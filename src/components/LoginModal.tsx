import React, { useState } from 'react';
import { Lock, User, AlertCircle, Globe } from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LoginModalProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const { data, setCurrentUser, lang, t } = useSamiti();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
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

    // First time setup check (empty password)
    if (!user.has_pw && password === '') {
      setIsFirstSetup(true);
      return;
    }

    // Default admin check
    if (cleanUser === 'admin') {
      if (password === 'admin' || (user.passwordHash && password === user.passwordHash)) {
        setCurrentUser(user);
        onSuccess();
        return;
      } else {
        setError(
          lang === 'en'
            ? 'Incorrect password (admin default: admin)'
            : 'পাসওয়ার্ড ভুল হয়েছে (অ্যাডমিন ডিফল্ট পাসওয়ার্ড: admin)'
        );
        return;
      }
    }

    // Other user check
    if (user.passwordHash) {
      if (password === user.passwordHash) {
        setCurrentUser(user);
        onSuccess();
        return;
      } else {
        setError(lang === 'en' ? 'Incorrect password.' : 'পাসওয়ার্ড ভুল হয়েছে।');
        return;
      }
    } else {
      // Allow login and prompt setup
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
      user.has_pw = true;
      user.passwordHash = newPass1;
      setCurrentUser(user);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-950 via-teal-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden p-6 sm:p-8 relative">
        {/* Language switch at top right */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher compact={true} />
        </div>

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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('usernameLabel')}</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  placeholder={lang === 'en' ? 'Enter password' : 'পাসওয়ার্ড দিন'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {t('defaultLoginInfoText')}
              <p className="mt-1 text-slate-400">
                {t('firstTimeUserHelp')}
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs">
              {lang === 'en' ? 'Set a new password for user ' : 'ইউজার '}
              <strong>{username}</strong> {t('setupPasswordPrompt')}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('newPasswordLabel')}</label>
              <input
                type="password"
                required
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
    </div>
  );
};
