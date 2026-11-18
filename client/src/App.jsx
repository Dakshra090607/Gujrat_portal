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

function Dashboard() { return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> OVERVIEW</div><div className="dashboard-title"><div><h1>Good afternoon.</h1><p>Your Gujarat regulatory workspace is ready to explore.</p></div><span className="date-chip">CGDCR · 2017</span></div><div className="dash-banner"><div><div className="eyebrow">REGULATORY DATA STATUS</div><h2>Source text extracted. Review is in progress.</h2><p>All three supplied documents are available. Configured numeric CGDCR rows provide preliminary FSI estimates; unsupported cases and compliance findings remain unresolved pending review.</p><Link to="/regulations" className="banner-link">View extraction status <ArrowRight size={15} /></Link></div><div className="banner-stat"><b>292</b><span>PDF pages</span><small>across 3 source documents</small></div></div><div className="quick-grid">{navItems.slice(1).map(({label,to,icon:Icon},i)=><Link key={to} to={to} className="quick-card"><span className={`quick-icon quick-${i}`}><Icon size={19}/></span><span className="quick-overline">{['SOURCE PORTAL','REGULATORY SEARCH','DEVELOPMENT TOOL','PRELIMINARY CHECK','PROCEDURE','ADMINISTRATION'][i]}</span><b>{label}</b><small>{['Explore parts and extracted pages','Search page-linked source text','Preliminary table-based FSI estimates','Checks require reviewed rules','Source-linked stages pending review','Review candidates and verify source-backed records'][i]}</small><ArrowRight size={16} className="quick-arrow"/></Link>)}</div><div className="dashboard-bottom"><div className="panel-card"><div className="panel-head"><div><span className="panel-label">RECENT ACTIVITY</span><h3>Pick up where you left off</h3></div><span className="soft-badge">LOCAL WORKSPACE</span></div><div className="activity-empty"><div className="activity-icon"><BookOpen size={18}/></div><div><b>Your activity will appear here</b><p>Browse source pages or start a project to build your workspace history.</p></div></div></div><div className="panel-card integrity-card"><span className="panel-label">DATA INTEGRITY</span><h3>Trace every provision.</h3><p>Original source, page reference, and review status stay visible as regulatory records are prepared.</p><div className="integrity-row"><ShieldCheck size={16}/><span>Unsupported FSI cases remain unresolved</span></div></div></div></div></AppShell>; }

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

const DEVELOPMENT_CATEGORIES = [
  { code: 'D1', label: 'D1 — Urban Development Authorities', authorities: ['Ahmedabad Urban Development Authority (AUDA)', 'Gandhinagar Urban Development Authority (GUDA)', 'Surat Urban Development Authority (SUDA)', 'Vadodara Urban Development Authority (VUDA)', 'Rajkot Urban Development Authority (RUDA)'] },
  { code: 'D2', label: 'D2 — Urban / Area Development Authorities', authorities: ['Junagadh Urban Development Authority (JuUDA)', 'Jamnagar Area Development Authority (JADA)', 'Bhavnagar Area Development Authority (BADA)', 'Bharuch-Ankleshwar Urban Development Authority (BAUDA)'] },
  { code: 'D3', label: 'D3 — Seismic Zone V authorities / municipality', authorities: ['Bhuj Area Development Authority (BhuADA)', 'Bhachau Area Development Authority (BhaADA)', 'Rapar Area Development Authority (RADA)', 'Anjar Area Development Authority (AADA)', 'Mandvi (Kutch) Municipality'] },
  { code: 'D4', label: 'D4 — Other Urban / Area Development Authorities', authorities: ['Himmatnagar Urban Development Authority (HUDA)', 'Surendranagar-Wadhwan Urban Development Authority (SWUDA)', 'Morbi-Wankaner Urban Development Authority (MWUDA)', 'Bardoli Urban Development Authority (BUDA)', 'Navsari Urban Development Authority (NUDA)', 'Anand-Vidhyanagar-Karmasad Urban Development Authority (AVKUDA)'] },
  { code: 'D5', label: 'D5 — Special Project Area Development Authorities', authorities: ['Alang Area Development Authority (AlADA)', 'Ambaji Area Development Authority (AmADA)', 'Shamlaji Area Development Authority (ShADA)', 'Khambhaliya Area Development Authority'] },
  { code: 'D6', label: 'D6 — Gandhidham Development Authority', authorities: ['Gandhidham Development Authority'] },
  { code: 'D7A', label: 'D7A — Designated Area Development Authorities', authorities: ['Amreli', 'Botad', 'Godhra', 'Jetpur-Navagadh', 'Mahesana', 'Nadiad', 'Palanpur', 'Patan', 'Porbandar', 'Valsad', 'Vapi', 'Veraval-Patan', 'Bilimora', 'Borsad', 'Dabhoi', 'Dahod', 'Deesa', 'Dhangadhra', 'Dholka', 'Dhoraji', 'Gondal', 'Kadi', 'Keshod', 'Khambhat', 'Mahuva', 'Mangrol', 'Modasa', 'Okha', 'Palitana', 'Petlad', 'Savarkundala', 'Siddhapur', 'Una', 'Unjha', 'Upleta', 'Viramgam', 'Visnagar'] },
  { code: 'D7B', label: 'D7B — Designated Area Development Authorities', authorities: ['Ahawa (Dang)', 'Anklav', 'Bagasara', 'Balasinor', 'Barwara', 'Bavla', 'Becharaji', 'Bhayavdar', 'Chansma', 'Chhaya', 'Chhotaudepur', 'Chorwad', 'Dakor', 'Devgadhbaria', 'Dhandhuka', 'Dharampur', 'Dharmaj', 'Dwarka', 'Gandevi', 'Halol', 'Halwad', 'Idar', 'Jagadiya-Sultanpura', 'Jambusar', 'Jamjodhpur', 'Kalawad', 'Kalol (Godhra)', 'Kapadvanj', 'Karjan', 'Kathor', 'Kayavarohan', 'Kheda', 'Khedbrahma', 'Kodinar', 'Kosamba', 'Limbdi', 'Lunawda', 'Manavadar', 'Mandal', 'Mandvi (Surat)', 'Mansa', 'Matar', 'Pardi', 'Prantij', 'Radhanpur', 'Rajpipla', 'Ranpur', 'Sankheda', 'Santarampura', 'Savali', 'Shihor', 'Sojitra', 'Talod', 'Tarsadi', 'Thangadh', 'Udwada', 'Umargam', 'Umreth', 'Vadinar', 'Vadnagar', 'Vaghodia', 'Vaso', 'Vijapur', 'Vyara', 'Waghai (Dang)'] },
  { code: 'D8', label: 'D8 — Other municipalities', authorities: ['Other municipality (enter name in Development area)'] },
  { code: 'D9', label: 'D9 — GIDC industrial estates / areas', authorities: ['GIDC industrial estate / area (enter name in Development area)'] },
  { code: 'D10', label: 'D10 — All other areas', authorities: ['Other area (enter name in Development area)'] },
];

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

const TABLE_6_3_USES = {
  DW1: { classification: 'Dwelling-1', details: 'Detached dwelling unit, Clinic not having indoor treatment facility.' },
  DW2: { classification: 'Dwelling-2', details: 'Semi-detached dwelling unit, Row House, Tenement, Chawls, Farm House, Clinic not having indoor treatment facility, Cottage Industry (not involving use or installation of any kind which may create noise, vibration, fume or dust). Home occupant and cottage industry shall not be permitted in tenement dwelling/flats. Part of a residential building may be used for professional requirements, as office, by advocate, doctors, architects, engineers and chartered accountants and Jari Industry.' },
  DW3: { classification: 'Dwelling-3', details: 'Apartment, Hostel, Dharamshala, Pre-school and Affordable Housing.' },
  M1: { classification: 'Mercantile-1', details: 'Shop, Business, Restaurant, Shopping Centre, Light Home Workshop, LPG Cylinder Godown, Service Establishment, Clinic, Fitness Centre.' },
  M2: { classification: 'Mercantile-2', details: 'Shopping Mall, Laboratory, Nursing Home, Maternity Home, Kerosene Depot, Corporate Offices, Call Centres, Training Centres, CinePlex (maximum seating capacity of 40 seats).' },
  M3: { classification: 'Mercantile-3', details: 'Wholesale Market, Indoor Hospital, Diamond Industry, Wholesale Market and their ancillary uses, Activity Related to I.T.' },
  EDU1: { classification: 'Educational-1', details: 'Primary Schools, Secondary Schools, Higher Secondary Schools.' },
  EDU2: { classification: 'Educational-2', details: 'College, Polytechnic, University and ancillary use.' },
  AS1: { classification: 'Assembly-1', details: 'Community Hall, Banquet Hall, Town Hall.' },
  AS2: { classification: 'Assembly-2', details: 'Convention Centre, Exhibition Hall, Auditorium, Planetarium, Stadium, Museum, Exhibition Halls, Wadi.' },
  AS3: { classification: 'Assembly-3', details: 'Theatre, Cinema, Multiplex, Drive-in Cinema, Clubs, Golf Course.' },
  AS4: { classification: 'Assembly-4', details: 'Party Plot, Garden Restaurants.' },
  INST: { classification: 'Institutional', details: 'Research Centres. Dwelling-1, 2 and 3, Retail Shop and Restaurants as a part of Educational Institute up to 20% of Utilised FSI.' },
  REG: { classification: 'Religious', details: 'Temples, Church, Mosque, Gurudwara, Synagogue, Upashraya, Sant Niwas or any Religious Structure.' },
  HO: { classification: 'Hospitality', details: 'Bed and Breakfast, Guest House, Lodging and Boarding, Hotel, Motel, Serviced Apartment.' },
  SE: { classification: 'Service Establishment', details: 'Auto Repair, Workshop, Wood Workshop, Fabrication, Public-Garage.' },
  IN1: { classification: 'Industrial-1', details: 'All type of Light, Service Industries, Small Factories, Warehouses, Newspaper Printing Press, Concrete Batching Plant, stone cutting and polishing; Poultry Farm, Dairy, Assembly Plant, Shipping Recycling Unit, Scrap Processing/Cutting Unit, Scrap Sorting Yard, Industrial Row House.' },
  IN1A: { classification: 'Industrial-1A', details: 'All industries manufacturing tiles, feeting for bathroom and sanitary wares, ceramic, ceramic store, clay, glass and also ancillary industries related to manufacture of tiles, clay bricks, concrete blocks for paving and other materials and their utensils.' },
  IN2: { classification: 'Industrial-2', details: 'All Industries except Obnoxious and Hazardous Industries, Junk Yard, Textile Units, Ice Factory, Quarrying of Stone, Quarrying of Gravel, Quarrying of Clay, Dumping of Solid Waste, Steel re-rolling, Metal Manufacturing/Sorting etc., Oil Processing/Storage.' },
  IN3: { classification: 'Industrial-3', details: 'Slaughter House, Meat Processing Units, Leather Processing Units, Cold Storage, Oxygen Plant, Agro Industries, Packaging, Mechanical Engineering, Fly Ash.' },
  IN4: { classification: 'Industrial-4', details: 'Fuel Storage, Storage of inflammable materials, Thermal Power Plant, Power Plant, Gas Plant, Storage of Hazardous Materials, Obnoxious and Hazardous Industries, Chemical Industries, Obnoxious and Hazardous Uses, Dying House.' },
  ST: { classification: 'Storage', details: 'Warehouse, Godown, Cold Storage, Timber Mart, Steel Stockyard, Ice Factory.' },
  SCK: { classification: 'Small Center (Kothar)', details: 'Building related to agricultural activities, small godowns/storage, having building dimensions not exceeding 30 m × 12 m.' },
  TR: { classification: 'Transport', details: 'Truck Terminal, Bus Terminal (by private enterprise), Transport Terminal for Goods and Passengers.' },
  AG1: { classification: 'Agriculture-1', details: 'Horticulture, Repair and Sale of agricultural equipment, Saw Mill, Brick Kiln, Dairy Development, Fisheries, Animal Rearing and Breeding, Natural Resource and Sanctuary, Tannery, Concrete Batching Plant, Cemetery, Burial Ground, Regional Park, Way-side Shop, Agricultural Vocational Training Centre, Panjarapole, Roofing Tiles and Cement Pipes, Studio, Animal Shed, Agro Based Storage, Farm House.' },
  AG2: { classification: 'Agriculture-2', details: 'Agricultural Vocational Training, Mining and Quarrying, Dumping of Solid Waste, Shooting Range, Drive-in Cinema, Golf Course, Ship Building or Ship Breaking, Fishing, Aqua culture Processing of fish and industry based on it port, Harbour ferry hovercraft service marine transport, Telephone microwave or other means of communication facilities, salt pans and non-polluting salt processing activity. Any type of activity permissible as per the Environment Protection Act, 1968 and Environment (Protection) Rules, 1968.' },
  AG3: { classification: 'Agriculture-3', details: 'Poultry Farm, Agro-based Godowns.' },
  TEMP: { classification: 'Temporary Use', details: 'Fair, Circus, Exhibition, Mela, Pandal, Fisheries related activities.' },
  PU: { classification: 'Public Utility', details: 'Sub-station, Bus Station and Terminals, Fuelling and eV Station and Storage with and without Service Station, Parking, Multi-level Parking; infrastructure for Water Supply, Purification Plant, Pumping Station, Electricity Sub-station; Drainage, Sanitation, Domestic Garbage Disposal Collection, Solid Waste Transfer Station; Electricity, Fire Stations, Solar Power Plant or any development activity carried out by appropriate authority for public purpose.' },
  PI: { classification: 'Public-Institutional', details: 'Any offices for appropriate authority, government and semi-government, Public assembly, Public facilities and amenities like Health, Transport and Communication, public security, social welfare, recreation of any type, Post Office, Police-Chowki, ward office.' },
  H1: { classification: 'Health-1', details: 'PHC, Clinic, Dispensary.' },
  H2: { classification: 'Health-2', details: 'Indoor Hospital up to 20 Bed, Surgical Hospital, Nursing Home.' },
  H3: { classification: 'Health-3', details: 'Civil Hospital, Medical College and Research Centre, Hospital of more than 20 Bed.' },
  H4: { classification: 'Health-4', details: 'Hospital for infectious diseases, Mental Hospital.' },
  TO: { classification: 'Tourism Services', details: 'Tourism Sponsored activity.' },
  REC: { classification: 'Recreation Use', details: 'Natural Reserve and Sanctuary, Race Track, Shooting Range, Zoo, Gardens, Recreation, Nursery, Botanical Garden, Green House, Play Fields, Forest.' },
  'SP&L': { classification: 'Sports and Leisure', details: 'Sports Complex, Swimming Pool, Playfield, Camping Ground, Facility for water sports, Theme/Amusement Park, Aquarium, Zoo, Botanical Garden, Exhibition and Mela, Motion Picture Hall.' },
};

const TABLE_6_3_CODES = Object.keys(TABLE_6_3_USES).sort((left, right) => right.length - left.length);
const TABLE_6_2_ZONE_CODES = [...new Set(DESIGNATED_ZONES.map(({ code }) => code))].sort((left, right) => right.length - left.length);

function getPermissibleUseCodes(zone, visited = new Set()) {
  if (!zone || visited.has(zone.code)) return [];
  const nextVisited = new Set(visited).add(zone.code);
  const codes = new Set();
  for (const useCode of TABLE_6_3_CODES) {
    const escaped = useCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^A-Z0-9&])${escaped}($|[^A-Z0-9])`).test(zone.permissibleUse)) codes.add(useCode);
  }
  for (const zoneCode of TABLE_6_2_ZONE_CODES) {
    const escaped = zoneCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (zoneCode !== zone.code && new RegExp(`\\b${escaped}\\b`).test(zone.permissibleUse)) {
      DESIGNATED_ZONES.filter((candidate) => candidate.code === zoneCode).forEach((candidate) => {
        getPermissibleUseCodes(candidate, nextVisited).forEach((useCode) => codes.add(useCode));
      });
    }
  }
  return TABLE_6_3_CODES.filter((code) => codes.has(code));
}

const ROAD_SIDE_MARGIN_COLUMNS = {
  D1: [2.5, 2.5, 3, 3, 4.5, 6, 7.5, 9],
  D2: [2, 2.5, 2.5, 3, 3, 6, 7.5, 9],
  D3: [2, 2.5, 2.5, 3, 3, 6, 6, 6],
  D4: [2, 2.5, 2.5, 3, 3, 6, 6, 6],
  D5: [2, 2.5, 2.5, 3, 3, 6, 6, 6],
  D7A: [2, 2.5, 2.5, 3, 3, 6, 6, 6],
  D7B: [2, 2.5, 2.5, 3, 3, 4.5, 4.5, 4.5],
  D8: [2, 2.5, 2.5, 3, 3, 4.5, 4.5, 4.5],
  D10: [2, 2.5, 2.5, 3, 3, 4.5, 4.5, 4.5],
};

function getRoadSideMargin({ category, authority, area, roadWidth, plotArea, buildingUse }) {
  if (!roadWidth) return null;
  const authorityCode = authority.match(/\(([^)]+)\)$/)?.[1] ?? authority;
  if (category === 'D6' || (category === 'D1' && authorityCode === 'GUDA' && /\bGMC\b/i.test(area))) return null;
  if (category === 'D9') {
    const use = (buildingUse ?? '').toLowerCase();
    if (/residential/.test(use)) {
      if (plotArea <= 25 && roadWidth <= 7.5) return { margin: 0, table: 'Table 6.40', note: 'No road-side margin is required for a residential D9 plot up to 25 m² on a road up to 7.5 m wide.' };
      const margin = roadWidth <= 7.5 ? 1.5 : roadWidth <= 12 ? 3 : roadWidth <= 20 ? 4.5 : roadWidth <= 30 ? 6 : 7.5;
      return { margin, table: 'Table 6.40' };
    }
    if (/public/.test(use)) return { margin: 9, table: 'Table 6.40' };
    if (/industrial|commercial/.test(use)) {
      if (plotArea < 50) return null;
      const margin = plotArea <= 100 ? 3 : plotArea <= 500 ? 4.5 : plotArea <= 10000 ? 6 : plotArea <= 50000 ? 7.5 : 9;
      return { margin, table: 'Table 6.40' };
    }
    return null;
  }
  const values = ROAD_SIDE_MARGIN_COLUMNS[category];
  if (!values) return null;
  const column = roadWidth <= 7.5 ? 0 : roadWidth <= 9 ? 1 : roadWidth <= 12 ? 2 : roadWidth <= 15 ? 3 : roadWidth < 18 ? 4 : roadWidth < 30 ? 5 : roadWidth < 45 ? 6 : 7;
  let margin = values[column];
  let note = '';
  if (/special\s+building/i.test(buildingUse)) margin = 12;
  if (category === 'D1' && authorityCode === 'RUDA' && roadWidth > 30 && roadWidth < 45) {
    if (plotArea <= 1000) { margin = 6; note = 'D1-RUDA Table 6.24 note: 6 m applies for plots up to 1,000 m²; building-height conditions may also affect this exception.'; }
    else note = 'D1-RUDA may allow a 6 m margin for buildings up to 25 m high; building height is not an input, so the Table 6.24 value is shown.';
  }
  return { margin, table: 'Table 6.24', note };
}

function RoadMarginDiagram({ category, authority, area, roadWidths, plotArea, buildingUse }) {
  const sides = Object.entries(roadWidths).filter(([, value]) => value !== '');
  if (!sides.length) return null;
  const marginInfo = Object.fromEntries(sides.map(([side, value]) => [side, getRoadSideMargin({ category, authority, area, roadWidth: Number(value), plotArea: Number(plotArea) || 0, buildingUse })]));
  const marginsAvailable = sides.every(([side]) => marginInfo[side]);
  const marginTables = [...new Set(sides.map(([side]) => marginInfo[side]?.table).filter(Boolean))];
  const plot = { x: 150, y: 48, width: 200, height: 150 };
  const hatch = <defs><pattern id="fsi-margin-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f5e1d9"/><line x1="0" y1="0" x2="0" y2="8" stroke="#c97e69" strokeWidth="2"/></pattern></defs>;
  const roadRects = {
    rear: <rect x="135" y="12" width="230" height="30" rx="2" fill="#e8ebef"/>,
    left: <rect x="70" y="33" width="74" height="180" rx="2" fill="#e8ebef"/>,
    right: <rect x="356" y="33" width="74" height="180" rx="2" fill="#e8ebef"/>,
    front: <rect x="135" y="204" width="230" height="30" rx="2" fill="#e8ebef"/>,
  };
  const marginRects = {
    rear: <rect x={plot.x} y={plot.y} width={plot.width} height="22" fill="url(#fsi-margin-hatch)"/>,
    left: <rect x={plot.x} y={plot.y} width="22" height={plot.height} fill="url(#fsi-margin-hatch)"/>,
    right: <rect x={plot.x + plot.width - 22} y={plot.y} width="22" height={plot.height} fill="url(#fsi-margin-hatch)"/>,
    front: <rect x={plot.x} y={plot.y + plot.height - 22} width={plot.width} height="22" fill="url(#fsi-margin-hatch)"/>,
  };
  const roadLabels = { front: 'Front', rear: 'Rear', left: 'Left', right: 'Right' };
  return <section className="road-margin-card" aria-label="Road-side margin diagram"><div className="road-margin-heading"><b>Road-side margin diagram</b><small>Schematic · not to scale{marginTables.length ? ` · ${marginTables.join(', ')}` : ''}</small></div><svg viewBox="0 0 500 250" role="img" aria-label="Plot with hatching on each entered road-side margin">{hatch}{sides.map(([side]) => <g key={`road-${side}`}>{roadRects[side]}</g>)}<rect x={plot.x} y={plot.y} width={plot.width} height={plot.height} fill="#fff" stroke="#7c8998" strokeWidth="1.5"/>{sides.map(([side]) => <g key={`margin-${side}`}>{marginRects[side]}<text x={side === 'left' ? 134 : side === 'right' ? 352 : plot.x + plot.width / 2} y={side === 'front' ? 193 : side === 'rear' ? 65 : plot.y + plot.height / 2} textAnchor={side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle'} fontSize="8" fill="#75483d">{marginInfo[side] ? `${marginInfo[side].margin} m` : 'margin per special table'}</text></g>)}<text x="250" y="127" textAnchor="middle" fontSize="11" fontWeight="700" fill="#43546a">Building unit</text>{sides.map(([side, width]) => <text key={`label-${side}`} x={side === 'left' ? 108 : side === 'right' ? 393 : 250} y={side === 'front' ? 226 : side === 'rear' ? 31 : 128} textAnchor="middle" fontSize="9" fill="#59697d">{roadLabels[side]} road · {width} m</text>)}</svg><div className="road-margin-legend">{sides.map(([side, width]) => <span key={side}><i/> {roadLabels[side]}: {width} m road → {marginInfo[side] ? `${marginInfo[side].margin} m margin` : 'special schedule required'}</span>)}</div>{!marginsAvailable && <small className="road-margin-note">The selected category uses a separate margin schedule; the road-side margin is not estimated here.</small>}{sides.map(([side]) => marginInfo[side]?.note && <small className="road-margin-note" key={`note-${side}`}>{marginInfo[side].note}</small>)}<small className="road-margin-note">Building height or special-building rules may require a larger road-side margin. Rear and side margins are not included in this diagram.</small></section>;
}

function FsiCalculator() {
  const [form, setForm] = useState({ developmentCategory: '', developmentAuthority: '', developmentArea: '', zone: '', plotArea: '', buildingUse: '' });
  const [roadWidths, setRoadWidths] = useState({ front: '', left: '', right: '', rear: '' });
  const [state, setState] = useState({ loading: false, result: null, error: '' });
  const [permissibleUseCode, setPermissibleUseCode] = useState('');
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const setRoadWidth = (side) => (event) => setRoadWidths((current) => ({ ...current, [side]: event.target.value }));
  const selectedCategory = DEVELOPMENT_CATEGORIES.find(({ code }) => code === form.developmentCategory);
  const authorityCode = form.developmentAuthority.match(/\(([^)]+)\)$/)?.[1] ?? form.developmentAuthority;
  const categoryZones = ['D8', 'D10'].includes(form.developmentCategory)
    ? DESIGNATED_ZONES.filter(({ code }) => ['GMD8', 'RMD8', 'RMD9'].includes(code))
    : form.developmentCategory === 'D9'
      ? DESIGNATED_ZONES.filter(({ code }) => code === 'GIDC')
      : DESIGNATED_ZONES.filter(({ code }) => !['GMD8', 'RMD8', 'RMD9'].includes(code));
  const selectedZones = categoryZones.filter(({ onlyAuthorities, excludedAuthorities, zone }) =>
    (!onlyAuthorities || onlyAuthorities.includes(authorityCode)) && (!excludedAuthorities || !excludedAuthorities.includes(authorityCode)) &&
    !(authorityCode === 'GUDA' && /non[\s-]?gmc/i.test(form.developmentArea) && ['Residential Zones 2–5 (GUDA)', 'Residential Zone R1 (GUDA)', 'Residential Renewal Zone (GUDA)', 'Commercial Zone I (GUDA – GMC)'].includes(zone)) &&
    !(authorityCode === 'GUDA' && !/non[\s-]?gmc/i.test(form.developmentArea) && zone === 'Commercial Zone II (GUDA – Non-GMC)')
  );
  const selectedZone = selectedZones.find(({ zone }) => zone === form.zone);
  const selectedUseCodes = selectedZone ? getPermissibleUseCodes(selectedZone) : [];
  const activeUseCode = selectedUseCodes.includes(permissibleUseCode) ? permissibleUseCode : (selectedUseCodes[0] ?? '');
  const setCategory = (event) => { setForm((current) => ({ ...current, developmentCategory: event.target.value, developmentAuthority: '', developmentArea: '', zone: '' })); setRoadWidths({ front: '', left: '', right: '', rear: '' }); setPermissibleUseCode(''); };
  const setAuthority = (event) => { setForm((current) => ({ ...current, developmentAuthority: event.target.value, zone: '' })); setPermissibleUseCode(''); };
  const setZone = (event) => { setForm((current) => ({ ...current, zone: event.target.value })); setPermissibleUseCode(''); };
  const roadWidthValues = Object.fromEntries(Object.entries(roadWidths).filter(([, value]) => value !== '').map(([side, value]) => [side, Number(value)]));
  const requiredRoadWidth = Object.keys(roadWidthValues).length === 0;
  const effectiveRoadWidth = Math.max(0, ...Object.values(roadWidthValues));
  const submit = async (event) => {
    event.preventDefault(); setState({ loading: true, result: null, error: '' });
    try { const response = await api.post('/calculations/fsi', { ...form, conceptualisedZone: selectedZone?.conceptualisedZone ?? '', zoneCode: selectedZone?.code ?? '', permissibleUse: selectedZone?.permissibleUse ?? '', permissibleUseCode: activeUseCode, buildingUse: form.buildingUse || undefined, plotArea: Number(form.plotArea), roadWidth: effectiveRoadWidth, roadWidths: roadWidthValues }); setState({ loading: false, result: response.data, error: '' }); }
    catch (error) { setState({ loading: false, result: null, error: getApiErrorMessage(error) }); }
  };
  return <AppShell><div className="workspace-page"><div className="page-kicker">BUILD RULE GUJARAT <span>/</span> FSI CALCULATOR</div><div className="page-title-row"><div><h1>FSI calculator</h1><p>Enter the site context. The calculator uses available CGDCR FSI tables and keeps special or unsupported cases unresolved.</p></div><span className="source-status-tag"><ShieldCheck size={14}/> DETERMINISTIC</span></div><div className="tool-layout"><form className="form-panel" onSubmit={submit}><div className="panel-label">SITE AND DEVELOPMENT CONTEXT</div><label>Development authority &amp; development area category<select required value={form.developmentCategory} onChange={setCategory}><option value="">Select category from Table 1.1</option>{DEVELOPMENT_CATEGORIES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}</select></label><label>Development authority / ULB<select required value={form.developmentAuthority} onChange={setAuthority} disabled={!selectedCategory}><option value="">{selectedCategory ? 'Select authority or area' : 'Select a category first'}</option>{selectedCategory?.authorities.map((authority) => <option key={authority} value={authority}>{authority}</option>)}</select></label><label>Development area <span className="optional-label">IF APPLICABLE</span><input maxLength="160" value={form.developmentArea} onChange={set('developmentArea')} required={['D8', 'D9', 'D10'].includes(form.developmentCategory) || form.developmentAuthority.includes('(GUDA)')} placeholder={form.developmentAuthority.includes('(GUDA)') ? 'Enter GMC or Non-GMC' : 'Plan area, industrial estate, or other area name'}/></label><label>Use Zone (Designation in Development Plan) or general land use<select required value={form.zone} onChange={setZone} disabled={!form.developmentAuthority}><option value="">{form.developmentAuthority ? 'Select a zone from Table 6.2' : 'Select an authority first'}</option>{selectedZones.map(({ zone, code }) => <option key={`${code}-${zone}`} value={zone}>{zone}</option>)}</select></label>{selectedZone && <><label>Conceptualised Zone<input readOnly value={selectedZone.conceptualisedZone}/></label><label>Code<input readOnly value={selectedZone.code}/></label><label>Permissible Use<textarea readOnly rows={selectedZone.code === 'RAH1' ? 8 : 4} value={selectedZone.permissibleUse}/></label><label>Permissible Use referred as code>{selectedUseCodes.length ? <><select value={activeUseCode} onChange={(event) => setPermissibleUseCode(event.target.value)}>{selectedUseCodes.map((useCode) => <option key={useCode} value={useCode}>{useCode}</option>)}</select>{activeUseCode && <div className="use-code-details"><b>{activeUseCode} — {TABLE_6_3_USES[activeUseCode].classification}</b><span>{TABLE_6_3_USES[activeUseCode].details}</span></div>}</> : <textarea readOnly rows="4" value={selectedZone.permissibleUse}/>}</label></>}<label>Plot area <span>(m²)</span><input type="number" required min="0.01" step="any" value={form.plotArea} onChange={set('plotArea')} placeholder="e.g. 500"/></label><div className="road-width-grid">{[['front', 'Front'], ['left', 'Left'], ['right', 'Right'], ['rear', 'Rear']].map(([side, label]) => <label key={side}>{label} road width <span>(m)</span><input type="number" min="0.01" step="any" required={requiredRoadWidth} value={roadWidths[side]} onChange={setRoadWidth(side)} placeholder={side === 'front' ? 'e.g. 12' : ''}/></label>)}</div><label>Building use <span className="optional-label">OPTIONAL</span><input maxLength="120" value={form.buildingUse} onChange={set('buildingUse')} placeholder="Residential, commercial, mixed…"/></label><button className="button button-primary form-submit" type="submit" disabled={state.loading}>{state.loading ? 'Checking applicable data…' : 'Establish applicable FSI'} <ArrowRight size={15}/></button><small className="form-disclaimer">This is a preliminary table-based estimate. Special conditions and Jantri charges may require authority review.</small></form>
    <div className="result-panel"><div className="panel-label">CALCULATION RESULT</div><RoadMarginDiagram category={form.developmentCategory} authority={form.developmentAuthority} area={form.developmentArea} roadWidths={roadWidths} plotArea={form.plotArea} buildingUse={form.buildingUse}/>{state.error ? <StateNotice tone="error">{state.error}</StateNotice> : state.loading ? <div className="panel-state">Resolving version, authority, zone, and applicable parameters…</div> : state.result?.status === 'CALCULATED' ? <><div className="fsi-result-summary"><small>Maximum permissible FSI · {state.result.calculation.table}</small><b>{state.result.calculation.maximumFsi.toFixed(2)}</b></div><div className="fsi-result-breakdown"><span>Base (free) FSI <b>{state.result.calculation.baseFsi == null ? 'See table' : state.result.calculation.baseFsi.toFixed(2)}</b></span><span>Chargeable FSI <b>{state.result.calculation.chargeableFsi == null ? 'See table' : state.result.calculation.chargeableFsi.toFixed(2)}</b></span><span>Base built-up area <b>{state.result.calculation.baseBuiltUpArea == null ? 'Not specified' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(state.result.calculation.baseBuiltUpArea)} m²`}</b></span><span>Chargeable built-up area <b>{state.result.calculation.chargeableBuiltUpArea == null ? 'Not specified' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(state.result.calculation.chargeableBuiltUpArea)} m²`}</b></span><span>Maximum built-up area <b>{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(state.result.calculation.maximumBuiltUpArea)} m²</b></span></div>{state.result.calculation.notes.map((note) => <p className="fsi-result-note" key={note}>{note}</p>)}<p className="fsi-result-note">{state.result.calculation.chargeableBasis}</p>{state.result.sources.map((source) => <div className="result-reference" key={source.table}><FileText size={15}/><span>{source.document}, {source.table}</span></div>)}</> : state.result ? <><div className="result-unresolved"><span className="warning-symbol">!</span><div><b>Verified result unavailable</b><small>{state.result.message}</small></div></div><div className="missing-list"><b>What remains unresolved</b>{state.result.missingInformation.map((item) => <p key={item}><span>•</span>{item}</p>)}</div><div className="result-reference"><FileText size={15}/><span>No verified regulation or source-page references are available for these inputs.</span></div></> : <div className="result-empty"><Calculator size={22}/><b>Your FSI breakdown will appear here</b><p>No universal FSI value is assumed. The calculator waits for a table row that matches the authority, zone, and road widths.</p></div>}</div></div></div></AppShell>;
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
