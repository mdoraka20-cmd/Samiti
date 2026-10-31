import React, { useState } from 'react';
import { Lock, User, AlertCircle, X, Eye, EyeOff, Key, HelpCircle, CheckCircle2 } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const adminUser = data.users.find((u) => u.username === 'admin');

  const handleRecoverPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanKey = recoveryKey.trim();
    // Authorized master recovery keys for the app
    const validKeys = ['123456', 'samiti2026', 'admin'];
    if (!validKeys.includes(cleanKey)) {
      setForgotError(
        lang === 'en'
          ? 'Invalid master recovery key. Please check or contact developer.'
          : 'মাস্টার রিকভারি কি (Master Key) সঠিক নয়। ডেভেলপারের সাথে যোগাযোগ করুন।'
      );
      return;
    }

    if (recoveryNewPass.length < 4) {
      setForgotError(
        lang === 'en'
          ? 'New password must be at least 4 characters.'
          : 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
      );
      return;
    }

    changePassword('admin', recoveryNewPass);
    setForgotSuccess(
      lang === 'en'
        ? 'Admin password reset successfully! You can now log in with your new password.'
        : 'অ্যাডমিন পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
    );
    setRecoveryKey('');
    setRecoveryNewPass('');
  };

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
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden p-6 sm:p-8 relative text-slate-900 animate-in fade-in zoom-in-95 duration-150">
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
              <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
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
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('passwordLabel')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder={lang === 'en' ? 'Enter password' : 'পাসওয়ার্ড লিখুন'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end -mt-1">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotError('');
                setForgotSuccess('');
                setRecoveryKey('');
                setRecoveryNewPass('');
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition"
            >
              {lang === 'en' ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer"
          >
            {t('loginBtn')}
          </button>
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
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

  const forgotPasswordModal = showForgotModal && (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          type="button"
          onClick={() => {
            setShowForgotModal(false);
            setForgotError('');
            setForgotSuccess('');
          }}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              {lang === 'en' ? 'Forgot Password & Recovery' : 'পাসওয়ার্ড পুনরুদ্ধার'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'en' ? 'Admin self-reset & support instructions' : 'অ্যাডমিন পাসওয়ার্ড রিসেট ও সহায়তা'}
            </p>
          </div>
        </div>

        {forgotError && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{forgotError}</span>
          </div>
        )}

        {forgotSuccess ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm mb-1">
                  {lang === 'en' ? 'Success!' : 'সফলভাবে সম্পন্ন হয়েছে!'}
                </span>
                <span>{forgotSuccess}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess('');
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {lang === 'en' ? 'Back to Login' : 'লগইনে ফিরে যান'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Admin Password Reset Form */}
            <form onSubmit={handleRecoverPassword} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'en' ? 'Admin Password Reset' : 'অ্যাডমিন পাসওয়ার্ড রিসেট'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {lang === 'en'
                  ? 'Enter master recovery key (default: 123456) to set a new admin password.'
                  : 'মাস্টার সিকিউরিটি কি (Master Key: 123456) দিয়ে অ্যাডমিনের নতুন পাসওয়ার্ড সেট করুন।'}
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'en' ? 'Master Recovery Key *' : 'মাস্টার রিকভারি কি *'}
                </label>
                <input
                  type="password"
                  required
                  placeholder={lang === 'en' ? 'Enter key (e.g. 123456)' : 'রিকভারি কি লিখুন (যেমন: 123456)'}
                  value={recoveryKey}
                  onChange={(e) => {
                    setRecoveryKey(e.target.value);
                    setForgotError('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'en' ? 'New Admin Password *' : 'নতুন অ্যাডমিন পাসওয়ার্ড *'}
                </label>
                <input
                  type="password"
                  required
                  placeholder={lang === 'en' ? 'Min 4 characters' : 'কমপক্ষে ৪ অক্ষর'}
                  value={recoveryNewPass}
                  onChange={(e) => {
                    setRecoveryNewPass(e.target.value);
                    setForgotError('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                {lang === 'en' ? 'Reset Admin Password' : 'অ্যাডমিন পাসওয়ার্ড রিসেট করুন'}
              </button>
            </form>

            {/* Sub-users & Support notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'en' ? 'Sub-User or Cashier Account?' : 'ক্যাশিয়ার বা সাধারণ ইউজার একাউন্ট?'}</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                {lang === 'en'
                  ? 'Sub-users should contact the primary Administrator. Admin can change any user password directly from Admin Panel.'
                  : 'সাধারণ ইউজার বা ক্যাশিয়ারদের পাসওয়ার্ড অ্যাডমিন প্যানেল থেকে অ্যাডমিনের মাধ্যমে পরিবর্তন করা যাবে।'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex flex-col gap-0.5">
              <span className="font-bold text-slate-800">
                {lang === 'en' ? 'Developer Technical Support:' : 'ডেভেলপার টেকনিক্যাল সাপোর্ট:'}
              </span>
              <span>Os Technology</span>
              <span className="font-mono text-emerald-700 font-semibold">md.oraka@gmail.com</span>
            </div>
          </div>
        )}
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

        {forgotPasswordModal}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-950/90 via-teal-950/80 to-slate-950/95 backdrop-blur-xs flex items-center justify-center p-4">
      {contentCard}
      {forgotPasswordModal}
    </div>
  );
};
