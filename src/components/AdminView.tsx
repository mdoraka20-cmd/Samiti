import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Key,
  Trash2,
  Lock,
  AlertTriangle,
  Power,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { UserAccount, Permission } from '../types/samiti';
import { formatNumberWithLang } from '../utils/translations';
import { ConfirmModal } from './ConfirmModal';

interface AdminViewProps {
  initialTab?: 'users' | 'lic' | 'wipe' | 'account';
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'users' }) => {
  const {
    data,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    changePassword,
    updateLicense,
    wipeData,
    lang,
    t,
  } = useSamiti();

  const [activeTab, setActiveTab] = useState<'users' | 'lic' | 'wipe' | 'account'>(initialTab);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPerms, setNewPerms] = useState<Permission[]>([
    'members',
    'collect',
    'reports',
  ]);
  const [newCanDelete, setNewCanDelete] = useState(false);

  // License Form State
  const [licExpiry, setLicExpiry] = useState(data.license.expiry);
  const [licMsg, setLicMsg] = useState(data.license.msg);
  const [showScrollNotice, setShowScrollNotice] = useState<boolean>(
    data.license.show_scroll ?? true
  );
  const [customScrollText, setCustomScrollText] = useState<string>(
    data.license.scroll_text ?? ''
  );

  // Wipe Form State
  const [wipeMembers, setWipeMembers] = useState(false);
  const [wipePayments, setWipePayments] = useState(false);
  const [wipeEntries, setWipeEntries] = useState(false);
  const [wipePass, setWipePass] = useState('');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Password Change
  const [oldPass, setOldPass] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  // Delete User Modal State
  const [deleteUserTarget, setDeleteUserTarget] = useState<string | null>(null);

  const permissionLabels: Record<Permission, string> = {
    members: lang === 'en' ? 'Members List' : 'সদস্য তালিকা',
    collect: lang === 'en' ? 'Deposit & Receipts' : 'চাঁদা জমা ও রিসিট',
    income: lang === 'en' ? 'Income Ledger' : 'আয় হিসাব',
    expense: lang === 'en' ? 'Expense Ledger' : 'ব্যয় হিসাব',
    reports: lang === 'en' ? 'All Reports' : 'সকল রিপোর্ট',
    settings: lang === 'en' ? 'Settings & Backup' : 'সেটিংস ও ব্যাকআপ',
  };

  const handleTogglePerm = (perm: Permission) => {
    setNewPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newUsername.trim()) return;
    const ok = addUser(newUsername.trim(), newPerms, newCanDelete);
    if (!ok) {
      setFormError(
        lang === 'en'
          ? 'Invalid username or user already exists.'
          : 'ইউজার নেম সঠিক নয় বা এই নামে ইতিমধ্যে ইউজার রয়েছে'
      );
      return;
    }
    setNewUsername('');
    setNewPerms(['members', 'collect', 'reports']);
    setNewCanDelete(false);
    triggerToast(lang === 'en' ? 'User created successfully!' : 'ইউজার সফলভাবে তৈরি হয়েছে!');
  };

  const handleSaveLicense = (e: React.FormEvent) => {
    e.preventDefault();
    updateLicense(licExpiry, licMsg, showScrollNotice, customScrollText);
    triggerToast(
      lang === 'en'
        ? 'License & Marquee scroll settings saved successfully!'
        : 'লাইসেন্স ও স্ক্রল নোটিশ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
    );
  };

  const handleExtendMonths = (months: number) => {
    const cur = new Date(licExpiry > new Date().toISOString() ? licExpiry : new Date().toISOString());
    cur.setMonth(cur.getMonth() + months);
    setLicExpiry(cur.toISOString().slice(0, 10));
  };

  const handleInitiateWipe = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!wipeMembers && !wipePayments && !wipeEntries) {
      setFormError(lang === 'en' ? 'Select at least one category to wipe' : 'কমপক্ষে একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }
    const adminUser = data.users.find((u) => u.username === 'admin');
    const currentAdminPass = adminUser?.passwordHash || 'admin';
    if (wipePass !== currentAdminPass) {
      setFormError(
        lang === 'en'
          ? 'Incorrect admin password.'
          : 'অ্যাডমিন পাসওয়ার্ড সঠিক নয়।'
      );
      return;
    }
    setShowWipeConfirm(true);
  };

  const handleConfirmWipe = () => {
    wipeData({
      members: wipeMembers,
      payments: wipePayments,
      entries: wipeEntries,
    });
    setWipePass('');
    setWipeMembers(false);
    setWipePayments(false);
    setWipeEntries(false);
    setShowWipeConfirm(false);
    triggerToast(lang === 'en' ? 'Selected data wiped.' : 'নির্বাচিত ডাটা মুছে ফেলা হয়েছে।');
  };

  const handleConfirmDeleteUser = () => {
    if (!deleteUserTarget) return;
    deleteUser(deleteUserTarget);
    const uName = deleteUserTarget;
    setDeleteUserTarget(null);
    triggerToast(
      lang === 'en'
        ? `User account "${uName}" deleted.`
        : `"${uName}" ইউজার অ্যাকাউন্ট মুছে ফেলা হয়েছে।`
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setPassSuccessMsg('');

    const targetUser = currentUser.username;
    const userInDb = data.users.find((u) => u.username === targetUser);
    const expectedCurrentPass = userInDb?.passwordHash || (targetUser === 'admin' ? 'admin' : '');

    // Check old password if existing password is set
    if (expectedCurrentPass) {
      if (!oldPass) {
        setFormError(
          lang === 'en'
            ? 'Please enter your current password.'
            : 'অনুগ্রহ করে আপনার বর্তমান পাসওয়ার্ড দিন।'
        );
        return;
      }
      if (oldPass !== expectedCurrentPass) {
        setFormError(
          lang === 'en'
            ? 'Current password did not match. (Default is admin if never changed)'
            : 'বর্তমান পাসওয়ার্ড মেলেনি। (পূর্বে পাসওয়ার্ড পরিবর্তন না করে থাকলে ডিফল্ট পাসওয়ার্ড: admin)'
        );
        return;
      }
    }

    if (newPass1.length < 4) {
      setFormError(
        lang === 'en'
          ? 'New password must be at least 4 characters'
          : 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'
      );
      return;
    }
    if (newPass1 !== newPass2) {
      setFormError(lang === 'en' ? 'Passwords do not match' : 'দুটি নতুন পাসওয়ার্ড মেলেনি');
      return;
    }

    changePassword(targetUser, newPass1);
    setOldPass('');
    setNewPass1('');
    setNewPass2('');

    const msg =
      lang === 'en'
        ? `Password for "${targetUser}" updated successfully! Use this new password for your next login.`
        : `"${targetUser}" এর পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! পরবর্তী লগইনের জন্য এই নতুন পাসওয়ার্ডটি ব্যবহার করুন।`;
    setPassSuccessMsg(msg);
    triggerToast(msg);
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

      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-700" />
            <span>{t('adminPanelTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('adminPanelSubtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'users', label: t('tabUserAccess') },
          { key: 'lic', label: t('tabLicenseRenewal') },
          { key: 'account', label: t('tabChangePassword') },
          { key: 'wipe', label: t('tabDataWipe') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              setFormError('');
            }}
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
      {/* TAB 1: USERS & ACCESS CONTROL                            */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Create User Form */}
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>{t('createUserTitle')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('usernameInputLabel')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. cashier1, manager' : 'যেমন: cashier1, manager'}
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('accountRoleLabel')}
                </label>
                <input
                  type="text"
                  disabled
                  value={t('subUserRoleText')}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500"
                />
              </div>
            </div>

            {/* Permission Checkboxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t('permissionsLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(permissionLabels) as Permission[]).map((pKey) => {
                  const checked = newPerms.includes(pKey);
                  return (
                    <label
                      key={pKey}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        checked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePerm(pKey)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{permissionLabels[pKey]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Can Delete Permission */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-rose-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCanDelete}
                  onChange={(e) => setNewCanDelete(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>{t('deletePermissionCheck')}</span>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('createUserBtn')}</span>
              </button>
            </div>
          </form>

          {/* User Accounts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">{t('existingUsersTitle')}</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">{t('usernameCol')}</th>
                    <th className="py-2.5 px-4">{t('roleCol')}</th>
                    <th className="py-2.5 px-4">{t('permissionsCol')}</th>
                    <th className="py-2.5 px-4 text-center">{t('deletePowerCol')}</th>
                    <th className="py-2.5 px-4 text-center">{t('userStatusCol')}</th>
                    <th className="py-2.5 px-4 text-right">{t('actionsCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((u) => {
                    const isSelf = currentUser.username === u.username;
                    return (
                      <tr key={u.username} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                          {u.username} {isSelf && <span className="text-[11px] text-emerald-600">{t('currentUserBadge')}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role === 'admin' ? t('adminRoleBadge') : t('userRoleBadge')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {u.role === 'admin' ? (
                              <span className="text-xs text-slate-500 font-semibold">{t('allPowersText')}</span>
                            ) : (
                              u.perms.map((p) => (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
                                >
                                  {permissionLabels[p] || p}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {u.can_delete ? (
                            <span className="text-emerald-700 font-bold text-xs">{t('hasPowerText')}</span>
                          ) : (
                            <span className="text-slate-400 text-xs">{t('noPowerText')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {u.active ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              {t('activeUserText')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                              {t('inactiveUserText')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Switch active session simulator */}
                            <button
                              onClick={() => {
                                setCurrentUser(u);
                                triggerToast(
                                  lang === 'en'
                                    ? `Switched to user "${u.username}".`
                                    : `"${u.username}" ইউজারে সুইচ করা হয়েছে।`
                                );
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                              title={lang === 'en' ? 'Switch to this user' : 'এই ইউজারে সুইচ করুন'}
                            >
                              {t('switchUserBtn')}
                            </button>
                            {u.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => {
                                    updateUser(u.username, { active: !u.active });
                                    triggerToast(
                                      !u.active
                                        ? `User "${u.username}" activated.`
                                        : `User "${u.username}" deactivated.`
                                    );
                                  }}
                                  className={`p-1 rounded transition cursor-pointer ${
                                    u.active
                                      ? 'text-amber-600 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={
                                    u.active
                                      ? lang === 'en' ? 'Deactivate Account' : 'অ্যাকাউন্ট সাময়িক বন্ধ করুন'
                                      : lang === 'en' ? 'Activate Account' : 'অ্যাকাউন্ট চালু করুন'
                                  }
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteUserTarget(u.username)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title={lang === 'en' ? 'Delete User' : 'ইউজার মুছুন'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LICENSE & RENEWAL                                 */}
      {/* ======================================================== */}
      {activeTab === 'lic' && (
        <form
          onSubmit={handleSaveLicense}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-2xl"
        >
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-700" />
              <span>{t('licenseManagementTitle')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('licenseManagementSubtitle')}
            </p>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t('currentExpiryDateLabel')}</span>
              <span className="font-bold font-mono text-indigo-950 text-base">
                {data.license.expiry}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t('remainingDaysLabel')}</span>
              <span className="font-bold font-mono text-emerald-700">
                {formatNumberWithLang(Math.max(0, data.license.days_left), lang)} {t('daysText')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t('licenseStatusLabel')}</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  data.license.expired
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {data.license.expired ? t('statusExpired') : (lang === 'en' ? 'Active' : 'সক্রিয় (Active)')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('newExpiryDateLabel')}
            </label>
            <input
              type="date"
              value={licExpiry}
              onChange={(e) => setLicExpiry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quick extension shortcuts */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t('quickExtendLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleExtendMonths(m)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  +{formatNumberWithLang(m, lang)} {t('monthSuffix')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('renewalNoticeMsgLabel')}
            </label>
            <textarea
              rows={3}
              value={licMsg}
              onChange={(e) => setLicMsg(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('renewalNoticeHelpText')}
            </p>
          </div>

          {/* Scroll Notice Setting (Exclusive to Admin) */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-300 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {t('scrollNoticeControlTitle')}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    {t('adminOnlyBadge')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {t('scrollNoticeControlDesc')}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setShowScrollNotice(!showScrollNotice)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showScrollNotice ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={showScrollNotice}
                title={showScrollNotice ? 'OFF' : 'ON'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    showScrollNotice ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span>{t('scrollStatusLabel')}</span>
              {showScrollNotice ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  {t('scrollStatusOn')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  {t('scrollStatusOff')}
                </span>
              )}
            </div>

            {/* Custom scroll text field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('customScrollInputLabel')}
              </label>
              <input
                type="text"
                placeholder={
                  lang === 'en'
                    ? 'e.g. Urgent Notice: Please contact 017... to renew software license...'
                    : 'যেমন: জরুরী নোটিশ: সফটওয়্যারের লাইসেন্স নবায়ন করতে ০১৭... নাম্বারে যোগাযোগ করুন...'
                }
                value={customScrollText}
                onChange={(e) => setCustomScrollText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Live preview */}
            {showScrollNotice && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  {t('livePreviewLabel')}
                </span>
                <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white rounded-lg p-2 text-xs overflow-hidden flex items-center shadow-xs">
                  <div className="flex items-center gap-1 bg-black/35 px-2 py-0.5 rounded shrink-0 mr-2 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
                    <span>{t('licenseNotice')}</span>
                  </div>
                  <div className="overflow-hidden whitespace-nowrap w-full">
                    <div className="animate-marquee font-medium">
                      {customScrollText.trim()
                        ? customScrollText
                        : (lang === 'en'
                            ? `License Expiry: ${licExpiry} (${formatNumberWithLang(Math.max(0, data.license.days_left), lang)} days remaining) — ${licMsg}`
                            : `সফটওয়্যারের মেয়াদ: ${licExpiry} (অবশিষ্ট: ${formatNumberWithLang(Math.max(0, data.license.days_left), lang)} দিন) — ${licMsg}`)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer"
            >
              {t('saveLicenseBtn')}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PASSWORD CHANGE                                   */}
      {/* ======================================================== */}
      {activeTab === 'account' && (
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-md"
        >
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-700" />
              <span>
                {t('changePasswordTitle')} ({currentUser.username})
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('changePasswordSubtitle')}
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {passSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('currentPasswordLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder={lang === 'en' ? 'Enter current password' : 'বর্তমান পাসওয়ার্ড লিখুন'}
              value={oldPass}
              onChange={(e) => {
                setOldPass(e.target.value);
                setFormError('');
                setPassSuccessMsg('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('newPasswordLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={lang === 'en' ? 'New password (min 4 chars)' : 'নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)'}
              value={newPass1}
              onChange={(e) => {
                setNewPass1(e.target.value);
                setFormError('');
                setPassSuccessMsg('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('confirmPasswordLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={lang === 'en' ? 'Confirm new password' : 'নতুন পাসওয়ার্ড পুনরায় লিখুন'}
              value={newPass2}
              onChange={(e) => {
                setNewPass2(e.target.value);
                setFormError('');
                setPassSuccessMsg('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer"
            >
              {t('changePasswordBtn')}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DATA WIPE                                         */}
      {/* ======================================================== */}
      {activeTab === 'wipe' && (
        <form
          onSubmit={handleInitiateWipe}
          className="bg-white rounded-xl border border-rose-300 p-6 shadow-xs space-y-4 max-w-lg"
        >
          <div className="border-b border-rose-200 pb-3">
            <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>{t('dataWipeTitle')}</span>
            </h3>
            <p className="text-xs text-rose-800 mt-1">
              {t('dataWipeWarning')}
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={wipeMembers}
                onChange={(e) => {
                  setWipeMembers(e.target.checked);
                  setFormError('');
                }}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>{t('wipeMembersCheck')}</span>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={wipePayments}
                onChange={(e) => {
                  setWipePayments(e.target.checked);
                  setFormError('');
                }}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>{t('wipePaymentsCheck')}</span>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={wipeEntries}
                onChange={(e) => {
                  setWipeEntries(e.target.checked);
                  setFormError('');
                }}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>{t('wipeEntriesCheck')}</span>
            </label>
          </div>

          <div className="pt-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'en' ? 'Enter current admin password to confirm *' : 'নিশ্চিত করতে বর্তমান অ্যাডমিন পাসওয়ার্ড দিন *'}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder={lang === 'en' ? 'Current admin password' : 'বর্তমান অ্যাডমিন পাসওয়ার্ড'}
              value={wipePass}
              onChange={(e) => {
                setWipePass(e.target.value);
                setFormError('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('permanentlyDeleteBtn')}</span>
            </button>
          </div>
        </form>
      )}

      {/* CONFIRM DELETE USER MODAL */}
      {deleteUserTarget && (
        <ConfirmModal
          isOpen={true}
          title={lang === 'en' ? 'Delete User Account' : 'ইউজার অ্যাকাউন্ট মুছে ফেলুন'}
          message={
            lang === 'en'
              ? `Are you sure you want to permanently delete user account "${deleteUserTarget}"?`
              : `আপনি কি "${deleteUserTarget}" ইউজার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান?`
          }
          itemName={deleteUserTarget}
          confirmLabel={lang === 'en' ? 'Yes, Delete User' : 'হ্যাঁ, ইউজার মুছুন'}
          onConfirm={handleConfirmDeleteUser}
          onCancel={() => setDeleteUserTarget(null)}
        />
      )}

      {/* CONFIRM DATA WIPE MODAL */}
      {showWipeConfirm && (
        <ConfirmModal
          isOpen={true}
          title={t('dataWipeTitle')}
          message={
            lang === 'en'
              ? 'Final Warning: Selected members, payments, and cash entries will be PERMANENTLY deleted from local storage. Are you completely sure?'
              : 'চূড়ান্ত সতর্কতা: নির্বাচিত সকল সদস্য, চাঁদা জমা এবং আয়-ব্যয়ের হিসাব স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?'
          }
          confirmLabel={lang === 'en' ? 'Yes, Wipe Data' : 'হ্যাঁ, স্থায়ীভাবে ডাটা মুছুন'}
          onConfirm={handleConfirmWipe}
          onCancel={() => setShowWipeConfirm(false)}
        />
      )}
    </div>
  );
};
