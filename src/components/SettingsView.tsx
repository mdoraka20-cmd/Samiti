import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Upload,
  Download,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
  const { data, updateSettings, restoreBackup, resetToDemo, lang, t } = useSamiti();

  const [heading, setHeading] = useState(data.settings.heading);
  const [subheading, setSubheading] = useState(data.settings.subheading || '');
  const [address, setAddress] = useState(data.settings.address);
  const [mobile, setMobile] = useState(data.settings.mobile);
  const [email, setEmail] = useState(data.settings.email || '');
  const [sharePrice, setSharePrice] = useState(data.settings.share_price || '');
  const [note, setNote] = useState(data.settings.note);
  const [logo, setLogo] = useState(data.settings.logo || '');
  const [signature, setSignature] = useState(data.settings.signature || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Confirm demo reset modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleImagePick = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (b64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      heading: heading.trim(),
      subheading: subheading.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      share_price: sharePrice.trim(),
      note: note.trim(),
      logo,
      signature,
    });
    setSavedSuccess(true);
    triggerToast(
      lang === 'en'
        ? 'Settings saved successfully!'
        : 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
    );
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteLogo = () => {
    setLogo('');
    updateSettings({ logo: '' });
    triggerToast(lang === 'en' ? 'Logo removed.' : 'লোগো মুছে ফেলা হয়েছে।');
  };

  const handleDeleteSignature = () => {
    setSignature('');
    updateSettings({ signature: '' });
    triggerToast(lang === 'en' ? 'Signature removed.' : 'স্বাক্ষর মুছে ফেলা হয়েছে।');
  };

  const handleDownloadBackup = () => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const filename = `samiti_backup_${timestamp}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(lang === 'en' ? 'Backup file downloaded!' : 'ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন!');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = restoreBackup(parsed);
        if (ok) {
          triggerToast(
            lang === 'en'
              ? 'Backup restored successfully!'
              : 'ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!'
          );
          setTimeout(() => window.location.reload(), 600);
        } else {
          triggerToast(
            lang === 'en'
              ? 'Invalid backup format. Please select a valid JSON backup file.'
              : 'ভুল ফাইল ফরম্যাট। অনুগ্রহ করে একটি সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।'
          );
        }
      } catch {
        triggerToast(lang === 'en' ? 'Failed to read file.' : 'ফাইলটি পড়তে সমস্যা হয়েছে।');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmResetDemo = () => {
    resetToDemo();
    setShowResetConfirm(false);
    triggerToast(lang === 'en' ? 'Demo data loaded!' : 'ডেমো ডাটা লোড হয়েছে!');
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

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-700" />
            <span>{t('settingsTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('settingsSubtitle')}
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('savedSuccessBadge')}</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-sm text-indigo-950 border-b pb-2 uppercase tracking-wide">
          {t('receiptAndReportHeadingSection')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('samitiNameLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('subheadingLabel')}
            </label>
            <input
              type="text"
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('samitiAddressLabel')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('mobileContactLabel')}
            </label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('defaultSharePriceLabel')}
            </label>
            <input
              type="number"
              value={sharePrice}
              onChange={(e) => setSharePrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t('receiptFooterNoteLabel')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Logo and Signature Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Logo */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t('logoWatermarkLabel')}
            </label>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative w-20 h-20 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center">
                  <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-md hover:bg-rose-700 cursor-pointer transition"
                    title={t('deleteLogoBtn')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e, setLogo)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">{t('pngJpgNote')}</p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t('signatureImageLabel')}
            </label>
            <div className="flex items-center gap-4">
              {signature ? (
                <div className="relative w-28 h-16 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center">
                  <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={handleDeleteSignature}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-md hover:bg-rose-700 cursor-pointer transition"
                    title={t('deleteSignatureBtn')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-16 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                  <span className="text-xs">{lang === 'en' ? 'No Signature' : 'স্বাক্ষর নেই'}</span>
                </div>
              )}
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e, setSignature)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">{t('whiteBgNote')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-sm transition cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveSettingsBtn')}</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Download */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('backupDownloadTitle')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {t('backupDownloadDesc')}
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{t('downloadBackupBtn')}</span>
          </button>
        </div>

        {/* Backup Restore */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">{t('backupRestoreTitle')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {t('backupRestoreDesc')}
            </p>
          </div>
          <div>
            <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs text-center">
              <Upload className="w-4 h-4" />
              <span>{t('uploadBackupBtn')}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reset to Demo Data */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{t('resetDemoTitle')}</span>
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            {t('resetDemoDesc')}
          </p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          {t('loadDemoBtn')}
        </button>
      </div>

      {/* CONFIRM RESET DEMO MODAL */}
      {showResetConfirm && (
        <ConfirmModal
          isOpen={true}
          title={t('resetDemoTitle')}
          message={
            lang === 'en'
              ? 'Warning: Reloading sample demo data will reset current records to the default demo state. Do you want to proceed?'
              : 'সতর্কতা: নমুনা ডেমো ডাটা লোড করলে বর্তমান হিসাব প্রাথমিক নমুনা তথ্যে পরিবর্তিত হবে। আপনি কি এগিয়ে যেতে চান?'
          }
          confirmLabel={lang === 'en' ? 'Yes, Load Demo Data' : 'হ্যাঁ, ডেমো ডাটা লোড করুন'}
          onConfirm={handleConfirmResetDemo}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};
