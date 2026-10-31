import React, { useState } from 'react';
import { Lock, User, AlertCircle, X } from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LoginModalProps {
  onSuccess: () => void;
  onCancel?: () => void;
  isFullPage?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onSuccess,
  onCancel,
  isFullPage = false,
}) => {
  const { data, setCurrentUser, changePassword, lang, t } = useSamiti();

  // Inputs start completely empty - user must manually enter username and password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');

  const adminUser = data.users.find((u) => u.username === 'admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setError(
        lang === 'en'
          ? 'Please enter your username.'
          : 'অনুগ্রহ করে আপনার ইউজার নেম লিখুন।'
      );
      return;
    }

    const user = data.users.find((u) => u.username === cleanUser);

    if (!user) {
      setError(
        lang === 'en'
          ? 'Invalid username. Please try again.'
          : 'ইউজার নেম সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
      return;
    }

    if (!user.active) {
      setError(
        lang === 'en'
          ? 'This user account is currently deactivated.'
          : 'এই ব্যবহারকারী অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় বা বন্ধ রয়েছে।'
      );
      return;
    }

    // First time setup check (user created without password)
    if (!user.has_pw && password === '') {
      setIsFirstSetup(true);
      return;
    }

    // Expected password: if user has a passwordHash, that MUST match strictly.
    // For admin, default password is 'admin' ONLY if no passwordHash has been set yet.
    const expectedPassword = user.passwordHash || (cleanUser === 'admin' ? 'admin' : '');

    if (expectedPassword) {
      if (password === expectedPassword) {
        setCurrentUser(user);
        onSuccess();
        return;
      } else {
        setError(
          lang === 'en'
            ? 'Incorrect password. Please enter the correct password.'
            : 'পাসওয়ার্ড ভুল হয়েছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।'
        );
        return;
      }
    } else {
      // First-time password setup prompt
      setIsFirstSetup(true);
    }
  };

  const handleSetupPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass1.length < 4) {
      setError(
        lang === 'en'
          ? 'Password must be at least 4 characters'
          : 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'
      );
      return;
    }
    if (newPass1 !== newPass2) {
      setError(lang === 'en' ? 'Passwords do not match' : 'দুটি পাসওয়ার্ড মেলেনি');
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const user = data.users.find((u) => u.username === cleanUser);
    if (user) {
      changePassword(cleanUser, newPass1);
      setCurrentUser({ ...user, has_pw: true, passwordHash: newPass1 });
      onSuccess();
    }
  };

  const contentCard = (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-150">
      {/* Optional close button if in modal mode and onCancel provided */}
      {!isFullPage && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title={lang === 'en' ? 'Close' : 'বন্ধ করুন'}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Language switch at top right (in modal mode) */}
      {!isFullPage && (
        <div className="absolute top-4 right-4">
          <LanguageSwitcher compact={true} />
        </div>
      )}

      <div className="text-center mb-6 pt-2">
        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-teal-500/20 mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 font-serif">
          {t('loginModalTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{data.settings.heading}</p>
      </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isFirstSetup ? (
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('usernameLabel')}</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder={lang === 'en' ? 'Enter username (e.g. admin)' : 'ইউজার নেম লিখুন (যেমন: admin)'}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder={lang === 'en' ? 'Enter password' : 'পাসওয়ার্ড লিখুন'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer"
            >
              {t('loginBtn')}
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 block">{t('defaultLoginInfoTitle')}</span>
              {adminUser?.passwordHash && adminUser.passwordHash !== 'admin' ? (
                <p className="text-emerald-700 font-medium">
                  {lang === 'en'
                    ? 'User: admin | (Password has been updated)'
                    : 'ইউজার: admin | (পাসওয়ার্ড পরিবর্তিত হয়েছে)'}
                </p>
              ) : (
                <p className="text-slate-600">{t('defaultLoginInfoText')}</p>
              )}
              <p className="mt-1 text-slate-400">
                {t('firstTimeUserHelp')}
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetupPassword} className="space-y-4" autoComplete="off">
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs">
              {lang === 'en' ? 'Set a new password for user ' : 'ইউজার '}
              <strong>{username}</strong> {t('setupPasswordPrompt')}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('newPasswordLabel')}</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder={lang === 'en' ? 'At least 4 characters' : 'কমপক্ষে ৪ অক্ষর'}
                value={newPass1}
                onChange={(e) => setNewPass1(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('confirmPasswordLabel')}</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder={lang === 'en' ? 'Confirm password' : 'পুনরায় নিশ্চিত করুন'}
                value={newPass2}
                onChange={(e) => setNewPass2(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFirstSetup(false)}
                className="w-1/2 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t('goBackBtn')}
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                {t('setupAndLoginBtn')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          <p className="font-semibold text-slate-600">{t('developedBy')}</p>
          <p>{t('contact')}</p>
        </div>
      </div>
    );

  if (isFullPage) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
        {/* Top Header Bar */}
        <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {lang === 'bn' ? 'স' : 'S'}
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white">
                {data.settings.heading}
              </h1>
              <p className="text-xs text-emerald-400">
                {data.settings.subheading || data.settings.reg_no || t('appSubtitle')}
              </p>
            </div>
          </div>
          <LanguageSwitcher className="bg-slate-800/90 border-slate-700 text-slate-200" />
        </header>

        {/* Center Login Card */}
        <main className="my-auto py-8 w-full flex items-center justify-center">
          {contentCard}
        </main>

        {/* Bottom Credits */}
        <footer className="w-full max-w-5xl mx-auto pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{data.settings.heading} &copy; {new Date().getFullYear()} — All rights reserved.</p>
          <p className="text-emerald-400/90 font-medium">Developed By Os Technology | Contact: md.oraka@gmail.com</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-950/90 via-teal-950/80 to-slate-950/95 backdrop-blur-xs flex items-center justify-center p-4">
      {contentCard}
    </div>
  );
};
