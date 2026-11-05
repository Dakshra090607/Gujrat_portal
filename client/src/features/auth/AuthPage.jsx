import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, CircleAlert, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, getApiErrorMessage, setAccessToken } from '../../lib/api.js';
import { authClient, getNeonAccessToken } from '../../lib/auth.js';
import './auth.css';

function landingForRole(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'REVIEWER') return '/admin/review';
  return '/app';
}

function messageFrom(exception) {
  return exception?.response ? getApiErrorMessage(exception) : exception?.message ?? 'Authentication could not be completed.';
}

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';
  const isRecovery = isForgot || isReset;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', termsAccepted: false, rememberMe: true });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isRecovery) return undefined;
    let active = true;
    api.get('/auth/me').then((response) => {
      if (active) navigate(landingForRole(response.data.data.user.role), { replace: true });
    }).catch(() => {});
    return () => { active = false; };
  }, [isRecovery, navigate]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (isRegister && !form.termsAccepted) return setError('Accept the terms to create an account.');
    if ((isRegister || isReset) && form.password !== form.confirmPassword) return setError('The passwords do not match.');
    setBusy(true);
    try {
      if (isForgot) {
        if (!authClient) throw new Error('Neon Auth has not been configured.');
        const result = await authClient.requestPasswordReset({ email: form.email.trim().toLowerCase(), redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw new Error(result.error.message ?? 'A reset email could not be sent.');
        setSuccess('If an account exists for that address, a password reset link has been sent.');
        return;
      }
      if (isReset) {
        if (!authClient) throw new Error('Neon Auth has not been configured.');
        const token = searchParams.get('token');
        if (!token) throw new Error('This password reset link is missing its token. Request a new link.');
        const result = await authClient.resetPassword({ newPassword: form.password, token });
        if (result.error) throw new Error(result.error.message ?? 'The password could not be reset.');
        setSuccess('Your password has been reset. You can now sign in.');
        navigate('/login', { replace: true });
        return;
      }
      if (!authClient) throw new Error('Neon Auth has not been configured.');
      const result = isRegister
        ? await authClient.signUp.email({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password })
        : await authClient.signIn.email({ email: form.email.trim().toLowerCase(), password: form.password, rememberMe: form.rememberMe });
      if (result.error) throw new Error(result.error.message ?? 'Check the email and password, then try again.');
      const token = await getNeonAccessToken();
      if (!token) {
        setSuccess(isRegister ? 'Your account was created. Check your email if verification is required, then sign in.' : 'Sign in completed, but the session token is not available yet. Try again.');
        return;
      }
      setAccessToken(token);
      if (isRegister) await api.post('/auth/accept-terms', { accepted: true });
      const profile = await api.get('/auth/me');
      navigate(landingForRole(profile.data.data.user.role), { replace: true });
    } catch (exception) {
      setError(messageFrom(exception));
    } finally {
      setBusy(false);
    }
  };

  const title = isRegister ? 'Create your workspace account.' : isForgot ? 'Reset your password.' : isReset ? 'Choose a new password.' : 'Welcome back to your workspace.';
  const heading = isRegister ? 'Create account' : isForgot ? 'Forgot password' : isReset ? 'Set new password' : 'Sign in';

  return <main className="auth-page">
    <header className="auth-header">
      <Link to="/" className="auth-brand"><span><Building2 size={18} /></span><b>BuildRule Gujarat</b></Link>
      <Link to="/" className="auth-back"><ArrowLeft size={14} /> Back to site</Link>
    </header>
    <section className="auth-content">
      <div className="auth-story">
        <span className="auth-eyebrow"><ShieldCheck size={14} /> GUJARAT REGULATORY WORKSPACE</span>
        <h1>{title}</h1>
        <p>{isRegister
          ? 'Create an account to continue into the BuildRule Gujarat workspace. Public accounts cannot access regulatory administration.'
          : isForgot || isReset
            ? 'Use the secure recovery flow managed by Neon Auth. Reset links are short-lived and single-use.'
            : 'Sign in to continue exploring source-linked regulations and development tools.'}</p>
        <div className="auth-trust-note"><LockKeyhole size={15} /><span>Neon Auth manages passwords and sessions. Reviewer and administrator roles are assigned separately.</span></div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-icon"><ShieldCheck size={20} /></div>
        <span className="auth-card-label">{isRegister ? 'NEW ACCOUNT' : isRecovery ? 'ACCOUNT RECOVERY' : 'ACCOUNT ACCESS'}</span>
        <h2>{heading}</h2>
        <p>{isRegister ? 'Use your name and email to set up a regular workspace account.' : isForgot ? 'We will send a reset link if an account matches that address.' : isReset ? 'Enter and confirm your new password.' : 'Enter your account email and password.'}</p>
        {error && <div className="auth-error" role="alert"><CircleAlert size={15} /><span>{error}</span></div>}
        {success && <div className="auth-success" role="status">{success}</div>}
        {isRegister && <label>Full name<input autoComplete="name" required minLength={2} maxLength={120} value={form.name} onChange={update('name')} /></label>}
        {(isForgot || (!isReset)) && <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update('email')} /></label>}
        {!isForgot && <label>Password<span className="auth-password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister || isReset ? 'new-password' : 'current-password'} required minLength={isRegister || isReset ? 12 : 1} maxLength={200} value={form.password} onChange={update('password')} /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>{(isRegister || isReset) && <small>Use at least 12 characters.</small>}</label>}
        {(isRegister || isReset) && <label>Confirm password<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={200} value={form.confirmPassword} onChange={update('confirmPassword')} /></label>}
        {!isRecovery && !isRegister && <div className="auth-form-options"><label className="auth-checkbox"><input type="checkbox" checked={form.rememberMe} onChange={update('rememberMe')} /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}
        {isRegister && <label className="auth-checkbox auth-terms"><input type="checkbox" required checked={form.termsAccepted} onChange={update('termsAccepted')} /> I agree to the terms and privacy notice.</label>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : isForgot ? 'Send reset link' : isReset ? 'Reset password' : 'Sign in'} <ArrowRight size={15} /></button>
        <div className="auth-switch">{isRegister ? <>Already registered? <Link to="/login">Sign in</Link></> : isRecovery ? <>Remember your password? <Link to="/login">Sign in</Link></> : <>New to BuildRule Gujarat? <Link to="/register">Create an account</Link></>}</div>
        {!isRegister && !isRecovery && <div className="auth-admin-note">Reviewer or administrator? Use this same login. <Link to="/admin">Open admin console</Link></div>}
      </form>
    </section>
    <footer className="auth-footer">CGDCR-2017 · Gujarat <span>•</span> Source-linked regulatory information</footer>
  </main>;
}
