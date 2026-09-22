import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'success', title) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev.slice(-4), { id, message, type, title }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const toast = {
    success: (message, title) => show(message, 'success', title),
    error: (message, title) => show(message, 'error', title),
    info: (message, title) => show(message, 'info', title),
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-accent-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-primary-500" />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(22rem,90vw)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-modal"
            >
              {icons[t.type]}
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-sm font-semibold text-slate-900">{t.title}</p>}
                <p className="text-sm text-slate-600">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}