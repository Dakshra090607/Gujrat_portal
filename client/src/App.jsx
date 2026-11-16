import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, getApiErrorMessage, setAccessToken } from './lib/api.js';
import ReviewWorkbench from './features/review/ReviewWorkbench.jsx';
import AdminDashboard from './features/admin/AdminDashboard.jsx';
import AuthPage from './features/auth/AuthPage.jsx';
import ProfilePage from './features/auth/ProfilePage.jsx';
import { authClient } from './lib/auth.js';
import {
  ArrowDownRight, ArrowRight, BookOpen, Building2, Calculator, CheckCircle2, LogOut,
  ChevronDown, CircleHelp, Compass, FileCheck2, FileText, Layers3, Menu,
  Search, ShieldCheck, Sparkles, X,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', to: '/app', icon: Compass },
  { label: 'Regulation explorer', to: '/regulations', icon: BookOpen },
  { label: 'Search regulations', to: '/search', icon: Search },
  { label: 'FSI calculator', to: '/fsi-calculator', icon: Calculator },
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

function Dashboard() { return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> OVERVIEW</div><div className="dashboard-title"><div><h1>Good afternoon.</h1><p>Your Gujarat regulatory workspace is ready to explore.</p></div><span className="date-chip">CGDCR · 2017</span></div><div className="dash-banner"><div><div className="eyebrow">REGULATORY DATA STATUS</div><h2>Source text extracted. Review is in progress.</h2><p>All three supplied documents are available. Candidate clauses and tables remain unverified and are not used for FSI or compliance results.</p><Link to="/regulations" className="banner-link">View extraction status <ArrowRight size={15} /></Link></div><div className="banner-stat"><b>292</b><span>PDF pages</span><small>across 3 source documents</small></div></div><div className="quick-grid">{navItems.slice(1).map(({label,to,icon:Icon},i)=><Link key={to} to={to} className="quick-card"><span className={`quick-icon quick-${i}`}><Icon size={19}/></span><span className="quick-overline">{['SOURCE PORTAL','REGULATORY SEARCH','DEVELOPMENT TOOL','PRELIMINARY CHECK','PROCEDURE','ADMINISTRATION'][i]}</span><b>{label}</b><small>{['Explore parts and extracted pages','Search page-linked source text','No verified FSI parameters yet','Checks require reviewed rules','Source-linked stages pending review','Review candidates and verify source-backed records'][i]}</small><ArrowRight size={16} className="quick-arrow"/></Link>)}</div><div className="dashboard-bottom"><div className="panel-card"><div className="panel-head"><div><span className="panel-label">RECENT ACTIVITY</span><h3>Pick up where you left off</h3></div><span className="soft-badge">LOCAL WORKSPACE</span></div><div className="activity-empty"><div className="activity-icon"><BookOpen size={18}/></div><div><b>Your activity will appear here</b><p>Browse source pages or start a project to build your workspace history.</p></div></div></div><div className="panel-card integrity-card"><span className="panel-label">DATA INTEGRITY</span><h3>Trace every provision.</h3><p>Original source, page reference, and review status stay visible as regulatory records are prepared.</p><div className="integrity-row"><ShieldCheck size={16}/><span>Unverified data excluded from calculations</span></div></div></div></div></AppShell>; }

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

function FsiCalculator() {
  const [form, setForm] = useState({ developmentAuthority: '', developmentArea: '', zone: '', plotArea: '', roadWidth: '', buildingUse: '' });
  const [state, setState] = useState({ loading: false, result: null, error: '' });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setState({ loading: true, result: null, error: '' });
    try { const response = await api.post('/calculations/fsi', { ...form, plotArea: Number(form.plotArea), roadWidth: Number(form.roadWidth) }); setState({ loading: false, result: response.data, error: '' }); }
    catch (error) { setState({ loading: false, result: null, error: getApiErrorMessage(error) }); }
  };
  return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> FSI CALCULATOR</div><div className="page-title-row"><div><h1>FSI calculator</h1><p>Enter the site context. The calculator will use only verified, applicable source parameters.</p></div><span className="source-status-tag"><ShieldCheck size={14}/> DETERMINISTIC</span></div><div className="tool-layout"><form className="form-panel" onSubmit={submit}><div className="panel-label">SITE AND DEVELOPMENT CONTEXT</div><label>Development authority<input required maxLength="160" value={form.developmentAuthority} onChange={set('developmentAuthority')} placeholder="Enter authority name"/></label><label>Development area <span className="optional-label">IF APPLICABLE</span><input maxLength="160" value={form.developmentArea} onChange={set('developmentArea')} placeholder="Development plan area"/></label><label>Zone<input required maxLength="120" value={form.zone} onChange={set('zone')} placeholder="Enter zone or land-use category"/></label><div className="field-pair"><label>Plot area <span>(m²)</span><input type="number" required min="0.01" step="any" value={form.plotArea} onChange={set('plotArea')} placeholder="e.g. 500"/></label><label>Road width <span>(m)</span><input type="number" required min="0.01" step="any" value={form.roadWidth} onChange={set('roadWidth')} placeholder="e.g. 12"/></label></div><label>Building use<input required maxLength="120" value={form.buildingUse} onChange={set('buildingUse')} placeholder="Residential, commercial, mixed…"/></label><button className="button button-primary form-submit" type="submit" disabled={state.loading}>{state.loading ? 'Checking applicable data…' : 'Establish applicable FSI'} <ArrowRight size={15}/></button><small className="form-disclaimer">Inputs are evaluated against the available regulatory data. A numeric result is withheld when verified rules are unavailable.</small></form>
    <div className="result-panel"><div className="panel-label">CALCULATION RESULT</div>{state.error ? <StateNotice tone="error">{state.error}</StateNotice> : state.loading ? <div className="panel-state">Resolving version, authority, zone, and applicable parameters…</div> : state.result ? <><div className="result-unresolved"><span className="warning-symbol">!</span><div><b>Verified result unavailable</b><small>{state.result.message}</small></div></div><div className="missing-list"><b>What remains unresolved</b>{state.result.missingInformation.map((item) => <p key={item}><span>•</span>{item}</p>)}</div><div className="result-reference"><FileText size={15}/><span>No verified regulation or source-page references are available for these inputs.</span></div></> : <div className="result-empty"><Calculator size={22}/><b>Your FSI breakdown will appear here</b><p>No universal FSI value is assumed. The calculator waits for verified provisions that match the authority, zone, use, and road width.</p></div>}</div></div></div></AppShell>;
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
    <div className="result-panel assessment-result"><div className="panel-label">ASSESSMENT STATUS</div>{state.error ? <StateNotice tone="error">{state.error}</StateNotice> : state.loading ? <div className="panel-state">Checking source availability and applicability…</div> : state.result ? <><div className="assessment-status"><span className="warning-symbol">!</span><div><b>Insufficient information</b><small>No compliance or non-compliance finding has been established.</small></div></div><div className="missing-list"><b>Why this assessment is unresolved</b>{state.result.missingInformation.map((item) => <p key={item}><span>•</span>{item}</p>)}</div><div className="result-reference"><FileText size={15}/><span>0 findings · no source provisions have been verified for this assessment.</span></div></> : <div className="result-empty"><FileCheck2 size={22}/><b>Findings will be listed here</b><p>Each finding will include the supplied value, applicable requirement, result, and source PDF page. Missing information will stay unresolved.</p></div>}</div></div></div></AppShell>;
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
