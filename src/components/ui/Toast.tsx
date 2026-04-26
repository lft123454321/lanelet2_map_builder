import React from 'react';
import { useToastStore } from '../../store/toastStore';
import { X, Info, CheckCircle, Warning, Lightbulb } from '@phosphor-icons/react';

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  hint: Lightbulb,
};

const colorMap = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  hint: 'bg-purple-500',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2" style={{ display: 'flex' }}>
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
              text-white min-w-[300px] max-w-[500px]
              animate-in slide-in-from-bottom-5 fade-in duration-300
              ${colorMap[toast.type]}
            `}
          >
            <Icon size={24} weight="fill" />
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
