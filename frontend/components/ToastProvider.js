"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-500/25 bg-emerald-950/25 text-emerald-300",
  },
  error: {
    icon: XCircle,
    className: "border-red-500/25 bg-red-950/25 text-red-300",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/25 bg-amber-950/25 text-amber-300",
  },
  info: {
    icon: Info,
    className: "border-purple-500/25 bg-purple-950/25 text-purple-300",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, type = "info", duration = 3600 }) => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, title, message, type }]);

      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast]
  );

  const confirmAction = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmation({
        title: "Are you sure?",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "danger",
        ...options,
        resolve,
      });
    });
  }, []);

  const closeConfirmation = useCallback(
    (result) => {
      if (!confirmation) return;
      confirmation.resolve(result);
      setConfirmation(null);
    },
    [confirmation]
  );

  const value = useMemo(() => ({ toast, confirmAction }), [toast, confirmAction]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed bottom-5 right-5 z-[80] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-3 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const style = toastStyles[item.type] || toastStyles.info;
            const Icon = style.icon;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-2xl shadow-black/40 backdrop-blur-xl ${style.className}`}
              >
                <div className="flex items-start gap-3 bg-zinc-950/70 px-4 py-3.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    {item.title && <p className="text-sm font-bold leading-5 text-white">{item.title}</p>}
                    {item.message && <p className="mt-0.5 text-xs leading-5 text-zinc-300">{item.message}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(item.id)}
                    className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmation && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="toast-confirm-title"
              aria-describedby="toast-confirm-message"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/60"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                  confirmation.variant === "danger"
                    ? "border-red-500/25 bg-red-950/30 text-red-400"
                    : "border-purple-500/25 bg-purple-950/30 text-purple-300"
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="toast-confirm-title" className="text-base font-bold text-white">
                    {confirmation.title}
                  </h2>
                  {confirmation.message && (
                    <p id="toast-confirm-message" className="mt-2 text-sm leading-6 text-zinc-400">
                      {confirmation.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => closeConfirmation(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-900 hover:text-white cursor-pointer"
                >
                  {confirmation.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => closeConfirmation(true)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                    confirmation.variant === "danger"
                      ? "bg-red-500 text-white hover:bg-red-400"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {confirmation.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
