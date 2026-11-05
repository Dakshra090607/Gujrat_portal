import { useEffect, useState } from 'react';
import { ArrowRight, CircleAlert, KeyRound, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../lib/api.js';
import { authClient } from '../../lib/auth.js';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/users/me').then((response) => {
      if (active) {
        setProfile(response.data.data.user);
        setName(response.data.data.user.name);
      }
    }).catch((exception) => active && setError(getApiErrorMessage(exception)));
    return () => { active = false; };
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const authResult = await authClient.updateUser({ name: name.trim() });
      if (authResult.error) throw new Error(authResult.error.message ?? 'Could not update the Neon Auth profile.');
      const response = await api.patch('/users/me', { name: name.trim() });
      setProfile(response.data.data.user); setNotice('Your profile was updated.');
    } catch (exception) { setError(exception?.response ? getApiErrorMessage(exception) : exception.message); }
    finally { setBusy(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    if (newPassword.length < 12) { setBusy(false); setError('Use a password with at least 12 characters.'); return; }
    if (newPassword !== confirmPassword) { setBusy(false); setError('The new passwords do not match.'); return; }
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (result.error) throw new Error(result.error.message ?? 'Could not change the password.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNotice('Password changed. Other active sessions were revoked.');
    } catch (exception) { setError(exception?.response ? getApiErrorMessage(exception) : exception.message); }
    finally { setBusy(false); }
  };

  if (!profile && !error) return <main className="workspace-page"><div className="panel-state">Loading your account…</div></main>;
  if (!profile) return <main className="workspace-page"><div className="state-notice state-error" role="alert">{error} <Link to="/login">Sign in</Link></div></main>;

  return <main className="workspace-page profile-page">
    <div className="page-kicker">BUILD RULE GUJARAT <span>/</span> ACCOUNT</div>
    <div className="page-title-row"><div><h1>Account settings</h1><p>Update your profile details and Neon Auth password.</p></div><span className="source-status-tag"><UserRound size={14} /> {profile.role}</span></div>
    {error && <div className="state-notice state-error" role="alert"><CircleAlert size={16} /> {error}</div>}
    {notice && <div className="state-notice state-success" role="status">{notice}</div>}
    <div className="profile-settings-grid">
      <form className="form-panel" onSubmit={saveProfile}>
        <div className="panel-label">PROFILE</div>
        <label>Full name<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Email address<input value={profile.email} readOnly aria-readonly="true" /><small>Email changes are managed by Neon Auth and are not enabled for this project.</small></label>
        <button className="button button-primary form-submit" disabled={busy}>Save profile <ArrowRight size={15} /></button>
      </form>
      <form className="form-panel" onSubmit={changePassword}>
        <div className="panel-label"><KeyRound size={14} /> PASSWORD</div>
        <label>Current password<input type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label>New password<input type="password" required minLength={12} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><small>Use at least 12 characters. Other sessions will be signed out.</small></label>
        <label>Confirm new password<input type="password" required minLength={12} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        <button className="button button-outline form-submit" disabled={busy}>Change password <ArrowRight size={15} /></button>
      </form>
    </div>
  </main>;
}
