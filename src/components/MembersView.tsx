import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { Member } from '../types/samiti';
import { formatMemberId } from '../utils/bengali';
import { formatNumberWithLang, formatCurrencyWithLang } from '../utils/translations';
import { ConfirmModal } from './ConfirmModal';

interface MembersViewProps {
  onCollectForMember?: (memberId: number) => void;
  onViewMemberReport?: (memberId: number) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  onCollectForMember,
  onViewMemberReport,
}) => {
  const {
    data,
    addMember,
    updateMember,
    deleteMember,
    permanentDeleteMember,
    restoreMember,
    canDelete,
    lang,
    t,
  } = useSamiti();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formShareCount, setFormShareCount] = useState('1');
  const [formNid, setFormNid] = useState('');
  const [formNominee, setFormNominee] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter members
  const query = searchQuery.trim().toLowerCase();
  const filteredMembers = data.members.filter((m) => {
    // Status filter
    if (activeTab === 'active' && !m.active) return false;
    if (activeTab === 'archived' && m.active) return false;

    if (!query) return true;
    const mid = formatMemberId(m.id).toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      (m.mobile || '').includes(query) ||
      mid.includes(query) ||
      String(m.id) === query ||
      (m.address || '').toLowerCase().includes(query)
    );
  });

  const getMemberTotalDeposit = (memberId: number) => {
    return data.payments
      .filter((p) => p.member_id === memberId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormMobile('');
    setFormAddress('');
    setFormShareCount('1');
    setFormNid('');
    setFormNominee('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormMobile(m.mobile || '');
    setFormAddress(m.address || '');
    setFormShareCount(String(m.share_count || 1));
    setFormNid(m.nid || '');
    setFormNominee(m.nominee || '');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const newM = addMember({
      name: formName.trim(),
      mobile: formMobile.trim(),
      address: formAddress.trim(),
      share_count: Number(formShareCount) || 1,
      nid: formNid.trim(),
      nominee: formNominee.trim(),
    });
    setShowAddModal(false);
    triggerToast(
      lang === 'en'
        ? `Member ${newM.name} added successfully!`
        : `সদস্য ${newM.name} সফলভাবে যোগ করা হয়েছে!`
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !formName.trim()) return;
    updateMember(editingMember.id, {
      name: formName.trim(),
      mobile: formMobile.trim(),
      address: formAddress.trim(),
      share_count: Number(formShareCount) || 1,
      nid: formNid.trim(),
      nominee: formNominee.trim(),
    });
    setEditingMember(null);
    triggerToast(
      lang === 'en'
        ? 'Member information updated!'
        : 'সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!'
    );
  };

  // Archive member
  const handleArchiveMember = () => {
    if (!deleteTarget) return;
    deleteMember(deleteTarget.id);
    const targetName = deleteTarget.name;
    setDeleteTarget(null);
    triggerToast(
      lang === 'en'
        ? `Member "${targetName}" archived.`
        : `সদস্য "${targetName}" কে আর্কাইভ/নিষ্ক্রিয় করা হয়েছে।`
    );
  };

  // Permanent Delete member
  const handlePermanentDelete = () => {
    if (!deleteTarget) return;
    permanentDeleteMember(deleteTarget.id);
    const targetName = deleteTarget.name;
    setDeleteTarget(null);
    triggerToast(
      lang === 'en'
        ? `Member "${targetName}" permanently deleted.`
        : `সদস্য "${targetName}" কে স্থায়ীভাবে মুছে ফেলা হয়েছে।`
    );
  };

  const handleRestore = (id: number, name: string) => {
    restoreMember(id);
    triggerToast(
      lang === 'en'
        ? `Member "${name}" restored.`
        : `সদস্য "${name}" পুনরায় সক্রিয় করা হয়েছে।`
    );
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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-700" />
            <span>{t('membersDirectory')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('totalMembers')}: {formatNumberWithLang(data.members.length, lang)} {t('persons')} |{' '}
            {t('activeMembers')}:{' '}
            {formatNumberWithLang(data.members.filter((m) => m.active).length, lang)} {t('persons')}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('addNewMember')}</span>
        </button>
      </div>

      {/* Search and Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('memberSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('activeTabActive')} ({formatNumberWithLang(data.members.filter((m) => m.active).length, lang)})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('activeTabAll')} ({formatNumberWithLang(data.members.length, lang)})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-white text-rose-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('activeTabArchived')} ({formatNumberWithLang(data.members.filter((m) => !m.active).length, lang)})
          </button>
        </div>
      </div>

      {/* Member Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <th className="py-3 px-4 w-24">{t('memberIdCol')}</th>
                <th className="py-3 px-4">{t('memberNameCol')}</th>
                <th className="py-3 px-4">{t('memberMobileCol')}</th>
                <th className="py-3 px-4">{t('memberAddressCol')}</th>
                <th className="py-3 px-4 text-center">{t('memberShareCol')}</th>
                <th className="py-3 px-4 text-right">{t('memberTotalDepositCol')}</th>
                <th className="py-3 px-4 text-center">{t('memberStatusCol')}</th>
                <th className="py-3 px-4 text-right">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    {t('noMembersFound')}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const totalDeposit = getMemberTotalDeposit(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/70 transition ${
                        !m.active ? 'bg-slate-50/50 opacity-70' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-900">
                        {formatMemberId(m.id)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        {m.nominee && (
                          <div className="text-[11px] text-slate-400">
                            {t('nomineeLabel')} {m.nominee}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {m.mobile || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {m.address || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-800">
                        {formatNumberWithLang(m.share_count || 1, lang)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrencyWithLang(totalDeposit, lang)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {m.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {t('statusActive')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            {t('statusArchived')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.active && onCollectForMember && (
                            <button
                              onClick={() => onCollectForMember(m.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold transition cursor-pointer"
                              title={t('takeDepositBtn')}
                            >
                              {t('takeDepositBtn')}
                            </button>
                          )}
                          {onViewMemberReport && (
                            <button
                              onClick={() => onViewMemberReport(m.id)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition cursor-pointer"
                              title={t('ledgerBtn')}
                            >
                              {t('ledgerBtn')}
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title={t('editTooltip')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete or Restore buttons */}
                          {m.active ? (
                            canDelete() && (
                              <button
                                onClick={() => setDeleteTarget(m)}
                                className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                title={t('deleteTooltip')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRestore(m.id, m.name)}
                                className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-emerald-50 transition cursor-pointer"
                                title={t('restoreTooltip')}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              {canDelete() && (
                                <button
                                  onClick={() => setDeleteTarget(m)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                  title={lang === 'en' ? 'Permanent Delete' : 'স্থায়ীভাবে মুছে ফেলুন'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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

      {/* CONFIRM DELETE MODAL (Replaces window.confirm) */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          title={
            deleteTarget.active
              ? lang === 'en' ? 'Delete / Archive Member' : 'সদস্য মুছে ফেলা / নিষ্ক্রিয়করণ'
              : lang === 'en' ? 'Permanent Delete Member' : 'স্থায়ীভাবে সদস্য মুছে ফেলুন'
          }
          message={
            deleteTarget.active
              ? lang === 'en'
                ? `Do you want to archive or permanently delete member "${deleteTarget.name}"? Historical collection records will remain in reports if archived.`
                : `আপনি কি সদস্য "${deleteTarget.name}" কে স্থায়ীভাবে মুছে ফেলতে চান নাকি সাময়িক নিষ্ক্রিয়/আর্কাইভ করতে চান?`
              : lang === 'en'
              ? `Warning: Permanently delete member "${deleteTarget.name}" and all associated payment records? This cannot be undone.`
              : `সতর্কতা: সদস্য "${deleteTarget.name}" এবং তার সকল জমার হিসাব ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলা হবে। এটি আর পুনরুদ্ধার করা যাবে না।`
          }
          itemName={`${formatMemberId(deleteTarget.id)} - ${deleteTarget.name}`}
          confirmLabel={
            deleteTarget.active
              ? lang === 'en' ? 'Permanent Delete' : 'স্থায়ীভাবে মুছুন'
              : lang === 'en' ? 'Yes, Delete Permanently' : 'হ্যাঁ, স্থায়ীভাবে মুছুন'
          }
          secondaryAction={
            deleteTarget.active
              ? {
                  label: lang === 'en' ? 'Archive Only' : 'শুধু নিষ্ক্রিয়/আর্কাইভ করুন',
                  onAction: handleArchiveMember,
                }
              : undefined
          }
          onConfirm={handlePermanentDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-emerald-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                <span>{t('memberRegistrationModal')}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('fullNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. Md. Rafiqul Islam' : 'যেমন: মো: রফিকুল ইসলাম'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('memberMobileCol')}
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('shareCountLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formShareCount}
                    onChange={(e) => setFormShareCount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('memberAddressCol')}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'Village/Area, Post, Upazila, District' : 'গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা'}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('nidLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'National ID Card' : 'এনআইডি নাম্বার'}
                    value={formNid}
                    onChange={(e) => setFormNid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('nomineeFieldLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Name (Relation)' : 'নাম (সম্পর্ক)'}
                    value={formNominee}
                    onChange={(e) => setFormNominee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
                >
                  {t('saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-indigo-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-300" />
                <span>
                  {t('editMemberModalTitle')} ({formatMemberId(editingMember.id)})
                </span>
              </h3>
              <button
                onClick={() => setEditingMember(null)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('fullNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('memberMobileCol')}
                  </label>
                  <input
                    type="text"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('shareCountLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formShareCount}
                    onChange={(e) => setFormShareCount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('memberAddressCol')}
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('nidLabel')}
                  </label>
                  <input
                    type="text"
                    value={formNid}
                    onChange={(e) => setFormNid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('nomineeFieldLabel')}
                  </label>
                  <input
                    type="text"
                    value={formNominee}
                    onChange={(e) => setFormNominee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm"
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
