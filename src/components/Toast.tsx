import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // ms
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

// ─── Toast Item ───────────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Entrée animée
    const show = setTimeout(() => setVisible(true), 10);

    // Décompte
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev - (100 / (toast.duration / 100));
        return next < 0 ? 0 : next;
      });
    }, 100);

    // Sortie
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration);

    return () => { clearTimeout(show); clearTimeout(hide); clearInterval(interval); };
  }, [toast.id, toast.duration, onRemove]);

  const styles: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
    success: { bg: 'bg-white',  border: 'border-green-400',  icon: 'text-green-500',  bar: 'bg-green-400'  },
    error:   { bg: 'bg-white',  border: 'border-red-400',    icon: 'text-red-500',    bar: 'bg-red-400'    },
    warning: { bg: 'bg-white',  border: 'border-yellow-400', icon: 'text-yellow-500', bar: 'bg-yellow-400' },
    info:    { bg: 'bg-white',  border: 'border-indigo-400', icon: 'text-indigo-500', bar: 'bg-indigo-400' },
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error:   <XCircle      className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info:    <Info         className="w-5 h-5" />,
  };

  const s = styles[toast.type];

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl shadow-lg border-l-4 ${s.border} ${s.bg}
        transition-all duration-300 ease-out min-w-[280px] max-w-sm
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}
      `}
    >
      <div className="flex items-start gap-3 px-4 py-3 pr-10">
        <span className={`mt-0.5 shrink-0 ${s.icon}`}>{icons[toast.type]}</span>
        <p className="text-sm text-gray-800 font-medium leading-snug">{toast.message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar (décompte 5s) */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all ease-linear ${s.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container — bas droite */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
