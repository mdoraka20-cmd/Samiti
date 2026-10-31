// Utility functions for Bengali numbering, date formatting, currency, and QR generation

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '০';
  const str = String(n);
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[parseInt(d, 10)] || d);
}

export function formatTk(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-US');
  return `৳ ${toBnNumber(formatted)}`;
}

export function formatEnNumber(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US');
}

export function formatMemberId(id: number | string): string {
  return `M-${String(id).padStart(4, '0')}`;
}

export function formatReceiptId(id: number | string): string {
  return String(id);
}

export const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function getBengaliMonthName(monthStr: string): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = BN_MONTHS[monthIdx] || '';
  return `${monthName} ${toBnNumber(year)}`;
}

export function formatBnDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!d) return dateStr;
  return `${toBnNumber(d)}-${toBnNumber(m)}-${toBnNumber(y)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthIso(): string {
  return todayIso().slice(0, 7);
}

export const PAYMENT_METHODS: Record<string, string> = {
  cash: 'ক্যাশ',
  bank: 'ব্যাংক',
  bkash: 'বিকাশ',
};

// Convert number to Bengali words for receipt amount
export function numberToBengaliWords(num: number): string {
  if (!num || num === 0) return 'শূন্য টাকা মাত্র';
  const ones = [
    '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
    'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ',
    'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
    'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
    'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
    'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
    'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
    'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
    'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই',
    'নব্বই', 'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
  ];

  let n = Math.floor(Math.abs(num));
  let result = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  n %= 100;

  if (crore > 0) result += `${ones[crore] || crore} কোটি `;
  if (lakh > 0) result += `${ones[lakh] || lakh} লাখ `;
  if (thousand > 0) result += `${ones[thousand] || thousand} হাজার `;
  if (hundred > 0) result += `${ones[hundred] || hundred} শত `;
  if (n > 0) result += `${ones[n]} `;

  return `${result.trim()} টাকা মাত্র`;
}

// Lightweight self-contained QR code SVG generator (Byte mode, Version 1-6)
export const QRCodeGenerator = (() => {
  const EXP = new Array(512), LOG = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

  const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

  function rsGen(n: number) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const ng = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) {
        ng[j] ^= g[j];
        ng[j + 1] ^= mul(g[j], EXP[i]);
      }
      g = ng;
    }
    return g;
  }

  function rsEnc(data: number[], n: number) {
    const g = rsGen(n), r = new Array(n).fill(0);
    for (const d of data) {
      const f = d ^ r[0];
      r.shift();
      r.push(0);
      for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f);
    }
    return r;
  }

  const T: Record<number, [number, number, number]> = {
    1: [16, 10, 1],
    2: [28, 16, 1],
    3: [44, 26, 1],
    4: [64, 18, 2],
    5: [86, 24, 2],
    6: [108, 16, 4],
  };

  function make(text: string): boolean[][] {
    const bytes = [...new TextEncoder().encode(text)];
    let v = 0;
    for (let k = 1; k <= 6; k++) {
      if (bytes.length + 2 <= T[k][0]) {
        v = k;
        break;
      }
    }
    if (!v) v = 6; // fallback
    const [dc, ecn, nb] = T[v] || [108, 16, 4];
    const size = 17 + 4 * v;
    const bits: number[] = [];
    const put = (val: number, n: number) => {
      for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };
    put(4, 4);
    put(bytes.length, 8);
    bytes.forEach((b) => put(b, 8));
    const cap = dc * 8;
    put(0, Math.min(4, Math.max(0, cap - bits.length)));
    while (bits.length % 8) bits.push(0);
    const data: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] || 0);
      data.push(b);
    }
    for (let p = 0xec; data.length < dc; p ^= 0xec ^ 0x11) data.push(p);
    const per = Math.floor(dc / nb);
    const blocks: number[][] = [];
    const ecs: number[][] = [];
    for (let b = 0; b < nb; b++) {
      const d = data.slice(b * per, (b + 1) * per);
      blocks.push(d);
      ecs.push(rsEnc(d, ecn));
    }
    const all: number[] = [];
    for (let i = 0; i < per; i++) blocks.forEach((b) => all.push(b[i]));
    for (let i = 0; i < ecn; i++) ecs.forEach((e) => all.push(e[i]));

    const M: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
    const F: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
    const setF = (xx: number, yy: number, d: boolean) => {
      if (yy >= 0 && yy < size && xx >= 0 && xx < size) {
        M[yy][xx] = d;
        F[yy][xx] = true;
      }
    };

    for (let i = 0; i < size; i++) {
      setF(6, i, i % 2 === 0);
      setF(i, 6, i % 2 === 0);
    }

    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const xx = cx + dx, yy = cy + dy;
          if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
            const d = Math.max(Math.abs(dx), Math.abs(dy));
            setF(xx, yy, d !== 2 && d !== 4);
          }
        }
      }
    });

    if (v >= 2) {
      const a = size - 7;
      [[a, a]].forEach(([cx, cy]) => {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            setF(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      });
    }

    const fmt = (mask: number) => {
      let d = mask, r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ (((r >>> 9) & 1) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      const g = (i: number) => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) setF(8, i, g(i));
      setF(8, 7, g(6));
      setF(8, 8, g(7));
      setF(7, 8, g(8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, g(i));
      setF(8, size - 8, true);
    };

    fmt(0);

    let k = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const xx = right - j;
          const up = ((right + 1) & 2) === 0;
          const yy = up ? size - 1 - vert : vert;
          if (!F[yy][xx] && k < all.length * 8) {
            M[yy][xx] = (((all[k >>> 3] >>> (7 - (k & 7))) & 1) === 1);
            k++;
          }
        }
      }
    }

    return M;
  }

  function svg(text: string, className?: string): string {
    try {
      const M = make(text);
      const n = M.length;
      const q = 2;
      let d = '';
      M.forEach((r, y) =>
        r.forEach((c, x) => {
          if (c) d += `M${x + q},${y + q}h1v1h-1z`;
        })
      );
      return `<svg class="${className || ''}" viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
    } catch {
      return '';
    }
  }

  return { make, svg };
})();
