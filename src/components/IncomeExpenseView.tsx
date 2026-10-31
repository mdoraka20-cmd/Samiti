import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Printer,
  Download,
  Loader2,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { Entry, PaymentMethod } from '../types/samiti';
import { todayIso } from '../utils/bengali';
import {
  formatCurrencyWithLang,
  formatNumberWithLang,
} from '../utils/translations';
import { ConfirmModal } from './ConfirmModal';
import { downloadElementAsPdf, printOrDownloadPdf } from '../utils/printHelper';

interface IncomeExpenseViewProps {
  initialType?: 'income' | 'expense';
}

export const IncomeExpenseView: React.FC<IncomeExpenseViewProps> = ({
  initialType = 'income',
}) => {
  const { data, addEntry, updateEntry, deleteEntry, canDelete, lang, t } = useSamiti();

  const [activeType, setActiveType] = useState<'income' | 'expense'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Add Form state
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('cash');
  const [formDate, setFormDate] = useState(todayIso());
  const [formComment, setFormComment] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Edit Modal state
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Delete Modal state
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<Entry | null>(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handlePrintLedger = async () => {
    setIsPrinting(true);
    setPrintNotice(null);
    const filename = `${activeType === 'income' ? 'income' : 'expense'}_ledger_${new Date().toISOString().slice(0, 10)}`;
    const res = await printOrDownloadPdf('income-expense-ledger-container', filename);
    setIsPrinting(false);
    if (res.method === 'pdf' && res.success) {
      setPrintNotice(
        lang === 'en'
          ? 'Print-ready PDF ledger downloaded!'
          : 'প্রিন্ট-রেডি PDF লেজার ডাউনলোড হয়েছে!'
      );
      setTimeout(() => setPrintNotice(null), 4000);
    }
  };

  const handleDownloadPdfLedger = async () => {
    setIsPrinting(true);
    setPrintNotice(null);
    const filename = `${activeType === 'income' ? 'income' : 'expense'}_ledger_${new Date().toISOString().slice(0, 10)}`;
    const ok = await downloadElementAsPdf('income-expense-ledger-container', filename);
    setIsPrinting(false);
    if (ok) {
      setPrintNotice(
        lang === 'en'
          ? 'PDF ledger downloaded!'
          : 'PDF লেজার ডাউনলোড হয়েছে!'
      );
      setTimeout(() => setPrintNotice(null), 4000);
    }
  };

  const entries = data.entries.filter((e) => e.type === activeType);

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (methodFilter !== 'all' && e.method !== methodFilter) return false;
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.comment || '').toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    }
    return true;
  });

  const totalFiltered = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amt = Number(formAmount);
    if (!formTitle.trim() || !amt || amt <= 0) {
      setFormError(
        lang === 'en'
          ? 'Provide a valid description and amount'
          : 'সঠিক বিবরণ ও টাকার পরিমাণ দিন'
      );
      return;
    }
    addEntry({
      type: activeType,
      title: formTitle.trim(),
      amount: amt,
      method: formMethod,
      comment: formComment.trim(),
      date: formDate || todayIso(),
    });
    setFormTitle('');
    setFormAmount('');
    setFormComment('');
    triggerToast(
      lang === 'en'
        ? `${activeType === 'income' ? 'Income' : 'Expense'} entry added!`
        : `${activeType === 'income' ? 'আয়' : 'ব্যয়'} এন্ট্রি সফলভাবে যোগ হয়েছে!`
    );
  };

  const handleOpenEdit = (e: Entry) => {
    setEditingEntry(e);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const amt = Number(editingEntry.amount);
    if (!editingEntry.title.trim() || !amt || amt <= 0) {
      return;
    }
    updateEntry(editingEntry.id, editingEntry);
    setEditingEntry(null);
    triggerToast(
      lang === 'en' ? 'Entry updated successfully!' : 'এন্ট্রি সফলভাবে পরিবর্তন হয়েছে!'
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteEntryTarget) return;
    deleteEntry(deleteEntryTarget.id);
    const title = deleteEntryTarget.title;
    setDeleteEntryTarget(null);
    triggerToast(
      lang === 'en'
        ? `Entry "${title}" deleted.`
        : `"${title}" এন্ট্রিটি মুছে ফেলা হয়েছে।`
    );
  };

  const isIncome = activeType === 'income';

  const getMethodBadge = (m: PaymentMethod) => {
    if (m === 'cash') return lang === 'en' ? 'Cash' : 'ক্যাশ';
    if (m === 'bank') return lang === 'en' ? 'Bank' : 'ব্যাংক';
    return lang === 'en' ? 'bKash/MFS' : 'বিকাশ';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isIncome ? (
              <TrendingUp className="w-6 h-6 text-blue-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-rose-600" />
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {isIncome ? t('incomeLedgerTitle') : t('expenseLedgerTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isIncome ? t('incomeLedgerSubtitle') : t('expenseLedgerSubtitle')}
          </p>
        </div>

        {/* Tab switch between Income and Expense */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-bold shrink-0">
          <button
            onClick={() => {
              setActiveType('income');
              setFormError('');
            }}
            className={`px-4 py-2 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              isIncome
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{lang === 'en' ? 'Income Ledger' : 'আয় হিসাব'}</span>
          </button>
          <button
            onClick={() => {
              setActiveType('expense');
              setFormError('');
            }}
            className={`px-4 py-2 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              !isIncome
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>{lang === 'en' ? 'Expense Ledger' : 'ব্যয় হিসাব'}</span>
          </button>
        </div>
      </div>

      {/* Add New Entry Form */}
      <form
        onSubmit={handleAddSubmit}
        className={`bg-white rounded-xl border p-5 shadow-xs space-y-4 ${
          isIncome ? 'border-blue-200' : 'border-rose-200'
        }`}
      >
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-slate-600" />
          <span>
            {t('addNewEntryPrefix')} {isIncome ? t('incomeLabel') : t('expenseLabel')}{' '}
            {t('entryAddSuffix')}
          </span>
        </h3>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isIncome
                ? lang === 'en'
                  ? 'Income Head / Description *'
                  : 'আয়ের খাত / বিবরণ *'
                : lang === 'en'
                ? 'Expense Head / Description *'
                : 'ব্যয়ের খাত / বিবরণ *'}
            </label>
            <input
              type="text"
              required
              placeholder={
                isIncome
                  ? lang === 'en'
                    ? 'e.g. Bank profit, Member form sales'
                    : 'যেমন: ব্যাংক মুনাফা, সদস্য ফরম বিক্রি'
                  : lang === 'en'
                  ? 'e.g. Office rent, Electricity bill'
                  : 'যেমন: অফিস ঘর ভাড়া, বিদ্যুৎ বিল'
              }
              value={formTitle}
              onChange={(e) => {
                setFormTitle(e.target.value);
                setFormError('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('amountTkLabel')} *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder={lang === 'en' ? 'Amount' : 'টাকা'}
              value={formAmount}
              onChange={(e) => {
                setFormAmount(e.target.value);
                setFormError('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('paymentMethodLabel')}
            </label>
            <select
              value={formMethod}
              onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="cash">💵 {t('cashMethod')}</option>
              <option value="bank">🏦 {t('bankMethod')}</option>
              <option value="bkash">📱 {t('bkashMethod')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('dateCol')}
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('commentRefLabel')}
            </label>
            <input
              type="text"
              placeholder={
                lang === 'en'
                  ? 'e.g. Bill No, Voucher No, Cheque No or details'
                  : 'যেমন: বিল নং, ভাউচার নং, চেক নং বা অন্যান্য তথ্য'
              }
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
              isIncome
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isIncome ? t('addIncomeBtn') : t('addExpenseBtn')}</span>
          </button>
        </div>
      </form>

      {/* Filter and Search Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchEntriesPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">{t('allMethods')}</option>
            <option value="cash">💵 {lang === 'en' ? 'Cash' : 'ক্যাশ'}</option>
            <option value="bank">🏦 {lang === 'en' ? 'Bank' : 'ব্যাংক'}</option>
            <option value="bkash">📱 {lang === 'en' ? 'bKash' : 'বিকাশ'}</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1 text-xs">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              title={t('dateRangeFrom')}
            />
            <span className="text-slate-400">{t('dateRangeFrom')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              title={t('dateRangeTo')}
            />
          </div>
        </div>

        {/* Print & PDF Ledger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintLedger}
            disabled={isPrinting}
            className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>{t('printReportBtn')}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdfLedger}
            disabled={isPrinting}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200 transition"
            title={lang === 'en' ? 'Download A4 PDF ledger' : 'A4 PDF লেজার ডাউনলোড করুন'}
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'en' ? 'PDF' : 'পিডিএফ'}</span>
          </button>
        </div>
      </div>

      {printNotice && (
        <div className="noprint p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{printNotice}</span>
        </div>
      )}

      {/* Ledger Table */}
      <div id="income-expense-ledger-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-28">{t('dateCol')}</th>
                <th className="py-3 px-4">{t('headAndDescriptionCol')}</th>
                <th className="py-3 px-4 text-center w-28">{t('methodCol')}</th>
                <th className="py-3 px-4 text-right w-36">{t('amountTkLabel')}</th>
                <th className="py-3 px-4">{t('commentVoucherCol')}</th>
                <th className="py-3 px-4 text-right w-24 noprint">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    {lang === 'en'
                      ? `No ${isIncome ? 'income' : 'expense'} records found.`
                      : `কোনো ${isIncome ? 'আয়ের' : 'ব্যয়ের'} তথ্য পাওয়া যায়নি।`}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {e.title}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {getMethodBadge(e.method)}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                        isIncome ? 'text-blue-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrencyWithLang(e.amount, lang)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {e.comment || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right noprint whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                          title={t('editTooltip')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canDelete() && (
                          <button
                            onClick={() => setDeleteEntryTarget(e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                            title={lang === 'en' ? 'Delete' : 'মুছে ফেলুন'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr
                className={`font-bold border-t-2 ${
                  isIncome
                    ? 'bg-blue-50/80 border-blue-600 text-blue-900'
                    : 'bg-rose-50/80 border-rose-600 text-rose-900'
                }`}
              >
                <td colSpan={3} className="py-3 px-4 text-right text-xs sm:text-sm">
                  {t('selectedTotalLabel')} {isIncome ? t('incomeLabel') : t('expenseLabel')}:
                </td>
                <td className="py-3 px-4 text-right text-base sm:text-lg font-mono">
                  {formatCurrencyWithLang(totalFiltered, lang)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {deleteEntryTarget && (
        <ConfirmModal
          isOpen={true}
          title={
            lang === 'en'
              ? `Delete ${deleteEntryTarget.type === 'income' ? 'Income' : 'Expense'} Entry`
              : `${deleteEntryTarget.type === 'income' ? 'আয়' : 'ব্যয়'} এন্ট্রি মুছে ফেলুন`
          }
          message={
            lang === 'en'
              ? `Are you sure you want to permanently delete this ${deleteEntryTarget.type} entry? This will update your cashbook and total fund balance.`
              : `আপনি কি "${deleteEntryTarget.title}" এর ${deleteEntryTarget.type === 'income' ? 'আয়' : 'ব্যয়'} এন্ট্রিটি মুছে ফেলতে চান? এটি ক্যাশ বহি ও মোট স্থিতি থেকে সমন্বয় করা হবে।`
          }
          itemName={`${deleteEntryTarget.title} — ${formatCurrencyWithLang(deleteEntryTarget.amount, lang)} (${deleteEntryTarget.date})`}
          confirmLabel={lang === 'en' ? 'Yes, Delete' : 'হ্যাঁ, মুছে ফেলুন'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteEntryTarget(null)}
        />
      )}

      {/* EDIT ENTRY MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>{t('editEntryTitle')}</span>
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('itemDescriptionCol')}
                </label>
                <input
                  type="text"
                  required
                  value={editingEntry.title}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('amountTkLabel')}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingEntry.amount}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('paymentMethodLabel')}
                  </label>
                  <select
                    value={editingEntry.method}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        method: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="cash">{lang === 'en' ? 'Cash' : 'ক্যাশ'}</option>
                    <option value="bank">{lang === 'en' ? 'Bank' : 'ব্যাংক'}</option>
                    <option value="bkash">{lang === 'en' ? 'bKash' : 'বিকাশ'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('dateCol')}
                </label>
                <input
                  type="date"
                  value={editingEntry.date}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('commentRefLabel')}
                </label>
                <input
                  type="text"
                  value={editingEntry.comment || ''}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
                >
                  {t('saveChangesBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
