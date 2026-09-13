'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Where the confirmation link in the "reset your password" email points
// (see resetPasswordForEmail's redirectTo in src/app/page.tsx). Clicking
// that link is what proves the person controls the inbox — Supabase reads
// the recovery token in the URL itself and turns it into a short-lived
// signed-in session automatically (detectSessionInUrl, on by default), so
// by the time this page's effect below runs, supabase.auth already knows
// who this is. From here it's just: ask for a new password, save it.
//
// Setup required in the Supabase dashboard for the email link to actually
// land here instead of being rejected:
//   Authentication -> URL Configuration -> Redirect URLs -> add
//   https://<your-deployed-domain>/reset-password
//   (and http://localhost:3000/reset-password for local testing)
// ============================================================================

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires this once it's parsed the recovery token from the URL.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready');
    });
    // Cover the case where the token was already processed before this
    // component mounted (e.g. a fast redirect) — if there's already a
    // session by the time we check, treat it the same as PASSWORD_RECOVERY.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus('ready');
      else setTimeout(() => setStatus((s) => (s === 'checking' ? 'invalid' : s)), 2500);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password needs to be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError("Those two passwords don't match."); return; }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (updateError) {
      setError('Could not update the password. The link may have expired — request a new one from the login page.');
    } else {
      setDone(true);
      await supabase.auth.signOut(); // don't leave them signed in from the recovery session — they should sign in fresh with the new password
    }
  };

  return (
    <div className="reset-wrap">
      <style jsx global>{`
        .reset-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          padding: 24px;
          font-family: var(--font-manrope), -apple-system, sans-serif;
        }
        .reset-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: #0a0a0a;
          border-radius: 18px;
          padding: 40px 36px;
          border: 1px solid transparent;
          background-clip: padding-box;
        }
        .reset-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 1.5px;
          background: linear-gradient(135deg, #00f3ff, #ff00e5, #7c3aed);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .reset-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-size: 26px;
          color: #fff;
          text-align: center;
          letter-spacing: 0.01em;
        }
        .reset-subtitle {
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(0,243,255,0.7);
          margin-top: 4px;
          margin-bottom: 22px;
        }
        .reset-copy {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.6);
          text-align: center;
          margin-bottom: 8px;
        }
        .reset-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin: 16px 0 6px;
        }
        .reset-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          padding: 11px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .reset-input:focus { border-color: #00f3ff; }
        .reset-btn {
          width: 100%;
          background: transparent;
          border: 1px solid #00f3ff;
          color: #00f3ff;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 12.5px;
          padding: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.25s, box-shadow 0.25s, color 0.25s;
          margin-top: 22px;
        }
        .reset-btn:hover:not(:disabled) {
          background: #00f3ff;
          color: #050505;
          box-shadow: 0 0 24px #00f3ff, inset 0 0 12px rgba(0,243,255,0.3);
        }
        .reset-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .reset-error {
          background: rgba(255,0,80,0.1);
          border: 1px solid rgba(255,0,80,0.4);
          color: #ff5c8a;
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: 6px;
          margin-top: 14px;
        }
        .reset-link {
          display: block;
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(0,243,255,0.6);
        }
        .reset-link:hover { color: #00f3ff; }
      `}</style>

      <div className="reset-card">
        <div className="reset-title">Reset Password</div>

        {status === 'checking' && (
          <>
            <div className="reset-subtitle">Verifying link</div>
            <p className="reset-copy">Give it a second…</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className="reset-subtitle">Link expired or invalid</div>
            <p className="reset-copy">
              This reset link isn&apos;t valid anymore — links only work once, and expire after a while.
              Go back to the login page and request a new one.
            </p>
            <a href="/" className="reset-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Back to Login
            </a>
          </>
        )}

        {status === 'ready' && !done && (
          <form onSubmit={handleSubmit}>
            <p className="reset-copy">Set a new password for your account.</p>
            {error && <div className="reset-error">{error}</div>}
            <label className="reset-label">New Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="reset-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <label className="reset-label">Confirm Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="reset-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button type="submit" disabled={submitting} className="reset-btn">
              {submitting ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        )}

        {status === 'ready' && done && (
          <>
            <p className="reset-copy">Password updated. Sign in with it from the login page.</p>
            <a href="/" className="reset-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
