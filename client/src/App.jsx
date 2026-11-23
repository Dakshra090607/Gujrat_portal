import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, getApiErrorMessage, setAccessToken } from './lib/api.js';
import ReviewWorkbench from './features/review/ReviewWorkbench.jsx';
import AdminDashboard from './features/admin/AdminDashboard.jsx';
import AuthPage from './features/auth/AuthPage.jsx';
import ProfilePage from './features/auth/ProfilePage.jsx';
import { authClient } from './lib/auth.js';
import buildingHeightSource from '../../data/table-6-23-building-height.json';
import zoneTableFallback from '../../data/table-6-2.json';
import {
  ArrowDownRight, ArrowRight, BookOpen, Building2, Calculator, CheckCircle2, LogOut,
  ChevronDown, CircleHelp, Compass, FileCheck2, FileText, Layers3, Menu,
  Search, ShieldCheck, Sparkles, X,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', to: '/app', icon: Compass },
  { label: 'Regulation explorer', to: '/regulations', icon: BookOpen },
  { label: 'Search regulations', to: '/search', icon: Search },
  { label: 'Calculator', to: '/fsi-calculator', icon: Calculator },
  { label: 'Compliance checker', to: '/compliance', icon: FileCheck2 },
  { label: 'Permission guide', to: '/permission-guide', icon: Layers3 },
  { label: 'Admin console', to: '/admin', icon: ShieldCheck },
];

function Brand({ light = false }) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><Building2 size={18} /></span><span>BuildRule<span className="brand-gujarat"> Gujarat</span></span></Link>;
}

function Landing() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/auth/me').then((response) => {
      if (active) setAccount(response.data.data.user);
    }).catch(() => {
      if (active) setAccount(null);
    });
    return () => { active = false; };
  }, []);

  return <div className="landing">
    <header className="site-header wrap">
      <Brand />
      <nav className="landing-nav"><a href="#platform">Platform</a><a href="#coverage">Regulatory coverage</a><Link to="/search">Search</Link></nav>
      <div className="header-actions">
        {account ? (
          <Link className="button button-primary button-small" to="/app">
            <Compass size={16} /> <span>Dashboard</span> <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            <Link className="signin-cta" to="/login">Sign in</Link>
            <Link className="button button-dark button-small" to="/register">Create account <ArrowRight size={15} /></Link>
          </>
        )}
      </div>
    </header>
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> CGDCR-2017 · GUJARAT</div>
          <h1>Understand building regulations.<br /><span>Evaluate development possibilities.</span></h1>
          <p className="hero-lede">A clear, source-linked workspace for exploring Gujarat’s development regulations and checking preliminary project parameters.</p>
          <div className="hero-actions">
            {account ? (
              <Link className="button button-primary" to="/app">
                <Compass size={16} /> Go to dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <Link className="button button-primary" to="/regulations">
                Explore regulations <ArrowRight size={16} />
              </Link>
            )}
            <Link className="button button-outline" to="/fsi-calculator">Check development potential <ArrowDownRight size={16} /></Link>
          </div>
          <div className="hero-proof"><ShieldCheck size={17} /><span>Source traceability built in</span><span className="proof-divider" /><span>Preliminary assistance</span><span className="proof-divider" /><span>Gujarat focused</span></div>
        </div>
        <div className="hero-visual" aria-label="Abstract building plan illustration">
          <div className="plan-topline"><span>DEVELOPMENT PARAMETERS</span><span className="live-tag"><i /> SOURCE LINKED</span></div>
          <div className="plan-grid"><div className="plan-block block-a"><span>01</span><b>LAND USE</b><small>Planning regulations</small></div><div className="plan-block block-b"><span>02</span><b>BUILDING FORM</b><small>Margins · Height · FSI</small></div><div className="plan-block block-c"><span>03</span><b>PERFORMANCE</b><small>Safety · Services</small></div><div className="plan-line line-one" /><div className="plan-line line-two" /><div className="plan-cross">+</div><div className="plan-scale"><span /><span /><span /><span /><span /></div></div>
          <div className="plan-footer"><span>CGDCR / 2017</span><span>REGULATORY REFERENCE SYSTEM</span></div>
        </div>
      </section>
      <section className="trust-strip"><div className="wrap trust-inner"><span>BUILT AROUND THREE SOURCE PARTS</span><b>Procedure</b><i /><b>Planning</b><i /><b>Performance</b><small>As modified up to October 2019, as indicated in supplied source PDFs</small></div></section>
      <section id="platform" className="section wrap">
        <div className="section-heading"><div><div className="eyebrow muted-eyebrow">ONE WORKSPACE · TWO MODULES</div><h2>From source text to project clarity.</h2></div><p>Explore the regulation source, then assess a project with transparent rule references and clear data limitations.</p></div>
        <div className="module-grid">
          <Link to="/regulations" className="module-card"><div className="module-icon icon-blue"><BookOpen size={21} /></div><span className="module-index">MODULE 01</span><h3>CGDCR information portal</h3><p>Browse the supplied parts, search extracted text, and follow each result back to its PDF page.</p><span className="module-link">Explore the source portal <ArrowRight size={16} /></span><div className="module-card-foot"><span>3 PARTS</span><span>PAGE-LEVEL REFERENCES</span></div></Link>
          <Link to="/compliance" className="module-card module-card-teal"><div className="module-icon icon-teal"><CheckCircle2 size={21} /></div><span className="module-index">MODULE 02</span><h3>Building compliance platform</h3><p>Check development inputs with deterministic rules, cited sources, and explicit unresolved states.</p><span className="module-link">Open compliance tools <ArrowRight size={16} /></span><div className="module-card-foot"><span>FSI CALCULATOR</span><span>PRELIMINARY CHECKS</span></div></Link>
        </div>
      </section>
      <section id="coverage" className="coverage-band"><div className="wrap coverage-inner"><div><div className="eyebrow">SOURCE COVERAGE</div><h2>One Gujarat framework.<br />Three connected parts.</h2><p>Original text and extracted structure stay connected to their source document and page. Unreviewed content is clearly labelled.</p></div><div className="coverage-list"><div><span className="part-no">I</span><div><b>Procedure Regulations</b><small>Applications, permissions and procedure</small></div><span className="coverage-state">SOURCE LOADED</span></div><div><span className="part-no">II</span><div><b>Planning Regulations</b><small>Land use and development controls</small></div><span className="coverage-state">SOURCE LOADED</span></div><div><span className="part-no">III</span><div><b>Performance Regulation</b><small>Building performance provisions</small></div><span className="coverage-state">SOURCE LOADED</span></div></div></div></section>
      <section className="disclaimer wrap"><ShieldCheck size={20} /><div><b>Preliminary information, not an approval.</b><p>BuildRule Gujarat provides regulatory information and preliminary, source-based assistance. It does not provide statutory permission, certified compliance, architectural or structural verification, or legal advice.</p></div><Link to="/app">Read about the platform <ArrowRight size={15} /></Link></section>
    </main>
    <footer className="site-footer"><div className="wrap footer-inner"><Brand light /><span>CGDCR-2017 regulatory information and preliminary compliance assistance.</span><span>© BuildRule Gujarat</span></div></footer>
  </div>;
}

function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const isAdminArea = useLocation().pathname.startsWith('/admin');
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    let active = true;
    if (isAdminArea) { setAccount(null); return () => { active = false; }; }
    api.get('/auth/me').then((response) => {
      if (active) setAccount(response.data.data.user);
    }).catch((error) => {
      if (!active) return;
      if (error.response?.status === 401) setAccessToken(null);
      setAccount(null);
    });
    return () => { active = false; };
  }, [isAdminArea]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setIsMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const signOut = async () => {
    try { await authClient?.signOut(); } catch { /* Clear local request state even if the auth service is unavailable. */ }
    setAccessToken(null);
    setAccount(null);
    navigate('/login', { replace: true });
  };
  return <div className="app-frame">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-hidden={isMobile && !open} inert={isMobile && !open}><div className="sidebar-head"><Brand light /><button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button></div><div className="workspace-label">WORKSPACE <ChevronDown size={13} /></div><div className="jurisdiction"><span className="jurisdiction-icon">GJ</span><span><b>Gujarat</b><small>CGDCR · 2017</small></span><span className="verified-dot" /></div><div className="nav-caption">REGULATORY WORKSPACE</div><nav className="side-nav">{navItems.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}><Icon size={17} /><span>{label}</span>{to === '/regulations' && <span className="nav-count">3</span>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="sidebar-source"><span><FileText size={16} /></span><div><b>Source documents</b><small>3 PDFs · 292 pages</small></div><CheckCircle2 size={14} /></div><div className="profile"><div className="profile-avatar">{isAdminArea ? 'A' : account?.name?.slice(0, 1).toUpperCase() ?? 'G'}</div><div><b>{isAdminArea ? 'Admin console' : account?.name ?? 'Guest workspace'}</b><small>{isAdminArea ? 'Role protected' : account?.role ?? 'Local preview'}</small></div><CircleHelp size={17} /></div></div></aside>
    <div className="app-main"><header className="app-topbar"><button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="topbar-crumb"><span>Gujarat</span><span className="crumb-slash">/</span><b>{isAdminArea ? 'Admin console' : 'Workspace'}</b></div><div className="topbar-right"><span className="status-pill"><i /> SOURCE TEXT EXTRACTED</span><Link className="help-button" to="/#coverage"><CircleHelp size={17} /><span>Help</span></Link>{account && !isAdminArea ? <div className="topbar-account"><Link to="/profile">{account.name}</Link><button className="topbar-signout" onClick={signOut}><LogOut size={14} /><span>Sign out</span></button></div> : !isAdminArea ? <div className="topbar-auth-links"><Link to="/login">Sign in</Link><Link className="topbar-register" to="/register">Register</Link></div> : <div className="top-avatar">A</div>}</div></header>{children}</div>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
  </div>;
}

function EmptyWorkspace({ title, description, icon: Icon = Sparkles, eyebrow = 'WORKSPACE READY' }) {
  return <div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> {eyebrow}</div><div className="empty-hero"><div className="empty-icon"><Icon size={23} /></div><h1>{title}</h1><p>{description}</p><div className="progress-note"><span className="progress-mark"><CheckCircle2 size={16} /></span><span><b>Source documents loaded</b><small>292 of 292 pages have selectable text. Extracted material is still awaiting regulatory review.</small></span></div><div className="empty-actions"><Link className="button button-primary" to="/search">Search extracted text <ArrowRight size={16} /></Link><Link className="button button-outline" to="/regulations">Open source explorer</Link></div></div><div className="source-cards"><div><span className="source-part">PART I</span><b>Procedure Regulations</b><small>166 pages · extracted, not verified</small></div><div><span className="source-part">PART II</span><b>Planning Regulations</b><small>76 pages · extracted, not verified</small></div><div><span className="source-part">PART III</span><b>Performance Regulation</b><small>50 pages · extracted, not verified</small></div></div></div>;
}

function Dashboard() { return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> OVERVIEW</div><div className="dashboard-title"><div><h1>Good afternoon.</h1><p>Your Gujarat regulatory workspace is ready to explore.</p></div><span className="date-chip">CGDCR · 2017</span></div><div className="dash-banner"><div><div className="eyebrow">REGULATORY DATA STATUS</div><h2>Source text extracted. Review is in progress.</h2><p>All three supplied documents are available. Configured CGDCR values provide preliminary FSI estimates; unsupported cases and compliance findings remain unresolved pending review.</p><Link to="/regulations" className="banner-link">View extraction status <ArrowRight size={15} /></Link></div><div className="banner-stat"><b>292</b><span>PDF pages</span><small>across 3 source documents</small></div></div><div className="quick-grid">{navItems.slice(1).map(({label,to,icon:Icon},i)=><Link key={to} to={to} className="quick-card"><span className={`quick-icon quick-${i}`}><Icon size={19}/></span><span className="quick-overline">{['SOURCE PORTAL','REGULATORY SEARCH','DEVELOPMENT TOOL','PRELIMINARY CHECK','PROCEDURE','ADMINISTRATION'][i]}</span><b>{label}</b><small>{['Explore parts and extracted pages','Search page-linked source text','Preliminary FSI estimates','Checks require reviewed rules','Source-linked stages pending review','Review candidates and verify source-backed records'][i]}</small><ArrowRight size={16} className="quick-arrow"/></Link>)}</div><div className="dashboard-bottom"><div className="panel-card"><div className="panel-head"><div><span className="panel-label">RECENT ACTIVITY</span><h3>Pick up where you left off</h3></div><span className="soft-badge">LOCAL WORKSPACE</span></div><div className="activity-empty"><div className="activity-icon"><BookOpen size={18}/></div><div><b>Your activity will appear here</b><p>Browse source pages or start a project to build your workspace history.</p></div></div></div><div className="panel-card integrity-card"><span className="panel-label">DATA INTEGRITY</span><h3>Trace every provision.</h3><p>Original source, page reference, and review status stay visible as regulatory records are prepared.</p><div className="integrity-row"><ShieldCheck size={16}/><span>Unsupported FSI cases remain unresolved</span></div></div></div></div></AppShell>; }

function PlaceholderPage({ title, description, icon }) { return <AppShell><EmptyWorkspace title={title} description={description} icon={icon} /></AppShell>; }

function StateNotice({ children, tone = 'info' }) { return <div className={`state-notice state-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>; }

function useSourceCatalog() {
  const [state, setState] = useState({ loading: true, documents: [], parts: [], error: '' });
  useEffect(() => {
    let active = true;
    Promise.all([api.get('/documents'), api.get('/parts')])
      .then(([documents, parts]) => active && setState({ loading: false, documents: documents.data.data, parts: parts.data.data, error: '' }))
      .catch((error) => active && setState({ loading: false, documents: [], parts: [], error: getApiErrorMessage(error) }));
    return () => { active = false; };
  }, []);
  return state;
}

function SourcePageReader({ document, pageNumber, onPageChange }) {
  const [state, setState] = useState({ loading: true, page: null, error: '' });
  useEffect(() => {
    let active = true;
    setState({ loading: true, page: null, error: '' });
    api.get(`/documents/${document._id}/pages`, { params: { page: pageNumber } })
      .then((response) => active && setState({ loading: false, page: response.data.data.page, error: '' }))
      .catch((error) => active && setState({ loading: false, page: null, error: getApiErrorMessage(error) }));
    return () => { active = false; };
  }, [document._id, pageNumber]);
  return <section className="page-reader">
    <div className="reader-head"><div><span className="panel-label">SOURCE PAGE</span><h2>{document.part} · {document.partTitle}</h2><small>{document.filename}</small></div><a className="pdf-link" href={`${api.defaults.baseURL}/documents/${document._id}/pdf#page=${pageNumber}`} target="_blank" rel="noreferrer"><FileText size={15}/> Open original PDF</a></div>
    <div className="reader-controls"><button className="reader-button" disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)}>Previous</button><label>PDF page <input type="number" min="1" max={document.pageCount} value={pageNumber} onChange={(event) => { const value = Number(event.target.value); if (value >= 1 && value <= document.pageCount) onPageChange(value); }} /> of {document.pageCount}</label><button className="reader-button" disabled={pageNumber >= document.pageCount} onClick={() => onPageChange(pageNumber + 1)}>Next</button></div>
    {state.loading ? <div className="panel-state">Loading extracted page text…</div> : state.error ? <StateNotice tone="error">{state.error}</StateNotice> : <><div className="review-label"><span className="review-dot"/> EXTRACTED TEXT · NEEDS REGULATORY REVIEW</div><pre className="source-text">{state.page?.text || 'No selectable text was extracted from this page.'}</pre></>}
  </section>;
}

function RegulationExplorer() {
  const catalog = useSourceCatalog();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('document');
  const pageNumber = Math.max(1, Number(params.get('page') || 1));
  const selected = catalog.documents.find((doc) => doc._id === selectedId);
  const choose = (doc) => setParams({ document: doc._id, page: '1' });
  return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> SOURCE EXPLORER</div><div className="page-title-row"><div><h1>CGDCR source explorer</h1><p>Browse the supplied regulation parts and review extracted text against the original PDF.</p></div><span className="source-status-tag"><CheckCircle2 size={14}/> SOURCE TEXT EXTRACTED</span></div>
    {catalog.loading ? <div className="panel-state">Loading source document inventory…</div> : catalog.error ? <StateNotice tone="error">{catalog.error} Check the Neon connection and run the source import to open the page explorer.</StateNotice> : <>
      <div className="part-grid">{catalog.parts.map((part) => { const doc = catalog.documents.find((item) => item.part === part.part); return <button key={part.part} className={`part-card ${selected?.part === part.part ? 'part-card-active' : ''}`} disabled={!doc} onClick={() => doc && choose(doc)}><span className="part-index">{part.part.toUpperCase()}</span><b>{part.partTitle}</b><small>{doc ? `${doc.pageCount} PDF pages · ${part.chapterCount} reviewed chapters` : 'Source document not indexed'}</small><span className="review-pill">{doc?.extractionStatus ?? 'UNAVAILABLE'}</span></button>; })}</div>
      {selected ? <SourcePageReader key={selected._id} document={selected} pageNumber={pageNumber} onPageChange={(next) => setParams({ document: selected._id, page: String(next) })}/> : <div className="hierarchy-pending"><Layers3 size={18}/><div><b>Chapter and regulation hierarchy is awaiting source review.</b><p>Part and page counts come from the source PDFs. No chapter title or regulation number is shown as canonical until it is verified.</p></div></div>}
    </>}</div></AppShell>;
}

function HighlightedSnippet({ text, query }) {
  if (!query) return text;
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) return text;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>;
}

function RegulationSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [part, setPart] = useState('');
  const [state, setState] = useState({ loading: false, data: [], pagination: null, answer: '', notice: '', error: '' });
  const search = async (event, nextPage = 1) => {
    event?.preventDefault();
    if (!q.trim()) { setState({ loading: false, data: [], pagination: null, answer: '', notice: '', error: 'Enter a question, keyword, phrase, regulation number, or technical term.' }); return; }
    setState((current) => ({ ...current, loading: true, error: '', notice: '' }));
    try {
      const response = await api.post('/search/ask', { q: q.trim(), ...(part && { part }) }, { timeout: 120_000 });
      const sources = response.data.sources.map((source) => ({
        citationId: source.citationId,
        sourceDocument: { _id: source.sourceDocumentId, part: source.part, partTitle: source.part, filename: source.filename },
        pdfPageNumber: source.pdfPageNumber,
        verificationStatus: source.verificationStatus,
        similarity: source.similarity,
        snippet: source.content,
      }));
      setState({ loading: false, data: sources, pagination: null, answer: response.data.answer, notice: '', error: '' });
    } catch (ragError) {
      try {
        const response = await api.get('/search', { params: { q: q.trim(), ...(part && { part }), page: nextPage, pageSize: 10 } });
        setState({
          loading: false,
          data: response.data.data,
          pagination: response.data.pagination,
          answer: '',
          notice: `AI-assisted search is unavailable (${getApiErrorMessage(ragError)}). Showing exact keyword matches instead.`,
          error: '',
        });
      } catch (error) {
        setState({ loading: false, data: [], pagination: null, answer: '', notice: '', error: getApiErrorMessage(error) });
      }
    }
  };
  return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> REGULATION SEARCH</div><div className="page-title-row"><div><h1>Search the source text</h1><p>Ask a question or search for a clause. Answers use retrieved passages linked to their original PDF pages.</p></div></div>
    <form className="search-panel" onSubmit={search}><div className="search-input-wrap"><Search size={18}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="e.g. What setbacks apply near a road?" aria-label="Search the source text"/><button className="button button-primary" type="submit" disabled={state.loading}>{state.loading ? 'Searching…' : 'Search'}</button></div><div className="filter-row"><label>Part <select value={part} onChange={(event) => setPart(event.target.value)}><option value="">All parts</option><option>Part I</option><option>Part II</option><option>Part III</option></select></label><span>AI-assisted retrieval · PDF page citations · Source text needs review</span></div></form>
    {state.error && <StateNotice tone={state.error.includes('Enter') ? 'info' : 'error'}>{state.error}</StateNotice>}
    {state.notice && <StateNotice>{state.notice}</StateNotice>}
    {state.loading && <div className="panel-state">Searching extracted pages…</div>}
    {!state.loading && state.answer && <section className="rag-answer-card"><span className="panel-label">ANSWER FROM SOURCE PASSAGES</span><p>{state.answer}</p><small>Informational only. Retrieved passages are extracted material awaiting regulatory review; this is not an official interpretation.</small></section>}
    {!state.loading && (state.answer || state.pagination) && <><div className="search-results-head"><b>{state.answer ? `${state.data.length} cited source passage${state.data.length === 1 ? '' : 's'}` : `${state.pagination.total} source page${state.pagination.total === 1 ? '' : 's'} found`}</b><span>{state.answer ? 'Open the cited PDF page to verify the source' : 'Exact keyword matches'}</span></div>{state.data.length ? <div className="search-results">{state.data.map((result) => <article key={`${result.sourceDocument?._id}-${result.pdfPageNumber}-${result.citationId ?? ''}`} className="search-result"><div className="result-meta"><span>{result.citationId ? `[${result.citationId}] · ` : ''}{result.sourceDocument?.part} · {result.sourceDocument?.partTitle}</span><span className="review-pill">EXTRACTED · NEEDS REVIEW</span></div><button className="result-snippet" onClick={() => navigate(`/regulations?document=${result.sourceDocument?._id}&page=${result.pdfPageNumber}`)}><HighlightedSnippet text={result.snippet} query={state.answer ? '' : q.trim()}/></button><div className="result-footer"><span>{result.sourceDocument?.filename}</span><button onClick={() => navigate(`/regulations?document=${result.sourceDocument?._id}&page=${result.pdfPageNumber}`)}>PDF page {result.pdfPageNumber} <ArrowRight size={14}/></button></div></article>)}</div> : <div className="hierarchy-pending"><Search size={18}/><div><b>No relevant source passages found.</b><p>Try a different wording or clear the part filter.</p></div></div>}{state.pagination?.pages > 1 && <div className="pagination-row"><button className="reader-button" disabled={state.pagination.page <= 1} onClick={(event) => search(event, state.pagination.page - 1)}>Previous</button><span>Page {state.pagination.page} of {state.pagination.pages}</span><button className="reader-button" disabled={state.pagination.page >= state.pagination.pages} onClick={(event) => search(event, state.pagination.page + 1)}>Next</button></div>}</>}
  </div></AppShell>;
}

function AuthoritySearchSelect({ categories, categoryCode, value, query, onQueryChange, onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const options = categories
    .filter((category) => !categoryCode || category.code === categoryCode)
    .flatMap((category) => category.authorities.map((authorityRow) => ({
      authority: typeof authorityRow === 'string' ? authorityRow : authorityRow.name,
      authorityCode: typeof authorityRow === 'string' ? '' : authorityRow.authorityCode,
      authorityType: typeof authorityRow === 'string' ? '' : authorityRow.authorityType,
      categoryCode: category.code,
      categoryLabel: category.label,
    })))
    .filter(({ authority, authorityCode: code, authorityType, categoryCode: optionCode, categoryLabel }) =>
      !normalizedQuery || `${authority} ${code} ${authorityType} ${optionCode} ${categoryLabel}`.toLocaleLowerCase().includes(normalizedQuery)
    );
  const visibleOptions = options;

  return <div className="authority-search-select" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <input
      role="combobox"
      aria-label="Search development authority or ULB"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls="authority-options"
      autoComplete="off"
      required
      disabled={disabled}
      value={query}
      placeholder={categoryCode ? 'Search or select an authority / ULB' : 'Search or select any authority / ULB'}
      onFocus={() => setOpen(true)}
      onChange={(event) => { onQueryChange(event.target.value); setOpen(true); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
        if (event.key === 'ArrowDown' && open && visibleOptions.length) {
          event.preventDefault();
          document.querySelector('#authority-options button')?.focus();
        }
        if (event.key === 'Enter' && open) {
          event.preventDefault();
          if (visibleOptions.length === 1) {
            onSelect(visibleOptions[0]);
            setOpen(false);
          }
        }
      }}
    />
    {open && <div className="authority-options" id="authority-options" role="listbox" aria-label="Development authorities">
      {visibleOptions.length ? visibleOptions.map((option) => (
        <button
          className="authority-option"
          type="button"
          role="option"
          aria-selected={option.authority === value && option.categoryCode === categoryCode}
          key={`${option.categoryCode}-${option.authority}`}
          onClick={() => { onSelect(option); setOpen(false); }}
        >
          <span>{option.authority}</span>
          <small>{option.categoryCode} - {option.categoryLabel.slice(option.categoryCode.length).trim().replace(/^[-\u2013\u2014]\s*/, '')}</small>
        </button>
      )) : <div className="authority-no-results">No matching authority. Try a shorter search.</div>}
      {options.length > 0 && <div className="authority-result-count">{options.length} results. Type to narrow the list.</div>}
    </div>}
  </div>;
}

const DESIGNATED_ZONES = [
  { zone: 'Core Walled City', conceptualisedZone: 'Core Walled Area', code: 'CW', permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Walled City / Nucleus Vistar / Existing Nucleus Node / Gamtal / Gauthan', conceptualisedZone: 'Gamtal', code: 'GM', excludedAuthorities: ['JuUDA', 'BAUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Gamtal Area (Walled City of Junagadh)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['JuUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Gamtal (other than Walled City of Junagadh) / Gamtal Extension', conceptualisedZone: 'Gamtal Extension', code: 'GME', onlyAuthorities: ['JuUDA'], permissibleUse: 'Those permissible in CW and EDU2, AS4.' },
  { zone: 'Core Area Gamtal (BAUDA)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['BAUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Gamtal other than Bharuch and Ankleshwar (BAUDA)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['BAUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Residential Area A (Alang ADA)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['AlADA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Bhavanath (JuUDA)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['JuUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'City Area A (JADA, BADA, RUDA)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['JADA', 'BADA', 'RUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'City Area B (RUDA)', conceptualisedZone: 'Gamtal', code: 'GM', onlyAuthorities: ['RUDA'], permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, H1, H2, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Village Extension / Gamtal Extension / Natural Growth of Village / Buffer zone of Gamtal', conceptualisedZone: 'Gamtal Extension', code: 'GME', permissibleUse: 'Those permissible in CW and EDU2, AS4.' },
  { zone: 'Residential Zone / Mix Use (other than Thangadh) / Residential Zone 1 (other than GUDA)', conceptualisedZone: 'Residential 1', code: 'R1', excludedAuthorities: ['GUDA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'Residential Zones 2–5 (GUDA)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'Residential Zone IV (GUDA – Non-GMC)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'Residential Zone V (GUDA – Non-GMC)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'City Area B (JADA, BADA)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['JADA', 'BADA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'City Area C (JADA, BADA, RUDA)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['JADA', 'BADA', 'RUDA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'City Area E (BADA)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['BADA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'Residential Area B (Alang ADA)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['AlADA'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'N.A. Residential Zone (Kalavad ADA)', conceptualisedZone: 'Residential 1', code: 'R1', onlyAuthorities: ['Kalawad'], permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, EDU2, H3, HO, M3, SE.' },
  { zone: 'Residential Zone R2 (other than GUDA)', conceptualisedZone: 'Residential 2', code: 'R2', excludedAuthorities: ['GUDA'], permissibleUse: 'Those permissible in R1.' },
  { zone: 'Residential Zone III (VUDA)', conceptualisedZone: 'Residential 2', code: 'R2', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1.' },
  { zone: 'City Area F (BADA)', conceptualisedZone: 'Residential 2', code: 'R2', onlyAuthorities: ['BADA'], permissibleUse: 'Those permissible in R1.' },
  { zone: 'Residential Zone R3 (other than GUDA and VUDA)', conceptualisedZone: 'Residential 3', code: 'R3', excludedAuthorities: ['GUDA', 'VUDA'], permissibleUse: 'AS1, AS2, AS3, AS4, DW1, DW2, DW3 (only within 200 m on either side of TOZ), EDU1, EDU2, H1, H2, H3, HO, INST, M1, M2, M3, PI, PU, REG, REC, SE, SP&L, TEMP.' },
  { zone: 'Recreation Zone (GUDA) / REZ', conceptualisedZone: 'Residential 3', code: 'R3', onlyAuthorities: ['GUDA'], permissibleUse: 'AS1, AS2, AS3, AS4, DW1, DW2, DW3 (only within 200 m on either side of TOZ), EDU1, EDU2, H1, H2, H3, HO, INST, M1, M2, M3, PI, PU, REG, REC, SE, SP&L, TEMP.' },
  { zone: 'Residential Zone R1 (GUDA)', conceptualisedZone: 'Residential 4', code: 'R4', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in R1.' },
  { zone: 'Residential Renewal Zone (GUDA)', conceptualisedZone: 'Residential 5', code: 'R5', onlyAuthorities: ['GUDA'], permissibleUse: 'DW3, PU, PI.' },
  { zone: 'Residential Affordable Housing Zone 1 (AUDA)', conceptualisedZone: 'Residential Affordable Housing-1', code: 'RAH1', onlyAuthorities: ['AUDA'], permissibleUse: '• DW3, EDU1, EDU2, H1, H2, INST, PU, PI, and TEMP.\n• Maximum aggregated 10% of total utilised FSI for M1 / M2 / AS1 / SE.\n• In AUDA, DW1 and DW2 type building shall be permitted in RAH-1 zone for layout of small sub-plotting having NA permission and layout approved prior to Dt.13/02/2009.' },
  { zone: 'Residential Affordable Housing Zone (Overlay Zone)', conceptualisedZone: 'Residential Affordable Housing', code: 'RAH', permissibleUse: 'DW3, EDU1, EDU2, H1, H2, INST, PU, PI, TEMP; maximum aggregated 10% of total utilised FSI for M1 / M2 / AS1 / SE.' },
  { zone: 'Restricted Residential Zone / Restricted Area / Flood Prone Area / Hazard Prone Area / Defence Zone', conceptualisedZone: 'Restricted Zone', code: 'RZ', excludedAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1 subject to Restricted Zone regulations, plus H1 and H2.' },
  { zone: 'Restricted Residential Zone (VUDA)', conceptualisedZone: 'Restricted Zone', code: 'RZ', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1 subject to Restricted Zone regulations, plus H1 and H2.' },
  { zone: 'Restricted Area (VUDA)', conceptualisedZone: 'Restricted Zone', code: 'RZ', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1 subject to Restricted Zone regulations, plus H1 and H2.' },
  { zone: 'Restricted Zone RZ1–RZ2 (VUDA)', conceptualisedZone: 'Restricted Zone', code: 'RZ', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1 subject to Restricted Zone regulations, plus H1 and H2.' },
  { zone: 'Restricted Zone RZ3–RZ5 (VUDA)', conceptualisedZone: 'Restricted Zone', code: 'RZ', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1 subject to Restricted Zone regulations, plus H1 and H2.' },
  { zone: 'Residential Zone 2 (VUDA)', conceptualisedZone: 'Residential 2', code: 'R2', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1.' },
  { zone: 'Residential Zone 3 (VUDA)', conceptualisedZone: 'Residential 3', code: 'R3', onlyAuthorities: ['VUDA'], permissibleUse: 'Those permissible in R1.' },
  { zone: 'Local Commercial Zone / Commercial Zone (excluding UDA)', conceptualisedZone: 'Commercial 1', code: 'C1', permissibleUse: 'AS1, AS2, AS3, AS4, DW1, DW2, DW3, EDU1, EDU2, H1, H2, H3, HO, INST, M1, M2, M3, PI, PU, REC, REG, SP&L, SE, ST, TEMP.' },
  { zone: 'Commercial Zone of UDA', conceptualisedZone: 'Commercial 2', code: 'C2', excludedAuthorities: ['GUDA'], permissibleUse: 'Those permissible in C1.' },
  { zone: 'Commercial Zone I (GUDA – GMC)', conceptualisedZone: 'Commercial 2', code: 'C2', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in C1.' },
  { zone: 'Commercial Zone II (GUDA – Non-GMC)', conceptualisedZone: 'Commercial 2', code: 'C2', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in C1.' },
  { zone: 'Commercial Zone III–IV (other than GUDA)', conceptualisedZone: 'Commercial 2', code: 'C2', excludedAuthorities: ['GUDA'], permissibleUse: 'Those permissible in C1.' },
  { zone: 'Commercial Zone III–IV (GUDA)', conceptualisedZone: 'Commercial - 3', code: 'C3', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in C1.' },
  { zone: 'General Commercial Zone (GCZ) / General Commercial Zone', conceptualisedZone: 'Commercial - 4', code: 'C4', permissibleUse: 'Those permissible in C1 and TO.' },
  { zone: 'Central Business District', conceptualisedZone: 'Commercial – 5', code: 'C5', permissibleUse: 'Those permissible in C1 and TO.' },
  { zone: 'Industrial Zone General / Non-obnoxious and Non-hazardous / Light Industrial / Industrial-A / GIDC', conceptualisedZone: 'Industrial Zone-1', code: 'IZ1', permissibleUse: 'AS2, AS3, AS4, EDU2, H1, H2, H3, IN1, IN2, M1, M2, M3, PI, PU, REC, REG, SP&L, SE, ST, TEMP. For a building used for IN1 or IN2, up to 20% of utilized FSI may be DW2/DW3 for units up to 66 sq.m.' },
  { zone: 'Industrial Buffer Zone', conceptualisedZone: 'Industrial Zone - 2', code: 'IZ2', permissibleUse: 'Those permissible in IZ1 and IN3 & IN4.' },
  { zone: 'GIDC Estate 1', conceptualisedZone: 'Industrial Zone - 3', code: 'IZ3', permissibleUse: 'IN1, IN2, IN3, M1, M2, SE.' },
  { zone: 'GIDC Estate 2', conceptualisedZone: 'Industrial Zone - 4', code: 'IZ4', permissibleUse: 'Those permissible in IZ3 and ST.' },
  { zone: 'Heavy Industrial / Industrial Zone Special / Obnoxious and Hazardous Industrial Zone', conceptualisedZone: 'Industrial Zone - 5', code: 'IZ5', permissibleUse: 'REG, SE, ST, TR, PI, PU, I2, IN4, DW2 and DW3, each up to 20% of utilized FSI with units up to 66 sq.m.' },
  { zone: 'Industrial-B', conceptualisedZone: 'Industrial Zone - 6', code: 'IZ6', permissibleUse: 'IN1, IN2, those permissible in C1, DW2 and DW3 each up to 20% of utilized FSI with units up to 66 sq.m.' },
  { zone: 'Mix Industrial Use', conceptualisedZone: 'Industrial Zone - 7', code: 'IZ7', permissibleUse: 'AS2, AS3, AS4, DW1, DW2, DW3, EDU2, H1, H2, H3, IN1, IN2, M1, M2, M3, PI, PU, REC, REG, SP&L, SE, ST, TEMP.' },
  { zone: 'Education / Educational Purpose / Religious and other Facilities / Service and Institutional / Knowledge Precinct / Institutional Zones / Special Nodes / Health Node', conceptualisedZone: 'Knowledge and Institutional Zone-1', code: 'KZ1', permissibleUse: 'AS2, DW1, DW2, DW3, EDU1, EDU2, HO, INST, M1, M2, PU, PI, REC, REG, SP&L, TEMP.' },
  { zone: 'Knowledge Township (VUDA)', conceptualisedZone: 'Knowledge and Institutional Zone-1', code: 'KZ1', onlyAuthorities: ['VUDA'], permissibleUse: 'AS2, DW1, DW2, DW3, EDU1, EDU2, HO, INST, M1, M2, PU, PI, REC, REG, SP&L, TEMP.' },
  { zone: 'Institutional Zone IV (GUDA)', conceptualisedZone: 'Knowledge and Institutional Zone-2', code: 'KZ2', onlyAuthorities: ['GUDA'], permissibleUse: 'Those permissible in KZ1.' },
  { zone: 'Essential Public Purpose / Public Service / Public Purpose (other than RUDA) / Public and Semi-Public / Public Utility / Neighbourhood and Town Centre / Parking / Public Use', conceptualisedZone: 'Public Purpose Zone - 1', code: 'PPZ1', permissibleUse: 'PU, PI.' },
  { zone: 'Public Purpose (RUDA)', conceptualisedZone: 'Public Purpose Zone - 2', code: 'PPZ2', onlyAuthorities: ['RUDA'], permissibleUse: 'AG1, AG2, AG3, AS4, DW1, EDU1, EDU2, INST, PI, PU, REC, REG, SP&L, ST.' },
  { zone: 'Recreational / Recreational Zone 1–2 / Green Institutional Zone-GI 1 / Natural Reserve / Sanctuary / Race Track / Shooting Range / Zoo / Nursery / Stadium', conceptualisedZone: 'Recreation Zone', code: 'REZ', permissibleUse: 'Botanical Garden, DW1, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'Parks / Gardens / Open Space', conceptualisedZone: 'PGO', code: 'P', permissibleUse: 'REC, SP&L, REG, PI, PU.' },
  { zone: 'Agriculture Zone / Agriculture / General Agriculture Zone', conceptualisedZone: 'Agriculture – 1', code: 'AGZ1', permissibleUse: 'AG1, AG2, AG3, AS4, DW1, EDU1, EDU2, HO, INST, IN3, PI, PU, REC, REG, SCK, ST, SP&L, TEMP, TR.' },
  { zone: 'Prime Agriculture / Agriculture (SP) / Agriculture Special / High-tech Agriculture / Hi-Tech Agriculture Use', conceptualisedZone: 'Agriculture – 2', code: 'AGZ2', permissibleUse: 'AG1, AG3, EDU1, EDU2, PI, PU. Service apartment, bread and breakfast, guest house, hotel, motel, lodging and boarding are not permitted.' },
  { zone: 'Restricted Agriculture Zone', conceptualisedZone: 'Agriculture – 3', code: 'AGZ3', permissibleUse: 'Zoo and Botanical Garden and any activity undertaken by Government for infrastructure.' },
  { zone: 'Restricted Agriculture Zone (High Flood Zone)', conceptualisedZone: 'Agriculture – 4', code: 'AGZ4', permissibleUse: 'AG1, PI, PU, TEMP. Service apartment, bread and breakfast, guest house, hotel, motel, lodging and boarding are not permitted.' },
  { zone: 'Logistics Zone / Logistic Park / Transport Node / Transport and Communication / Public Purpose (ST)', conceptualisedZone: 'Logistics Zone', code: 'LZ', permissibleUse: 'AS1, AS3, DW2 and DW3 (both max 20% of utilized FSI with units up to 66 sq.m. for industrial workers), H1, HO, INST, IN1, IN2, M1, M2, M3, PI, PU, REG, SE, ST, TR.' },
  { zone: 'Special Plan Development Zone of GIFT', conceptualisedZone: 'Special Plan Development Zone - 1', code: 'SPD1', permissibleUse: 'As per GIFT Master Plan.' },
  { zone: 'Special Plan Development Zone of Sabarmati Riverfront Development', conceptualisedZone: 'Special Plan Development Zone - 2', code: 'SPD2', permissibleUse: 'As per SRFDCL Master Plan.' },
  { zone: 'SPD – Science Park', conceptualisedZone: 'Special Plan Development Zone - 3', code: 'SPD3', permissibleUse: 'Those permissible in R1.' },
  { zone: 'SPD – Gandhi Ashram Special Development Area', conceptualisedZone: 'Special Plan Development Zone - 4', code: 'SPD4', permissibleUse: 'Those permissible in R1.' },
  { zone: 'Transit Oriented Zone / Smart City Node / Transport Node / high-density zone within 200 m of road edge', conceptualisedZone: 'Smart City & TOZ', code: 'SPD5', permissibleUse: 'Those permissible in R1, C1, REZ.' },
  { zone: 'Closed Textile Mill Zone', conceptualisedZone: 'CZ', code: 'CZ', permissibleUse: 'Those permissible in KZ1, RAH.' },
  { zone: 'Forest Land', conceptualisedZone: 'Forest Zone', code: 'FZ', permissibleUse: 'As permitted by the competent authority and subject to Defence and Central Government regulations.' },
  { zone: 'Fishing Beach Zone', conceptualisedZone: 'Special Zone 1', code: 'SZ1', permissibleUse: 'As per Environment Protection and CRZ criteria; temporary use from wooden and cloth materials only for fishing activity.' },
  { zone: 'Buffer Zone', conceptualisedZone: 'Special Zone 2', code: 'SZ2', permissibleUse: 'As per IZ1.' },
  { zone: 'Hilly Area', conceptualisedZone: 'Special Zone 3', code: 'SZ3', permissibleUse: 'As per Environment Regulation.' },
  { zone: 'Heritage Zone / Heritage Precinct (SZ4)', conceptualisedZone: 'Special Zone 4', code: 'SZ4', permissibleUse: 'Subject to Heritage Regulations.' },
  { zone: 'Residential Tourist Accommodation Zone', conceptualisedZone: 'Special Zone 5', code: 'SZ5', permissibleUse: 'DW1, DW2, DW3, HO, M1, M2, M3, PI, PU, REC, REG, TO.' },
  { zone: 'Special Tourism Project Area', conceptualisedZone: 'Special Zone 6', code: 'SZ6', permissibleUse: 'DW3, M2, M3, REC, TO.' },
  { zone: 'Vacant Land', conceptualisedZone: 'Vacant Land', code: 'VL', permissibleUse: 'No development permission.' },
  { zone: 'Heritage Area', conceptualisedZone: 'Heritage', code: 'HA', permissibleUse: 'DW1, DW2, DW3, M1, M2, HO. Owners must conserve all facades, building footprint, and the character of open spaces such as courtyards, khadki, and streets.' },
  { zone: 'Mix Use Zone (Thangadh)', conceptualisedZone: 'Mix Zone', code: 'MUZ', permissibleUse: 'AS1, AS2, AS3, AS4, DW1, DW2, DW3, EDU1, EDU2, H1, H2, H3, HO, IN1A, IN1 and IN2 for pottery/ceramic industries (proposed road at least 9 m; 30–35% open for loading, unloading and storage), INST, M1, M2, M3, PI, PU, REC, REG, SP&L, SE, ST, TEMP.' },
  { zone: 'D8 & D10 — Gamtal Area', conceptualisedZone: '—', code: 'GMD8', permissibleUse: 'AS1, DW1, DW2, DW3, EDU1, HO, INST, M1, M2, PI, PU, REG, REC, SP&L, TEMP.' },
  { zone: 'D8 & D10 — Outside gamtal, within 200 m of its boundary', conceptualisedZone: '—', code: 'RMD8', permissibleUse: 'Those permissible in GMD8 and AS2, AS3, AS4, EDU2, HO, M2, SE, SCK.' },
  { zone: 'D8 & D10 — Outside gamtal, more than 200 m from its boundary', conceptualisedZone: '—', code: 'RMD9', permissibleUse: 'Those permissible in CW and AS2, AS3, AS4, HO, IN1, IN2, IN3, IN4, M2, M3, SCK, SE, ST, AG1, AG2.' },
  { zone: 'GIDC', conceptualisedZone: 'GIDC', code: 'GIDC', permissibleUse: 'As specified by GIDC.' },
];

const TABLE_6_2_ZONE_CODES = [...new Set(DESIGNATED_ZONES.map(({ code }) => code))].sort((left, right) => right.length - left.length);

function cleanRuleReference(value = '') {
  return String(value)
    .replace(/\bTables?\s+\d+(?:\.\d+)?[A-Z]?(?:\s*(?:[–—/-]\s*\d+(?:\.\d+)?[A-Z]?))*\b/gi, '')
    .replace(/\b(?:table|tables)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

function getPermissibleUseCodes(zone, useCodeRows, zones, visited = new Set()) {
  if (!zone || visited.has(zone.code)) return [];
  const nextVisited = new Set(visited).add(zone.code);
  const tableCodes = useCodeRows.map(({ code }) => code).filter(Boolean);
  const codes = new Set();
  for (const useCode of tableCodes) {
    const escaped = useCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^A-Z0-9&])${escaped}($|[^A-Z0-9])`).test(zone.permissibleUse)) codes.add(useCode);
  }
  for (const zoneCode of [...new Set(zones.map(({ code }) => code))]) {
    const escaped = zoneCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (zoneCode !== zone.code && new RegExp(`\\b${escaped}\\b`).test(zone.permissibleUse)) {
      zones.filter((candidate) => candidate.code === zoneCode).forEach((candidate) => {
        getPermissibleUseCodes(candidate, useCodeRows, zones, nextVisited).forEach((useCode) => codes.add(useCode));
      });
    }
  }
  return tableCodes.filter((code) => codes.has(code));
}

function getRoadSideMargin({ category, authority, area, zoneCode, roadWidth, plotArea, buildingUse, side, buildingUnitArea, buildingHeight, schedules }) {
  if (!roadWidth) return null;
  const authorityCode = authority.match(/\(([^)]+)\)$/)?.[1] ?? authority;
  if (category === 'D1' && authorityCode === 'GUDA' && (!/non[\s-]?gmc/i.test(area) || (/\bGMC\b/i.test(area) && !/non[\s-]?gmc/i.test(area)))) return null;
  if (category === 'D6') {
    const zone = String(zoneCode ?? '').toUpperCase();
    const rowsFor = (table) => schedules.filter((row) => row.tableNumber === table && (row.categoryCodes ?? []).includes('D6'));
    const value = (text) => { const raw = String(text ?? '').trim(); if (!raw || /n\.?a\.?|not applicable|not required|^\s*-\s*$/i.test(raw)) return null; const match = raw.match(/[\d.]+/); return match ? Number(match[0]) : null; };
    const matchesArea = (label, amount) => {
      const numbers = [...String(label ?? '').matchAll(/[\d,]+(?:\.\d+)?/g)].map(([n]) => Number(n.replaceAll(',', '')));
      const text = String(label ?? '').toLowerCase();
      if (!numbers.length || !amount) return false;
      const parentheticalArea = text.match(/\(\s*([\d,]+(?:\.\d+)?)\s*\)/)?.[1];
      if (parentheticalArea) return amount === Number(parentheticalArea.replaceAll(',', ''));
      if (/upto|up to|less than/.test(text)) return amount <= numbers.at(-1);
      if (/above|more than/.test(text)) return amount > numbers[0] && (numbers.length === 1 || amount <= numbers.at(-1));
      if (/[&,]/.test(text) || /row|twin/.test(text)) return numbers.includes(amount);
      return numbers.length === 1 ? amount === numbers[0] : amount >= numbers[0] && amount <= numbers.at(-1);
    };
    if (zone === 'C1') {
      const row = rowsFor('6.31').find((item) => /less than 12/i.test(item.sourceCells?.[0] ?? '') ? roadWidth < 12 : roadWidth >= 12);
      return row ? { margin: value(row.sourceCells?.[1]) } : null;
    }
    if (zone === 'I3') {
      const row = rowsFor('6.34').find((item) => /less than 24/i.test(item.sourceCells?.[0] ?? '') ? roadWidth < 24 : /24 mts and above/i.test(item.sourceCells?.[0] ?? '') && roadWidth >= 24);
      return row ? { margin: value(row.sourceCells?.[1]) } : null;
    }
    if (zone === 'GIDC-1' || zone === 'GIDC-2') {
      const row = rowsFor('6.35').find((item) => /30mt.*above/i.test(item.sourceCells?.[0] ?? '') ? roadWidth >= 30 : /less than.?30mt/i.test(item.sourceCells?.[0] ?? '') && roadWidth < 30);
      return row ? { margin: value(row.sourceCells?.[1]) } : null;
    }
    if (zone === 'RR1' || zone === 'RR-1') {
      const row = rowsFor('6.30')[0];
      if (!row) return null;
      const roadColumn = roadWidth <= 10 ? 1 : roadWidth <= 18 ? 2 : 3;
      const margin = value(row.sourceCells?.[roadColumn]);
      const height = Number(buildingHeight);
      return { margin, note: !height ? 'Enter building height to check the linked rear and side value.' : '' };
    }
    if (zone === 'RE1' || zone === 'RE-1') {
      const rows = rowsFor('6.36');
      const isJRoad = /\bJ\s*road\b/i.test(area ?? '');
      const row = rows.find((item) => /abutting.*j.*road/i.test(item.sourceCells?.[0] ?? '') === isJRoad && /road/i.test(item.sourceCells?.[0] ?? ''));
      return row ? { margin: value(row.sourceCells?.[1]), note: 'The 30 m river-edge requirement applies separately where a plot adjoins a river.' } : { margin: null, note: 'Confirm whether the site abuts the designated J road to resolve its road-side margin.' };
    }
    if (zone === 'GI1' || zone === 'GI-1') {
      const row = rowsFor('6.33').find((item) => matchesArea(item.sourceCells?.[0], Number(plotArea)));
      return row ? { margin: value(row.sourceCells?.[1]) } : { margin: null, note: 'Table 6.33 lists specific plot sizes; no exact plot-size row matches the entered plot area.' };
    }
    if (/^IN/.test(String(buildingUse ?? '').toUpperCase()) || /industrial/i.test(buildingUse ?? '')) {
      const row = rowsFor('6.37').find((item) => matchesArea(item.sourceCells?.[0], roadWidth));
      if (!row) return null;
      const unitArea = Number(buildingUnitArea);
      if (!unitArea) return { margin: null, note: 'Enter building-unit area to resolve the industrial road-side margin in Table 6.37.' };
      const sideValue = value(unitArea <= 1000 ? row.sourceCells?.[2] : row.sourceCells?.[3]);
      const roadLabel = String(row.sourceCells?.[1] ?? '');
      return { margin: /as per side margin/i.test(roadLabel) ? sideValue : value(roadLabel) };
    }
    if (['R1', 'R2', 'R3'].includes(zone)) {
      const row = rowsFor('6.29').find((item) => matchesArea(item.sourceCells?.[1], Number(plotArea)));
      if (!row) return { margin: null, note: 'Table 6.29 requires a listed residential plot-size row.' };
      const roadType = /town/i.test(area ?? '') ? 'town' : /interior/i.test(area ?? '') ? 'interior' : '';
      if (!roadType) return { margin: null, note: 'Enter whether this residential road is a town road or an interior road.' };
      const column = roadType === 'town' ? ({ R1: 2, R2: 3, R3: 4 }[zone]) : ({ R1: 5, R2: 6, R3: 7 }[zone]);
      const margin = value(row.sourceCells?.[column]);
      return { margin, note: margin == null ? 'The selected residential plot size and road type have no numeric margin in the active schedule.' : '' };
    }
    return { margin: null, note: 'No unique D6 road-side rule matches this zone and the available site details.' };
  }
  if (category === 'D9') {
    const use = (buildingUse ?? '').toLowerCase();
    const d9Rows = schedules.filter((row) => row.tableNumber === '6.40' && !row.isDeleted);
    const industrialStart = d9Rows.findIndex((row) => /industrial development and commercial development/i.test(row.sourceCells?.[0] ?? ''));
    const inRange = (label, value) => {
      const numbers = [...String(label).matchAll(/[\d,]+(?:\.\d+)?/g)].map(([number]) => Number(number.replaceAll(',', '')));
      const text = String(label).toLowerCase();
      if (!numbers.length) return false;
      if (/up to|upto|less than/.test(text)) return value <= numbers[numbers.length - 1];
      if (/and above|above \d|more than/.test(text)) return value > numbers[0] && (numbers.length < 2 || value <= numbers[1]);
      return numbers.length > 1 && value >= numbers[0] && value <= numbers[1];
    };
    if (/residential/.test(use)) {
      const row = d9Rows.slice(0, industrialStart < 0 ? d9Rows.length : industrialStart).find((item) => inRange(item.sourceCells?.[0], roadWidth));
      const margin = Number(row?.sourceCells?.[1]);
      return row ? { margin: Number.isFinite(margin) ? margin : 0 } : null;
    }
    if (/public/.test(use)) {
      const publicRow = d9Rows.find((item) => /public uses/i.test(item.sourceCells?.[0] ?? ''));
      const margin = Number(String(publicRow?.sourceCells?.[0] ?? '').match(/[\d.]+/)?.[0]);
      return Number.isFinite(margin) ? { margin } : null;
    }
    if (/industrial|commercial/.test(use)) {
      if (side !== 'front') return { margin: null, note: 'The listed industrial and commercial margin applies to the front side.' };
      const publicStart = d9Rows.findIndex((item) => /public uses/i.test(item.sourceCells?.[0] ?? ''));
      const row = d9Rows.slice(Math.max(0, industrialStart + 1), publicStart < 0 ? d9Rows.length : publicStart).find((item) => inRange(item.sourceCells?.[0], plotArea));
      const margin = Number(row?.sourceCells?.[1]);
      return row ? { margin } : { margin: null, note: 'No industrial or commercial front margin is listed for this plot size.' };
    }
    return null;
  }
  const scheduleRow = schedules.find((row) => row.tableNumber === '6.24' && !row.isDeleted && (row.categoryCodes ?? []).includes(category));
  if (!scheduleRow) return null;
  const column = roadWidth <= 7.5 ? 0 : roadWidth <= 9 ? 1 : roadWidth <= 12 ? 2 : roadWidth <= 15 ? 3 : roadWidth < 18 ? 4 : roadWidth < 30 ? 5 : roadWidth < 45 ? 6 : 7;
  // Some source cells carry footnote markers (for example, "7.5*"). Read
  // the numeric margin while leaving the original dashboard value intact.
  const marginText = String(scheduleRow.sourceCells?.[column + 2] ?? '');
  let margin = Number(marginText.match(/-?[\d.]+/)?.[0]);
  if (!Number.isFinite(margin)) return null;
  let note = '';
  if (/special\s+building/i.test(buildingUse)) margin = 12;
  if (!/special\s+building/i.test(buildingUse) && category === 'D1' && authorityCode === 'RUDA' && roadWidth > 30 && roadWidth < 45) {
    const unitArea = Number(buildingUnitArea);
    const height = Number(buildingHeight);
    if ((unitArea > 0 && unitArea <= 1000) || (height > 0 && height <= 25)) { margin = 6; note = 'A 6 m minimum applies when the building-unit area is up to 1,000 m² or the building height is up to 25 m.'; }
    else if (!buildingUnitArea || !buildingHeight) note = 'Enter building-unit area and building height to check whether the 6 m exception applies.';
  }
  return { margin, note };
}

function RoadMarginDiagram({ category, authority, area, zoneCode, roadWidths, plotArea, buildingUse, buildingUnitArea, buildingHeight, rearSideAssessment, schedules }) {
  const sides = ['rear', 'left', 'right', 'front'];
  const roadSides = sides.filter((side) => roadWidths[side] !== '');
  const marginInfo = Object.fromEntries(roadSides.map((side) => [side, getRoadSideMargin({ category, authority, area, zoneCode, roadWidth: Number(roadWidths[side]), plotArea: Number(plotArea) || 0, buildingUse, side, buildingUnitArea, buildingHeight, schedules })]));
  const edgeMargins = { ...(rearSideAssessment?.status === 'available' ? rearSideAssessment.edgeMargins : {}) };
  if (rearSideAssessment?.status === 'available' && rearSideAssessment.allocation) {
    const { count, value, sides: eligibleSides } = rearSideAssessment.allocation;
    const withoutRoad = eligibleSides.filter((side) => !roadSides.includes(side));
    const withRoad = eligibleSides.filter((side) => roadSides.includes(side));
    [...withoutRoad, ...withRoad].slice(0, count).forEach((side) => { edgeMargins[side] = value; });
  }
  const marginValues = Object.fromEntries(sides.map((side) => {
    const roadMargin = roadSides.includes(side) ? marginInfo[side]?.margin : null;
    const sideMargin = edgeMargins[side];
    if (roadSides.includes(side)) {
      const value = category === 'D9' ? (roadMargin ?? sideMargin) : roadMargin != null && sideMargin != null ? Math.max(roadMargin, sideMargin) : roadMargin;
      return [side, { road: true, value, message: marginInfo[side]?.note ?? '' }];
    }
    return [side, { road: false, value: sideMargin ?? null, message: '' }];
  }));
  const plot = { x: 150, y: 48, width: 200, height: 150 };
  const roadRects = {
    rear: <rect x="135" y="12" width="230" height="30" rx="2" fill="#e8ebef"/>,
    left: <rect x="70" y="33" width="74" height="180" rx="2" fill="#e8ebef"/>,
    right: <rect x="356" y="33" width="74" height="180" rx="2" fill="#e8ebef"/>,
    front: <rect x="135" y="204" width="230" height="30" rx="2" fill="#e8ebef"/>,
  };
  const marginRects = {
    rear: <rect x={plot.x} y={plot.y} width={plot.width} height="22" fill="#f8efec" stroke="#e8c9be" strokeWidth="0.8"/>,
    left: <rect x={plot.x} y={plot.y} width="22" height={plot.height} fill="#f8efec" stroke="#e8c9be" strokeWidth="0.8"/>,
    right: <rect x={plot.x + plot.width - 22} y={plot.y} width="22" height={plot.height} fill="#f8efec" stroke="#e8c9be" strokeWidth="0.8"/>,
    front: <rect x={plot.x} y={plot.y + plot.height - 22} width={plot.width} height="22" fill="#f8efec" stroke="#e8c9be" strokeWidth="0.8"/>,
  };
  const marginValue = (side) => {
    const value = marginValues[side].value;
    if (value == null) return '';
    const location = side === 'front' ? 'Front' : side === 'rear' ? 'Rear' : 'Side';
    const roadQualifier = marginValues[side].road && side !== 'front' ? ' road' : '';
    const amount = value === 0 ? 'Nil' : `${value} m`;
    return `${location}${roadQualifier} margin · ${amount}`;
  };
  const notes = [...new Set([
    ...(rearSideAssessment?.status !== 'available' && rearSideAssessment?.message ? [rearSideAssessment.message] : []),
    ...(rearSideAssessment?.status === 'available' ? [rearSideAssessment.note, rearSideAssessment.maximumBuiltUpArea ? `Maximum built-up area: ${rearSideAssessment.maximumBuiltUpArea}.` : '', rearSideAssessment.allocation ? 'One representative placement is shown for requirements that allow a choice of side.' : ''] : []),
    ...Object.values(marginInfo).map((info) => info?.note ?? ''),
  ].filter(Boolean))];
  return <section className="road-margin-card" aria-label="Road, rear, and side margin diagram"><div className="road-margin-heading"><b>Road, rear, and side margin diagram</b><small>Schematic · not to scale</small></div><svg viewBox="0 0 500 250" role="img" aria-label="Plot diagram showing front, side, and rear margins, with road-facing margins where roads adjoin">{roadSides.map((side) => <g key={`road-${side}`}>{roadRects[side]}</g>)}<rect x={plot.x} y={plot.y} width={plot.width} height={plot.height} fill="#fff" stroke="#7c8997" strokeWidth="1.5"/>{sides.map((side) => {const x = side === 'left' ? plot.x + 11 : side === 'right' ? plot.x + plot.width - 11 : plot.x + plot.width / 2; const y = side === 'rear' ? plot.y + 12 : side === 'front' ? plot.y + plot.height - 10 : plot.y + plot.height / 2; const sideMargin = side === 'left' || side === 'right'; return <g key={`margin-${side}`}>{marginValues[side].value > 0 && marginRects[side]}<text x={x} y={y} textAnchor="middle" dominantBaseline="middle" transform={sideMargin ? `rotate(-90 ${x} ${y})` : undefined} fontSize={sideMargin ? '7' : '8'} fontWeight="700" fill="#75483d">{marginValue(side)}</text></g>;})}<text x="250" y="127" textAnchor="middle" fontSize="11" fontWeight="700" fill="#43546a">Building unit</text>{roadSides.map((side) => <text key={`label-${side}`} x={side === 'left' ? 107 : side === 'right' ? 393 : 250} y={side === 'front' ? 226 : side === 'rear' ? 31 : 128} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="#59697d">Road · {roadWidths[side]} m</text>)}</svg>{notes.map((note) => <small className="road-margin-note" key={note}>{cleanRuleReference(note)}</small>)}</section>;
}

function getRearSideMarginAssessment({ category, authorityCode, developmentArea, zoneCode, plotArea, buildingUnitArea, buildingHeight, buildingUse, buildingUseCode, specialBuilding, schedules }) {
  const plot = Number(plotArea);
  const unit = Number(buildingUnitArea);
  const height = Number(buildingHeight);
  const needs = (...fields) => ({ status: 'input', message: `Enter ${fields.join(' and ')} to determine the rear and side margins.` });
  const result = (rear, side, note = '', maximumBuiltUpArea = '', edgeMargins = {}, allocation = null) => ({ status: 'available', rear, side, note, maximumBuiltUpArea, edgeMargins, allocation });
  const review = (message) => ({ status: 'review', message });
  if (!category || !Number.isFinite(plot) || plot <= 0 || !buildingUse) return needs('plot area and building use');

  if (category === 'D9') {
    const use = buildingUse.toLowerCase();
    const d9Rows = schedules.filter((row) => row.tableNumber === '6.41' && !row.isDeleted);
    const industrialStart = d9Rows.findIndex((row) => /industrial and commercial development/i.test(row.sourceCells?.[0] ?? ''));
    const inPlotRange = (label) => {
      const numbers = [...String(label).matchAll(/[\d,]+(?:\.\d+)?/g)].map(([number]) => Number(number.replaceAll(',', '')));
      const text = String(label).toLowerCase();
      if (!numbers.length) return false;
      if (/upto|up to/.test(text)) return plot <= numbers[numbers.length - 1];
      if (/above|more than/.test(text)) return plot > numbers[0] && (numbers.length < 2 || plot <= numbers[1]);
      return numbers.length > 1 && plot >= numbers[0] && plot <= numbers[1];
    };
    const numericMargin = (value) => /nil|not required/i.test(String(value)) ? 0 : Number(String(value).match(/[\d.]+/)?.[0]);
    if (/residential/.test(use)) {
      const row = d9Rows.slice(0, industrialStart < 0 ? d9Rows.length : industrialStart).find((item) => inPlotRange(item.sourceCells?.[0]));
      if (!row) return review('The active residential margin rows do not identify a value for this plot size.');
      const text = row.sourceCells?.[1] ?? '';
      if (/two outcomes|75%|70%/.test(text) || (plot <= 25 && d9Rows.some((item) => /70%/.test(item.sourceCells?.[2] ?? '')))) return review('The active schedule lists multiple outcomes for this residential plot size without a condition to distinguish them.');
      const value = numericMargin(text);
      if (!Number.isFinite(value)) return review('The active residential margin row needs a numeric margin value before a result can be shown.');
      const coverage = row.sourceCells?.[2] ?? '';
      const isTwoSides = /2\s*side|two sides/i.test(text);
      const isRear = /rear/i.test(text);
      return result(`${value ? `${value} m` : 'Nil'}`, isTwoSides ? `Two sides: ${value} m each` : `One location: ${value} m`, '', coverage, isTwoSides ? { rear: value, left: value, right: value } : {}, { count: isTwoSides ? 2 : 1, value, sides: isRear ? ['rear', 'left', 'right'] : ['left', 'right'] });
    }
    if (/industrial|commercial/.test(use)) {
      const dataStart = d9Rows.findIndex((item, index) => index > industrialStart && /plot size/i.test(item.sourceCells?.[0] ?? ''));
      const row = d9Rows.slice(Math.max(0, dataStart + 2)).find((item) => inPlotRange(item.sourceCells?.[0]));
      if (!row) return review('The active industrial and commercial margin rows do not identify a value for this plot size.');
      const rear = numericMargin(row.sourceCells?.[1]);
      const sideI = numericMargin(row.sourceCells?.[2]);
      const sideII = numericMargin(row.sourceCells?.[3]);
      if (![rear, sideI, sideII].some(Number.isFinite)) return review('The active margin row needs numeric rear and side values before a result can be shown.');
      return result(Number.isFinite(rear) ? `${rear} m` : 'Not specified', `Side I: ${Number.isFinite(sideI) ? `${sideI} m` : 'not specified'} · Side II: ${Number.isFinite(sideII) ? `${sideII} m` : 'not specified'}`, '', '', { rear, left: sideI, right: sideII });
    }
    return review('The source does not specify rear and side margins for this D9 building use.');
  }

  const isGmc = authorityCode === 'GMC' || (authorityCode === 'GUDA' && !/non[\s-]?gmc/i.test(developmentArea));
  if (category === 'D6') {
    const zone = String(zoneCode ?? '').toUpperCase();
    const rowsFor = (table) => schedules.filter((item) => item.tableNumber === table && (item.categoryCodes ?? []).includes('D6'));
    const numberOrNull = (text) => { const raw = String(text ?? '').trim(); if (!raw) return null; if (/not required|nil/i.test(raw)) return 0; const match = raw.match(/[\d.]+/); return match ? Number(match[0]) : null; };
    const inRange = (label, amount) => {
      const values = [...String(label ?? '').matchAll(/[\d,]+(?:\.\d+)?/g)].map(([n]) => Number(n.replaceAll(',', '')));
      const text = String(label ?? '').toLowerCase();
      if (!values.length || !amount) return false;
      const parentheticalArea = text.match(/\(\s*([\d,]+(?:\.\d+)?)\s*\)/)?.[1];
      if (parentheticalArea) return amount === Number(parentheticalArea.replaceAll(',', ''));
      if (/upto|up to|less than/.test(text)) return amount <= values.at(-1);
      if (/above|more than/.test(text)) return amount > values[0] && (values.length === 1 || amount <= values.at(-1));
      if (/[&,]/.test(text) || /row|twin/.test(text)) return values.includes(amount);
      return values.length === 1 ? amount === values[0] : amount >= values[0] && amount <= values.at(-1);
    };
    if (zone === 'C1') {
      const row = rowsFor('6.32').find((item) => /less than 1000/i.test(item.sourceCells?.[0] ?? '') ? plot < 1000 : plot >= 1000);
      const margin = numberOrNull(row?.sourceCells?.[1]);
      return Number.isFinite(margin) ? result(`${margin} m`, `${margin} m`, '', '', { rear: margin, left: margin, right: margin }) : review('No active commercial side and rear row matches this plot area.');
    }
    if (zone === 'GI1' || zone === 'GI-1') {
      const row = rowsFor('6.33').find((item) => inRange(item.sourceCells?.[0], plot));
      const rear = numberOrNull(row?.sourceCells?.[2]);
      const side = numberOrNull(row?.sourceCells?.[3]);
      return Number.isFinite(rear) && Number.isFinite(side) ? result(`${rear} m`, `${side} m`, '', '', { rear, left: side, right: side }) : review('Table 6.33 requires a listed Green Institutional plot size.');
    }
    if (zone === 'GIDC-1' || zone === 'GIDC-2') {
      const row = rowsFor('6.35').find((item) => /all side margins/i.test(item.sourceCells?.[0] ?? ''));
      const margin = numberOrNull(row?.sourceCells?.[1]);
      return Number.isFinite(margin) ? result(`${margin} m`, `${margin} m`, '', '', { rear: margin, left: margin, right: margin }) : review('The active GIDC schedule does not provide a numeric all-side margin.');
    }
    if (zone === 'RE1' || zone === 'RE-1') {
      const row = rowsFor('6.36').find((item) => /all side margin/i.test(item.sourceCells?.[0] ?? ''));
      const margin = numberOrNull(row?.sourceCells?.[1]);
      return Number.isFinite(margin) ? result(`${margin} m`, `${margin} m`, 'A separate 30 m margin applies from a river edge where the plot adjoins one.', '', { rear: margin, left: margin, right: margin }) : review('The active recreational schedule does not provide a numeric all-side margin.');
    }
    if (zone === 'I3') {
      const row = rowsFor('6.34').find((item) => /remaining sides/i.test(item.sourceCells?.[0] ?? ''));
      const margin = numberOrNull(row?.sourceCells?.[1]);
      return Number.isFinite(margin) ? result(`${margin} m`, `${margin} m`, '', '', { rear: margin, left: margin, right: margin }) : review('The active institutional schedule does not provide a numeric remaining-side margin.');
    }
    if (/^IN/.test(String(buildingUseCode ?? '').toUpperCase()) || /industrial/i.test(buildingUse ?? '')) {
      if (!unit) return needs('building-unit area');
      const row = rowsFor('6.37').find((item) => /upto 12/i.test(item.sourceCells?.[0] ?? '')) ?? rowsFor('6.37')[0];
      const side = numberOrNull(unit <= 1000 ? row?.sourceCells?.[2] : row?.sourceCells?.[3]);
      return Number.isFinite(side) ? result(`${side} m`, `${side} m`, '', '', { rear: side, left: side, right: side }) : review('The active industrial schedule does not give a numeric side and rear margin for this building-unit area.');
    }
    if (zone === 'RR1' || zone === 'RR-1') {
      const row = rowsFor('6.30')[0];
      if (!row) return review('The active renewal-zone schedule has no row.');
      if (!height) return needs('building height');
      const margin = numberOrNull(height <= 15 ? row.sourceCells?.[5] : height <= 25 ? row.sourceCells?.[6] : null);
      return Number.isFinite(margin) ? result(`${margin} m`, `${margin} m`, '', '', { rear: margin, left: margin, right: margin }) : review('Table 6.30 does not list a rear and side margin for this building height.');
    }
    if ((buildingUseCode === 'DW1' || buildingUseCode === 'DW2') && unit > 0) {
      const row = rowsFor('6.38').find((item) => inRange(item.sourceCells?.[0], unit));
      if (row) {
        const rear = numberOrNull(row.sourceCells?.[1]);
        const sideText = row.sourceCells?.[2] ?? '';
        const side = numberOrNull(sideText);
        if (Number.isFinite(rear) && Number.isFinite(side)) {
          const count = /both sides/i.test(sideText) ? 2 : /any one side/i.test(sideText) ? 1 : 0;
          return result(`${rear} m`, count ? `${count === 2 ? 'Two sides' : 'One side'}: ${side} m` : 'Not required', '', '', { rear, ...(count === 2 ? { left: side, right: side } : {}) }, count ? { count, value: side, sides: ['left', 'right'] } : null);
        }
      }
    }
    if (['R1', 'R2', 'R3'].includes(zone) && plot <= 500) {
      const row = rowsFor('6.28').find((item) => inRange(item.sourceCells?.[1], plot));
      if (!row) return review('Table 6.28 has no listed residential plot-size row for this plot area.');
      const rearText = row.sourceCells?.[zone === 'R2' ? 3 : 2] ?? '';
      const sideText = row.sourceCells?.[zone === 'R2' ? 5 : 4] ?? '';
      const rear = numberOrNull(rearText); const side = numberOrNull(sideText);
      if (!Number.isFinite(rear) && !Number.isFinite(side)) return review('The matching Table 6.28 row does not specify numeric rear or side margins.');
      const count = /both sides/i.test(sideText) ? 2 : /one side/i.test(sideText) ? 1 : 0;
      return result(Number.isFinite(rear) ? `${rear} m` : 'Not specified', count ? `${count === 2 ? 'Two sides' : 'One side'}: ${side} m` : Number.isFinite(side) ? `${side} m` : 'Not specified', '', '', { ...(Number.isFinite(rear) ? { rear } : {}), ...(count === 2 ? { left: side, right: side } : Number.isFinite(side) && !count ? { left: side, right: side } : {}) }, count ? { count, value: side, sides: ['left', 'right'] } : null);
    }
    return review('No unique D6 rear and side rule matches the selected zone and supplied plot details.');
  }
  if (isGmc) return review('The supplied rear and side margin schedule does not cover this authority.');
  if (specialBuilding) {
    if (!buildingHeight || height <= 0) return needs('building height');
    const margin = height <= 25 ? 6 : 8;
    return result(`${margin} m`, `${margin} m`, '', '', { rear: margin, left: margin, right: margin });
  }

  const useCode = (buildingUseCode ?? '').toUpperCase();
  const isDwelling12 = /^DW[12]$/.test(useCode);
  const isDwelling3 = useCode === 'DW3';
  const isIndustrial = /^IN/.test(useCode) || /industrial/.test(buildingUse.toLowerCase());
  const applicableRows = schedules.filter((row) => !row.isDeleted && (row.categoryCodes ?? []).includes(category));
  const parseRange = (label, value) => {
    const numbers = [...String(label).matchAll(/[\d,]+(?:\.\d+)?/g)].map(([number]) => Number(number.replaceAll(',', '')));
    const text = String(label).toLowerCase();
    if (!numbers.length) return false;
    if (/above|more than|>\s*\d/.test(text)) return value > numbers[0] && (numbers.length < 2 || value <= numbers[numbers.length - 1]);
    if (/≤\s*\d|<=\s*\d|up to|upto/.test(text)) return value <= numbers[numbers.length - 1];
    return numbers.length > 1 && value >= numbers[0] && value <= numbers[1];
  };
  const numberOrNull = (text) => /nil|not required/i.test(String(text)) ? 0 : Number(String(text ?? '').match(/[\d.]+/)?.[0]);
  if (category === 'D1' && authorityCode === 'RUDA' && isDwelling3 && (!unit || !height)) return needs(...(!unit && !height ? ['building-unit area', 'building height'] : !unit ? ['building-unit area'] : ['building height']));
  if (category === 'D1' && authorityCode === 'RUDA' && isDwelling3 && unit > 0 && height > 0 && unit <= 500 && height <= 16.5) {
    const row = applicableRows.filter((item) => item.tableNumber === '6.27').find((item) => parseRange(item.sourceCells?.[1], unit));
    if (!row) return review('No active building-unit size row matches the special RUDA dwelling condition.');
    const margin = numberOrNull(row.sourceCells?.[2]);
    if (!Number.isFinite(margin)) return review('The active RUDA row has no numeric margin value.');
    const count = /two/i.test(row.sourceCells?.[2] ?? '') ? 2 : 1;
    const allSides = /all sides/i.test(row.sourceCells?.[2] ?? '');
    return result(`${margin} m`, allSides ? `All sides: ${margin} m` : `${count === 2 ? 'Two sides' : 'One location'}: ${margin} m`, '', '', allSides ? { rear: margin, left: margin, right: margin } : {}, { count, value: margin, sides: ['rear', 'left', 'right'] });
  }
  const rows = applicableRows.filter((item) => item.tableNumber === '6.26');
  const row = rows.filter((item) => {
    const condition = item.sourceCells?.[2] ?? '';
    if (isDwelling12) return /dwelling 1-2/i.test(item.sourceCells?.[1] ?? '') || (!item.sourceCells?.[1] && /PS\s*[≤>]/i.test(condition));
    if (isIndustrial) return /industrial use/i.test(item.sourceCells?.[1] ?? '') || (!item.sourceCells?.[1] && Number(item.sourceRow) >= 12);
    return /other than dwelling/i.test(item.sourceCells?.[1] ?? '') || (!item.sourceCells?.[1] && /B\.H\./i.test(condition));
  }).find((item) => {
    const condition = item.sourceCells?.[2] ?? '';
    return /B\.H\./i.test(condition) ? height > 0 && parseRange(condition, height) : parseRange(condition, plot);
  });
  if (!row) return review('No active rear and side margin row matches this category, use, and site size.');
  const rowText = row.sourceCells ?? [];
  const continuation = rows.find((item) => Number(item.sourceRow) === Number(row.sourceRow) + 1 && !(item.sourceCells?.[2] ?? '').trim());
  const remark = [...rowText.slice(3), ...(continuation?.sourceCells?.slice(3) ?? [])].join(' ');
  if (isDwelling12 && plot <= 25) return result('Not required', 'Not required', remark, '', { rear: 0, left: 0, right: 0 });
  const rear = numberOrNull(rowText[3]);
  const side = numberOrNull(rowText[4]);
  const flexibleText = `${rowText[4] ?? ''} ${rowText[5] ?? ''} ${continuation?.sourceCells?.[5] ?? ''}`;
  if (/any one side|any two sides/i.test(flexibleText) && Number.isFinite(numberOrNull(flexibleText))) {
    const value = numberOrNull(flexibleText);
    const count = /any two sides/i.test(flexibleText) ? 2 : 1;
    const fixedRear = Number.isFinite(rear) ? { rear } : {};
    return result(Number.isFinite(rear) ? `${rear} m` : `${value} m`, `${count === 2 ? 'Two sides' : 'One location'}: ${value} m`, remark, '', fixedRear, { count, value, sides: /including rear/i.test(flexibleText) ? ['rear', 'left', 'right'] : ['left', 'right'] });
  }
  if (![rear, side].some(Number.isFinite)) return review('The active margin row has no numeric rear or side values.');
  return result(Number.isFinite(rear) ? `${rear} m` : 'Not specified', Number.isFinite(side) ? `${side} m` : 'Not specified', remark, '', { rear, left: side, right: side });
}

function heightRuleFor(category, authorityCode, developmentArea, roadWidth, buildingUse, schedules) {
  if (category === 'D9') {
    const useLabel = /residential/i.test(buildingUse ?? '') ? 'Residential'
      : /commercial/i.test(buildingUse ?? '') ? 'Commercial'
        : /industrial/i.test(buildingUse ?? '') ? 'Industrial' : null;
    const row = useLabel && schedules.find((item) => item.tableNumber === '6.19' && !item.isDeleted && (item.parsedData?.useText ?? item.sourceCells?.[1]) === useLabel);
    return row ? {
      tableNumber: row.tableNumber,
      sourceCells: row.sourceCells,
      maximumBuildingHeightText: String(row.sourceCells?.[4] ?? row.parsedData?.maximumHeightM ?? row.parsedData?.maximumHeightText ?? '').match(/[\d.]+/)?.[0] ?? '',
      roadWidthLabel: useLabel,
      industrialNote: row.parsedData?.additionalHeightNote ?? '',
    } : null;
  }
  const rows = schedules.filter((item) => item.tableNumber === '6.23' && !item.isDeleted).map((item) => ({ ...item, ...(item.parsedData ?? {}), roadWidthLabel: item.sourceCells?.[2] ?? item.roadWidthLabel, maximumBuildingHeightText: item.sourceCells?.[3] ?? item.maximumBuildingHeightText }));
  let categoryRow;
  if (category === 'D1') {
    const isRuda = authorityCode === 'RUDA' || /\bRUDA\b/i.test(developmentArea);
    if (authorityCode === 'GMC' || (authorityCode === 'GUDA' && !/non[\s-]?gmc/i.test(developmentArea)) || (/\bGMC\b/i.test(developmentArea) && !/non[\s-]?gmc/i.test(developmentArea))) return null;
    categoryRow = rows.find((row) => isRuda ? /D1-RUDA/i.test(row.sourceCells[0]) : /D1 except GMC/i.test(row.sourceCells[0]));
  } else categoryRow = rows.find((row) => row.categoryCodes.includes(category));
  if (!categoryRow) return null;
  return rows.find((row) => {
    if (!(row.sourceCells?.[0] === categoryRow.sourceCells?.[0] || row.authorityScope === categoryRow.authorityScope)) return false;
    const label = row.sourceCells?.[2] ?? row.sourceCells?.[1] ?? '';
    const values = [...String(label).matchAll(/[\d.]+/g)].map(([value]) => Number(value));
    const min = values[0] ?? Number(row.roadWidthMinMeters ?? 0);
    const max = /less than|below|under/i.test(label) ? values.at(-1) : values.length > 1 ? values.at(-1) + 0.1 : row.roadWidthMaxExclusiveMeters != null ? Number(row.roadWidthMaxExclusiveMeters) : null;
    return roadWidth >= min && (max == null || roadWidth < max);
  }) ?? null;
}

function FsiCalculator() {
  const [calculatorConfig, setCalculatorConfig] = useState({ zones: zoneTableFallback.rows, roadWidths: [], schedules: [], fsiRows: [] });
  const [zoneDataSource, setZoneDataSource] = useState('loading');
  const [developmentCategories, setDevelopmentCategories] = useState([]);
  const [authorityDataState, setAuthorityDataState] = useState({ loading: true, error: '' });
  const [useCodeRows, setUseCodeRows] = useState([]);
  const [useCodeDataState, setUseCodeDataState] = useState({ loading: true, error: '' });
  const [form, setForm] = useState({ developmentCategory: '', developmentAuthority: '', developmentArea: '', zone: '', plotArea: '', buildingUse: '', buildingUseCode: '' });
  const [roadWidths, setRoadWidths] = useState({ front: '', left: '', right: '', rear: '' });
  const [marginInputs, setMarginInputs] = useState({ buildingUnitArea: '', buildingHeight: '', specialBuilding: false });
  const [distanceFromWideRoad, setDistanceFromWideRoad] = useState('');
  const [state, setState] = useState({ loading: false, result: null, error: '' });
  const [permissibleUseCode, setPermissibleUseCode] = useState('');
  const [authorityQuery, setAuthorityQuery] = useState('');
  const [activePart, setActivePart] = useState('fsi');
  const lastFsiRequest = useRef(null);
  const configSignature = useRef('');
  const fsiSignature = useRef('');
  const authoritySignature = useRef('');
  const useCodeSignature = useRef('');
  useEffect(() => {
    let active = true;
    let loading = false;
    const refreshConfig = async () => {
      if (loading) return;
      loading = true;
      try {
        const [configResult, authoritiesResult, usesResult] = await Promise.allSettled([
          api.get('/calculator-configuration'), api.get('/development-authorities'), api.get('/calculator-use-codes'),
        ]);
        if (!active) return;
        if (configResult.status === 'fulfilled' && configResult.value.data?.data) {
          const nextConfig = configResult.value.data.data;
          const nextSignature = JSON.stringify({ fsiRows: nextConfig.fsiRows ?? [], schedules: nextConfig.schedules ?? [], zones: nextConfig.zones ?? [], roadWidths: nextConfig.roadWidths ?? [] });
          if (JSON.stringify(nextConfig) !== configSignature.current) setCalculatorConfig(nextConfig);
          setZoneDataSource(configResult.value.data.zoneSource ?? 'dashboard');
          if (fsiSignature.current && fsiSignature.current !== nextSignature && lastFsiRequest.current) {
            api.post('/calculations/fsi', lastFsiRequest.current).then((response) => {
              if (active && lastFsiRequest.current) setState({ loading: false, result: response.data, error: '' });
            }).catch(() => {});
          }
          configSignature.current = JSON.stringify(nextConfig);
          fsiSignature.current = nextSignature;
        }
        if (authoritiesResult.status === 'fulfilled' && Array.isArray(authoritiesResult.value.data?.data)) {
          const categories = authoritiesResult.value.data.data;
          const signature = JSON.stringify(categories);
          if (signature !== authoritySignature.current) {
            setDevelopmentCategories(categories);
            authoritySignature.current = signature;
          }
          setAuthorityDataState((current) => current.loading || current.error ? { loading: false, error: '' } : current);
        } else setAuthorityDataState((current) => current.loading ? { loading: false, error: 'Authority data could not be loaded.' } : current);
        if (usesResult.status === 'fulfilled' && Array.isArray(usesResult.value.data?.data)) {
          const rows = usesResult.value.data.data;
          const signature = JSON.stringify(rows);
          if (signature !== useCodeSignature.current) { setUseCodeRows(rows); useCodeSignature.current = signature; }
          setUseCodeDataState((current) => current.loading || current.error ? { loading: false, error: '' } : current);
        } else setUseCodeDataState((current) => current.loading ? { loading: false, error: 'Building use data could not be loaded.' } : current);
      } catch {
        if (!configSignature.current) {
          setCalculatorConfig((current) => ({ ...current, zones: zoneTableFallback.rows }));
          setZoneDataSource('fallback');
        }
      }
      finally { loading = false; }
    };
    refreshConfig();
    const interval = window.setInterval(refreshConfig, 5000);
    window.addEventListener('focus', refreshConfig);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refreshConfig); };
  }, []);
  const clearResult = () => { lastFsiRequest.current = null; setState({ loading: false, result: null, error: '' }); };
  const set = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); clearResult(); };
  const setDevelopmentArea = (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, developmentArea: value, ...(authorityCode === 'GUDA' ? { zone: '' } : {}) }));
    clearResult();
  };
  const setRoadWidth = (side) => (event) => { setRoadWidths((current) => ({ ...current, [side]: event.target.value })); clearResult(); };
  const setMarginInput = (key) => (event) => { setMarginInputs((current) => ({ ...current, [key]: key === 'specialBuilding' ? event.target.checked : event.target.value })); };
  const authorityCode = form.developmentAuthority.match(/\(([^)]+)\)$/)?.[1] ?? form.developmentAuthority;
  const activeZones = calculatorConfig.zones.map((row) => ({ ...row, zone: row.useZone ?? row.zone }));
  const selectedZones = activeZones.filter((zone) => (zone.appliesToCategories ?? []).includes(form.developmentCategory));
  const selectedZone = selectedZones.find(({ zone }) => zone === form.zone);
  const selectedZoneUseCodes = selectedZone ? getPermissibleUseCodes(selectedZone, useCodeRows, activeZones) : [];
  const selectedRoadWidth = Number(roadWidths.front) || 0;
  const widthControl = selectedRoadWidth > 0
    ? calculatorConfig.roadWidths.find((row) => !row.isDeleted && selectedRoadWidth >= Number(row.roadWidthMinMeters) && (row.roadWidthMaxExclusiveMeters == null || selectedRoadWidth < Number(row.roadWidthMaxExclusiveMeters)))
    : null;
  const roadWidthUseCodes = selectedZone && ['CW', 'GM'].includes(selectedZone.code)
    ? widthControl?.coreEffectiveUseCodes
    : widthControl ? [...(widthControl.otherEffectiveUseCodes ?? []), ...(widthControl.otherConditionalUseCodes ?? [])] : null;
  const selectedUseCodes = roadWidthUseCodes ? selectedZoneUseCodes.filter((code) => roadWidthUseCodes.includes(code)) : selectedZoneUseCodes;
  const availableBuildingUses = selectedZone ? useCodeRows.filter(({ code }) => selectedUseCodes.includes(code)) : useCodeRows;
  const activeUseCode = selectedUseCodes.includes(permissibleUseCode) ? permissibleUseCode : (selectedUseCodes[0] ?? '');
  const activeUseDetails = useCodeRows.find(({ code }) => code === activeUseCode);
  const selectedBuildingUse = useCodeRows.find(({ code }) => code === form.buildingUseCode);
  const selectedCategory = developmentCategories.find(({ code }) => code === form.developmentCategory);
  const setCategory = (event) => {
    setForm((current) => ({ ...current, developmentCategory: event.target.value, developmentAuthority: '', developmentArea: '', zone: '', buildingUse: '', buildingUseCode: '' }));
    setAuthorityQuery(''); setRoadWidths({ front: '', left: '', right: '', rear: '' }); setPermissibleUseCode(''); clearResult();
  };
  const searchAuthorities = (query) => { setAuthorityQuery(query); setForm((current) => ({ ...current, developmentAuthority: '', zone: '' })); setPermissibleUseCode(''); clearResult(); };
  const selectAuthority = ({ authority, categoryCode }) => {
    const categoryChanged = categoryCode !== form.developmentCategory;
    setForm((current) => ({ ...current, developmentCategory: categoryCode, developmentAuthority: authority, developmentArea: categoryChanged ? '' : current.developmentArea, zone: '' }));
    setAuthorityQuery(authority);
    if (categoryChanged) setRoadWidths({ front: '', left: '', right: '', rear: '' });
    setPermissibleUseCode(''); clearResult();
  };
  const setZone = (event) => { setForm((current) => ({ ...current, zone: event.target.value })); setPermissibleUseCode(''); clearResult(); };
  const setBuildingUseCode = (event) => {
    const code = event.target.value;
    const use = useCodeRows.find((row) => row.code === code);
    const normalizedUse = code.startsWith('DW') ? 'Residential' : code.startsWith('M') ? 'Commercial' : code.startsWith('IN') ? 'Industrial' : code.startsWith('AG') ? 'Agricultural' : use?.classification ?? '';
    setForm((current) => ({ ...current, buildingUseCode: code, buildingUse: normalizedUse }));
    clearResult();
  };
  const buildingUseField = form.developmentCategory === 'D9'
    ? <label><span>Building use <span className="required-asterisk" aria-hidden="true">*</span></span><select required value={form.buildingUse} onChange={set('buildingUse')}><option value="">Choose a building use</option><option value="Residential">Residential</option><option value="Commercial">Commercial</option><option value="Industrial">Industrial</option><option value="Public">Public use</option></select></label>
    : <label><span>Building use <span className="required-asterisk" aria-hidden="true">*</span></span><select required value={form.buildingUseCode} onChange={setBuildingUseCode} disabled={useCodeDataState.loading || Boolean(useCodeDataState.error)}><option value="">{useCodeDataState.loading ? 'Loading building uses…' : 'Choose a building use'}</option>{availableBuildingUses.map(({ code, classification }) => <option key={code} value={code}>{code} — {classification}</option>)}</select>{selectedBuildingUse&&<small className="field-hint"><b>{selectedBuildingUse.classification} ({selectedBuildingUse.code}):</b> {cleanRuleReference(selectedBuildingUse.permittedUses)}</small>}</label>;
  const roadWidthValues = Object.fromEntries(Object.entries(roadWidths).filter(([, value]) => value !== '').map(([side, value]) => [side, Number(value)]));
  const rearSideMarginAssessment = getRearSideMarginAssessment({ category: form.developmentCategory, authorityCode, developmentArea: form.developmentArea, zoneCode: selectedZone?.code, plotArea: form.plotArea, buildingUnitArea: marginInputs.buildingUnitArea, buildingHeight: marginInputs.buildingHeight, buildingUse: form.buildingUse, buildingUseCode: form.buildingUseCode, specialBuilding: marginInputs.specialBuilding, schedules: calculatorConfig.schedules });
  const effectiveRoadWidth = Math.max(0, ...Object.values(roadWidthValues));
  const heightRows = form.developmentCategory === 'D9'
    ? [{ side: 'D9', width: null, rule: heightRuleFor(form.developmentCategory, authorityCode, form.developmentArea, 0, form.buildingUse, calculatorConfig.schedules) }]
    : Object.entries(roadWidthValues).map(([side, width]) => ({ side, width, rule: heightRuleFor(form.developmentCategory, authorityCode, form.developmentArea, width, form.buildingUse, calculatorConfig.schedules) }));
  const submit = async () => {
    setState({ loading: true, result: null, error: '' });
    if (!form.developmentCategory) { setState({ loading: false, result: null, error: 'Choose a development authority and area category.' }); return; }
    if (!form.developmentAuthority) { setState({ loading: false, result: null, error: 'Choose a development authority / ULB from the search results.' }); return; }
    if (!selectedCategory?.authorities.some((authority) => (typeof authority === 'string' ? authority : authority.name) === form.developmentAuthority)) { setState({ loading: false, result: null, error: 'Choose an authority or area from the search results.' }); return; }
    if (authorityCode === 'GUDA' && !/^(?:GMC|Non[\s-]?GMC)$/i.test(form.developmentArea.trim())) { setState({ loading: false, result: null, error: 'For GUDA, enter exactly “GMC” or “Non-GMC” in Development area before choosing the zone.' }); return; }
    if (!selectedZone) { setState({ loading: false, result: null, error: 'Choose a use zone before calculating FSI.' }); return; }
    if (form.developmentCategory === 'D9' && !form.buildingUse) { setState({ loading: false, result: null, error: 'Select a building use: Residential, Commercial, Industrial, or Public.' }); return; }
    if (form.developmentCategory !== 'D9' && !form.buildingUseCode) { setState({ loading: false, result: null, error: 'Select a building use.' }); return; }
    if (form.developmentCategory !== 'D9' && !selectedUseCodes.includes(form.buildingUseCode)) { setState({ loading: false, result: null, error: 'Choose a building use permitted for the selected zone and road width.' }); return; }
    if (!form.plotArea || Number(form.plotArea) <= 0) { setState({ loading: false, result: null, error: 'Enter the plot area.' }); return; }
    if (!roadWidths.front || Number(roadWidths.front) <= 0) { setState({ loading: false, result: null, error: 'Enter the front road width.' }); return; }
    try {
      const payload = { ...form, conceptualisedZone: selectedZone?.conceptualisedZone ?? '', zoneCode: selectedZone?.code ?? '', permissibleUse: selectedZone?.permissibleUse ?? '', permissibleUseCode: activeUseCode, buildingUse: form.buildingUse || undefined, buildingUseCode: form.buildingUseCode || undefined, plotArea: Number(form.plotArea), roadWidth: effectiveRoadWidth, roadWidths: roadWidthValues, ...(distanceFromWideRoad !== '' ? { distanceFromWideRoad: Number(distanceFromWideRoad) } : {}) };
      lastFsiRequest.current = payload;
      const response = await api.post('/calculations/fsi', payload);
      setState({ loading: false, result: response.data, error: '' });
    } catch (error) { setState({ loading: false, result: null, error: getApiErrorMessage(error) }); }
  };
  const parts = [
    { id: 'fsi', number: '01', title: 'FSI', subtitle: 'Base, chargeable and maximum permissible floor area' },
    { id: 'margins', number: '02', title: 'Margins', subtitle: 'Road-side, rear and side margin checks' },
    { id: 'height', number: '03', title: 'Height', subtitle: 'Maximum height for each abutting road' },
  ];
  const activePartInfo = parts.find((part) => part.id === activePart);
  const renderFsiResult = () => state.error ? <StateNotice tone="error">{cleanRuleReference(state.error)}</StateNotice> : state.loading ? <div className="panel-state">Resolving authority, zone, plot size, and applicable FSI parameters…</div> : state.result?.status === 'CALCULATED' ? <><div className="fsi-result-summary"><small>Maximum permissible FSI</small><b>{state.result.calculation.maximumFsi.toFixed(2)}</b></div><div className="fsi-result-breakdown"><span>Base (free) FSI <b>{state.result.calculation.baseFsi == null ? 'Not specified' : state.result.calculation.baseFsi.toFixed(2)}</b></span><span>Chargeable FSI <b>{state.result.calculation.chargeableFsi == null ? 'Not specified' : state.result.calculation.chargeableFsi.toFixed(2)}</b></span><span>Base built-up area <b>{state.result.calculation.baseBuiltUpArea == null ? 'Not specified' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(state.result.calculation.baseBuiltUpArea)} m²`}</b></span><span>Chargeable built-up area <b>{state.result.calculation.chargeableBuiltUpArea == null ? 'Not specified' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(state.result.calculation.chargeableBuiltUpArea)} m²`}</b></span><span>Maximum built-up area <b>{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(state.result.calculation.maximumBuiltUpArea)} m²</b></span></div>{state.result.calculation.notes.map((note) => <p className="fsi-result-note" key={note}>{cleanRuleReference(note)}</p>)}<p className="fsi-result-note">{cleanRuleReference(state.result.calculation.chargeableBasis)}</p>{state.result.sources.map((source) => <div className="result-reference" key={source.document}><FileText size={15}/><span>{cleanRuleReference(source.document)}</span></div>)}</> : state.result ? <><div className="result-unresolved"><span className="warning-symbol">!</span><div><b>Verified result unavailable</b><small>{cleanRuleReference(state.result.message)}</small></div></div><div className="missing-list"><b>What remains unresolved</b>{state.result.missingInformation.map((item) => <p key={item}><span>•</span>{cleanRuleReference(item)}</p>)}</div><div className="result-reference"><FileText size={15}/><span>No verified regulation or source-page references are available for these inputs.</span></div></> : <div className="result-empty"><Calculator size={22}/><b>FSI calculation is ready</b><p>Complete the shared site details, then calculate to match the authority, zone, permitted use, and road widths to a verified schedule.</p></div>;
  return <AppShell><div className="workspace-page plot-feasibility-page">
    <div className="page-kicker">BUILD RULE GUJARAT <span>/</span> PLOT FEASIBILITY</div>
    <div className="page-title-row"><div><h1>Land/Plot Feasibility Calculator</h1><p>Enter the site details once, then review FSI, margins, and height in separate checks.</p></div><span className="source-status-tag"><ShieldCheck size={14}/> SOURCE-LINKED</span></div>
    <section className="site-context-card"><div className="site-context-heading"><div><span className="panel-label">SHARED SITE INPUTS</span><h2>Site and development context</h2><p>These details are shared across all three checks.</p></div><span className="site-context-badge">{form.developmentCategory || 'CATEGORY'}{selectedZone ? ` · ${selectedZone.code}` : ''}</span></div>
      <div className="site-context-grid">
        <label><span>Development authority &amp; area category <span className="required-asterisk" aria-hidden="true">*</span></span><select required value={form.developmentCategory} onChange={setCategory} disabled={authorityDataState.loading || Boolean(authorityDataState.error)}><option value="">{authorityDataState.loading ? 'Loading categories…' : developmentCategories.length ? 'Choose a category' : 'No active categories'}</option>{developmentCategories.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}</select></label>
        <label><span>Development authority / ULB <span className="required-asterisk" aria-hidden="true">*</span></span><AuthoritySearchSelect categories={developmentCategories} categoryCode={form.developmentCategory} value={form.developmentAuthority} query={authorityQuery} onQueryChange={searchAuthorities} onSelect={selectAuthority} disabled={authorityDataState.loading || Boolean(authorityDataState.error)}/></label>
        <label>Development area {authorityCode === 'GUDA' && <span className="required-label">REQUIRED · GMC OR NON-GMC</span>}<input maxLength="160" value={form.developmentArea} onChange={setDevelopmentArea} placeholder={authorityCode === 'GUDA' ? 'Enter exactly GMC or Non-GMC' : 'Plan area, industrial estate, or other area name'}/>{authorityCode === 'GUDA'&&<small className="field-hint">GUDA zones and applicable FSI, margin, and height rules depend on this selection. Set it before choosing a zone.</small>}</label>
        <label><span>Use zone / general land use <span className="required-asterisk" aria-hidden="true">*</span></span><select required value={form.zone} onChange={setZone} disabled={!form.developmentAuthority}><option value="">{form.developmentAuthority ? 'Select a Zone' : 'Select an authority first'}</option>{selectedZones.map(({ zone, code }) => <option key={`${code}-${zone}`} value={zone}>{zone}</option>)}</select>{zoneDataSource === 'dashboard'&&<small className="field-hint">Loaded from active dashboard rows.</small>}{zoneDataSource === 'fallback'&&<small className="field-hint">Dashboard zone data is unavailable; showing the built-in zone list.</small>}</label>
        <label><span>Plot area (m²) <span className="required-asterisk" aria-hidden="true">*</span></span><input required type="number" min="0.01" step="any" value={form.plotArea} onChange={set('plotArea')} placeholder="e.g. 500"/></label>
        {buildingUseField}
      </div>
      {authorityDataState.error&&<StateNotice tone="error">Could not load categories and authorities: {authorityDataState.error}</StateNotice>}
      {useCodeDataState.error&&<StateNotice tone="error">Could not load building uses: {useCodeDataState.error}</StateNotice>}
      {selectedZone&&<details className="site-zone-details"><summary>Selected zone details · {selectedZone.code}</summary><div className="site-zone-summary"><span><b>Conceptualised zone</b>{selectedZone.conceptualisedZone}</span><span><b>Zone code</b>{selectedZone.code}</span><span className="site-permissible-use"><b>Permissible uses</b>{cleanRuleReference(selectedZone.permissibleUse)}</span>{selectedUseCodes.length>0&&<><label>Permitted use code<select value={activeUseCode} onChange={(event)=>{setPermissibleUseCode(event.target.value);clearResult();}}>{selectedUseCodes.map((code)=><option key={code} value={code}>{code}{useCodeRows.find((row)=>row.code===code)?` — ${useCodeRows.find((row)=>row.code===code).classification}`:''}</option>)}</select></label><div className="site-selected-use-detail" aria-live="polite"><b>Building use details{activeUseCode?` · ${activeUseCode}`:''}</b>{activeUseDetails?<><strong>{activeUseDetails.classification}</strong><p>{cleanRuleReference(activeUseDetails.permittedUses)}</p></>:<p>Detailed description for this code is not available.</p>}</div></>}</div></details>}
      <div className="site-road-widths"><div><b>Abutting road widths</b><small>Enter every road adjoining the plot; leave other sides blank.</small></div><div className="road-width-grid">{[['front','Front'],['left','Left'],['right','Right'],['rear','Rear']].map(([side,label])=><label key={side}><span>{label} road (m){side==='front'&&<> <span className="required-asterisk" aria-hidden="true">*</span></>}</span><input required={side==='front'} type="number" min="0.01" step="any" value={roadWidths[side]} onChange={setRoadWidth(side)} placeholder={side==='front'?'e.g. 12':'Not abutting'}/></label>)}</div></div>
      <label className="wide-road-distance-field">Distance from the edge of the qualifying 36 m+ road (m)<input type="number" min="0" step="any" value={distanceFromWideRoad} onChange={(event)=>{setDistanceFromWideRoad(event.target.value);clearResult();}} placeholder="Enter only if within or near 200 m"/><small className="field-hint">For D1, D2, D4, and D7A sites with base FSI ≥ 1.5 and a 36 m+ road, enter the distance from the road edge. This provision applies within 200 m, subject to its listed exceptions.</small></label>
    </section>
    <nav className="feasibility-part-tabs" aria-label="Plot feasibility checks" role="tablist">{parts.map((part)=><button key={part.id} className={`feasibility-part-tab${activePart===part.id?' is-active':''}`} type="button" role="tab" aria-selected={activePart===part.id} aria-controls={`feasibility-${part.id}`} onClick={()=>setActivePart(part.id)}><span>{part.number}</span><b>{part.title}</b><small>{part.subtitle}</small></button>)}</nav>
    <section id={`feasibility-${activePart}`} className="feasibility-part-panel" role="tabpanel"><div className="feasibility-part-heading"><div><span className="panel-label">PART {activePartInfo.number}</span><h2>{activePartInfo.title}</h2><p>{activePartInfo.subtitle}</p></div>{activePart==='fsi'&&<button className="button button-primary feasibility-action" type="button" onClick={submit} disabled={state.loading}>{state.loading?'Calculating…':'Calculate FSI'} <ArrowRight size={15}/></button>}</div>
      {activePart==='fsi'&&<div className="feasibility-result-body">{renderFsiResult()}<small className="form-disclaimer">Preliminary estimate. Special conditions and Jantri charges may require authority review.</small></div>}
      {activePart==='margins'&&<div className="feasibility-result-body">
        <div className="margin-input-grid">
          {(form.developmentCategory === 'D6' || (form.developmentCategory === 'D1' && authorityCode === 'RUDA' && (form.buildingUseCode === 'DW3' || (Number(roadWidths.front) > 30 && Number(roadWidths.front) < 45)))) && <label>Building-unit area (m²)<input type="number" min="0.01" step="any" value={marginInputs.buildingUnitArea} onChange={setMarginInput('buildingUnitArea')} placeholder="Enter building-unit area"/></label>}
          {form.developmentCategory !== 'D9' && <label>Building height (m)<input type="number" min="0.01" step="any" value={marginInputs.buildingHeight} onChange={setMarginInput('buildingHeight')} placeholder="Enter proposed height"/><small>Used where rear and side margins depend on building height.</small></label>}
          {form.developmentCategory !== 'D9' && <label className="margin-special-toggle"><input type="checkbox" checked={marginInputs.specialBuilding} onChange={setMarginInput('specialBuilding')}/> Special building</label>}
        </div>
        <RoadMarginDiagram category={form.developmentCategory} authority={form.developmentAuthority} area={form.developmentArea} zoneCode={selectedZone?.code} roadWidths={roadWidths} plotArea={form.plotArea} buildingUse={form.buildingUse} buildingUnitArea={marginInputs.buildingUnitArea} buildingHeight={marginInputs.buildingHeight} rearSideAssessment={rearSideMarginAssessment} schedules={calculatorConfig.schedules}/>
      </div>}
      {activePart==='height'&&<div className="feasibility-result-body"><div className="height-result-list">{heightRows.length?heightRows.map(({side,width,rule})=><article className="height-result-row" key={side}><div><small>{form.developmentCategory === 'D9' ? 'CATEGORY D9' : `${side.toUpperCase()} ROAD`}</small><b>{form.developmentCategory === 'D9' ? (form.buildingUse || 'Select building use') : `${width} m`}</b></div><span className="height-result-arrow">→</span><div className="height-result-value">{rule?<><small>{rule.tableNumber === '6.19' ? 'MAXIMUM HEIGHT' : 'MAXIMUM HEIGHT'}</small><b>{rule.maximumBuildingHeightText} m</b><span>{rule.tableNumber === '6.19' ? `${rule.roadWidthLabel} use` : `${rule.sourceCells[0]} · ${rule.roadWidthLabel}`}</span>{rule.industrialNote&&<span>{cleanRuleReference(rule.industrialNote)}</span>}</>:<><small>{form.developmentCategory === 'D9' ? 'BUILDING USE REQUIRED' : 'NO MATCHING ROW'}</small><b>{form.developmentCategory === 'D9' ? (form.buildingUse ? 'Height result unavailable' : 'Choose a building use') : 'Unresolved'}</b><span>{form.developmentCategory === 'D9' ? 'Available height values cover Residential, Commercial, and Industrial uses.' : 'This category or authority scope is not covered by the supplied height schedule.'}</span></>}</div></article>):<div className="result-empty"><Calculator size={22}/><b>Enter a road width and category</b><p>Height is matched to each abutting road separately.</p></div>}</div>{form.developmentCategory === 'D9' ? <details className="height-source-notes" open={Boolean(form.buildingUse?.toLowerCase().includes('industrial'))}><summary>Notes and provisions</summary><p>A maximum height of 13.00 m for Residential, Commercial, and Industrial use. Additional height for industrial purposes requires approval by the Factory Inspector.</p></details> : <details className="height-source-notes"><summary>Notes and provisions</summary><ul>{buildingHeightSource.table.notes.map((note,index)=><li key={`note-${index}`}>{cleanRuleReference(note)}</li>)}{buildingHeightSource.generalProvisions[0].sourceText.map((note,index)=><li key={`rule-${index}`}>{cleanRuleReference(note)}</li>)}</ul></details>}</div>}
    </section>
  </div></AppShell>;
}
function ComplianceChecker() {
  const [form, setForm] = useState({ projectName: '', developmentAuthority: '', zone: '', plotArea: '', roadWidth: '', landUse: '', buildingUse: '', buildingHeight: '', numberOfFloors: '', proposedBuiltUpArea: '', groundCoverage: '', parkingDetails: '' });
  const [state, setState] = useState({ loading: false, result: null, error: '' });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setState({ loading: true, result: null, error: '' });
    const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '').map(([key, value]) => [key, ['plotArea','roadWidth','buildingHeight','numberOfFloors','proposedBuiltUpArea','groundCoverage'].includes(key) ? Number(value) : value]));
    try { const response = await api.post('/assessments', body); setState({ loading: false, result: response.data, error: '' }); }
    catch (error) { setState({ loading: false, result: null, error: getApiErrorMessage(error) }); }
  };
  return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> PRELIMINARY ASSESSMENT</div><div className="page-title-row"><div><h1>Building compliance checker</h1><p>Capture project and site details. Each check requires an applicable, verified provision.</p></div><span className="source-status-tag"><ShieldCheck size={14}/> PRELIMINARY ONLY</span></div><div className="tool-layout compliance-layout"><form className="form-panel" onSubmit={submit}><div className="panel-label">PROJECT AND SITE DETAILS</div><label>Project name<input maxLength="160" value={form.projectName} onChange={set('projectName')} placeholder="Project name"/></label><div className="field-pair"><label>Development authority<input maxLength="160" value={form.developmentAuthority} onChange={set('developmentAuthority')} placeholder="Authority"/></label><label>Zone<input maxLength="120" value={form.zone} onChange={set('zone')} placeholder="Zone"/></label></div><div className="field-pair"><label>Plot area <span>(m²)</span><input type="number" min="0.01" step="any" value={form.plotArea} onChange={set('plotArea')}/></label><label>Road width <span>(m)</span><input type="number" min="0.01" step="any" value={form.roadWidth} onChange={set('roadWidth')}/></label></div><div className="panel-label form-subsection">BUILDING DETAILS</div><div className="field-pair"><label>Land use<input maxLength="120" value={form.landUse} onChange={set('landUse')} placeholder="Designation"/></label><label>Building use<input maxLength="120" value={form.buildingUse} onChange={set('buildingUse')} placeholder="Occupancy or use"/></label></div><div className="field-pair"><label>Building height <span>(m)</span><input type="number" min="0.01" step="any" value={form.buildingHeight} onChange={set('buildingHeight')}/></label><label>Number of floors<input type="number" min="1" step="1" value={form.numberOfFloors} onChange={set('numberOfFloors')}/></label></div><div className="field-pair"><label>Proposed built-up area <span>(m²)</span><input type="number" min="0.01" step="any" value={form.proposedBuiltUpArea} onChange={set('proposedBuiltUpArea')}/></label><label>Ground coverage <span>(m²)</span><input type="number" min="0.01" step="any" value={form.groundCoverage} onChange={set('groundCoverage')}/></label></div><label>Parking details<input maxLength="500" value={form.parkingDetails} onChange={set('parkingDetails')} placeholder="Optional details"/></label><button className="button button-primary form-submit" type="submit" disabled={state.loading}>{state.loading ? 'Checking available rules…' : 'Run preliminary assessment'} <ArrowRight size={15}/></button></form>
    <div className="result-panel assessment-result"><div className="panel-label">ASSESSMENT STATUS</div>{state.error ? <StateNotice tone="error">{cleanRuleReference(state.error)}</StateNotice> : state.loading ? <div className="panel-state">Checking source availability and applicability…</div> : state.result ? <><div className="assessment-status"><span className="warning-symbol">!</span><div><b>Insufficient information</b><small>No compliance or non-compliance finding has been established.</small></div></div><div className="missing-list"><b>Why this assessment is unresolved</b>{state.result.missingInformation.map((item) => <p key={item}><span>•</span>{cleanRuleReference(item)}</p>)}</div><div className="result-reference"><FileText size={15}/><span>0 findings · no source provisions have been verified for this assessment.</span></div></> : <div className="result-empty"><FileCheck2 size={22}/><b>Findings will be listed here</b><p>Each finding will include the supplied value, applicable requirement, result, and source PDF page. Missing information will stay unresolved.</p></div>}</div></div></div></AppShell>;
}

function PermissionGuide() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => { let active = true; api.get('/permission-guide').then((response) => active && setState({ loading: false, data: response.data, error: '' })).catch((error) => active && setState({ loading: false, data: null, error: getApiErrorMessage(error) })); return () => { active = false; }; }, []);
  return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> PROCEDURE GUIDE</div><div className="page-title-row"><div><h1>Development permission guide</h1><p>Procedural stages are being mapped to the supplied Part I source provisions.</p></div><span className="source-status-tag"><FileText size={14}/> PART I</span></div>{state.loading ? <div className="panel-state">Checking reviewed procedure records…</div> : state.error ? <StateNotice tone="error">{state.error}</StateNotice> : <div className="guide-pending"><div className="guide-icon"><Layers3 size={20}/></div><div><span className="review-pill">{state.data.status}</span><h2>No verified stages are available yet.</h2><p>{state.data.message}</p><small>Source: {state.data.sourceDocument}. Page references will be displayed after review.</small></div></div>}</div></AppShell>;
}

function NotFound() { return <PlaceholderPage title="This page is not available" description="Choose a section from the navigation to continue." icon={CircleHelp}/>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/app" element={<Dashboard />} />
    <Route path="/regulations" element={<RegulationExplorer />} />
    <Route path="/search" element={<RegulationSearch />} />
    <Route path="/fsi-calculator" element={<FsiCalculator />} />
    <Route path="/compliance" element={<ComplianceChecker />} />
    <Route path="/permission-guide" element={<PermissionGuide />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
    <Route path="/reset-password" element={<AuthPage mode="reset" />} />
    <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
    <Route path="/admin" element={<AppShell><AdminDashboard /></AppShell>} />
    <Route path="/admin/review" element={<ReviewWorkbench />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
