import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useSamiti } from '../context/SamitiContext';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Optional secondary action, e.g. for members: "Archive" vs "Permanent Delete"
  secondaryAction?: {
    label: string;
    onAction: () => void;
  };
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  onConfirm,
  onCancel,
  secondaryAction,
}) => {
  const { lang } = useSamiti();

  if (!isOpen) return null;

  const defaultTitle =
    title || (lang === 'en' ? 'Confirm Deletion' : 'মুছে ফেলার নিশ্চিতকরণ');
  const defaultConfirm =
    confirmLabel || (lang === 'en' ? 'Yes, Delete' : 'হ্যাঁ, মুছে ফেলুন');
  const defaultCancel =
    cancelLabel || (lang === 'en' ? 'Cancel' : 'বাতিল করুন');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            {isDestructive ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title={defaultCancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">{defaultTitle}</h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {message}
          </p>
          {itemName && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 break-all">
              {itemName}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {defaultCancel}
          </button>

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onAction}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{defaultConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
