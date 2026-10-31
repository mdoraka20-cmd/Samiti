/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Building2,
  Calendar,
  Lock,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { SamitiProvider, useSamiti } from './context/SamitiContext';
import { Dashboard } from './components/Dashboard';
import { MembersView } from './components/MembersView';
import { CollectView } from './components/CollectView';
import { IncomeExpenseView } from './components/IncomeExpenseView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginModal } from './components/LoginModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { formatNumberWithLang, formatCurrencyWithLang } from './utils/translations';

function SamitiApp() {
  const { data, currentUser, can, lang, t } = useSamiti();

  const [currentView, setCurrentView] = useState<string>('dash');
  const [subView, setSubView] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cross-view state pass-throughs
  const [selectedMemberForReport, setSelectedMemberForReport] = useState<number | null>(null);
  const [selectedMemberForCollect, setSelectedMemberForCollect] = useState<number | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null);

  // Active receipt modal
  const [activeReceiptId, setActiveReceiptId] = useState<number | null>(null);

  // Login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Quick navigation helper
  const navigateTo = (view: string, sub: string = '') => {
    setCurrentView(view);
    setSubView(sub);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open receipt voucher modal
  const handleViewReceipt = (receiptId: number) => {
    setActiveReceiptId(receiptId);
  };

  // Calculate current fund net balance
  const totalIn =
    data.payments.reduce((s, p) => s + p.amount, 0) +
    data.entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalOut = data.entries
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0);
  const netFund = totalIn - totalOut;

  // Active receipt data for modal
  const activeReceiptPayments = activeReceiptId
    ? data.payments.filter((p) => p.receipt_id === activeReceiptId)
    : [];
  const activeReceiptMember =
    activeReceiptPayments.length > 0
      ? data.members.find((m) => m.id === activeReceiptPayments[0].member_id)
      : null;

  const navItems = [
    { id: 'dash', label: t('dash'), icon: Building2, show: true },
    {
      id: 'members',
      label: t('members'),
      icon: Users,
      badge: formatNumberWithLang(data.members.filter((m) => m.active).length, lang),
      show: can('members'),
    },
    {
      id: 'collect',
      label: t('collect'),
      icon: PlusCircle,
      show: can('collect'),
    },
    {
      id: 'income',
      label: t('income'),
      icon: TrendingUp,
      show: can('income'),
    },
    {
      id: 'expense',
      label: t('expense'),
      icon: TrendingDown,
      show: can('expense'),
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: FileText,
      show: can('reports'),
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: SettingsIcon,
      show: can('settings'),
    },
    {
      id: 'admin',
      label: t('admin'),
      icon: Shield,
      show: currentUser.role === 'admin',
    },
    {
      id: 'account',
      label: t('account'),
      icon: Lock,
      show: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* MOBILE HEADER (No Print) */}
      <div className="noprint md:hidden bg-indigo-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md gap-2">
        <div className="flex items-center gap-2.5 truncate">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-indigo-900 transition shrink-0"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="truncate">
            <h1 className="font-bold text-sm truncate">{data.settings.heading}</h1>
            <p className="text-[10px] text-emerald-400 font-mono">
              {t('currentBalance')}: {formatCurrencyWithLang(netFund, lang)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher compact className="bg-white/10 border-white/20 text-white" />
          <button
            onClick={() => handleViewReceipt(data.payments[0]?.receipt_id || 1001)}
            className="text-xs bg-emerald-600 px-2.5 py-1.5 rounded font-semibold text-white cursor-pointer"
          >
            {t('activeReceiptBtn')}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (No Print) */}
      <aside
        className={`noprint fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* App Branding */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {lang === 'bn' ? 'স' : 'S'}
              </div>
              <div className="truncate">
                <h1 className="font-bold text-sm text-white truncate">
                  {data.settings.heading}
                </h1>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {t('appSubtitle')}
                </span>
              </div>
            </div>

            {/* Current user pill */}
            <div className="mt-3 py-1.5 px-2.5 bg-slate-800/80 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300 font-medium truncate">
                  {currentUser.username}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded">
                {currentUser.role === 'admin' ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin') : (lang === 'bn' ? 'ইউজার' : 'User')}
              </span>
            </div>

            {/* Language Switcher in Sidebar */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-center">
              <LanguageSwitcher className="bg-slate-800/90 border-slate-700 text-slate-300 w-full justify-center" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>

          {/* Bottom Actions & Attribution */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>

            {/* Developer branding exactly preserved from uploaded app */}
            <div className="text-[11px] text-emerald-400/90 leading-tight border-t border-slate-800/80 pt-2.5">
              <p className="font-bold text-slate-300">Developed By Os Technology</p>
              <p className="text-[10px] text-slate-400">Contact: md.oraka@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* SCROLLING EXPIRY MARQUEE NOTICE (Controlled exclusively from Admin Panel) */}
        {data.license.show_scroll && (
          <div className="noprint bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white shadow-sm flex items-center overflow-hidden border-b border-amber-400/40 select-none">
            <div className="flex items-center gap-1.5 bg-black/35 backdrop-blur-xs px-3 py-2 text-xs font-bold shrink-0 z-10 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse"></span>
              <span className="tracking-wide">{t('licenseNotice')}</span>
            </div>
            <div
              className="overflow-hidden whitespace-nowrap w-full py-2 cursor-pointer relative"
              title={t('mousePauseNote')}
            >
              <div className="animate-marquee font-medium text-xs sm:text-sm tracking-wide text-white drop-shadow-xs">
                {data.license.scroll_text?.trim()
                  ? data.license.scroll_text
                  : lang === 'bn'
                  ? `সফটওয়্যারের মেয়াদ শেষ তারিখ: ${data.license.expiry} (অবশিষ্ট আর ${formatNumberWithLang(Math.max(0, data.license.days_left), 'bn')} দিন) — ${data.license.msg}`
                  : `License Expiry Date: ${data.license.expiry} (Remaining: ${formatNumberWithLang(Math.max(0, data.license.days_left), 'en')} Days) — ${data.license.msg}`}
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP TOPBAR (No Print) */}
        <header className="noprint hidden md:flex bg-white border-b border-slate-200 px-6 py-3.5 items-center justify-between shadow-2xs">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-wide font-serif">
              {data.settings.heading}
            </h2>
            <p className="text-xs text-slate-500">
              {data.settings.subheading || data.settings.address}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* EN / BN Language Switcher Button */}
            <LanguageSwitcher />

            {/* Quick Live Net Balance */}
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-right">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                {t('netFund')}
              </span>
              <span className="text-base font-bold text-emerald-900 font-mono">
                {formatCurrencyWithLang(netFund, lang)}
              </span>
            </div>

            {/* Quick Collect Action */}
            {can('collect') && (
              <button
                onClick={() => {
                  setSelectedMemberForCollect(null);
                  setEditingReceiptId(null);
                  navigateTo('collect');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('addDepositBtn')}</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic View Mount */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dash' && (
            <Dashboard
              onNavigate={(v, s) => navigateTo(v, s)}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {currentView === 'members' && (
            <MembersView
              onCollectForMember={(memberId) => {
                setSelectedMemberForCollect(memberId);
                setEditingReceiptId(null);
                navigateTo('collect');
              }}
              onViewMemberReport={(memberId) => {
                setSelectedMemberForReport(memberId);
                navigateTo('reports', 'ind');
              }}
            />
          )}

          {currentView === 'collect' && (
            <CollectView
              initialMemberId={selectedMemberForCollect}
              editingReceiptId={editingReceiptId}
              onViewReceipt={handleViewReceipt}
              onClearEdit={() => setEditingReceiptId(null)}
            />
          )}

          {currentView === 'income' && <IncomeExpenseView initialType="income" />}

          {currentView === 'expense' && <IncomeExpenseView initialType="expense" />}

          {currentView === 'reports' && (
            <ReportsView
              initialSubTab={subView || 'ind'}
              initialMemberId={selectedMemberForReport}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {currentView === 'settings' && <SettingsView />}

          {currentView === 'admin' && <AdminView initialTab="users" />}

          {currentView === 'account' && <AdminView initialTab="account" />}
        </main>
      </div>

      {/* PRINTABLE MONEY RECEIPT MODAL */}
      {activeReceiptId && activeReceiptMember && (
        <ReceiptModal
          receiptId={activeReceiptId}
          payments={activeReceiptPayments}
          member={activeReceiptMember}
          settings={data.settings}
          onClose={() => setActiveReceiptId(null)}
        />
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <LoginModal
          onSuccess={() => {
            setShowLoginModal(false);
            navigateTo('dash');
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SamitiProvider>
      <SamitiApp />
    </SamitiProvider>
  );
}
