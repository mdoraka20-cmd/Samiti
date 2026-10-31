import React from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building,
  AlertCircle,
  FileText,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import {
  formatMemberId,
  formatReceiptId,
  currentMonthIso,
} from '../utils/bengali';
import {
  formatNumberWithLang,
  formatCurrencyWithLang,
  getMonthNameWithLang,
} from '../utils/translations';

interface DashboardProps {
  onNavigate: (view: string, sub?: string) => void;
  onViewReceipt: (receiptId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onViewReceipt }) => {
  const { data, getReceiptsGrouped, can, lang, t } = useSamiti();

  const activeMembers = data.members.filter((m) => m.active);
  const receipts = getReceiptsGrouped();

  // Financial aggregates
  const methodTotals = {
    cash: { credit: 0, debit: 0 },
    bank: { credit: 0, debit: 0 },
    bkash: { credit: 0, debit: 0 },
  };

  data.payments.forEach((p) => {
    if (methodTotals[p.method]) {
      methodTotals[p.method].credit += p.amount;
    }
  });

  data.entries.forEach((e) => {
    if (methodTotals[e.method]) {
      if (e.type === 'income') {
        methodTotals[e.method].credit += e.amount;
      } else {
        methodTotals[e.method].debit += e.amount;
      }
    }
  });

  const totalChanda = data.payments
    .filter((p) => p.category !== 'other')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOtherPayments = data.payments
    .filter((p) => p.category === 'other')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalIncome = data.entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = data.entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCredit =
    methodTotals.cash.credit + methodTotals.bank.credit + methodTotals.bkash.credit;
  const totalDebit =
    methodTotals.cash.debit + methodTotals.bank.debit + methodTotals.bkash.debit;
  const netBalance = totalCredit - totalDebit;

  // Monthly collection status for current month
  const curMonth = currentMonthIso();
  const currentMonthPayments = data.payments.filter((p) => p.month === curMonth);
  const paidMemberIds = new Set(currentMonthPayments.map((p) => p.member_id));
  const paidCount = activeMembers.filter((m) => paidMemberIds.has(m.id)).length;
  const dueCount = activeMembers.length - paidCount;
  const collectionPercentage =
    activeMembers.length > 0 ? Math.round((paidCount / activeMembers.length) * 100) : 0;

  // Recent 5 receipts
  const recentReceipts = receipts.slice(0, 5);
  // Recent 5 entries
  const recentEntries = data.entries.slice(0, 5);

  const methodNames: Record<string, string> = {
    cash: lang === 'bn' ? 'ক্যাশ' : 'Cash',
    bank: lang === 'bn' ? 'ব্যাংক' : 'Bank',
    bkash: lang === 'bn' ? 'বিকাশ' : 'bKash',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice if License Expiring */}
      {data.license.days_left <= 30 && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-xs ${
            data.license.expired
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm flex-1">
            <span className="font-bold">
              {data.license.expired
                ? lang === 'bn' ? 'সফটওয়্যারের মেয়াদ উত্তীর্ণ হয়েছে!' : 'Software License Expired!'
                : lang === 'bn' ? 'লাইসেন্স মেয়াদ সতর্কতা:' : 'License Expiry Warning:'}
            </span>{' '}
            {lang === 'bn'
              ? `মেয়াদ আর ${formatNumberWithLang(Math.max(0, data.license.days_left), 'bn')} দিন অবশিষ্ট আছে (মেয়াদ: ${data.license.expiry})। ${data.license.msg}`
              : `Only ${formatNumberWithLang(Math.max(0, data.license.days_left), 'en')} days remaining (Expiry: ${data.license.expiry}). ${data.license.msg}`}
          </div>
          {can('settings') && (
            <button
              onClick={() => onNavigate('admin', 'lic')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer shrink-0"
            >
              {lang === 'bn' ? 'রিনিউ করুন' : 'Renew'}
            </button>
          )}
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Active Members */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('activeMembers')}</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {formatNumberWithLang(activeMembers.length, lang)}{' '}
              <span className="text-sm font-normal text-slate-500">{t('persons')}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('totalMembers')}: {formatNumberWithLang(data.members.length, lang)} {t('persons')}
            </p>
          </div>
        </div>

        {/* Total Chanda */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('totalChanda')}</span>
            <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-teal-700 font-mono">
              {formatCurrencyWithLang(totalChanda, lang)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('regularInstallment')}</p>
          </div>
        </div>

        {/* Other Receipts */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('otherCollection')}</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-700 font-mono">
              {formatCurrencyWithLang(totalOtherPayments, lang)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('otherFees')}</p>
          </div>
        </div>

        {/* Other Income */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('generalIncome')}</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-blue-700 font-mono">
              {formatCurrencyWithLang(totalIncome, lang)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('profitAndDonation')}</p>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('totalExpense')}</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-700 font-mono">
              {formatCurrencyWithLang(totalExpense, lang)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('officeOperatingCost')}</p>
          </div>
        </div>

        {/* Net Current Balance */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100">{t('netBalance')}</span>
            <div className="p-2 bg-white/10 rounded-lg text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white font-mono">
              {formatCurrencyWithLang(netBalance, lang)}
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">{t('allAccountsIncluded')}</p>
          </div>
        </div>
      </div>

      {/* Quick Launch Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {can('collect') && (
          <button
            onClick={() => onNavigate('collect')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition text-slate-800 group shadow-2xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold">{t('collect')}</span>
          </button>
        )}
        {can('members') && (
          <button
            onClick={() => onNavigate('members')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-teal-50 hover:border-teal-400 transition text-slate-800 group shadow-2xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold">{t('members')}</span>
          </button>
        )}
        {can('income') && (
          <button
            onClick={() => onNavigate('income')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition text-slate-800 group shadow-2xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold">{t('income')}</span>
          </button>
        )}
        {can('expense') && (
          <button
            onClick={() => onNavigate('expense')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-400 transition text-slate-800 group shadow-2xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-110 transition">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold">{t('expense')}</span>
          </button>
        )}
        {can('reports') && (
          <button
            onClick={() => onNavigate('reports')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition text-slate-800 group shadow-2xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-110 transition">
              <FileText className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold">{t('reports')}</span>
          </button>
        )}
        {can('settings') && (
          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition text-slate-800 group shadow-2xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-110 transition">
              <Building className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-bold">{t('settings')}</span>
          </button>
        )}
      </div>

      {/* Middle Row: Account Breakdown & Month Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Breakdown (Cash / Bank / bKash) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('accountSummary')}</h3>
              <p className="text-xs text-slate-500">{t('accountSummarySubtitle')}</p>
            </div>
            <button
              onClick={() => onNavigate('reports', 'acc')}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('viewDetails')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                  <th className="py-2.5 px-3 rounded-l">{t('accountMethod')}</th>
                  <th className="py-2.5 px-3">{t('creditDeposit')}</th>
                  <th className="py-2.5 px-3">{t('debitExpense')}</th>
                  <th className="py-2.5 px-3 text-right rounded-r">{t('currentBalance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 flex items-center gap-2 font-medium text-slate-900">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                      💵
                    </span>
                    {t('cashInHand')}
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 font-mono">
                    {formatCurrencyWithLang(methodTotals.cash.credit, lang)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-rose-700 font-mono">
                    {formatCurrencyWithLang(methodTotals.cash.debit, lang)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatCurrencyWithLang(methodTotals.cash.credit - methodTotals.cash.debit, lang)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 flex items-center gap-2 font-medium text-slate-900">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                      🏦
                    </span>
                    {t('bankAccount')}
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 font-mono">
                    {formatCurrencyWithLang(methodTotals.bank.credit, lang)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-rose-700 font-mono">
                    {formatCurrencyWithLang(methodTotals.bank.debit, lang)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatCurrencyWithLang(methodTotals.bank.credit - methodTotals.bank.debit, lang)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 flex items-center gap-2 font-medium text-slate-900">
                    <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs">
                      📱
                    </span>
                    {t('bkashMfs')}
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 font-mono">
                    {formatCurrencyWithLang(methodTotals.bkash.credit, lang)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-rose-700 font-mono">
                    {formatCurrencyWithLang(methodTotals.bkash.debit, lang)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatCurrencyWithLang(methodTotals.bkash.credit - methodTotals.bkash.debit, lang)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200">
                  <td className="py-3 px-3">{t('grandTotalBalance')}</td>
                  <td className="py-3 px-3 font-mono text-emerald-800">{formatCurrencyWithLang(totalCredit, lang)}</td>
                  <td className="py-3 px-3 font-mono text-rose-800">{formatCurrencyWithLang(totalDebit, lang)}</td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-900 text-base">
                    {formatCurrencyWithLang(netBalance, lang)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Current Month Collection Progress Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{t('monthCollectionTitle')}</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {getMonthNameWithLang(curMonth, lang)}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>
                    {t('collectionProgress')}: {formatNumberWithLang(paidCount, lang)} / {formatNumberWithLang(activeMembers.length, lang)} {t('persons')}
                  </span>
                  <span className="font-bold text-emerald-700">{formatNumberWithLang(collectionPercentage, lang)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${collectionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-xs text-emerald-800 font-semibold block">{t('paidCountLabel')}</span>
                  <span className="text-xl font-bold text-emerald-900 font-mono">
                    {formatNumberWithLang(paidCount, lang)} {t('persons')}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-xs text-rose-800 font-semibold block">{t('dueCountLabel')}</span>
                  <span className="text-xl font-bold text-rose-900 font-mono">
                    {formatNumberWithLang(dueCount, lang)} {t('persons')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{t('monthCollectedAmount')}: </span>
                <span className="font-bold text-emerald-700 font-mono">
                  {formatCurrencyWithLang(currentMonthPayments.reduce((s, p) => s + p.amount, 0), lang)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports', 'month')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('viewMonthlySheet')}</span>
          </button>
        </div>
      </div>

      {/* Bottom Grid: Recent Receipts and Income/Expense Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Money Receipts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('recentReceipts')}</h3>
              <p className="text-xs text-slate-500">{t('recentReceiptsSubtitle')}</p>
            </div>
            {can('collect') && (
              <button
                onClick={() => onNavigate('collect')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {t('allReceipts')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentReceipts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">{t('noReceipts')}</p>
            ) : (
              recentReceipts.map((rcpt) => {
                const first = rcpt.items[0];
                const member = data.members.find((m) => m.id === first.member_id);
                const total = rcpt.items.reduce((s, p) => s + p.amount, 0);

                return (
                  <div
                    key={rcpt.receipt_id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                        #{rcpt.receipt_id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {member?.name || (lang === 'bn' ? '(মুছে ফেলা)' : '(Deleted)')}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {member ? formatMemberId(member.id) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {rcpt.items.map((it) => it.description).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-emerald-700 font-mono text-sm">
                        {formatCurrencyWithLang(total, lang)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400">{first.date}</span>
                        <button
                          onClick={() => onViewReceipt(rcpt.receipt_id)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          {t('viewReceiptBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Income & Expense Entries */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('recentCashEntries')}</h3>
              <p className="text-xs text-slate-500">{t('recentCashEntriesSubtitle')}</p>
            </div>
            <div className="flex gap-2">
              {can('income') && (
                <button
                  onClick={() => onNavigate('income')}
                  className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  {t('incomeLabel')}
                </button>
              )}
              {can('expense') && (
                <button
                  onClick={() => onNavigate('expense')}
                  className="text-xs text-rose-700 font-semibold hover:underline cursor-pointer"
                >
                  {t('expenseLabel')}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentEntries.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">{t('noEntries')}</p>
            ) : (
              recentEntries.map((ent) => (
                <div
                  key={ent.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        ent.type === 'income'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ent.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{ent.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{methodNames[ent.method] || ent.method}</span>
                        <span>•</span>
                        <span>{ent.date}</span>
                        {ent.comment && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{ent.comment}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold font-mono text-sm ${
                        ent.type === 'income' ? 'text-blue-700' : 'text-rose-700'
                      }`}
                    >
                      {ent.type === 'income' ? '+' : '-'} {formatCurrencyWithLang(ent.amount, lang)}
                    </span>
                    <span
                      className={`block text-[10px] font-semibold uppercase ${
                        ent.type === 'income' ? 'text-blue-600' : 'text-rose-600'
                      }`}
                    >
                      {ent.type === 'income' ? t('creditLabel') : t('debitLabel')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
