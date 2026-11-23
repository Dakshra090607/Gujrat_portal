import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Database,
  FileCheck2,
  FileStack,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../lib/api.js';
import { authClient } from '../../lib/auth.js';
import CalculatorTablesPanel from './CalculatorTablesPanel.jsx';
import CalculatorAuthoritiesPanel from './CalculatorAuthoritiesPanel.jsx';
import CalculatorZonesPanel from './CalculatorZonesPanel.jsx';
import CalculatorUseCodesPanel from './CalculatorUseCodesPanel.jsx';
import CalculatorRoadWidthPanel from './CalculatorRoadWidthPanel.jsx';
import CalculatorFsiSchedulesPanel from './CalculatorFsiSchedulesPanel.jsx';
import CalculatorBuildingHeightPanel from './CalculatorBuildingHeightPanel.jsx';
import './admin.css';

const workflow = [
  ['01', 'Open the source page', 'Compare each extraction candidate with the original PDF page.'],
  ['02', 'Record a typed draft', 'Preserve numbering, wording, source location, and applicability.'],
  ['03', 'Approve with provenance', 'Approval records reviewer identity and an immutable audit event.'],
];

function count(value) {
  return Number(value ?? 0).toLocaleString('en-IN');
}

export default function AdminDashboard() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [usersError, setUsersError] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [userFilters, setUserFilters] = useState({ q: '', role: '', status: 'ALL' });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userActionId, setUserActionId] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/auth/me').then((response) => {
      if (!active) return;
      const currentUser = response.data.data.user;
      if (currentUser.role !== 'ADMIN') {
        setAuthState('denied');
        return;
      }
      setUser(currentUser);
      setAuthState('ready');
    }).catch((error) => {
      if (!active) return;
      setLoginError(error.response?.status === 401 ? '' : getApiErrorMessage(error));
      setAuthState(error.response?.status === 401 ? 'login' : 'unavailable');
    });
    return () => { active = false; };
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewError('');
    setRefreshing(true);
    try {
      const response = await api.get('/admin/overview');
      setOverview(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
        setAuthState('login');
        setLoginError('Your session expired. Sign in again to continue.');
      } else setOverviewError(getApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersError('');
    setUsersLoading(true);
    try {
      const response = await api.get('/admin/users', { params: { page: usersPage, pageSize: 100, ...userFilters } });
      setUsers(response.data.data);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      setUsersError(getApiErrorMessage(error));
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, userFilters]);

  useEffect(() => {
    if (authState === 'ready') loadOverview();
  }, [authState, loadOverview]);

  useEffect(() => {
    if (authState === 'ready') loadUsers();
  }, [authState, loadUsers]);

  const updateUserRole = async (target, role) => {
    const note = window.prompt(`Add an audit note for changing ${target.name}'s role to ${role}:`);
    if (note === null) return;
    setUserActionId(target.id);
    setUsersError('');
    try {
      await api.patch(`/admin/users/${target.id}/role`, { role, note });
      await loadUsers();
    } catch (error) {
      setUsersError(getApiErrorMessage(error));
    } finally {
      setUserActionId(null);
    }
  };

  const updateUserStatus = async (target) => {
    const isActive = !target.isActive;
    const note = window.prompt(`Add an audit note for ${isActive ? 'enabling' : 'disabling'} ${target.name}:`);
    if (note === null) return;
    setUserActionId(target.id);
    setUsersError('');
    try {
      await api.patch(`/admin/users/${target.id}/status`, { isActive, note });
      await loadUsers();
    } catch (error) {
      setUsersError(getApiErrorMessage(error));
    } finally {
      setUserActionId(null);
    }
  };

  const removeUserAccess = async (target) => {
    const confirmed = window.confirm(`Remove sign-in access for ${target.name} (${target.email})? Their profile and audit history will be retained.`);
    if (!confirmed) return;
    const note = window.prompt(`Add an audit note for removing ${target.name}'s access:`);
    if (note === null) return;
    setUserActionId(target.id);
    setUsersError('');
    try {
      await api.patch(`/admin/users/${target.id}/status`, { isActive: false, note });
      await loadUsers();
      await loadOverview();
    } catch (error) {
      setUsersError(getApiErrorMessage(error));
    } finally {
      setUserActionId(null);
    }
  };

  const searchUsers = (event) => {
    event.preventDefault();
    setUsersPage(1);
    setUserFilters({ q: userSearch.trim(), role: userRoleFilter, status: userStatusFilter });
  };

  const logout = async () => {
    try { await authClient?.signOut(); } catch { /* Clear local state even if Neon Auth is unavailable. */ }
    setUser(null);
    setOverview(null);
    setAuthState('login');
  };

  if (authState === 'loading') {
    return <main className="workspace-page admin-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> ADMIN CONSOLE</div><div className="admin-auth-state"><RefreshCw size={18} className="admin-spin" /> Checking administrator session…</div></main>;
  }

  if (authState === 'unavailable') {
    return <main className="workspace-page admin-page">
      <div className="page-kicker">BUILD RULE GUJARAT <span>/</span> ADMIN CONSOLE</div>
      <div className="admin-auth-message" role="alert"><CircleAlert size={20} /><div><strong>Admin sign-in is unavailable</strong><p>{loginError}</p><button className="button button-outline" onClick={() => window.location.reload()}>Try again <RefreshCw size={14} /></button></div></div>
    </main>;
  }

  if (authState === 'denied') {
    return <main className="workspace-page admin-page">
      <div className="page-kicker">BUILD RULE GUJARAT <span>/</span> ADMIN CONSOLE</div>
      <div className="admin-auth-message" role="alert"><LockKeyhole size={20} /><div><strong>Administrator access is required</strong><p>Use the standard BuildRule sign-in. Reviewer accounts can access the review workbench.</p><Link className="button button-primary" to="/admin/review">Open review workbench <ArrowRight size={14} /></Link></div></div>
    </main>;
  }

  if (authState === 'login') {
    return <main className="workspace-page admin-page">
      <div className="page-kicker">BUILD RULE GUJARAT <span>/</span> ADMIN CONSOLE</div>
      <div className="admin-auth-message"><LockKeyhole size={20} /><div><strong>Sign in through the standard account page</strong><p>Administrator access is checked by the API after Neon Auth verifies your session.</p><Link className="button button-primary" to="/login">Open sign in <ArrowRight size={14} /></Link></div></div>
    </main>;
  }

  return <AdminOverview
    overview={overview}
    overviewError={overviewError}
    refreshing={refreshing}
    user={user}
    users={users}
    usersPagination={usersPagination}
    usersError={usersError}
    usersLoading={usersLoading}
    usersPage={usersPage}
    userSearch={userSearch}
    userRoleFilter={userRoleFilter}
    userStatusFilter={userStatusFilter}
    userActionId={userActionId}
    onUserSearch={searchUsers}
    onUserSearchChange={setUserSearch}
    onUserRoleFilterChange={setUserRoleFilter}
    onUsersPageChange={setUsersPage}
    onUserRoleChange={updateUserRole}
    onUserStatusChange={updateUserStatus}
    onUserStatusFilterChange={setUserStatusFilter}
    onUserRemove={removeUserAccess}
    onRefresh={loadOverview}
    onLogout={logout}
  />;
}

function AdminOverview({ overview, overviewError, refreshing, user, users, usersPagination, usersError, usersLoading, usersPage, userSearch, userRoleFilter, userStatusFilter, userActionId, onUserSearch, onUserSearchChange, onUserRoleFilterChange, onUserStatusFilterChange, onUsersPageChange, onUserRoleChange, onUserStatusChange, onUserRemove, onRefresh, onLogout }) {
  const source = overview?.source;
  const review = overview?.review;
  const verified = overview?.verified;
  const statuses = review?.workflow ?? {};
  const statusCards = [
    {
      label: 'SOURCE MATERIAL',
      value: `${count(source?.documentCount)} documents`,
      detail: `${count(source?.pageCount)} PDF pages; ${count(source?.extractedPageCount)} pages contain extracted text.`,
      state: 'PostgreSQL', tone: 'ready', icon: FileStack,
    },
    {
      label: 'REVIEW QUEUE',
      value: review?.backfillRequired ? 'Backfill required' : `${count(review?.pendingCount)} pending`,
      detail: review?.backfillRequired
        ? `${count(source?.candidateCount)} source candidates are ready to be queued.`
        : `${count(statuses.QUEUED)} queued · ${count(statuses.IN_REVIEW)} in review · ${count(statuses.RETURNED_FOR_CORRECTION)} returned.`,
      state: review?.backfillRequired ? 'Setup step' : `${count(review?.totalCount)} total`,
      tone: review?.backfillRequired ? 'attention' : 'ready', icon: Database,
    },
    {
      label: 'VERIFIED HIERARCHY',
      value: `${count(verified?.recordCount)} records`,
      detail: verified?.recordCount ? 'Approved canonical records with source and reviewer provenance.' : 'No verified regulatory records are available yet.',
      state: verified?.recordCount ? 'Approved' : 'Awaiting review',
      tone: verified?.recordCount ? 'ready' : 'pending', icon: BookOpenCheck,
    },
    {
      label: 'VERIFIED PARAMETERS',
      value: `${count(verified?.parameterCount)} parameters`,
      detail: 'Calculation responses still check matching conditions for each project.',
      state: verified?.parameterCount ? 'Source reviewed' : 'Calculations gated',
      tone: verified?.parameterCount ? 'ready' : 'locked', icon: LockKeyhole,
    },
  ];

  return (
    <main className="workspace-page admin-page">
      <div className="page-kicker">BUILD RULE GUJARAT <span>/</span> ADMIN CONSOLE</div>
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <div className="admin-eyebrow"><ShieldCheck size={14} /> REGULATORY CONTROL CENTER</div>
          <h1>Make every verified rule traceable.</h1>
          <p>Review extracted candidates against source PDFs, preserve their structure, and approve records with a complete audit trail.</p>
          <div className="admin-hero-actions">
            <Link className="button button-primary" to="/admin/review">Open review workbench <ArrowRight size={16} /></Link>
            <span><LockKeyhole size={13} /> Administrator session active</span>
          </div>
        </div>
        <div className="admin-hero-visual" aria-hidden="true">
          <div className="admin-orbit admin-orbit-one" />
          <div className="admin-orbit admin-orbit-two" />
          <div className="admin-doc-card">
            <div className="admin-doc-top"><span>CGDCR · 2017</span><FileTextIcon /></div>
            <div className="admin-doc-line admin-doc-line-long" />
            <div className="admin-doc-line" />
            <div className="admin-doc-line admin-doc-line-short" />
            <div className="admin-doc-stamp"><BadgeCheck size={14} /> SOURCE LINKED</div>
          </div>
          <div className="admin-hero-check"><CheckCircle2 size={16} /><span>Audit trail ready</span></div>
        </div>
      </section>

      <div className="admin-data-toolbar">
        <div><span className="admin-section-label">DATABASE OVERVIEW</span><h2>Regulatory data status</h2><small>Signed in as {user.name} · {user.email}</small></div>
        <div className="admin-toolbar-actions"><button className="admin-toolbar-button" onClick={onRefresh} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'admin-spin' : ''} /> Refresh</button><button className="admin-toolbar-button admin-signout" onClick={onLogout}><LogOut size={14} /> Sign out</button></div>
      </div>

      {overviewError && <div className="admin-login-error admin-overview-error" role="alert"><CircleAlert size={15} />{overviewError}</div>}
      {!overview && refreshing ? <div className="admin-auth-state"><RefreshCw size={18} className="admin-spin" /> Loading counts from PostgreSQL…</div> : !overview ? <div className="admin-auth-message" role="alert"><CircleAlert size={20} /><div><strong>Could not load database overview</strong><p>{overviewError || 'The database overview is unavailable.'}</p><button className="button button-outline" onClick={onRefresh} disabled={refreshing}>Retry <RefreshCw size={14} /></button></div></div> : <>
        <section className="admin-status-grid" aria-label="Regulatory data status">
          {statusCards.map(({ label, value, detail, state, tone, icon: Icon }) => (
            <article className="admin-status-card" key={label}>
              <div className={`admin-status-icon admin-tone-${tone}`}><Icon size={18} /></div>
              <span className="admin-status-label">{label}</span>
              <strong>{value}</strong>
              <p>{detail}</p>
              <span className={`admin-state admin-state-${tone}`}><i />{state}</span>
            </article>
          ))}
        </section>

        <section className="admin-lower-grid">
          <article className="admin-panel admin-workflow-panel">
            <div className="admin-panel-heading">
              <div><span className="admin-section-label">REVIEW WORKFLOW</span><h2>From extracted text to trusted data</h2></div>
              <span className="admin-panel-icon"><FileCheck2 size={18} /></span>
            </div>
            <div className="admin-workflow-list">
              {workflow.map(([number, title, description], index) => (
                <div className="admin-workflow-step" key={number}>
                  <span className="admin-step-number">{number}</span>
                  <div><strong>{title}</strong><p>{description}</p></div>
                  {index < workflow.length - 1 && <span className="admin-step-connector" />}
                </div>
              ))}
            </div>
            <Link className="admin-panel-link" to="/admin/review">Go to regulatory review <ArrowRight size={15} /></Link>
          </article>

          <aside className="admin-panel admin-safeguard-panel">
            <div className="admin-panel-heading">
              <div><span className="admin-section-label">PROMOTION SAFEGUARDS</span><h2>Approval has evidence requirements</h2></div>
              <span className="admin-panel-icon admin-panel-icon-teal"><ShieldCheck size={18} /></span>
            </div>
            <p className="admin-safeguard-intro">A reviewer cannot promote a candidate by changing its status alone.</p>
            <ul className="admin-safeguard-list">
              <li><CheckCircle2 size={15} /><span>Valid source document and page locator</span></li>
              <li><CheckCircle2 size={15} /><span>Original wording or a typed parameter</span></li>
              <li><CheckCircle2 size={15} /><span>Applicability conditions and units where required</span></li>
              <li><CheckCircle2 size={15} /><span>Reviewer identity and append-only audit record</span></li>
            </ul>
          </aside>
        </section>

        <CalculatorZonesPanel />
        <CalculatorUseCodesPanel />
        <CalculatorRoadWidthPanel />
        <CalculatorFsiSchedulesPanel />
        <CalculatorBuildingHeightPanel />
        <CalculatorFsiSchedulesPanel mode="margins" />
        <CalculatorAuthoritiesPanel />
        <CalculatorTablesPanel />

        <section className="admin-users-panel">
          <div className="admin-users-heading"><div><span className="admin-section-label">ACCOUNT ADMINISTRATION</span><h2>Users and access</h2><p>{count(usersPagination?.total)} accounts · manage roles, sign-in access, and account removal.</p></div><span className="admin-panel-icon"><LockKeyhole size={18} /></span></div>
          <form className="admin-user-filters" onSubmit={onUserSearch}>
            <label>Search users<input value={userSearch} onChange={(event) => onUserSearchChange(event.target.value)} placeholder="Name or email" maxLength={120} /></label>
            <label>Role<select value={userRoleFilter} onChange={(event) => onUserRoleFilterChange(event.target.value)}><option value="">All roles</option><option value="GENERAL_USER">General user</option><option value="PROFESSIONAL_USER">Professional user</option><option value="REVIEWER">Reviewer</option><option value="ADMIN">Administrator</option></select></label>
            <label>Access<select value={userStatusFilter} onChange={(event) => onUserStatusFilterChange(event.target.value)}><option value="ALL">All accounts</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></select></label>
            <button className="admin-toolbar-button" type="submit"><RefreshCw size={14} /> Apply filters</button>
          </form>
          {usersError && <div className="admin-login-error" role="alert"><CircleAlert size={15} />{usersError}</div>}
          <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Last sign in</th><th>Actions</th></tr></thead><tbody>
            {!usersLoading && users.map((account) => <tr key={account.id}>
              <td><strong>{account.name}</strong><span>{account.email}</span></td>
              <td><select aria-label={`Role for ${account.name}`} value={account.role} disabled={userActionId === account.id} onChange={(event) => onUserRoleChange(account, event.target.value)}><option value="GENERAL_USER">General user</option><option value="PROFESSIONAL_USER">Professional user</option><option value="REVIEWER">Reviewer</option><option value="ADMIN">Administrator</option></select></td>
              <td><span className={`admin-user-status ${account.isActive ? 'active' : 'inactive'}`}>{account.isActive ? 'Active' : 'Disabled'}</span></td>
              <td>{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : '—'}</td>
              <td>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleDateString() : 'Never'}</td>
              <td className="admin-user-actions"><button className="admin-user-action" disabled={userActionId === account.id} onClick={() => onUserStatusChange(account)}>{account.isActive ? 'Disable' : 'Enable'}</button>{account.isActive && account.id !== user.id && <button className="admin-user-action admin-user-remove" disabled={userActionId === account.id} onClick={() => onUserRemove(account)}><UserRoundX size={12} /> Remove access</button>}</td>
            </tr>)}
            {usersLoading && <tr><td colSpan="6" className="admin-users-empty">Loading accounts…</td></tr>}
            {!usersLoading && !users.length && <tr><td colSpan="6" className="admin-users-empty">No accounts match these filters.</td></tr>}
          </tbody></table></div>
          {usersPagination && <div className="admin-users-pagination"><span>Showing {users.length ? (usersPage - 1) * usersPagination.pageSize + 1 : 0}–{Math.min(usersPage * usersPagination.pageSize, usersPagination.total)} of {count(usersPagination.total)} accounts · page {usersPage} of {Math.max(1, usersPagination.pages)}</span><div><button className="reader-button" disabled={usersLoading || usersPage <= 1} onClick={() => onUsersPageChange(usersPage - 1)}>Previous</button><button className="reader-button" disabled={usersLoading || usersPage >= usersPagination.pages} onClick={() => onUsersPageChange(usersPage + 1)}>Next</button></div></div>}
        </section>

        <section className="admin-setup-note">
          <div className="admin-setup-icon"><Database size={17} /></div>
          <div><strong>{review?.backfillRequired ? 'Review queue setup required' : 'Database connected'}</strong><p>{review?.backfillRequired ? 'Create review cases from the extracted candidates using the server command below.' : 'These counts come from the active application database and refresh when requested.'}</p></div>
          {review?.backfillRequired && <div className="admin-setup-commands"><code>npm run review:backfill</code></div>}
        </section>
      </>}
    </main>
  );
}

function FileTextIcon() {
  return <span className="admin-file-glyph"><FileStack size={15} /></span>;
}
