import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Member,
  PaymentItem,
  ReceiptFormItem,
  Entry,
  Settings,
  UserAccount,
  LicenseInfo,
  SamitiStoreData,
  PaymentMethod,
} from '../types/samiti';
import { todayIso, toBnNumber } from '../utils/bengali';
import { Language, translations } from '../utils/translations';

interface SamitiContextType {
  data: SamitiStoreData;
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  logout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['bn']) => string;
  // Member actions
  addMember: (member: Omit<Member, 'id' | 'created' | 'active'>) => Member;
  updateMember: (id: number, member: Partial<Member>) => void;
  deleteMember: (id: number) => void;
  permanentDeleteMember: (id: number) => void;
  restoreMember: (id: number) => void;
  // Receipt actions
  addReceipt: (
    memberId: number,
    method: PaymentMethod,
    date: string,
    comment: string,
    items: ReceiptFormItem[]
  ) => number;
  updateReceipt: (
    receiptId: number,
    memberId: number,
    method: PaymentMethod,
    date: string,
    comment: string,
    items: ReceiptFormItem[]
  ) => void;
  deleteReceipt: (receiptId: number) => void;
  // Entry actions (Income / Expense)
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (id: number, entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (id: number) => void;
  // Settings & System
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateLicense: (
    expiry: string,
    msg: string,
    show_scroll?: boolean,
    scroll_text?: string
  ) => void;
  wipeData: (options: { members?: boolean; payments?: boolean; entries?: boolean }) => void;
  restoreBackup: (importedData: SamitiStoreData) => boolean;
  resetToDemo: () => void;
  // User Management
  addUser: (username: string, perms: string[], canDelete: boolean) => boolean;
  updateUser: (username: string, updates: Partial<UserAccount>) => void;
  deleteUser: (username: string) => void;
  changePassword: (username: string, newPasswordHash: string) => void;
  // Helpers
  can: (perm: string) => boolean;
  canDelete: () => boolean;
  getMemberById: (id: number) => Member | undefined;
  getReceiptsGrouped: () => { receipt_id: number; items: PaymentItem[] }[];
}

const STORAGE_KEY = 'samiti_manager_data_v2';
const FIRESTORE_DOC_PATH = 'samiti_store/state';

const getInitialExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
};

const DEFAULT_SETTINGS: Settings = {
  heading: 'একতা ক্ষুদ্র ব্যবসায়ী সমবায় সমিতি লিঃ',
  subheading: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার কর্তৃক অনুমোদিত (রেজি নং: এস-১২৯৩৪)',
  address: 'বাড়ি #১২, রোড #০৪, সেকশন-১০, মিরপুর, ঢাকা-১২১৬',
  mobile: '০১৭১১-৯৮৭৬৫৪, ০১৮২২-৩৩৪৪৫৫',
  note: 'পরবর্তী নির্দিষ্ট তারিখের পূর্বেই আপনার কিস্তি/চাঁদা পরিশোধ করুন। অনলাইন রিসিট সংরক্ষণ করুন।',
  share_price: '৫০০',
  logo: '',
  signature: '',
  reg_no: 'REG-2018-MIR-12934',
  email: 'ekota.samiti.bd@gmail.com',
};

const DEFAULT_USERS: UserAccount[] = [
  {
    username: 'admin',
    role: 'admin',
    perms: ['members', 'collect', 'income', 'expense', 'reports', 'settings'],
    can_delete: true,
    active: true,
    created: '2026-01-01',
    has_pw: true,
    passwordHash: 'admin',
  },
  {
    username: 'cashier',
    role: 'user',
    perms: ['members', 'collect', 'reports'],
    can_delete: false,
    active: true,
    created: '2026-03-15',
    has_pw: true,
    passwordHash: '1234',
  },
];

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 1,
    name: 'মো: রফিকুল ইসলাম',
    address: 'ব্লক-সি, মিরপুর-১০, ঢাকা',
    mobile: '০১৭১১-২৩৪৫৬৭',
    active: 1,
    created: '2026-01-10',
    share_count: 2,
    nid: '১৯৮৫২৬৯২৪৫১২৮৭',
    nominee: 'মোসা: সালমা বেগম (স্ত্রী)',
  },
  {
    id: 2,
    name: 'মোছা: নাসরিন আক্তার',
    address: 'মধ্য পাইকপাড়া, মিরপুর, ঢাকা',
    mobile: '০১৮২২-৩৪৫৬৭৮',
    active: 1,
    created: '2026-01-12',
    share_count: 1,
    nid: '১৯৯০২৬১২৪৫৯৯১২',
    nominee: 'তানভীর আহমেদ (ছেলে)',
  },
  {
    id: 3,
    name: 'কাজী মোস্তাফিজুর রহমান',
    address: 'পূর্ব কাজীপাড়া, মিরপুর, ঢাকা',
    mobile: '০১৯৩৩-৪৫৬৭৮৯',
    active: 1,
    created: '2026-01-15',
    share_count: 3,
    nid: '১৯৭৮২৬৮৭৫৪০১২৩',
    nominee: 'ফারহানা রহমান (স্ত্রী)',
  },
  {
    id: 4,
    name: 'আবদুল হালিম শেখ',
    address: 'পশ্চিম শেওড়াপাড়া, মিরপুর, ঢাকা',
    mobile: '০১৫৪৪-৫৬৭৮৯০',
    active: 1,
    created: '2026-02-01',
    share_count: 1,
    nid: '১৯৮২১২৫৬৭৮৯৩৪৫',
    nominee: 'রেহানা পারভীন (স্ত্রী)',
  },
  {
    id: 5,
    name: 'শাহাদাত হোসেন বাবলু',
    address: 'কালশী রোড, মিরপুর-১২, ঢাকা',
    mobile: '০১৬৫৫-৬৭৮৯০১',
    active: 1,
    created: '2026-02-15',
    share_count: 2,
    nid: '১৯৮৮২৬১২৩৪৭৮৯০',
    nominee: 'মো: সাইফুল ইসলাম (ভাই)',
  },
  {
    id: 6,
    name: 'সুলতানা রাজিয়া',
    address: 'সেনপাড়া পর্বতা, মিরপুর, ঢাকা',
    mobile: '০১৭৬৬-৭৮৯০১X',
    active: 1,
    created: '2026-03-01',
    share_count: 1,
    nid: '১৯৯২৪৫১২৭৮৯২৩৪',
    nominee: 'সাব্বির আহমেদ (স্বামী)',
  },
];

const DEFAULT_PAYMENTS: PaymentItem[] = [
  {
    id: 1,
    receipt_id: 1001,
    member_id: 1,
    amount: 1000,
    month: '2026-10',
    method: 'cash',
    comment: 'অক্টোবর মাসের নিয়মিত চাঁদা (২ শেয়ার)',
    date: '2026-10-05',
    category: 'chanda',
    description: 'মাসিক চাঁদা (অক্টোবর ২০২৬)',
    qty: 2,
    price: 500,
    late_fee: 0,
  },
  {
    id: 2,
    receipt_id: 1001,
    member_id: 1,
    amount: 200,
    month: '2026-10',
    method: 'cash',
    comment: '',
    date: '2026-10-05',
    category: 'other',
    description: 'কল্যাণ তহবিল অনুদান',
    qty: 1,
    price: 200,
    late_fee: 0,
  },
  {
    id: 3,
    receipt_id: 1002,
    member_id: 2,
    amount: 500,
    month: '2026-10',
    method: 'bkash',
    comment: 'বিকাশ ট্রান্সফার ফি সমিতি বহন করেছে',
    date: '2026-10-08',
    category: 'chanda',
    description: 'মাসিক চাঁদা (অক্টোবর ২০২৬)',
    qty: 1,
    price: 500,
    late_fee: 0,
  },
  {
    id: 4,
    receipt_id: 1003,
    member_id: 3,
    amount: 1550,
    month: '2026-10',
    method: 'bank',
    comment: 'ইসলামী ব্যাংক ট্রান্সফার (Txn: IBBL-94827)',
    date: '2026-10-12',
    category: 'chanda',
    description: 'মাসিক চাঁদা (অক্টোবর ২০২৬) - ৩ শেয়ার + লেট ফি',
    qty: 3,
    price: 500,
    late_fee: 50,
  },
  {
    id: 5,
    receipt_id: 1004,
    member_id: 4,
    amount: 500,
    month: '2026-09',
    method: 'cash',
    comment: 'সেপ্টেম্বর বকেয়া কিস্তি পরিশোধ',
    date: '2026-09-25',
    category: 'chanda',
    description: 'মাসিক চাঁদা (সেপ্টেম্বর ২০২৬)',
    qty: 1,
    price: 500,
    late_fee: 0,
  },
  {
    id: 6,
    receipt_id: 1005,
    member_id: 5,
    amount: 1000,
    month: '2026-10',
    method: 'bkash',
    comment: 'নিয়মিত চাঁদা',
    date: '2026-10-15',
    category: 'chanda',
    description: 'মাসিক চাঁদা (অক্টোবর ২০২৬)',
    qty: 2,
    price: 500,
    late_fee: 0,
  },
];

const DEFAULT_ENTRIES: Entry[] = [
  {
    id: 1,
    type: 'income',
    title: 'নতুন সদস্য ভর্তি ও ফরম ফি (৩ জন)',
    amount: 1500,
    method: 'cash',
    comment: 'রশিদ বহি #০২ হতে আদায়',
    date: '2026-10-02',
  },
  {
    id: 2,
    type: 'income',
    title: 'ব্যাংক একাউন্ট মুনাফা / লাভ্যাংশ জমা',
    amount: 3450,
    method: 'bank',
    comment: 'সোনালী ব্যাংক মিরপুর শাখা সেভিংস হিসাব',
    date: '2026-10-10',
  },
  {
    id: 3,
    type: 'expense',
    title: 'অফিস ঘর ভাড়া (অক্টোবর ২০২৬)',
    amount: 3000,
    method: 'bank',
    comment: 'মালিক মো: সালাহউদ্দিন এর ব্যাংক হিসাবে জমা',
    date: '2026-10-06',
  },
  {
    id: 4,
    type: 'expense',
    title: 'অফিস বিদ্যুৎ বিল ও ওয়াইফাই ইন্টারনেট ফি',
    amount: 1250,
    method: 'bkash',
    comment: 'ডেসকো বিল ও ইন্টারনেট প্রোভাইডার বিল',
    date: '2026-10-14',
  },
  {
    id: 5,
    type: 'expense',
    title: 'মাসিক সাধারণ মিটিং আপ্যায়ন ও নাস্তা খরচ',
    amount: 850,
    method: 'cash',
    comment: 'বিসমিল্লাহ সুইটস থেকে মিষ্টি ও নাস্তা',
    date: '2026-10-18',
  },
];

const DEFAULT_LICENSE: LicenseInfo = {
  expiry: getInitialExpiry(),
  days_left: 90,
  expired: false,
  tampered: false,
  msg: 'সফটওয়্যারের মেয়াদ শেষ হয়ে আসছে। রিনিউ করতে ডেভেলপারের সাথে যোগাযোগ করুন (Os Technology - md.oraka@gmail.com)।',
  show_scroll: true,
  scroll_text: '',
};

const getDefaultStoreData = (): SamitiStoreData => ({
  settings: { ...DEFAULT_SETTINGS },
  members: [...DEFAULT_MEMBERS],
  payments: [...DEFAULT_PAYMENTS],
  entries: [...DEFAULT_ENTRIES],
  users: [...DEFAULT_USERS],
  license: { ...DEFAULT_LICENSE },
});

// Recalculate license days
const checkLicense = (lic: LicenseInfo): LicenseInfo => {
  const today = new Date();
  const exp = new Date(lic.expiry);
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return {
    ...lic,
    days_left: diffDays,
    expired: diffDays < 0,
  };
};

const SamitiContext = createContext<SamitiContextType | undefined>(undefined);

export const SamitiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SamitiStoreData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.license && parsed.license.expiry) {
          parsed.license = checkLicense(parsed.license);
        }
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map((u: UserAccount) => {
            if (u.username === 'admin' && !u.passwordHash) {
              return { ...u, passwordHash: 'admin' };
            }
            return u;
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved data from localStorage', e);
    }
    return getDefaultStoreData();
  });

  // Screen requires manual login on each visit
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const logout = () => {
    setCurrentUser(null);
  };

  const LANG_STORAGE_KEY = 'samiti_manager_lang_v1';
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {}
    return 'bn';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
    } catch {}
  };

  const t = (key: keyof typeof translations['bn']): string => {
    const dict = translations[lang] || translations.bn;
    return dict[key] || translations.bn[key] || String(key);
  };

  // Helper to persist to Firestore
  const saveToCloud = (nextData: SamitiStoreData) => {
    try {
      const docRef = doc(db, 'samiti_store', 'state');
      setDoc(docRef, {
        ...nextData,
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, FIRESTORE_DOC_PATH);
      });
    } catch (err) {
      console.error('Error invoking Firestore write:', err);
    }
  };

  // Unified updater for local state, localStorage, and Firestore cloud
  const updateData = (updater: (prev: SamitiStoreData) => SamitiStoreData) => {
    setData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      saveToCloud(next);
      return next;
    });
  };

  // Real-time synchronization across all tabs, browsers, IPs, and mobile devices
  useEffect(() => {
    const docRef = doc(db, 'samiti_store', 'state');
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as any;
          if (cloudData && Array.isArray(cloudData.users)) {
            const syncedData: SamitiStoreData = {
              settings: cloudData.settings ? { ...DEFAULT_SETTINGS, ...cloudData.settings } : DEFAULT_SETTINGS,
              members: Array.isArray(cloudData.members) ? cloudData.members : [],
              payments: Array.isArray(cloudData.payments) ? cloudData.payments : [],
              entries: Array.isArray(cloudData.entries) ? cloudData.entries : [],
              users: Array.isArray(cloudData.users) && cloudData.users.length > 0 ? cloudData.users : DEFAULT_USERS,
              license: cloudData.license ? checkLicense(cloudData.license) : DEFAULT_LICENSE,
            };

            // Ensure admin has default password if unassigned
            syncedData.users = syncedData.users.map((u: UserAccount) => {
              if (u.username === 'admin' && !u.passwordHash) {
                return { ...u, passwordHash: 'admin' };
              }
              return u;
            });

            setData(syncedData);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedData));
            } catch {}
          }
        } else {
          // Cloud document does not exist yet: seed initial store data to Firestore
          const initial = data.users.length > 0 ? data : getDefaultStoreData();
          setDoc(docRef, {
            ...initial,
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, FIRESTORE_DOC_PATH);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, FIRESTORE_DOC_PATH);
      }
    );

    return () => unsub();
  }, []);

  const can = (perm: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.perms.includes(perm as any);
  };

  const canDelete = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.can_delete !== false;
  };

  const getMemberById = (id: number): Member | undefined => {
    return data.members.find((m) => m.id === id);
  };

  const getReceiptsGrouped = () => {
    const map = new Map<number, PaymentItem[]>();
    data.payments.forEach((p) => {
      const items = map.get(p.receipt_id) || [];
      items.push(p);
      map.set(p.receipt_id, items);
    });

    return Array.from(map.entries())
      .map(([receipt_id, items]) => ({
        receipt_id,
        items: items.sort((a, b) => a.id - b.id),
      }))
      .sort((a, b) => {
        const dateA = a.items[0]?.date || '';
        const dateB = b.items[0]?.date || '';
        if (dateA !== dateB) return dateA < dateB ? 1 : -1;
        return b.receipt_id - a.receipt_id;
      });
  };

  // Member CRUD
  const addMember = (m: Omit<Member, 'id' | 'created' | 'active'>): Member => {
    const nextId = data.members.length > 0 ? Math.max(...data.members.map((x) => x.id)) + 1 : 1;
    const newMember: Member = {
      ...m,
      id: nextId,
      active: 1,
      created: todayIso(),
    };
    updateData((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    return newMember;
  };

  const updateMember = (id: number, updates: Partial<Member>) => {
    updateData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const deleteMember = (id: number) => {
    updateData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, active: 0 } : m)),
    }));
  };

  const permanentDeleteMember = (id: number) => {
    updateData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      payments: prev.payments.filter((p) => p.member_id !== id),
    }));
  };

  const restoreMember = (id: number) => {
    updateData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, active: 1 } : m)),
    }));
  };

  // Receipt CRUD
  const addReceipt = (
    memberId: number,
    method: PaymentMethod,
    date: string,
    comment: string,
    items: ReceiptFormItem[]
  ): number => {
    const nextReceiptId =
      data.payments.length > 0
        ? Math.max(...data.payments.map((p) => p.receipt_id), 1000) + 1
        : 1001;

    let nextPaymentId =
      data.payments.length > 0 ? Math.max(...data.payments.map((p) => p.id)) + 1 : 1;

    const newPaymentItems: PaymentItem[] = items.map((it, idx) => {
      const q = Number(it.qty) || 1;
      const pr = Number(it.price) || 0;
      const lf = Number(it.late_fee) || 0;
      const amount = q * pr + lf;
      const month = it.category === 'other' ? date.slice(0, 7) : it.month || date.slice(0, 7);

      return {
        id: nextPaymentId++,
        receipt_id: nextReceiptId,
        member_id: memberId,
        amount,
        month,
        method,
        comment: idx === 0 ? comment : '',
        date: date || todayIso(),
        category: it.category,
        description: it.description || 'মাসিক চাঁদা',
        qty: q,
        price: pr,
        late_fee: lf,
      };
    });

    updateData((prev) => ({
      ...prev,
      payments: [...prev.payments, ...newPaymentItems],
    }));

    return nextReceiptId;
  };

  const updateReceipt = (
    receiptId: number,
    memberId: number,
    method: PaymentMethod,
    date: string,
    comment: string,
    items: ReceiptFormItem[]
  ) => {
    let nextPaymentId =
      data.payments.length > 0 ? Math.max(...data.payments.map((p) => p.id)) + 1 : 1;

    const newItems: PaymentItem[] = items.map((it, idx) => {
      const q = Number(it.qty) || 1;
      const pr = Number(it.price) || 0;
      const lf = Number(it.late_fee) || 0;
      const amount = q * pr + lf;
      const month = it.category === 'other' ? date.slice(0, 7) : it.month || date.slice(0, 7);

      return {
        id: nextPaymentId++,
        receipt_id: receiptId,
        member_id: memberId,
        amount,
        month,
        method,
        comment: idx === 0 ? comment : '',
        date: date || todayIso(),
        category: it.category,
        description: it.description || 'মাসিক চাঁদা',
        qty: q,
        price: pr,
        late_fee: lf,
      };
    });

    updateData((prev) => ({
      ...prev,
      payments: [...prev.payments.filter((p) => p.receipt_id !== receiptId), ...newItems],
    }));
  };

  const deleteReceipt = (receiptId: number) => {
    updateData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.receipt_id !== receiptId),
    }));
  };

  // Income / Expense CRUD
  const addEntry = (entry: Omit<Entry, 'id'>) => {
    const nextId = data.entries.length > 0 ? Math.max(...data.entries.map((e) => e.id)) + 1 : 1;
    const newEntry: Entry = {
      ...entry,
      id: nextId,
    };
    updateData((prev) => ({
      ...prev,
      entries: [newEntry, ...prev.entries],
    }));
  };

  const updateEntry = (id: number, entry: Omit<Entry, 'id'>) => {
    updateData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...entry, id } : e)),
    }));
  };

  const deleteEntry = (id: number) => {
    updateData((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
  };

  // Settings & System
  const updateSettings = (newSettings: Partial<Settings>) => {
    updateData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const updateLicense = (
    expiry: string,
    msg: string,
    show_scroll?: boolean,
    scroll_text?: string
  ) => {
    updateData((prev) => ({
      ...prev,
      license: checkLicense({
        ...prev.license,
        expiry,
        msg: msg || prev.license.msg,
        show_scroll: show_scroll !== undefined ? show_scroll : (prev.license.show_scroll ?? true),
        scroll_text: scroll_text !== undefined ? scroll_text : (prev.license.scroll_text ?? ''),
      }),
    }));
  };

  const wipeData = (options: { members?: boolean; payments?: boolean; entries?: boolean }) => {
    updateData((prev) => ({
      ...prev,
      members: options.members ? [] : prev.members,
      payments: options.payments ? [] : prev.payments,
      entries: options.entries ? [] : prev.entries,
    }));
  };

  const restoreBackup = (importedData: SamitiStoreData): boolean => {
    try {
      if (
        !importedData ||
        !importedData.settings ||
        !Array.isArray(importedData.members) ||
        !Array.isArray(importedData.payments)
      ) {
        return false;
      }
      const full = {
        settings: { ...DEFAULT_SETTINGS, ...importedData.settings },
        members: importedData.members,
        payments: importedData.payments,
        entries: importedData.entries || [],
        users: importedData.users || DEFAULT_USERS,
        license: checkLicense(importedData.license || DEFAULT_LICENSE),
      };
      updateData(() => full);
      return true;
    } catch {
      return false;
    }
  };

  const resetToDemo = () => {
    const demo = getDefaultStoreData();
    updateData(() => demo);
    setCurrentUser(demo.users[0]);
  };

  // User Management
  const addUser = (username: string, perms: string[], canDel: boolean): boolean => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || cleanUser === 'admin' || data.users.some((u) => u.username === cleanUser)) {
      return false;
    }
    const newUser: UserAccount = {
      username: cleanUser,
      role: 'user',
      perms: perms as any,
      can_delete: canDel,
      active: true,
      created: todayIso(),
      has_pw: false,
    };
    updateData((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
    return true;
  };

  const updateUser = (username: string, updates: Partial<UserAccount>) => {
    updateData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.username === username ? { ...u, ...updates } : u)),
    }));
  };

  const deleteUser = (username: string) => {
    if (username === 'admin') return;
    updateData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.username !== username),
    }));
  };

  const changePassword = (username: string, newPasswordHash: string) => {
    updateData((prev) => {
      const updatedUsers = prev.users.map((u) =>
        u.username === username ? { ...u, has_pw: true, passwordHash: newPasswordHash } : u
      );
      return {
        ...prev,
        users: updatedUsers,
      };
    });

    setCurrentUser((prev) => {
      if (prev && prev.username === username) {
        return { ...prev, has_pw: true, passwordHash: newPasswordHash };
      }
      return prev;
    });
  };

  return (
    <SamitiContext.Provider
      value={{
        data,
        currentUser,
        setCurrentUser,
        logout,
        lang,
        setLang,
        t,
        addMember,
        updateMember,
        deleteMember,
        permanentDeleteMember,
        restoreMember,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        addEntry,
        updateEntry,
        deleteEntry,
        updateSettings,
        updateLicense,
        wipeData,
        restoreBackup,
        resetToDemo,
        addUser,
        updateUser,
        deleteUser,
        changePassword,
        can,
        canDelete,
        getMemberById,
        getReceiptsGrouped,
      }}
    >
      {children}
    </SamitiContext.Provider>
  );
};

export const useSamiti = () => {
  const context = useContext(SamitiContext);
  if (!context) {
    throw new Error('useSamiti must be used within a SamitiProvider');
  }
  return context;
};
