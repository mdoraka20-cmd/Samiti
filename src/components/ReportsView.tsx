import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import {
  formatMemberId,
  formatReceiptId,
  currentMonthIso,
} from '../utils/bengali';
import {
  formatCurrencyWithLang,
  formatNumberWithLang,
  getMonthNameWithLang,
} from '../utils/translations';
import { downloadElementAsPdf, printOrDownloadPdf } from '../utils/printHelper';

interface ReportsViewProps {
  initialSubTab?: string;
  initialMemberId?: number | null;
  onViewReceipt?: (receiptId: number) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialSubTab = 'ind',
  initialMemberId,
  onViewReceipt,
}) => {
  const { data, lang, t } = useSamiti();

  const [activeTab, setActiveTab] = useState<'ind' | 'month' | 'dc' | 'acc'>(
    (initialSubTab as any) || 'ind'
  );

  // Individual Report state
  const [selectedMemberId, setSelectedMemberId] = useState<number>(
    initialMemberId || (data.members[0]?.id ?? 1)
  );

  // Monthly Report state
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthIso());

  // Debit-Credit Report state
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  const activeMembers = data.members.filter((m) => m.active);

  const getReportName = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    if (activeTab === 'ind') {
      const m = data.members.find((x) => x.id === selectedMemberId);
      return `member_report_${m?.name ? m.name.replace(/\s+/g, '_') : selectedMemberId}_${dateStr}`;
    }
    if (activeTab === 'month') {
      return `monthly_report_${selectedMonth}_${dateStr}`;
    }
    if (activeTab === 'dc') {
      return `cashbook_report_${dateStr}`;
    }
    return `balance_sheet_${dateStr}`;
  };

  // Print trigger
  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    setPrintFeedback(null);
    const filename = getReportName();
    const res = await printOrDownloadPdf('reports-printable-container', filename);
    setIsGeneratingPdf(false);
    if (res.method === 'pdf' && res.success) {
      setPrintFeedback(
        lang === 'en'
          ? 'Print-ready PDF report downloaded successfully!'
          : 'প্রিন্ট-রেডি PDF রিপোর্ট ডাউনলোড হয়েছে!'
      );
      setTimeout(() => setPrintFeedback(null), 4000);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPrintFeedback(null);
    const filename = getReportName();
    const ok = await downloadElementAsPdf('reports-printable-container', filename);
    setIsGeneratingPdf(false);
    if (ok) {
      setPrintFeedback(
        lang === 'en'
          ? 'PDF report downloaded successfully!'
          : 'PDF রিপোর্ট ডাউনলোড হয়েছে!'
      );
      setTimeout(() => setPrintFeedback(null), 4000);
    }
  };

  // CSV Export
  const handleExportCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodBadge = (m: string) => {
    if (m === 'cash') return lang === 'en' ? 'Cash' : 'ক্যাশ';
    if (m === 'bank') return lang === 'en' ? 'Bank' : 'ব্যাংক';
    return lang === 'en' ? 'bKash/MFS' : 'বিকাশ';
  };

  // Helper for official report header
  const ReportHeader: React.FC<{ title: string; subtitle?: string }> = ({
    title,
    subtitle,
  }) => (
    <div className="report-header text-center pb-4 mb-4 border-b-2 border-indigo-900">
      <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-950 uppercase font-serif tracking-wide">
        {data.settings.heading}
      </h1>
      {data.settings.subheading && (
        <p className="text-xs text-indigo-800 font-medium">{data.settings.subheading}</p>
      )}
      <p className="text-xs text-slate-600 mt-1">
        {lang === 'en' ? 'Address: ' : 'ঠিকানা: '}{data.settings.address} | {lang === 'en' ? 'Mobile: ' : 'মোবাইল: '}{data.settings.mobile}
      </p>
      <div className="mt-3 inline-block bg-indigo-900 text-white px-4 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase">
        {title}
      </div>
      {subtitle && <p className="text-xs font-semibold text-slate-700 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Tab Bar (No Print) */}
      <div className="noprint bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-700" />
            <span>{t('reportsTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('reportsSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>{t('printReportBtn')}</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
            title={lang === 'en' ? 'Download A4 PDF report' : 'A4 PDF রিপোর্ট ডাউনলোড করুন'}
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'en' ? 'Download PDF' : 'PDF ডাউনলোড'}</span>
          </button>
        </div>
      </div>

      {printFeedback && (
        <div className="noprint p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{printFeedback}</span>
        </div>
      )}

      {/* Tabs navigation (No Print) */}
      <div className="noprint flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ind', label: t('tabMemberReport') },
          { key: 'month', label: t('tabMonthlyReport') },
          { key: 'dc', label: t('tabCashbookReport') },
          { key: 'acc', label: t('tabAccountReport') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INDIVIDUAL MEMBER REPORT                          */}
      {/* ======================================================== */}
      {activeTab === 'ind' && (
        <div className="space-y-4">
          {/* Member selector bar (No Print) */}
          <div className="noprint bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700 shrink-0">
                {t('selectMemberLabelReport')}
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                className="w-full sm:w-80 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatMemberId(m.id)} - {m.name} {m.mobile ? `(${m.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const member = data.members.find((m) => m.id === selectedMemberId);
                const mPayments = data.payments.filter((p) => p.member_id === selectedMemberId);
                const csvRows = [
                  [lang === 'en' ? 'Member ID' : 'সদস্য আইডি', formatMemberId(selectedMemberId)],
                  [lang === 'en' ? 'Member Name' : 'সদস্যের নাম', member?.name || ''],
                  [lang === 'en' ? 'Mobile' : 'মোবাইল', member?.mobile || ''],
                  [lang === 'en' ? 'Address' : 'ঠিকানা', member?.address || ''],
                  [],
                  [
                    lang === 'en' ? 'Receipt No' : 'রিসিট নং',
                    lang === 'en' ? 'Date' : 'তারিখ',
                    lang === 'en' ? 'Description' : 'বিবরণ',
                    lang === 'en' ? 'Method' : 'মাধ্যম',
                    lang === 'en' ? 'Amount (Tk)' : 'টাকা (৳)',
                    lang === 'en' ? 'Comment' : 'মন্তব্য',
                  ],
                  ...mPayments.map((p) => [
                    p.receipt_id,
                    p.date,
                    p.description,
                    getMethodBadge(p.method),
                    p.amount,
                    p.comment,
                  ]),
                  [lang === 'en' ? 'Total Paid' : 'মোট জমা', '', '', '', mPayments.reduce((s, p) => s + p.amount, 0), ''],
                ];
                handleExportCSV(`member_report_${selectedMemberId}.csv`, csvRows);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('csvExportBtn')}</span>
            </button>
          </div>

          {/* Printable Member Statement */}
          <div id="reports-printable-container" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
            <ReportHeader
              title={t('memberLedgerReportTitle')}
              subtitle={`${t('shareholderIdLabel')} ${formatMemberId(selectedMemberId)}`}
            />

            {(() => {
              const member = data.members.find((m) => m.id === selectedMemberId);
              if (!member) {
                return (
                  <p className="text-center py-6 text-slate-400">
                    {lang === 'en' ? 'Member not found' : 'সদস্য পাওয়া যায়নি'}
                  </p>
                );
              }
              const mPayments = data.payments
                .filter((p) => p.member_id === selectedMemberId)
                .sort((a, b) => (a.date < b.date ? -1 : 1));
              const totalPaid = mPayments.reduce((s, p) => s + p.amount, 0);

              return (
                <div className="space-y-6">
                  {/* Member Bio Box */}
                  <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">{t('memberNameCol')}:</span>
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {member.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">{t('mobileLabel')}</span>
                      <span className="font-semibold text-slate-900">{member.mobile || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">{t('shareCountLabel')}:</span>
                      <span className="font-semibold text-slate-900">
                        {formatNumberWithLang(member.share_count || 1, lang)} {t('sharesCountText')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">{t('joiningDateLabel')}</span>
                      <span className="font-semibold text-slate-900">{member.created}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 text-xs block">{t('addressLabel')}</span>
                      <span className="text-slate-800">{member.address || '—'}</span>
                    </div>
                    {member.nominee && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 text-xs block">{t('nomineeText')}</span>
                        <span className="text-slate-800">{member.nominee}</span>
                      </div>
                    )}
                  </div>

                  {/* Payments Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-indigo-100 text-indigo-950 font-bold border-b border-indigo-200">
                          <th className="py-2.5 px-3 w-12 text-center">{t('serialCol')}</th>
                          <th className="py-2.5 px-3 w-24">{t('receiptNoCol')}</th>
                          <th className="py-2.5 px-3 w-28">{t('dateCol')}</th>
                          <th className="py-2.5 px-3">{t('itemDescriptionCol')}</th>
                          <th className="py-2.5 px-3 text-center w-24">{t('methodCol')}</th>
                          <th className="py-2.5 px-3 text-right w-32">{t('lineTotalCol')}</th>
                          <th className="py-2.5 px-3">{t('commentRefLabel')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mPayments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              {lang === 'en' ? 'No deposit receipts found for this member.' : 'এই সদস্যের কোনো জমা রিসিট নেই।'}
                            </td>
                          </tr>
                        ) : (
                          mPayments.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-500">
                                {formatNumberWithLang(idx + 1, lang)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-900 text-xs">
                                <button
                                  onClick={() => onViewReceipt && onViewReceipt(p.receipt_id)}
                                  className="hover:underline cursor-pointer"
                                >
                                  #{formatReceiptId(p.receipt_id)}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                                {p.date}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                {p.description}
                              </td>
                              <td className="py-2.5 px-3 text-center text-xs">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {getMethodBadge(p.method)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                {formatCurrencyWithLang(p.amount, lang)}
                              </td>
                              <td className="py-2.5 px-3 text-xs text-slate-500">
                                {p.comment || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-900 text-white font-bold">
                          <td colSpan={5} className="py-3 px-4 text-right text-xs sm:text-sm">
                            {t('memberTotalDepositSum')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base text-emerald-300">
                            {formatCurrencyWithLang(totalPaid, lang)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="mt-14 pt-6 flex justify-between items-end text-xs">
                    <div className="text-center min-w-[150px]">
                      <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                        {t('memberSignatureLabel')}
                      </div>
                    </div>
                    <div className="text-center min-w-[180px]">
                      {data.settings.signature ? (
                        <img
                          src={data.settings.signature}
                          alt="Signature"
                          className="h-10 mx-auto object-contain mix-blend-multiply"
                        />
                      ) : (
                        <div className="h-8"></div>
                      )}
                      <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                        {t('cashierSignatureLabel')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MONTHLY COLLECTION REGISTER                       */}
      {/* ======================================================== */}
      {activeTab === 'month' && (
        <div className="space-y-4">
          {/* Month selector bar (No Print) */}
          <div className="noprint bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">
                {lang === 'en' ? 'Select Month:' : 'মাস নির্বাচন করুন:'}
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                const monthPayments = data.payments.filter((p) => p.month === selectedMonth);
                const rows = [
                  [t('monthlyRegisterTitle'), getMonthNameWithLang(selectedMonth, lang)],
                  [],
                  [
                    lang === 'en' ? 'Serial' : 'ক্রম',
                    lang === 'en' ? 'ID' : 'আইডি',
                    lang === 'en' ? 'Name' : 'নাম',
                    lang === 'en' ? 'Mobile' : 'মোবাইল',
                    lang === 'en' ? 'Share Deposit (Tk)' : 'চাঁদা জমা (৳)',
                    lang === 'en' ? 'Other Deposit (Tk)' : 'অন্যান্য আদায় (৳)',
                    lang === 'en' ? 'Status' : 'অবস্থা',
                  ],
                  ...activeMembers.map((m, idx) => {
                    const mp = monthPayments.filter((p) => p.member_id === m.id);
                    const chanda = mp
                      .filter((p) => p.category !== 'other')
                      .reduce((s, p) => s + p.amount, 0);
                    const other = mp
                      .filter((p) => p.category === 'other')
                      .reduce((s, p) => s + p.amount, 0);
                    return [
                      idx + 1,
                      formatMemberId(m.id),
                      m.name,
                      m.mobile,
                      chanda,
                      other,
                      chanda > 0 ? t('statusPaid') : t('statusDue'),
                    ];
                  }),
                ];
                handleExportCSV(`monthly_report_${selectedMonth}.csv`, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('csvExportBtn')}</span>
            </button>
          </div>

          {/* Printable Monthly Register */}
          <div id="reports-printable-container" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
            <ReportHeader
              title={`${t('monthlyRegisterTitle')} — ${getMonthNameWithLang(selectedMonth, lang)}`}
              subtitle={`${t('dateCol')}: ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD')}`}
            />

            {(() => {
              const monthPayments = data.payments.filter((p) => p.month === selectedMonth);
              let grandChanda = 0;
              let grandOther = 0;
              let paidCount = 0;

              const memberRows = activeMembers.map((m, idx) => {
                const mp = monthPayments.filter((p) => p.member_id === m.id);
                const chandaItems = mp.filter((p) => p.category !== 'other');
                const otherItems = mp.filter((p) => p.category === 'other');
                const chandaTotal = chandaItems.reduce((s, p) => s + p.amount, 0);
                const otherTotal = otherItems.reduce((s, p) => s + p.amount, 0);

                grandChanda += chandaTotal;
                grandOther += otherTotal;
                if (chandaTotal > 0) paidCount++;

                const methods = [...new Set(mp.map((p) => getMethodBadge(p.method)))].join(', ');
                const comments = [...new Set(mp.map((p) => p.comment).filter(Boolean))].join('; ');

                return {
                  idx: idx + 1,
                  member: m,
                  methods,
                  chandaTotal,
                  otherTotal,
                  otherDesc: otherItems.map((p) => p.description).join(', '),
                  isPaid: chandaTotal > 0,
                  comments,
                };
              });

              return (
                <div className="space-y-4">
                  {/* Register Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-indigo-100 text-indigo-950 font-bold border-b border-indigo-200">
                          <th className="py-2.5 px-3 w-10 text-center">{t('serialCol')}</th>
                          <th className="py-2.5 px-3 w-20">{lang === 'en' ? 'ID' : 'আইডি'}</th>
                          <th className="py-2.5 px-3">{t('memberNameCol')}</th>
                          <th className="py-2.5 px-3">{t('mobileLabel')}</th>
                          <th className="py-2.5 px-3 text-center">{t('methodCol')}</th>
                          <th className="py-2.5 px-3 text-right">{t('chandaOption')} (৳)</th>
                          <th className="py-2.5 px-3 text-right">{t('otherOption')} (৳)</th>
                          <th className="py-2.5 px-3 text-center">{t('memberStatusCol')}</th>
                          <th className="py-2.5 px-3">{t('commentRefLabel')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {memberRows.map((row) => (
                          <tr key={row.member.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center font-mono text-xs text-slate-500">
                              {formatNumberWithLang(row.idx, lang)}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-900 text-xs">
                              {formatMemberId(row.member.id)}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {row.member.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-slate-600">
                              {row.member.mobile || '—'}
                            </td>
                            <td className="py-2 px-3 text-center text-xs text-slate-700">
                              {row.methods || '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {row.chandaTotal > 0 ? formatCurrencyWithLang(row.chandaTotal, lang) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700 text-xs">
                              {row.otherTotal > 0 ? (
                                <div>
                                  <span className="font-bold">{formatCurrencyWithLang(row.otherTotal, lang)}</span>
                                  {row.otherDesc && (
                                    <span className="block text-[10px] text-slate-400">
                                      ({row.otherDesc})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.isPaid ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  {t('statusPaid')}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                  {t('statusDue')}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-slate-500 max-w-xs truncate">
                              {row.comments || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-900 text-white font-bold">
                          <td colSpan={5} className="py-3 px-4 text-right text-xs sm:text-sm">
                            {lang === 'en'
                              ? `Total (Paid: ${formatNumberWithLang(paidCount, lang)} / Dues: ${formatNumberWithLang(activeMembers.length - paidCount, lang)}):`
                              : `সর্বমোট (পরিশোধ করেছেন: ${formatNumberWithLang(paidCount, lang)} জন / বকেয়া: ${formatNumberWithLang(activeMembers.length - paidCount, lang)} জন):`}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base text-emerald-300">
                            {formatCurrencyWithLang(grandChanda, lang)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base text-amber-300">
                            {formatCurrencyWithLang(grandOther, lang)}
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-right font-mono text-white text-base">
                            {lang === 'en' ? 'Total: ' : 'মোট: '} {formatCurrencyWithLang(grandChanda + grandOther, lang)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block">{t('totalMembers')}:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatNumberWithLang(activeMembers.length, lang)} {t('persons')}
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-emerald-800 block">{t('paidSummaryText')}</span>
                      <span className="font-bold text-emerald-900 text-sm">
                        {formatNumberWithLang(paidCount, lang)} {t('persons')}
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-rose-800 block">{t('dueSummaryText')}</span>
                      <span className="font-bold text-rose-900 text-sm">
                        {formatNumberWithLang(activeMembers.length - paidCount, lang)} {t('persons')}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <span className="text-indigo-800 block">{t('monthTotalCollected')}</span>
                      <span className="font-bold text-indigo-950 text-sm font-mono">
                        {formatCurrencyWithLang(grandChanda + grandOther, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DEBIT-CREDIT CASHBOOK LEDGER                      */}
      {/* ======================================================== */}
      {activeTab === 'dc' && (
        <div className="space-y-4">
          {/* Date range filter (No Print) */}
          <div className="noprint bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700">{t('cashbookFilterLabel')}</span>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                />
                <span className="text-slate-400">{t('dateRangeFrom')}</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  {t('clearFilterBtn')}
                </button>
              )}
            </div>

            <button
              onClick={() => {
                const inRange = (d: string) => (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
                const transactions = [
                  ...data.payments
                    .filter((p) => inRange(p.date))
                    .map((p) => {
                      const m = data.members.find((mem) => mem.id === p.member_id);
                      return {
                        date: p.date,
                        title: `${p.description || (lang === 'en' ? 'Deposit' : 'চাঁদা')} — ${m ? m.name : ''} (${formatMemberId(p.member_id)})`,
                        method: p.method,
                        credit: p.amount,
                        debit: 0,
                        comment: p.comment,
                      };
                    }),
                  ...data.entries
                    .filter((e) => inRange(e.date))
                    .map((e) => ({
                      date: e.date,
                      title: `${e.type === 'income' ? (lang === 'en' ? 'Income: ' : 'সাধারণ আয় — ') : (lang === 'en' ? 'Expense: ' : 'ব্যয় — ')}${e.title}`,
                      method: e.method,
                      credit: e.type === 'income' ? e.amount : 0,
                      debit: e.type === 'expense' ? e.amount : 0,
                      comment: e.comment,
                    })),
                ].sort((a, b) => (a.date < b.date ? -1 : 1));

                const rows = [
                  [t('cashbookTitle'), dateFrom || dateTo ? `${dateFrom} to ${dateTo}` : 'All Time'],
                  [],
                  [
                    lang === 'en' ? 'Date' : 'তারিখ',
                    lang === 'en' ? 'Description' : 'বিবরণ',
                    lang === 'en' ? 'Method' : 'মাধ্যম',
                    lang === 'en' ? 'Credit (Deposit)' : 'ক্রেডিট (জমা)',
                    lang === 'en' ? 'Debit (Expense)' : 'ডেবিট (খরচ)',
                    lang === 'en' ? 'Comment' : 'মন্তব্য',
                  ],
                  ...transactions.map((tItem) => [
                    tItem.date,
                    tItem.title,
                    getMethodBadge(tItem.method),
                    tItem.credit,
                    tItem.debit,
                    tItem.comment,
                  ]),
                ];
                handleExportCSV(`cashbook_${dateFrom || 'all'}_${dateTo || 'all'}.csv`, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('csvExportBtn')}</span>
            </button>
          </div>

          {/* Printable Cashbook */}
          <div id="reports-printable-container" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
            <ReportHeader
              title={t('cashbookTitle')}
              subtitle={
                dateFrom || dateTo
                  ? `${dateFrom || (lang === 'en' ? 'Start' : 'শুরু')} ${t('dateRangeTo')} ${dateTo || (lang === 'en' ? 'Today' : 'আজ পর্যন্ত')}`
                  : (lang === 'en' ? 'All Transactions from Inception' : 'সার্বিক শুরু হতে বর্তমান পর্যন্ত')
              }
            />

            {(() => {
              const inRange = (d: string) => (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);

              const transactions = [
                ...data.payments
                  .filter((p) => inRange(p.date))
                  .map((p) => {
                    const m = data.members.find((mem) => mem.id === p.member_id);
                    return {
                      date: p.date,
                      title: `${p.description || (lang === 'en' ? 'Deposit' : 'চাঁদা')} — ${m ? m.name : ''} (${formatMemberId(p.member_id)})`,
                      method: p.method,
                      credit: p.amount,
                      debit: 0,
                      comment: p.comment,
                    };
                  }),
                ...data.entries
                  .filter((e) => inRange(e.date))
                  .map((e) => ({
                    date: e.date,
                    title: `${e.type === 'income' ? (lang === 'en' ? 'Income: ' : 'সাধারণ আয় — ') : (lang === 'en' ? 'Expense: ' : 'ব্যয় — ')}${e.title}`,
                    method: e.method,
                    credit: e.type === 'income' ? e.amount : 0,
                    debit: e.type === 'expense' ? e.amount : 0,
                    comment: e.comment,
                  })),
              ].sort((a, b) => (a.date < b.date ? -1 : 1));

              let runningBalance = 0;
              let totalCredit = 0;
              let totalDebit = 0;

              return (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-indigo-100 text-indigo-950 font-bold border-b border-indigo-200">
                          <th className="py-2.5 px-3 w-28">{t('dateCol')}</th>
                          <th className="py-2.5 px-3">{t('transactionDescriptionCol')}</th>
                          <th className="py-2.5 px-3 text-center w-24">{t('methodCol')}</th>
                          <th className="py-2.5 px-3 text-right w-28 text-emerald-800">{t('creditDeposit')}</th>
                          <th className="py-2.5 px-3 text-right w-28 text-rose-800">{t('debitExpense')}</th>
                          <th className="py-2.5 px-3 text-right w-32">{t('runningBalanceCol')}</th>
                          <th className="py-2.5 px-3">{t('commentRefLabel')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              {lang === 'en' ? 'No transactions found in selected date range.' : 'নির্বাচিত তারিখে কোনো লেনদেন পাওয়া যায়নি।'}
                            </td>
                          </tr>
                        ) : (
                          transactions.map((tx, idx) => {
                            runningBalance += tx.credit - tx.debit;
                            totalCredit += tx.credit;
                            totalDebit += tx.debit;

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                                  {tx.date}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {tx.title}
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {getMethodBadge(tx.method)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                  {tx.credit > 0 ? formatCurrencyWithLang(tx.credit, lang) : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                                  {tx.debit > 0 ? formatCurrencyWithLang(tx.debit, lang) : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {formatCurrencyWithLang(runningBalance, lang)}
                                </td>
                                <td className="py-2.5 px-3 text-xs text-slate-500 max-w-xs truncate">
                                  {tx.comment || '—'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-900 text-white font-bold">
                          <td colSpan={3} className="py-3 px-4 text-right text-xs sm:text-sm">
                            {t('totalTransactionsLabel')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base text-emerald-300">
                            {formatCurrencyWithLang(totalCredit, lang)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base text-rose-300">
                            {formatCurrencyWithLang(totalDebit, lang)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-base text-yellow-300">
                            {formatCurrencyWithLang(runningBalance, lang)}
                          </td>
                          <td className="py-3 px-3 text-xs text-indigo-200">
                            {t('netBalanceSummaryLabel')} {formatCurrencyWithLang(totalCredit - totalDebit, lang)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ACCOUNT BREAKDOWN & FUND SUMMARY                  */}
      {/* ======================================================== */}
      {activeTab === 'acc' && (
        <div className="space-y-4">
          <div id="reports-printable-container" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
            <ReportHeader
              title={t('balanceSheetTitle')}
              subtitle={`${t('dateCol')}: ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD')}`}
            />

            {(() => {
              const totals = {
                cash: { credit: 0, debit: 0 },
                bank: { credit: 0, debit: 0 },
                bkash: { credit: 0, debit: 0 },
              };

              data.payments.forEach((p) => {
                if (totals[p.method]) totals[p.method].credit += p.amount;
              });

              data.entries.forEach((e) => {
                if (totals[e.method]) {
                  if (e.type === 'income') totals[e.method].credit += e.amount;
                  else totals[e.method].debit += e.amount;
                }
              });

              const totalChanda = data.payments
                .filter((p) => p.category !== 'other')
                .reduce((s, p) => s + p.amount, 0);
              const totalOther = data.payments
                .filter((p) => p.category === 'other')
                .reduce((s, p) => s + p.amount, 0);
              const totalIncome = data.entries
                .filter((e) => e.type === 'income')
                .reduce((s, e) => s + e.amount, 0);
              const totalExpense = data.entries
                .filter((e) => e.type === 'expense')
                .reduce((s, e) => s + e.amount, 0);

              const grandIncome = totalChanda + totalOther + totalIncome;
              const netFundBalance = grandIncome - totalExpense;

              const sumCredit = Object.values(totals).reduce((s, x) => s + x.credit, 0);
              const sumDebit = Object.values(totals).reduce((s, x) => s + x.debit, 0);

              return (
                <div className="space-y-8">
                  {/* Table 1: Channel Breakdown */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                      <span>{t('accountChannelSectionTitle')}</span>
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-2.5 px-3">{t('accountMethod')}</th>
                            <th className="py-2.5 px-3 text-right text-emerald-800">{t('creditDeposit')}</th>
                            <th className="py-2.5 px-3 text-right text-rose-800">{t('debitExpense')}</th>
                            <th className="py-2.5 px-3 text-right font-bold">{t('currentBalance')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              💵 {t('cashInHand')}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatCurrencyWithLang(totals.cash.credit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                              {formatCurrencyWithLang(totals.cash.debit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrencyWithLang(totals.cash.credit - totals.cash.debit, lang)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              🏦 {t('bankAccount')}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatCurrencyWithLang(totals.bank.credit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                              {formatCurrencyWithLang(totals.bank.debit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrencyWithLang(totals.bank.credit - totals.bank.debit, lang)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              📱 {t('bkashMfs')}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatCurrencyWithLang(totals.bkash.credit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                              {formatCurrencyWithLang(totals.bkash.debit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrencyWithLang(totals.bkash.credit - totals.bkash.debit, lang)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-200/80 font-bold text-slate-900">
                            <td className="py-3 px-3">{t('grandTotalBalance')}</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-800">
                              {formatCurrencyWithLang(sumCredit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-rose-800">
                              {formatCurrencyWithLang(sumDebit, lang)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-indigo-950 text-base">
                              {formatCurrencyWithLang(sumCredit - sumDebit, lang)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Table 2: Financial Profit & Fund Statement */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                      <span>{t('financialProfitSectionTitle')}</span>
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {t('regularChandaItem')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              {formatCurrencyWithLang(totalChanda, lang)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {t('otherReceiptsItem')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              {formatCurrencyWithLang(totalOther, lang)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {t('generalIncomeItem')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              {formatCurrencyWithLang(totalIncome, lang)}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/80 font-bold text-emerald-950">
                            <td className="py-3.5 px-4 text-sm sm:text-base">
                              {t('totalEarnedRevenue')}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-emerald-900 text-base sm:text-lg">
                              {formatCurrencyWithLang(grandIncome, lang)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-medium text-rose-800">
                              {t('totalOperatingExpense')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                              - {formatCurrencyWithLang(totalExpense, lang)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-indigo-900 text-white font-bold">
                            <td className="py-4 px-4 text-sm sm:text-base">
                              {t('netFundBalanceLabel')}
                            </td>
                            <td className="py-4 px-4 text-right font-mono text-lg sm:text-xl text-yellow-300">
                              {formatCurrencyWithLang(netFundBalance, lang)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="mt-14 pt-6 flex justify-between items-end text-xs">
                    <div className="text-center min-w-[160px]">
                      <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                        {t('auditorSignLabel')}
                      </div>
                    </div>
                    <div className="text-center min-w-[160px]">
                      <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                        {t('secretarySignLabel')}
                      </div>
                    </div>
                    <div className="text-center min-w-[160px]">
                      <div className="border-t-2 border-slate-700 pt-1 font-bold text-slate-800">
                        {t('presidentSignLabel')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
