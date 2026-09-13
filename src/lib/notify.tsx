'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// ============================================================================
// A themed replacement for window.alert() / window.confirm() — those render
// as the browser's own generic gray OS dialog (see the screenshot that
// prompted this file), which looks nothing like the rest of the app and
// can't be styled at all. This gives every component two hooks instead:
//
//   const { toast } = useNotify();
//   toast.error('Failed to save.');           // was: alert('Failed to save.')
//   toast.success('Saved.');
//
//   const { confirm } = useNotify();
//   if (!(await confirm('Remove this item?'))) return;   // was: window.confirm(...)
//   // or, for a destructive action, get a red Confirm button:
//   if (!(await confirm({ message: 'Delete this account?', danger: true }))) return;
//
// Both need the calling function to be `async` (confirm() returns a
// Promise<boolean>, resolved when the person clicks a button) — every
// existing window.confirm() call site in this app already was, since they
// all continue on to an `await supabase...` call right after.
// ============================================================================

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red Confirm button, for destructive/irreversible actions (delete, archive, void). */
  danger?: boolean;
};
type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void };

type NotifyContextValue = {
  toast: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void };
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 8 14.5 16 6" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6v5" />
      <circle cx="10" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="8" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 9v5" />
      <circle cx="10" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="8" />
    </svg>
  );
}

const TOAST_COLOR: Record<ToastType, string> = {
  success: 'var(--color-moss)',
  error: 'var(--color-oxblood)',
  info: 'var(--color-brass)',
};

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const toast = {
    success: (msg: string) => pushToast('success', msg),
    error: (msg: string) => pushToast('error', msg),
    info: (msg: string) => pushToast('info', msg),
  };

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve }));
  }, []);

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <NotifyContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack — bottom-right, stacks upward, auto-dismisses */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col-reverse gap-2 w-[min(380px,calc(100vw-2.5rem))] print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="notify-toast flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderLeft: `3px solid ${TOAST_COLOR[t.type]}`,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span className="shrink-0 mt-0.5" style={{ color: TOAST_COLOR[t.type] }}>
              {t.type === 'error' ? <IconAlert /> : t.type === 'success' ? <IconCheck /> : <IconInfo />}
            </span>
            <p className="text-sm text-ink flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-muted hover:text-ink text-base leading-none shrink-0" aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4 print:hidden"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="notify-confirm-card bg-canvas border border-thread rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <h3 className="text-sm font-bold text-ink mb-2">{confirmState.title || (confirmState.danger ? 'Are you sure?' : 'Confirm')}</h3>
              <p className="text-sm text-muted leading-relaxed">{confirmState.message}</p>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => closeConfirm(false)} className="flex-1 p-btn p-btn-ghost justify-center">
                {confirmState.cancelLabel || 'Cancel'}
              </button>
              <button onClick={() => closeConfirm(true)} className={`flex-1 p-btn ${confirmState.danger ? 'p-btn-danger' : 'p-btn-primary'} justify-center`}>
                {confirmState.confirmLabel || (confirmState.danger ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used inside <NotifyProvider>');
  return ctx;
}
