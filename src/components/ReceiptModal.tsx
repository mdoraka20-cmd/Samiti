import React, { useEffect, useState } from 'react';
import {
  Printer,
  Download,
  X,
  Phone,
  MapPin,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { PaymentItem, Member, Settings } from '../types/samiti';
import { useSamiti } from '../context/SamitiContext';
import {
  formatMemberId,
  formatReceiptId,
  QRCodeGenerator,
  numberToBengaliWords,
} from '../utils/bengali';
import {
  formatNumberWithLang,
  formatCurrencyWithLang,
  formatDateWithLang,
  numberToEnglishWords,
} from '../utils/translations';
import { downloadElementAsPdf } from '../utils/printHelper';

interface ReceiptModalProps {
  receiptId: number;
  payments: PaymentItem[];
  member: Member;
  settings: Settings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptId,
  payments,
  member,
  settings,
  onClose,
}) => {
  const { lang, t } = useSamiti();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    document.body.classList.add('printing-receipt');
    return () => {
      document.body.classList.remove('printing-receipt');
    };
  }, []);

  if (!payments || payments.length === 0) return null;

  const first = payments[0];
  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  // Pad to minimum 4 rows for voucher aesthetic
  const displayRows = [...payments];
  while (displayRows.length < 4) {
    displayRows.push({
      id: -Math.random(),
      receipt_id: receiptId,
      member_id: member.id,
      amount: 0,
      month: '',
      method: first.method,
      comment: '',
      date: first.date,
      category: 'chanda',
      description: '',
      qty: 0,
      price: 0,
      late_fee: 0,
    });
  }

  // QR Code payload
  const qrData = `RCPT:${receiptId}|MEMBER:${formatMemberId(member.id)}|NAME:${member.name}|DATE:${first.date}|TOTAL:${grandTotal}TK`;
  const qrSvg = QRCodeGenerator.svg(qrData, 'w-24 h-24 print:w-20 print:h-20');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    let printAttempted = false;

    try {
      window.focus();
      window.print();
      printAttempted = true;
    } catch (e) {
      console.warn('Direct print blocked by sandbox:', e);
    }

    // In iframe environments where browser blocks native print dialog,
    // automatically generate and download the crisp A4 PDF.
    const inIframe = window.self !== window.top;
    if (inIframe || !printAttempted) {
      await downloadElementAsPdf('receipt-voucher-body', `receipt_${receiptId}_${member.name}`);
      triggerToast(
        lang === 'en'
          ? 'Print-ready PDF downloaded!'
          : 'প্রিন্ট-রেডি PDF ফাইল ডাউনলোড হয়েছে!'
      );
    }
    setIsProcessing(false);
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    const ok = await downloadElementAsPdf('receipt-voucher-body', `receipt_${receiptId}_${member.name}`);
    setIsProcessing(false);
    if (ok) {
      triggerToast(
        lang === 'en'
          ? 'PDF downloaded successfully!'
          : 'রিসিট PDF ফাইল ডাউনলোড হয়েছে!'
      );
    }
  };

  const amountInWords =
    lang === 'en'
      ? numberToEnglishWords(grandTotal)
      : numberToBengaliWords(grandTotal);

  return (
    <div
      id="receipt-modal-wrapper"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
    >
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-5 z-[60] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top border border-emerald-500/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Action bar (No Print) */}
        <div className="noprint bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">
              {t('receiptNoPrefix')} #{formatReceiptId(receiptId)}
            </span>
            <span className="text-slate-400 text-sm">| {member.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
              title={lang === 'en' ? 'Print Receipt' : 'প্রিন্ট করুন'}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{t('printReceiptBtn')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
              title={lang === 'en' ? 'Download PDF' : 'PDF ডাউনলোড'}
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'en' ? 'PDF' : 'PDF ডাউনলোড'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER CONTAINER */}
        <div
          id="receipt-voucher-body"
          className="receipt-voucher-body relative p-6 sm:p-8 text-slate-900 bg-white min-h-[580px] print:p-6 print:m-0"
        >
          {/* Watermark Logo or Heading */}
          {settings.logo ? (
            <div
              className="absolute inset-0 bg-center bg-no-repeat pointer-events-none opacity-[0.06]"
              style={{
                backgroundImage: `url(${settings.logo})`,
                backgroundSize: '320px',
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <span className="text-5xl font-extrabold tracking-wider rotate-[-15deg] select-none text-indigo-900 uppercase">
                {settings.heading}
              </span>
            </div>
          )}

          {/* Top Header Section */}
          <div className="relative flex justify-between items-start gap-4 pb-4 border-b-2 border-indigo-900">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xl print:border print:border-indigo-900">
                  {settings.heading.slice(0, 1)}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-950 tracking-wide uppercase font-serif">
                    {settings.heading}
                  </h1>
                  {settings.subheading && (
                    <p className="text-xs sm:text-sm font-medium text-indigo-800">
                      {settings.subheading}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-700 inline shrink-0" />
                  <span>{settings.address}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-700 inline shrink-0" />
                  <span>{t('mobileLabel')} {settings.mobile}</span>
                  {settings.email && <span> | Email: {settings.email}</span>}
                </p>
              </div>
            </div>

            {/* Verification QR Code */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="p-1 border-2 border-indigo-900 rounded bg-white shadow-xs"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="text-[10px] text-indigo-950 font-mono mt-0.5 font-bold">
                {t('verifiedQrBadge')}
              </span>
            </div>
          </div>

          {/* Receipt Title Banner & Meta */}
          <div className="relative my-4 flex flex-wrap items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-900 text-white px-3 py-1 rounded text-xs font-bold tracking-wider uppercase">
                {t('moneyReceiptBadge')}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {t('voucherNoLabel')}{' '}
                <span className="font-mono text-base font-bold text-indigo-950">
                  #{formatReceiptId(receiptId)}
                </span>
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <span>{t('receiptDateLabel')}</span>
              <span className="font-mono bg-white px-2.5 py-1 rounded border border-indigo-200 text-slate-900 font-bold">
                {formatDateWithLang(first.date, lang)}
              </span>
            </div>
          </div>

          {/* Member Information Box */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 border border-slate-200 rounded-lg bg-slate-50/70 text-xs mb-4">
            <div>
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                {t('billToTitle')}
              </span>
              <div className="font-bold text-sm text-slate-900 mt-0.5">
                {member.name}
              </div>
              <div className="text-slate-600 mt-0.5">
                {t('shareholderIdLabel')}{' '}
                <span className="font-mono font-bold text-indigo-900">
                  {formatMemberId(member.id)}
                </span>
                {member.share_count && (
                  <span> | {formatNumberWithLang(member.share_count, lang)} {lang === 'en' ? 'Shares' : 'টি শেয়ার'}</span>
                )}
              </div>
              <div className="text-slate-600">
                {t('addressLabel')} {member.address || '—'}
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div>
                <span className="text-slate-500">{t('mobileLabel')} </span>
                <span className="font-mono font-semibold text-slate-800">
                  {member.mobile || '—'}
                </span>
              </div>
              {member.nominee && (
                <div>
                  <span className="text-slate-500">{t('nomineeText')} </span>
                  <span className="font-semibold text-slate-800">{member.nominee}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">{t('paymentModeLabel')} </span>
                <span className="inline-block px-2 py-0.5 font-bold uppercase rounded bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px]">
                  {first.method === 'cash'
                    ? t('cashModeLabel')
                    : first.method === 'bank'
                    ? t('bankModeLabel')
                    : t('bkashModeLabel')}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="relative border-2 border-indigo-900 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-indigo-900 text-white font-bold border-b border-indigo-900 text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">{t('serialCol')}</th>
                  <th className="py-2.5 px-3">{t('itemizedDescriptionCol')}</th>
                  <th className="py-2.5 px-3 w-32 text-center">{t('shareTimesPriceCol')}</th>
                  <th className="py-2.5 px-3 w-28 text-center">{t('lateFeeCol')}</th>
                  <th className="py-2.5 px-4 w-36 text-right">{t('lineTotalCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {displayRows.map((it, idx) => {
                  const isReal = it.amount > 0 || it.description;
                  return (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      style={{ minHeight: '36px' }}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                        {isReal ? formatNumberWithLang(idx + 1, lang) : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">
                        {it.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-xs">
                        {isReal && (Number(it.qty) > 0 || Number(it.price) > 0)
                          ? `${formatNumberWithLang(it.qty, lang)} × ${formatCurrencyWithLang(it.price, lang)}`
                          : ''}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-xs">
                        {isReal && Number(it.late_fee) > 0
                          ? formatCurrencyWithLang(it.late_fee, lang)
                          : ''}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {isReal ? formatCurrencyWithLang(it.amount, lang) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-900 text-slate-900">
                  <td colSpan={4} className="py-3 px-4 text-right text-xs sm:text-sm">
                    {t('grandTotalPayable')}
                  </td>
                  <td className="py-3 px-4 text-right text-base sm:text-lg font-bold font-mono text-indigo-950 whitespace-nowrap">
                    {formatCurrencyWithLang(grandTotal, lang)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount In Words & Notes */}
          <div className="relative space-y-2 text-xs mb-8">
            <div className="p-2.5 rounded bg-slate-100 border border-slate-200">
              <span className="font-bold text-slate-700">{t('inWordsLabel')} </span>
              <span className="font-semibold text-indigo-950 capitalize">{amountInWords}</span>
            </div>

            {(first.comment || settings.note) && (
              <div className="text-[11px] text-slate-600 space-y-0.5">
                {first.comment && (
                  <p>
                    <span className="font-bold">{t('specialNoteLabel')}</span> {first.comment}
                  </p>
                )}
                {settings.note && (
                  <p className="text-slate-500 italic">
                    {settings.note}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="relative mt-12 pt-6 flex justify-between items-end text-xs">
            {/* Member signature */}
            <div className="text-center min-w-[140px]">
              <div className="h-10"></div>
              <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                {t('memberSignatureLabel')}
              </div>
            </div>

            {/* Software attribution notice */}
            <div className="text-center text-[10px] text-slate-400 font-mono">
              <p>{t('preparedBySoftware')}</p>
              <p>{t('computerGeneratedNotice')}</p>
            </div>

            {/* Cashier / Manager Signature */}
            <div className="text-center min-w-[160px]">
              {settings.signature ? (
                <img
                  src={settings.signature}
                  alt="Signature"
                  className="h-10 mx-auto object-contain mix-blend-multiply mb-1"
                />
              ) : (
                <div className="h-10"></div>
              )}
              <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                {t('cashierSignatureLabel')}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar (No Print) */}
        <div className="noprint bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap border-t border-slate-800">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-emerald-400">
              {t('receiptNoPrefix')} #{formatReceiptId(receiptId)}
            </span>
            <span className="text-slate-400">| {member.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{t('printReceiptBtn')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4" />
              <span>{lang === 'en' ? 'Close' : 'বন্ধ করুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
