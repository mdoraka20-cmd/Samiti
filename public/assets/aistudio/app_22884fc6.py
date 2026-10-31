# -*- coding: utf-8 -*-
"""সমিতি ম্যানেজমেন্ট - লোকাল সার্ভার (Python + SQLite) | লগইন + লাইসেন্স সিস্টেমসহ"""
import json, os, re, sqlite3, sys, threading, webbrowser, datetime, hmac, hashlib, secrets, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie
from urllib.parse import urlparse

# !!! বিক্রির/বিতরণের আগে এই গোপন কী নিজের মতো বদলে নিন (তারপর exe বানান) !!!
SECRET = b"SAMITI-change-this-secret-key-before-build-2026"
PERMS = ["members", "collect", "income", "expense", "reports", "settings"]

def res_path(name):
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, name)

APP_DIR = os.path.dirname(sys.executable if getattr(sys, "frozen", False) else os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB = os.path.join(DATA_DIR, "samiti.db")
LOCK = threading.Lock(); VL = threading.Lock()
SESS = {}; FAIL = {}

# ---------- সিগনেচার / পাসওয়ার্ড ----------
def _sig(o): return hmac.new(SECRET, json.dumps(o, sort_keys=True, ensure_ascii=False).encode("utf8"), hashlib.sha256).hexdigest()
def hashpw(pw, salt): return hashlib.pbkdf2_hmac("sha256", pw.encode("utf8"), bytes.fromhex(salt), 120000).hex()
def mkpw(pw): s = secrets.token_hex(16); return {"salt": s, "hash": hashpw(pw, s)}

# ---------- ভল্ট: অ্যাডমিন পাসওয়ার্ড + লাইসেন্স (দুই জায়গায় সাইন করা কপি) ----------
def vpaths():
    p = [os.path.join(DATA_DIR, "vault.dat")]
    base = os.environ.get("APPDATA") or os.path.join(os.path.expanduser("~"), ".config")
    d = os.path.join(base, "SamitiManager")
    try: os.makedirs(d, exist_ok=True); p.append(os.path.join(d, "vault.dat"))
    except Exception: pass
    return p

def vault_load():
    best = None
    for p in vpaths():
        try:
            j = json.load(open(p, encoding="utf8"))
            if hmac.compare_digest(j["sig"], _sig(j["v"])) and (not best or j["v"]["serial"] > best["serial"]):
                best = j["v"]
        except Exception: pass
    return best

def vault_save(v):
    v["serial"] += 1
    j = {"v": v, "sig": _sig(v)}
    for p in vpaths():
        try: json.dump(j, open(p, "w", encoding="utf8"), ensure_ascii=False)
        except Exception: pass

def vault_init():
    global V
    V = vault_load()
    if not V:
        t = datetime.date.today()
        V = {"admin": mkpw("admin"), "expiry": (t + datetime.timedelta(days=30)).isoformat(),
             "msg": "সফটওয়্যারের মেয়াদ শেষ হয়ে আসছে। রিনিউ করতে ডেভেলপারের সাথে যোগাযোগ করুন।",
             "last_seen": t.isoformat(), "serial": 0}
        vault_save(V)

def lic():
    today = datetime.date.today()
    with VL:
        last = datetime.date.fromisoformat(V["last_seen"])
        tamper = today < last - datetime.timedelta(days=1)   # সিস্টেম ঘড়ি পিছিয়ে দিলে ধরা পড়বে
        if today > last: V["last_seen"] = today.isoformat(); vault_save(V)
        exp = datetime.date.fromisoformat(V["expiry"]); msg = V["msg"]; ex = V["expiry"]
    days = (exp - today).days
    return {"expiry": ex, "days_left": days, "expired": tamper or days < 0, "tampered": tamper, "msg": msg}

# ---------- ডাটাবেজ ----------
def conn():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row; return c

def init():
    c = conn()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        address TEXT, mobile TEXT, active INTEGER DEFAULT 1, created TEXT);
    CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER,
        amount REAL, month TEXT, method TEXT, comment TEXT, date TEXT);
    CREATE TABLE IF NOT EXISTS entries(id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, title TEXT,
        amount REAL, method TEXT, comment TEXT, date TEXT);
    CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, salt TEXT, hash TEXT, perms TEXT,
        can_delete INTEGER, active INTEGER, created TEXT, sig TEXT);
    """)
    for k, v in {"heading": "আপনার সমিতির নাম", "address": "সমিতির ঠিকানা এখানে লিখুন", "mobile": "০১৭XXXXXXXX",
                 "subheading": "", "note": "পরবর্তী নির্দিষ্ট তারিখের পূর্বেই আপনার টাকা পরিশোধ করুন।",
                 "share_price": "", "logo": "", "signature": ""}.items():
        c.execute("INSERT OR IGNORE INTO settings VALUES(?,?)", (k, v))
    # রিসিটে একাধিক সারি: পুরনো ডাটাবেজ হলে নতুন কলাম যোগ
    have = [r[1] for r in c.execute("PRAGMA table_info(payments)").fetchall()]
    for col, typ in [("receipt_id", "INTEGER"), ("category", "TEXT DEFAULT 'chanda'"), ("description", "TEXT"),
                     ("qty", "REAL DEFAULT 1"), ("price", "REAL"), ("late_fee", "REAL DEFAULT 0")]:
        if col not in have: c.execute("ALTER TABLE payments ADD COLUMN %s %s" % (col, typ))
    c.execute("UPDATE payments SET receipt_id=id WHERE receipt_id IS NULL")
    c.execute("UPDATE payments SET description='মাসিক চাঁদা' WHERE description IS NULL")
    c.execute("UPDATE payments SET price=amount WHERE price IS NULL")
    c.commit(); c.close()

def rows(sql, args=()):
    c = conn(); r = [dict(x) for x in c.execute(sql, args).fetchall()]; c.close(); return r

def run(sql, args=()):
    with LOCK:
        c = conn(); cur = c.execute(sql, args); c.commit(); i = cur.lastrowid; c.close(); return i

def get_member(i):
    try: r = rows("SELECT * FROM members WHERE id=?", (int(i),))
    except Exception: return None
    return r[0] if r else None

def usig(r): return _sig([r["username"], r["salt"], r["hash"], r["perms"], int(r["can_delete"]), int(r["active"])])
def get_user(name):
    rs = rows("SELECT * FROM users WHERE username=?", (name,))
    if not rs or not hmac.compare_digest(rs[0]["sig"] or "", usig(rs[0])): return None
    return rs[0]
def save_user(r):
    r["sig"] = usig(r)
    run("INSERT OR REPLACE INTO users(username,salt,hash,perms,can_delete,active,created,sig) VALUES(?,?,?,?,?,?,?,?)",
        (r["username"], r["salt"], r["hash"], r["perms"], int(r["can_delete"]), int(r["active"]), r["created"], r["sig"]))
def drop_sessions(name):
    for k in [k for k, v in SESS.items() if v == name]: SESS.pop(k, None)

NEED = {"members/add": "members", "members/delete": "members", "members/restore": "members",
        "members/update": "members", "receipts/add": "collect", "receipts/update": "collect", "receipts/delete": "collect", "settings": "settings"}
DELS = {"members/delete", "receipts/delete", "entries/delete"}

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ctype="application/json; charset=utf-8", extra=None):
        if isinstance(body, (dict, list)): body = json.dumps(body, ensure_ascii=False)
        if isinstance(body, str): body = body.encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items(): self.send_header(k, v)
        self.end_headers(); self.wfile.write(body)

    def ctx(self):
        c = SimpleCookie(self.headers.get("Cookie", ""))
        n = SESS.get(c["sid"].value) if "sid" in c else None
        if not n: return None
        if n == "admin": return {"username": "admin", "role": "admin", "perms": PERMS[:], "can_delete": True}
        r = get_user(n)
        if not r or not r["active"]: return None
        return {"username": n, "role": "user", "perms": [p for p in json.loads(r["perms"]) if p in PERMS], "can_delete": bool(r["can_delete"])}

    def heading(self):
        r = rows("SELECT v FROM settings WHERE k='heading'"); return r[0]["v"] if r else ""

    def me(self):
        u = self.ctx(); L = lic()
        if not u or (L["expired"] and u["role"] != "admin"):
            return {"user": None, "heading": self.heading(), "license": {"expired": L["expired"], "msg": L["msg"]}}
        dp = u["role"] == "admin" and hashpw("admin", V["admin"]["salt"]) == V["admin"]["hash"]
        return {"user": u, "heading": self.heading(), "license": L, "default_pass": dp}

    def gate(self):
        """লগইন + লাইসেন্স চেক। ইউজার ফেরত দেয়, নাহলে রেসপন্স পাঠিয়ে None"""
        u = self.ctx()
        if not u: self.send(401, {"error": "login"}); return None
        L = lic()
        if L["expired"] and u["role"] != "admin":
            self.send(403, {"expired": True, "msg": L["msg"]}); return None
        return u

    def do_GET(self):
        p = urlparse(self.path).path
        if p in ("/", "/index.html"):
            return self.send(200, open(res_path("index.html"), "rb").read(), "text/html; charset=utf-8")
        if p == "/api/me": return self.send(200, self.me())
        u = self.gate()
        if not u: return
        P = u["perms"]
        if p == "/api/all":
            ent = rows("SELECT * FROM entries ORDER BY date DESC, id DESC")
            if "reports" not in P: ent = [e for e in ent if e["type"] in P]
            pay = rows("SELECT * FROM payments ORDER BY date DESC, id DESC") if set(P) & {"collect", "reports", "members"} else []
            return self.send(200, {"settings": {r["k"]: r["v"] for r in rows("SELECT * FROM settings")},
                                   "members": rows("SELECT * FROM members ORDER BY id"), "payments": pay, "entries": ent})
        if p == "/api/backup":
            if "settings" not in P: return self.send(403, {"error": "অনুমতি নেই"})
            name = "samiti_backup_%s.db" % datetime.datetime.now().strftime("%Y%m%d_%H%M")
            return self.send(200, open(DB, "rb").read(), "application/octet-stream", {"Content-Disposition": 'attachment; filename="%s"' % name})
        if p == "/api/users":
            if u["role"] != "admin": return self.send(403, {"error": "শুধু অ্যাডমিন"})
            out = []
            for r in rows("SELECT * FROM users ORDER BY created, username"):
                ok = hmac.compare_digest(r["sig"] or "", usig(r))
                out.append({"username": r["username"], "perms": json.loads(r["perms"]) if ok else [], "can_delete": bool(r["can_delete"]),
                            "active": bool(r["active"]) and ok, "has_pw": r["hash"] != "", "created": r["created"], "valid": ok})
            return self.send(200, {"users": out})
        self.send(404, {"error": "not found"})

    # ---------- লগইন ----------
    def fail(self, name):
        n, _ = FAIL.get(name, (0, 0)); n += 1
        FAIL[name] = (n, time.time() + 60 if n >= 5 else 0)
        if n >= 5: FAIL[name] = (0, time.time() + 60)
        self.send(400, {"error": "ইউজার নেম বা পাসওয়ার্ড ভুল"})

    def start(self, who):
        sid = secrets.token_urlsafe(24); SESS[sid] = who; FAIL.pop(who, None)
        self.send(200, {"ok": True}, extra={"Set-Cookie": "sid=%s; HttpOnly; Path=/; SameSite=Strict" % sid})

    def login(self, d):
        name = (d.get("username") or "").strip().lower(); pw = d.get("password") or ""
        if FAIL.get(name, (0, 0))[1] > time.time(): return self.send(400, {"error": "অনেকবার ভুল হয়েছে, ১ মিনিট পর চেষ্টা করুন"})
        if name == "admin":
            if hmac.compare_digest(hashpw(pw, V["admin"]["salt"]), V["admin"]["hash"]): return self.start("admin")
            return self.fail(name)
        L = lic()
        if L["expired"]: return self.send(403, {"expired": True, "msg": L["msg"]})
        r = get_user(name)
        if not r or not r["active"]: return self.fail(name)
        if r["hash"] == "":
            if pw == "": return self.send(200, {"setup": True})
            return self.send(400, {"error": "এই ইউজারের পাসওয়ার্ড এখনও তৈরি হয়নি — পাসওয়ার্ড ঘর ফাঁকা রেখে লগইন চাপুন"})
        if hmac.compare_digest(hashpw(pw, r["salt"]), r["hash"]): return self.start(name)
        self.fail(name)

    def first_pw(self, d):
        name = (d.get("username") or "").strip().lower(); pw = d.get("password") or ""
        if lic()["expired"]: return self.send(403, {"expired": True, "msg": V["msg"]})
        r = get_user(name)
        if not r or not r["active"] or r["hash"] != "": return self.send(400, {"error": "পাসওয়ার্ড তৈরি করা যাবে না"})
        if len(pw) < 4: return self.send(400, {"error": "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে"})
        x = mkpw(pw); r["salt"], r["hash"] = x["salt"], x["hash"]; save_user(r); self.start(name)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        try: d = json.loads(self.rfile.read(n) or b"{}")
        except Exception: d = {}
        p = urlparse(self.path).path.replace("/api/", "", 1)
        if p == "login": return self.login(d)
        if p == "setup": return self.first_pw(d)
        if p == "logout":
            c = SimpleCookie(self.headers.get("Cookie", ""))
            if "sid" in c: SESS.pop(c["sid"].value, None)
            return self.send(200, {"ok": True})
        u = self.gate()
        if not u: return
        try:
            if p == "changepass": return self.changepass(u, d)
            if p.split("/")[0] in ("users", "license", "admin"):
                if u["role"] != "admin": return self.send(403, {"error": "শুধু অ্যাডমিন এটি করতে পারবেন"})
                return self.admin_post(p, d)
            perm = NEED.get(p)
            if p.startswith("entries/"):
                if p == "entries/add": t = d.get("type")
                else:
                    r = rows("SELECT type FROM entries WHERE id=?", (d.get("id"),)); t = r[0]["type"] if r else None
                if t not in ("income", "expense"): return self.send(400, {"error": "ভুল অনুরোধ"})
                perm = t
            if not perm: return self.send(404, {"error": "not found"})
            if perm not in u["perms"]: return self.send(403, {"error": "এই কাজের অনুমতি আপনার নেই"})
            if p in DELS and not u["can_delete"]: return self.send(403, {"error": "ডিলিট করার অনুমতি আপনার নেই"})
            today = datetime.date.today().isoformat()
            if p == "settings":
                for k in ("heading", "address", "mobile", "subheading", "note", "share_price", "logo", "signature"):
                    if k in d: run("INSERT OR REPLACE INTO settings VALUES(?,?)", (k, d[k]))
            elif p == "members/add":
                if not d.get("name", "").strip(): return self.send(400, {"error": "নাম দিন"})
                run("INSERT INTO members(name,address,mobile,created) VALUES(?,?,?,?)", (d["name"].strip(), d.get("address", ""), d.get("mobile", ""), today))
            elif p == "members/delete": run("UPDATE members SET active=0 WHERE id=?", (d["id"],))
            elif p == "members/restore": run("UPDATE members SET active=1 WHERE id=?", (d["id"],))
            elif p == "receipts/add": return self.save_receipt(d, today)
            elif p == "receipts/update": return self.save_receipt(d, today, int(d["receipt_id"]))
            elif p == "members/update":
                if not (d.get("name") or "").strip(): return self.send(400, {"error": "নাম দিন"})
                if not get_member(d.get("id")): return self.send(400, {"error": "সদস্য পাওয়া যায়নি"})
                run("UPDATE members SET name=?,address=?,mobile=? WHERE id=?", (d["name"].strip(), d.get("address", ""), d.get("mobile", ""), int(d["id"])))
            elif p == "entries/update":
                nt = d.get("type")
                if nt not in ("income", "expense") or nt not in u["perms"]: return self.send(403, {"error": "এই ধরনে পরিবর্তনের অনুমতি আপনার নেই"})
                amt = float(d.get("amount") or 0)
                if amt <= 0: return self.send(400, {"error": "টাকার পরিমাণ দিন"})
                if d.get("method") not in ("cash", "bank", "bkash"): return self.send(400, {"error": "মাধ্যম নির্বাচন করুন"})
                run("UPDATE entries SET type=?,title=?,amount=?,method=?,comment=?,date=? WHERE id=?",
                    (nt, d.get("title", ""), amt, d["method"], d.get("comment", ""), d.get("date") or today, int(d["id"])))
            elif p == "receipts/delete": run("DELETE FROM payments WHERE receipt_id=?", (d["receipt_id"],))
            elif p == "entries/add":
                run("INSERT INTO entries(type,title,amount,method,comment,date) VALUES(?,?,?,?,?,?)",
                    (d["type"], d.get("title", ""), float(d["amount"]), d["method"], d.get("comment", ""), d.get("date") or today))
            elif p == "entries/delete": run("DELETE FROM entries WHERE id=?", (d["id"],))
            self.send(200, {"ok": True})
        except Exception as e:
            self.send(500, {"error": str(e)})

    def save_receipt(self, d, today, rid=None):
        """নতুন রিসিট বা (rid দিলে) বিদ্যমান রিসিট হুবহু বদলে দেয় — সব বা কিছুই নয় (transaction)"""
        items = d.get("items") or []
        if not items or len(items) > 10: return self.send(400, {"error": "১ থেকে ১০টি সারি দিন"})
        m = get_member(d.get("member_id"))
        if not m: return self.send(400, {"error": "সদস্য পাওয়া যায়নি"})
        if not m["active"] and rid is None: return self.send(400, {"error": "এই সদস্য বাদ দেওয়া হয়েছে"})
        if d.get("method") not in ("cash", "bank", "bkash"): return self.send(400, {"error": "জমার মাধ্যম নির্বাচন করুন"})
        date = d.get("date") or today
        with LOCK:
            c = conn()
            try:
                if rid is None:
                    rid = c.execute("SELECT COALESCE(MAX(receipt_id),0)+1 FROM payments").fetchone()[0]
                else:
                    if not c.execute("SELECT 1 FROM payments WHERE receipt_id=?", (rid,)).fetchone():
                        return self.send(400, {"error": "রিসিট পাওয়া যায়নি"})
                    c.execute("DELETE FROM payments WHERE receipt_id=?", (rid,))
                for i, it in enumerate(items):
                    q = float(it.get("qty") or 1); pr = float(it.get("price") or 0); lf = float(it.get("late_fee") or 0)
                    desc = (it.get("description") or "").strip()
                    if q <= 0 or pr < 0 or lf < 0 or q * pr + lf <= 0 or not desc:
                        raise ValueError("সারি %d: বিবরণ ও টাকার পরিমাণ ঠিকভাবে দিন" % (i + 1))
                    cat = "other" if it.get("category") == "other" else "chanda"
                    month = date[:7] if cat == "other" else (it.get("month") or date[:7])
                    c.execute("INSERT INTO payments(member_id,amount,month,method,comment,date,receipt_id,category,description,qty,price,late_fee) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                              (m["id"], q * pr + lf, month, d["method"], (d.get("comment") or "") if i == 0 else "", date, rid, cat, desc, q, pr, lf))
                c.commit()
            finally: c.close()
        return self.send(200, {"receipt_id": rid})

    def changepass(self, u, d):
        old, new = d.get("old") or "", d.get("new") or ""
        if len(new) < 4: return self.send(400, {"error": "নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে"})
        if u["role"] == "admin":
            if not hmac.compare_digest(hashpw(old, V["admin"]["salt"]), V["admin"]["hash"]): return self.send(400, {"error": "বর্তমান পাসওয়ার্ড ভুল"})
            with VL: V["admin"] = mkpw(new); vault_save(V)
        else:
            r = get_user(u["username"])
            if not hmac.compare_digest(hashpw(old, r["salt"]), r["hash"]): return self.send(400, {"error": "বর্তমান পাসওয়ার্ড ভুল"})
            x = mkpw(new); r["salt"], r["hash"] = x["salt"], x["hash"]; save_user(r)
        self.send(200, {"ok": True})

    def admin_post(self, p, d):
        clean = lambda L: [x for x in (L or []) if x in PERMS]
        if p == "users/add":
            name = (d.get("username") or "").strip().lower()
            if not re.match(r"^[\w.\-]{3,30}$", name) or name == "admin": return self.send(400, {"error": "ইউজার নেম ৩-৩০ অক্ষর (ইংরেজি/সংখ্যা/._-) হতে হবে, 'admin' চলবে না"})
            if rows("SELECT 1 FROM users WHERE username=?", (name,)): return self.send(400, {"error": "এই ইউজার নেম আগেই আছে"})
            save_user({"username": name, "salt": "", "hash": "", "perms": json.dumps(clean(d.get("perms"))), "can_delete": bool(d.get("can_delete")),
                       "active": 1, "created": datetime.date.today().isoformat()})
        elif p in ("users/update", "users/resetpw", "users/delete"):
            r = get_user((d.get("username") or "").lower())
            if not r: return self.send(400, {"error": "ইউজার পাওয়া যায়নি"})
            if p == "users/update":
                if "perms" in d: r["perms"] = json.dumps(clean(d["perms"]))
                if "can_delete" in d: r["can_delete"] = int(bool(d["can_delete"]))
                if "active" in d: r["active"] = int(bool(d["active"]))
                save_user(r)
                if not r["active"]: drop_sessions(r["username"])
            elif p == "users/resetpw":
                r["salt"] = r["hash"] = ""; save_user(r); drop_sessions(r["username"])
            else:
                run("DELETE FROM users WHERE username=?", (r["username"],)); drop_sessions(r["username"])
        elif p == "license/set":
            try: datetime.date.fromisoformat(d.get("expiry", ""))
            except Exception: return self.send(400, {"error": "সঠিক তারিখ দিন"})
            with VL:
                V["expiry"] = d["expiry"]; V["msg"] = (d.get("msg") or "").strip() or V["msg"]
                vault_save(V)
        elif p == "admin/wipe":
            if not hmac.compare_digest(hashpw(d.get("password") or "", V["admin"]["salt"]), V["admin"]["hash"]): return self.send(400, {"error": "অ্যাডমিন পাসওয়ার্ড ভুল"})
            tabs = [t for t in ("members", "payments", "entries") if d.get(t)]
            if not tabs: return self.send(400, {"error": "কিছু নির্বাচন করুন"})
            for t in tabs:
                run("DELETE FROM %s" % t); run("DELETE FROM sqlite_sequence WHERE name=?", (t,))
        else: return self.send(404, {"error": "not found"})
        self.send(200, {"ok": True})

def _fix_console():
    """Windows কনসোলে বাংলা ছাপতে গিয়ে ক্র্যাশ ঠেকায়; exe হলে কালো উইন্ডো নিজে থেকে মিনিমাইজ করে"""
    for st in (sys.stdout, sys.stderr):
        try: st.reconfigure(errors="replace")
        except Exception: pass
    if sys.platform == "win32" and getattr(sys, "frozen", False):
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleTitleW("Samiti Manager Server - keep open while using")
            hwnd = ctypes.windll.kernel32.GetConsoleWindow()
            if hwnd: ctypes.windll.user32.ShowWindow(hwnd, 6)   # SW_MINIMIZE
        except Exception: pass

def already_running(port=8765):
    """আগে থেকেই চালু থাকলে নতুন সার্ভার না খুলে শুধু ব্রাউজার খোলা হবে"""
    try:
        import urllib.request
        with urllib.request.urlopen("http://127.0.0.1:%d/api/me" % port, timeout=2) as r:
            return b'"heading"' in r.read()
    except Exception:
        return False

def main():
    _fix_console()
    init(); vault_init()
    if already_running():
        webbrowser.open("http://127.0.0.1:8765")
        return
    port = 8765
    while True:
        try: srv = ThreadingHTTPServer(("127.0.0.1", port), H); break
        except OSError: port += 1
    url = "http://127.0.0.1:%d" % port
    print("=" * 52); print(" Samiti Manager server is running"); print(" Address     :", url)
    print(" Data folder :", DATA_DIR); print(" Keep this window open while using. Close it to stop."); print("=" * 52)
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try: srv.serve_forever()
    except KeyboardInterrupt: pass

if __name__ == "__main__":
    main()
