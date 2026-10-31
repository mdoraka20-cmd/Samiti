import React from 'react';
import { Globe } from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { lang, setLang } = useSamiti();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs ${className}`}
      role="group"
      aria-label="Language selection"
    >
      {!compact && <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1 shrink-0" />}

      <button
        type="button"
        onClick={() => setLang('bn')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
          lang === 'bn'
            ? 'bg-emerald-700 text-white shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="বাংলা ভাষায় ব্যবহার করুন"
      >
        বাংলা
      </button>

      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
          lang === 'en'
            ? 'bg-emerald-700 text-white shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="Switch to English"
      >
        English
      </button>
    </div>
  );
};
