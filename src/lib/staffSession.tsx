'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type StaffIdentity = { id: string; full_name: string; role: string };

type PendingApproval = {
  actionLabel: string;
  resolve: (staff: StaffIdentity | null) => void;
  pin: string;
  error: string;
  submitting: boolean;
};

type StaffSessionValue = {
  currentStaff: StaffIdentity | null;
  identifyStaff: (pin: string) => Promise<StaffIdentity | null>; // "who's working the register"
  clearStaff: () => void;
  // Opens the manager-PIN modal and resolves with the approving manager's
  // identity, or null if they cancelled. Never throws.
  requestManagerApproval: (actionLabel: string) => Promise<StaffIdentity | null>;
};

const StaffSessionContext = createContext<StaffSessionValue | null>(null);

const STORAGE_KEY = 'crave-abs-current-staff';

export function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffIdentity | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const identifyStaff = useCallback(async (pin: string): Promise<StaffIdentity | null> => {
    const { data, error } = await supabase.rpc('verify_staff_pin', { p_pin: pin });
    const match = !error && Array.isArray(data) && data[0] ? (data[0] as StaffIdentity) : null;
    if (match) {
      setCurrentStaff(match);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(match)); } catch {}
    }
    return match;
  }, []);

  const clearStaff = useCallback(() => {
    setCurrentStaff(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const [pending, setPending] = useState<PendingApproval | null>(null);
  const pendingRef = useRef<PendingApproval | null>(null);
  useEffect(() => { pendingRef.current = pending; }, [pending]);

  const requestManagerApproval = useCallback((actionLabel: string): Promise<StaffIdentity | null> => {
    return new Promise((resolve) => {
      setPending({ actionLabel, resolve, pin: '', error: '', submitting: false });
    });
  }, []);

  const closeModal = (result: StaffIdentity | null) => {
    pendingRef.current?.resolve(result);
    setPending(null);
  };

  const submitPin = async () => {
    const current = pendingRef.current;
    if (!current || current.pin.length < 4) return;
    setPending(p => (p ? { ...p, submitting: true, error: '' } : p));
    const { data, error } = await supabase.rpc('verify_manager_pin', { p_pin: current.pin });
    const match = !error && Array.isArray(data) && data[0] ? (data[0] as StaffIdentity) : null;
    if (match) {
      closeModal(match);
    } else {
      setPending(p => (p ? { ...p, submitting: false, error: 'Incorrect PIN, or not a manager/admin PIN.', pin: '' } : p));
    }
  };

  const value = useMemo(() => ({ currentStaff, identifyStaff, clearStaff, requestManagerApproval }), [currentStaff, identifyStaff, clearStaff, requestManagerApproval]);

  return (
    <StaffSessionContext.Provider value={value}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-canvas border border-thread max-w-sm w-full p-6 shadow-xl">
            <h3 className="font-display text-lg text-ink mb-1">Manager approval needed</h3>
            <p className="text-sm text-muted mb-4">{pending.actionLabel} requires a manager or admin PIN.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={8}
              placeholder="PIN"
              className="w-full px-4 py-3 bg-paper border border-thread focus:border-oxblood outline-none font-mono text-lg tracking-widest text-center mb-2"
              value={pending.pin}
              onChange={(e) => setPending(p => (p ? { ...p, pin: e.target.value.replace(/\D/g, ''), error: '' } : p))}
              onKeyDown={(e) => { if (e.key === 'Enter') submitPin(); }}
            />
            {pending.error && <p className="text-xs text-oxblood font-semibold mb-2">{pending.error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => closeModal(null)}
                className="flex-1 px-4 py-2.5 border border-thread text-sm font-bold uppercase tracking-wide hover:bg-paper transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPin}
                disabled={pending.pin.length < 4 || pending.submitting}
                className="flex-1 px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90 disabled:opacity-50 transition-colors"
              >
                {pending.submitting ? 'Checking…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession(): StaffSessionValue {
  const ctx = useContext(StaffSessionContext);
  if (!ctx) throw new Error('useStaffSession must be used inside <StaffSessionProvider>');
  return ctx;
}
