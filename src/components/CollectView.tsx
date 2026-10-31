import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { ReceiptFormItem, PaymentMethod } from '../types/samiti';
import {
  todayIso,
  currentMonthIso,
  formatMemberId,
  formatReceiptId,
} from '../utils/bengali';
import {
  formatCurrencyWithLang,
  formatNumberWithLang,
  getMonthNameWithLang,
} from '../utils/translations';
import { ConfirmModal } from './ConfirmModal';

interface CollectViewProps {
  initialMemberId?: number | null;
  editingReceiptId?: number | null;
  onViewReceipt: (receiptId: number) => void;
  onClearEdit?: () => void;
}

export const CollectView: React.FC<CollectViewProps> = ({
  initialMemberId,
  editingReceiptId,
  onViewReceipt,
  onClearEdit,
}) => {
  const {
    data,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    getReceiptsGrouped,
    canDelete,
    lang,
    t,
  } = useSamiti();

  const activeMembers = data.members.filter((m) => m.active);
  const curMonth = currentMonthIso();
  const defaultSharePrice = Number(data.settings.share_price) || 500;

  // Selected Member
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(
    initialMemberId || (activeMembers[0]?.id ?? '')
  );

  // Receipt Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptDate, setReceiptDate] = useState<string>(todayIso());
  const [comment, setComment] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Delete modal state
  const [deleteReceiptTarget, setDeleteReceiptTarget] = useState<{
    receiptId: number;
    total: number;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const getDefaultChandaDesc = (m: string) =>
    lang === 'en'
      ? `Monthly Share (${getMonthNameWithLang(m, 'en')})`
      : `মাসিক চাঁদা (${getMonthNameWithLang(m, 'bn')})`;

  // Multi-line receipt items
  const [items, setItems] = useState<ReceiptFormItem[]>([
    {
      category: 'chanda',
      month: curMonth,
      description: getDefaultChandaDesc(curMonth),
      qty: 1,
      price: defaultSharePrice,
      late_fee: 0,
      auto: true,
    },
  ]);

  // Receipts Table Search
  const [tableSearch, setTableSearch] = useState('');

  // Handle Edit mode initialization
  useEffect(() => {
    if (editingReceiptId) {
      const existing = data.payments.filter((p) => p.receipt_id === editingReceiptId);
      if (existing.length > 0) {
        const first = existing[0];
        setSelectedMemberId(first.member_id);
        setPaymentMethod(first.method);
        setReceiptDate(first.date);
        setComment(first.comment || '');
        setItems(
          existing.map((p) => ({
            category: p.category,
            month: p.month,
            description: p.description,
            qty: p.qty,
            price: p.price,
            late_fee: p.late_fee,
            auto: false,
          }))
        );
      }
    }
  }, [editingReceiptId, data.payments]);

  // Sync initial member if passed
  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  const selectedMember = data.members.find((m) => m.id === selectedMemberId);

  // Update line row category
  const handleCategoryChange = (index: number, cat: 'chanda' | 'other') => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      const newMonth = cat === 'chanda' ? curMonth : '';
      const newDesc =
        cat === 'chanda'
          ? getDefaultChandaDesc(curMonth)
          : lang === 'en'
          ? 'Other Collection Fee'
          : 'অন্যান্য আদায় ফি';
      copy[index] = {
        ...cur,
        category: cat,
        month: newMonth,
        description: cur.auto ? newDesc : cur.description,
      };
      return copy;
    });
  };

  // Update line month
  const handleMonthChange = (index: number, newMonth: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      copy[index] = {
        ...cur,
        month: newMonth,
        description: cur.auto ? getDefaultChandaDesc(newMonth) : cur.description,
      };
      return copy;
    });
  };

  // Update other row fields
  const handleItemFieldChange = (
    index: number,
    field: keyof ReceiptFormItem,
    val: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val,
        ...(field === 'description' ? { auto: false } : {}),
      };
      return copy;
    });
  };

  // Add line row
  const handleAddRow = () => {
    if (items.length >= 10) {
      setFormError(
        lang === 'en'
          ? 'Maximum 10 items allowed per receipt'
          : 'এক রিসিটে সর্বোচ্চ ১০টি আইটেম যোগ করা যাবে'
      );
      return;
    }
    setFormError('');
    setItems((prev) => [
      ...prev,
      {
        category: 'other',
        month: curMonth,
        description: lang === 'en' ? 'Other Fee / Grant' : 'অন্যান্য ফি / অনুদান',
        qty: 1,
        price: 100,
        late_fee: 0,
        auto: false,
      },
    ]);
  };

  // Remove line row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Total calculation
  const grandTotal = items.reduce((sum, it) => {
    const q = Number(it.qty) || 0;
    const pr = Number(it.price) || 0;
    const lf = Number(it.late_fee) || 0;
    return sum + (q * pr + lf);
  }, 0);

  // Submit Receipt
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedMemberId) {
      setFormError(lang === 'en' ? 'Please select a member' : 'অনুগ্রহ করে একজন সদস্য নির্বাচন করুন');
      return;
    }

    if (items.length === 0) {
      setFormError(lang === 'en' ? 'Please add at least one row' : 'কমপক্ষে একটি সারিতে হিসাব দিন');
      return;
    }

    // Validation
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const lineTot = (Number(it.qty) || 0) * (Number(it.price) || 0) + (Number(it.late_fee) || 0);
      if (lineTot <= 0 || !it.description.trim()) {
        setFormError(
          lang === 'en'
            ? `Row #${i + 1}: Provide valid description and amount`
            : `সারি #${i + 1}: সঠিক বিবরণ ও টাকার পরিমাণ দিন`
        );
        return;
      }
    }

    if (editingReceiptId) {
      updateReceipt(
        editingReceiptId,
        Number(selectedMemberId),
        paymentMethod,
        receiptDate,
        comment,
        items
      );
      if (onClearEdit) onClearEdit();
      triggerToast(
        lang === 'en'
          ? `Receipt #${editingReceiptId} updated!`
          : `রিসিট #${editingReceiptId} সফলভাবে আপডেট হয়েছে!`
      );
      onViewReceipt(editingReceiptId);
    } else {
      const newReceiptId = addReceipt(
        Number(selectedMemberId),
        paymentMethod,
        receiptDate,
        comment,
        items
      );
      // Reset form
      setComment('');
      setItems([
        {
          category: 'chanda',
          month: curMonth,
          description: getDefaultChandaDesc(curMonth),
          qty: 1,
          price: defaultSharePrice,
          late_fee: 0,
          auto: true,
        },
      ]);
      triggerToast(
        lang === 'en'
          ? `Receipt #${newReceiptId} created successfully!`
          : `রিসিট #${newReceiptId} সফলভাবে তৈরি হয়েছে!`
      );
      onViewReceipt(newReceiptId);
    }
  };

  const handleConfirmDeleteReceipt = () => {
    if (!deleteReceiptTarget) return;
    deleteReceipt(deleteReceiptTarget.receiptId);
    const rId = deleteReceiptTarget.receiptId;
    setDeleteReceiptTarget(null);
    triggerToast(
      lang === 'en'
        ? `Receipt #${rId} deleted successfully.`
        : `রিসিট #${rId} সফলভাবে মুছে ফেলা হয়েছে।`
    );
  };

  // Filter receipts list
  const receipts = getReceiptsGrouped();
  const qLower = tableSearch.trim().toLowerCase();
  const filteredReceipts = receipts.filter((rcpt) => {
    if (!qLower) return true;
    const first = rcpt.items[0];
    const member = data.members.find((m) => m.id === first.member_id);
    const mid = member ? formatMemberId(member.id).toLowerCase() : '';
    const rNo = String(rcpt.receipt_id);
    return (
      rNo.includes(qLower) ||
      (member && member.name.toLowerCase().includes(qLower)) ||
      mid.includes(qLower) ||
      rcpt.items.some((it) => it.description.toLowerCase().includes(qLower))
    );
  });

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

      {/* Header and Mode alert */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-700" />
            <span>
              {editingReceiptId
                ? `${t('editReceiptTitle')} #${formatReceiptId(editingReceiptId)}`
                : t('moneyReceiptTitle')}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('collectSubtitle')}
          </p>
        </div>

        {editingReceiptId && (
          <button
            onClick={() => {
              if (onClearEdit) onClearEdit();
              setItems([
                {
                  category: 'chanda',
                  month: curMonth,
                  description: getDefaultChandaDesc(curMonth),
                  qty: 1,
                  price: defaultSharePrice,
                  late_fee: 0,
                  auto: true,
                },
              ]);
            }}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t('cancelEditBtn')}
          </button>
        )}
      </div>

      {/* Main Collection Voucher Form */}
      <form
        onSubmit={handleSubmitReceipt}
        className="bg-white rounded-xl border-2 border-emerald-700/80 shadow-md p-5 sm:p-6 space-y-6"
      >
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Top Info: Member, Method, Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Member Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{t('selectMemberLabel')} *</span>
              {selectedMember && (
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  {lang === 'en' ? 'ID' : 'আইডি'}: {formatMemberId(selectedMember.id)}
                </span>
              )}
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(Number(e.target.value));
                setFormError('');
              }}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="">-- {t('selectMemberLabel')} --</option>
              {data.members.map((m) => (
                <option key={m.id} value={m.id} disabled={!m.active && m.id !== selectedMemberId}>
                  {formatMemberId(m.id)} - {m.name} {!m.active ? `(${lang === 'en' ? 'Archived' : 'বাদ দেওয়া'})` : ''} {m.mobile ? `(${m.mobile})` : ''}
                </option>
              ))}
            </select>
            {selectedMember && (
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {lang === 'en' ? 'Address: ' : 'ঠিকানা: '}{selectedMember.address || '—'} | {lang === 'en' ? 'Mobile: ' : 'মোবাইল: '}{selectedMember.mobile || '—'}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('paymentMethodLabel')} *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="cash">💵 {t('cashMethod')}</option>
              <option value="bank">🏦 {t('bankMethod')}</option>
              <option value="bkash">📱 {t('bkashMethod')}</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('collectionDateLabel')} *
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Itemized Lines Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-xs uppercase tracking-wide text-slate-700">
              {t('receiptItemTableTitle')}
            </span>
            <span className="text-xs text-slate-500">
              {t('totalRowsLabel')} {formatNumberWithLang(items.length, lang)} {lang === 'en' ? 'rows' : 'টি'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-36">{t('itemTypeCol')}</th>
                  <th className="py-2.5 px-3 w-40">{t('itemMonthCol')}</th>
                  <th className="py-2.5 px-3">{t('itemDescriptionCol')}</th>
                  <th className="py-2.5 px-3 w-24 text-center">{t('itemShareCol')}</th>
                  <th className="py-2.5 px-3 w-32 text-center">{t('itemPriceCol')}</th>
                  <th className="py-2.5 px-3 w-28 text-center">{t('itemLateFeeCol')}</th>
                  <th className="py-2.5 px-3 w-32 text-right">{t('itemTotalCol')}</th>
                  <th className="py-2.5 px-2 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((row, idx) => {
                  const lineTotal =
                    (Number(row.qty) || 0) * (Number(row.price) || 0) +
                    (Number(row.late_fee) || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <select
                          value={row.category}
                          onChange={(e) =>
                            handleCategoryChange(idx, e.target.value as 'chanda' | 'other')
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="chanda">{t('chandaOption')}</option>
                          <option value="other">{t('otherOption')}</option>
                        </select>
                      </td>

                      {/* Month Picker (Only for chanda) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="month"
                          disabled={row.category === 'other'}
                          value={row.month}
                          onChange={(e) => handleMonthChange(idx, e.target.value)}
                          className={`w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                            row.category === 'other'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-white text-slate-900'
                          }`}
                        />
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'description', e.target.value)
                          }
                          placeholder={lang === 'en' ? 'Item description...' : 'আদায়ের বিবরণ লিখুন...'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Qty */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'qty', Math.max(1, Number(e.target.value)))
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={row.price}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'price', Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Late Fee */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={row.late_fee || ''}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'late_fee', Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-800 text-sm whitespace-nowrap">
                        {formatCurrencyWithLang(lineTotal, lang)}
                      </td>

                      {/* Remove Button */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={items.length <= 1}
                          className={`p-1 rounded text-slate-400 hover:text-rose-600 transition ${
                            items.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={lang === 'en' ? 'Remove this row' : 'এই সারিটি মুছুন'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/80 font-bold border-t-2 border-emerald-700">
                  <td colSpan={6} className="py-3 px-4 text-right text-slate-800 text-sm sm:text-base">
                    {t('grandTotalPayable')}
                  </td>
                  <td className="py-3 px-3 text-right text-lg sm:text-xl font-bold font-mono text-emerald-900 whitespace-nowrap">
                    {formatCurrencyWithLang(grandTotal, lang)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Add row button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>{t('addMoreRowBtn')}</span>
          </button>
        </div>

        {/* Comment field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t('commentNotesLabel')}
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {t('receiptAutoPrintNotice')}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{editingReceiptId ? `💾 ${t('saveChangesBtn')}` : t('completeDepositBtn')}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Existing Receipts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('allReceiptsTableTitle')}</h3>
            <p className="text-xs text-slate-500">{t('allReceiptsTableSubtitle')}</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchReceiptsPlaceholder')}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-24">{t('receiptNoCol')}</th>
                <th className="py-3 px-4 w-28">{t('dateCol')}</th>
                <th className="py-3 px-4">{t('memberNameAndIdCol')}</th>
                <th className="py-3 px-4">{t('descriptionCol')}</th>
                <th className="py-3 px-4 text-center">{t('methodCol')}</th>
                <th className="py-3 px-4 text-right">{t('totalTkCol')}</th>
                <th className="py-3 px-4 text-right">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    {t('noReceipts')}
                  </td>
                </tr>
              ) : (
                filteredReceipts.slice(0, 50).map((rcpt) => {
                  const first = rcpt.items[0];
                  const member = data.members.find((m) => m.id === first.member_id);
                  const total = rcpt.items.reduce((s, p) => s + p.amount, 0);

                  return (
                    <tr key={rcpt.receipt_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-950">
                        #{formatReceiptId(rcpt.receipt_id)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700 whitespace-nowrap">
                        {first.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {member ? member.name : (lang === 'en' ? '(Archived Member)' : '(মুছে ফেলা সদস্য)')}
                        </div>
                        {member && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {formatMemberId(member.id)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs">
                        <div className="truncate font-medium">
                          {rcpt.items.map((it) => it.description).join(', ')}
                        </div>
                        {first.comment && (
                          <div className="text-[11px] text-slate-400 truncate italic">
                            {lang === 'en' ? 'Note: ' : 'নোট: '}{first.comment}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {getMethodBadge(first.method)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-emerald-700 text-sm">
                        {formatCurrencyWithLang(total, lang)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewReceipt(rcpt.receipt_id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title={lang === 'en' ? 'Print voucher' : 'রিসিট ভাউচার প্রিন্ট করুন'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{t('viewReceiptBtn')}</span>
                          </button>
                          <button
                            onClick={() => {
                              // Trigger edit
                              const ex = data.payments.filter(
                                (p) => p.receipt_id === rcpt.receipt_id
                              );
                              if (ex.length > 0) {
                                setSelectedMemberId(ex[0].member_id);
                                setPaymentMethod(ex[0].method);
                                setReceiptDate(ex[0].date);
                                setComment(ex[0].comment || '');
                                setItems(
                                  ex.map((p) => ({
                                    category: p.category,
                                    month: p.month,
                                    description: p.description,
                                    qty: p.qty,
                                    price: p.price,
                                    late_fee: p.late_fee,
                                    auto: false,
                                  }))
                                );
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title={t('editTooltip')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {canDelete() && (
                            <button
                              onClick={() => {
                                setDeleteReceiptTarget({
                                  receiptId: rcpt.receipt_id,
                                  total,
                                });
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                              title={lang === 'en' ? 'Delete Receipt' : 'রিসিট মুছে ফেলুন'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM RECEIPT DELETE MODAL */}
      {deleteReceiptTarget && (
        <ConfirmModal
          isOpen={true}
          title={lang === 'en' ? 'Delete Money Receipt' : 'মানি রিসিট মুছে ফেলুন'}
          message={
            lang === 'en'
              ? `Are you sure you want to permanently delete receipt #${deleteReceiptTarget.receiptId}? All line items in this voucher will be removed.`
              : `আপনি কি মানি রিসিট #${deleteReceiptTarget.receiptId} স্থায়ীভাবে মুছে ফেলতে চান? এই রিসিটের সকল লাইনের হিসাব হিসাব বহি থেকে বাদ যাবে।`
          }
          itemName={`Receipt #${formatReceiptId(deleteReceiptTarget.receiptId)} — Total: ${formatCurrencyWithLang(deleteReceiptTarget.total, lang)}`}
          confirmLabel={lang === 'en' ? 'Yes, Delete Receipt' : 'হ্যাঁ, রিসিট মুছুন'}
          onConfirm={handleConfirmDeleteReceipt}
          onCancel={() => setDeleteReceiptTarget(null)}
        />
      )}
    </div>
  );
};
