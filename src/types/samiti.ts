export type PaymentMethod = 'cash' | 'bank' | 'bkash';

export type Permission = 'members' | 'collect' | 'income' | 'expense' | 'reports' | 'settings';

export interface Member {
  id: number;
  name: string;
  address: string;
  mobile: string;
  active: number; // 1 = active, 0 = archived
  created: string;
  share_count?: number;
  nid?: string;
  nominee?: string;
}

export interface PaymentItem {
  id: number;
  receipt_id: number;
  member_id: number;
  amount: number;
  month: string; // YYYY-MM
  method: PaymentMethod;
  comment: string;
  date: string; // YYYY-MM-DD
  category: 'chanda' | 'other';
  description: string;
  qty: number;
  price: number;
  late_fee: number;
}

export interface ReceiptFormItem {
  category: 'chanda' | 'other';
  month: string;
  description: string;
  qty: number;
  price: number;
  late_fee: number;
  auto?: boolean;
}

export interface Entry {
  id: number;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  method: PaymentMethod;
  comment: string;
  date: string; // YYYY-MM-DD
}

export interface Settings {
  heading: string;
  subheading: string;
  address: string;
  mobile: string;
  note: string;
  share_price: string;
  logo: string;
  signature: string;
  reg_no?: string;
  email?: string;
}

export interface UserAccount {
  username: string;
  perms: Permission[];
  can_delete: boolean;
  active: boolean;
  created: string;
  has_pw: boolean;
  role: 'admin' | 'user';
  passwordHash?: string;
}

export interface LicenseInfo {
  expiry: string;
  days_left: number;
  expired: boolean;
  tampered: boolean;
  msg: string;
  show_scroll?: boolean;
  scroll_text?: string;
}

export interface SamitiStoreData {
  settings: Settings;
  members: Member[];
  payments: PaymentItem[];
  entries: Entry[];
  users: UserAccount[];
  license: LicenseInfo;
}
