import React, { createContext, useContext, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Account, Audit, Invoice, Period, Refund, Role, accounts, companies, buildSeed, money, stamp, day, monthLabel, taxOf, taxFor, taxParts, modeOf, RATE_MODES, RateMode, fingerprint, refundedOf, shownStatus, totalsFor, FULL, ADMIN_BASE, BIZ_BASE, Line } from './data';
import { Icon, QR, Badge, Stat, Card, PageHead, Bars } from './ui';
import './style.css';

const ROOT = typeof window !== 'undefined' ? window.location.origin : '';
interface Store { invoices: Invoice[]; refunds: Refund[]; audit: Audit[]; user: Account | null; base: string; log: (action: string, target: string, companyId: string) => void; patch: (id: string, f: (i: Invoice) => Invoice) => void; addInvoice: (i: Invoice) => void; addRefund: (r: Refund) => void }
const Ctx = createContext<Store>(null as unknown as Store);
const useStore = () => useContext(Ctx);
const cname = (id: string) => companies.find((c) => c.id === id)?.name ?? id;

const NAV: Record<Role, [string, string, string][]> = {
  'GRA Admin': [['', 'Overview', 'dashboard'], ['/companies', 'Companies', 'building'], ['/invoices', 'Invoices', 'receipt'], ['/exceptions', 'Cancelled & refunds', 'undo'], ['/reports', 'Reports', 'chart'], ['/audit', 'Audit log', 'history']],
  Owner: [['', 'Dashboard', 'dashboard'], ['/invoices', 'Invoices', 'receipt'], ['/new', 'New invoice', 'plus'], ['/refunds', 'Refunds', 'undo'], ['/reports', 'Reports', 'chart'], ['/team', 'Team', 'users'], ['/audit', 'Audit log', 'history']],
  Manager: [['', 'Dashboard', 'dashboard'], ['/invoices', 'Invoices', 'receipt'], ['/new', 'New invoice', 'plus'], ['/refunds', 'Refunds', 'undo'], ['/reports', 'Reports', 'chart']],
  Cashier: [['', 'Dashboard', 'dashboard'], ['/new', 'New invoice', 'plus'], ['/invoices', 'My shift invoices', 'receipt']],
  Auditor: [['', 'Dashboard', 'dashboard'], ['/invoices', 'Invoices', 'receipt'], ['/refunds', 'Refunds', 'undo'], ['/reports', 'Reports', 'chart'], ['/audit', 'Audit log', 'history']],
};
const ROLE_INFO: { role: Role; who: string; sees: string; can: string }[] = [
  { role: 'GRA Admin', who: 'GRA staff, separate portal', sees: 'Every company, invoice, timestamp and QR code; cancelled and refunded invoices; monthly or custom-range totals', can: 'Search companies, track one company, flag invoices for review. Read-only on business records' },
  { role: 'Owner', who: 'Business owner', sees: 'Own company only: dashboard, invoices, refunds, reports, team, audit log', can: 'Create, certify, cancel, refund' },
  { role: 'Manager', who: 'Shift or branch manager', sees: 'Own company: dashboard, invoices, refunds, reports', can: 'Create, certify, cancel, refund' },
  { role: 'Cashier', who: 'Till operator', sees: 'Own company: dashboard, new invoice, last 7 days of invoices', can: 'Create, certify, cancel pending only. No refunds' },
  { role: 'Auditor', who: 'External or internal auditor', sees: 'Own company: dashboard, invoices, refunds, reports, audit log', can: 'Read only' },
];
const can = (r: Role, a: string) => (({ 'GRA Admin': ['flag'], Owner: ['create', 'certify', 'cancel', 'cancelPending', 'refund'], Manager: ['create', 'certify', 'cancel', 'cancelPending', 'refund'], Cashier: ['create', 'certify', 'cancelPending'], Auditor: [] }) as Record<Role, string[]>)[r].includes(a);

class Boundary extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) { return { err: String(e && e.stack ? e.stack : e).slice(0, 600) }; }
  render() { return this.state.err ? <div className="wrap"><PageHead title="Something went wrong" icon="info" sub="Reload the page and try again." /><pre className="mono">{this.state.err}</pre></div> : this.props.children; }
}
export function App() {
  const { pathname } = useLocation();
  const seed = useMemo(buildSeed, []);
  const [invoices, setInvoices] = useState<Invoice[]>(seed.invoices);
  const [refunds, setRefunds] = useState<Refund[]>(seed.refunds);
  const [audit, setAudit] = useState<Audit[]>(seed.audit);
  const [email, setEmail] = useState<string | null>(null);
  const path = pathname.replace(/\/+$/, '') || '/';
  const portal = path.startsWith(ADMIN_BASE) ? 'admin' : path.startsWith(BIZ_BASE) ? 'business' : 'public';
  const acct = accounts.find((a) => a.email === email) ?? null;
  const user = acct && acct.portal === portal ? acct : null;
  const base = portal === 'admin' ? ADMIN_BASE : BIZ_BASE;
  const store: Store = {
    invoices, refunds, audit, user, base,
    log: (action, target, companyId) => user && setAudit((a) => [{ at: new Date().toISOString(), actor: user.email, role: user.role, companyId, action, target }, ...a]),
    patch: (id, f) => setInvoices((x) => x.map((i) => (i.id === id ? f(i) : i))),
    addInvoice: (i) => setInvoices((x) => [i, ...x]),
    addRefund: (r) => setRefunds((x) => [r, ...x]),
  };
  const nav = user ? NAV[user.role] : portal === 'public' ? [['/', 'Home', 'home'], ['/app', 'Business login', 'lock']] : [];
  const rel = portal === 'public' ? path : path.slice(base.length) || '';
  const active = (to: string) => (portal === 'public' ? path === to : rel === to || (to !== '' && rel.startsWith(to + '/')));
  let page: React.ReactNode;
  if (path.startsWith('/verify/')) page = <Verify id={decodeURIComponent(path.slice(8))} />;
  else if (portal === 'public') page = path === '/' ? <Home /> : <NotFound />;
    else if (!user) page = <Login portal={portal} current={acct} onLogin={(a) => setEmail(a.email)} />;
  else page = <Routed rel={rel} />;
  const isVerify = path.startsWith('/verify/');
  return (
    <Ctx.Provider value={store}>
      <div className={'app ' + (portal === 'admin' ? 'theme-admin' : 'theme-biz')}>
        <header className="top">
          <div className="top-in">
            <Link to="/" className="brand"><span className="mark"><Icon name="shield" size={22} /></span><span className="brand-t"><b>Mabbin GRA</b><i>{portal === 'admin' ? 'GRA Admin Portal' : portal === 'business' ? 'Business E-VAT Portal' : 'E-VAT demo platform'}</i></span><span className="demo-tag">GRA DEMO</span></Link>
            <div className="top-r">
              {user && <span className="who"><Icon name="user" size={16} /><span><b>{user.name}</b><i>{user.role}{user.companyId ? ' - ' + cname(user.companyId) : ''}</i></span></span>}
              {user && <button className="btn ghost sm" onClick={() => setEmail(null)}><Icon name="logout" size={16} />Sign out</button>}
            </div>
          </div>
          {!isVerify && nav.length > 0 && <nav className="nav" aria-label="Main"><div className="nav-in">{nav.map(([to, label, ic]) => <Link key={to} to={portal === 'public' ? to : base + to} className={'nav-a' + (active(to) ? ' on' : '')}><Icon name={ic} size={17} />{label}</Link>)}</div></nav>}
        </header>
        <main className="main"><Boundary>{page}</Boundary></main>
        <footer className="foot"><div className="foot-in">
          <div><b>Mabbin GRA</b><p>Front-end demo of an E-VAT invoice platform. All data is made up.</p></div>
          <div><b>Not official</b><p>Not affiliated with, endorsed by or verified by the Ghana Revenue Authority. Tax figures follow the published 2026 Ghana rates by default (VAT 15% + NHIL 2.5% + GETFund 2.5%) or an illustrative demo 10%, and are not a tax filing.</p></div>
          <div><b>Demo only</b><p>Logins and sessions are simulated in the browser. Do not enter real credentials.</p></div>
        </div></footer>
      </div>
    </Ctx.Provider>
  );
}

function NotFound() { return <div className="wrap"><PageHead title="Page not found" icon="info" /><Link to="/" className="btn">Back to home</Link></div>; }

function Home() {
  const { invoices } = useStore();
  const sample = invoices.filter((i) => i.status === 'Certified').slice(0, 3);
  const [q, setQ] = useState('');
  return (
    <div className="wrap">
      <section className="hero">
        <p className="eyebrow">Demo platform - not the Ghana Revenue Authority</p>
        <h1>E-VAT invoicing you can oversee end to end</h1>
        <p className="lead">Businesses issue invoices, each stamped with a time and a QR code. GRA staff sign in to a separate portal to track every company, invoice, cancellation and refund.</p>
        <div className="row"><Link to={BIZ_BASE} className="btn"><Icon name="lock" size={18} />Business login</Link><a className="btn ghost" href="#roles">See who sees what</a></div>
      </section>
      <div className="grid g3">
        <Card title="Business portal" icon="receipt"><p className="muted">Owners, managers, cashiers and auditors sign in with their own login and see only their company and only what their role allows.</p><Link to={BIZ_BASE} className="btn sm">Open business login<Icon name="arrow" size={16} /></Link></Card>
        <Card title="Verify an invoice" icon="qr"><p className="muted">Customers scan the QR code on a receipt. Enter an invoice number to try the demo verification page.</p><div className="row"><input className="in" placeholder="INV-AK-0001" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Invoice number" /><Link to={'/verify/' + (q.trim() || sample[0]?.id)} className="btn sm">Verify</Link></div></Card>
        <Card title="Try a sample" icon="check"><div className="stack">{sample.map((i) => <Link key={i.id} to={'/verify/' + i.id} className="mini"><b>{i.id}</b><span>{cname(i.companyId)} - {money(i.total)}</span></Link>)}</div></Card>
      </div>
      <h2 id="roles" className="sec">Roles</h2>
      <div className="grid g3">{ROLE_INFO.map((r) => <Card key={r.role} title={r.role} icon={r.role === 'GRA Admin' ? 'shield' : 'user'}><p className="muted">{r.who}</p><p><b>Sees: </b>{r.sees}</p><p><b>Can: </b>{r.can}</p></Card>)}</div>
    </div>
  );
}

function Login({ portal, current, onLogin }: { portal: string; current: Account | null; onLogin: (a: Account) => void }) {
  const [em, setEm] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const admin = portal === 'admin';
  const submit = () => {
    const a = accounts.find((x) => x.email.toLowerCase() === em.trim().toLowerCase() && x.password === pw);
    if (!a) return setErr('Email or password is wrong.');
    if (a.portal !== portal) return setErr(admin ? 'This is the GRA staff portal. Business users sign in at the business login.' : 'This account belongs to the GRA staff portal.');
    setErr(''); onLogin(a);
  };
  const demo = accounts.filter((a) => a.portal === portal);
  return (
    <div className="wrap narrow">
      <div className="login">
        <span className="page-ic big"><Icon name={admin ? 'shield' : 'lock'} size={26} /></span>
        <h1>{admin ? 'GRA Admin Portal' : 'Business sign in'}</h1>
        <p className="muted">{admin ? 'Staff oversight of all companies and invoices.' : 'Sign in with your company login.'} Demo only: no real authentication happens here.</p>
        {current && <p className="note">Signed in as {current.email} ({current.role}). Signing in below replaces that session.</p>}
        <div className="form" onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}>
          <label className="f"><span>Email</span><input className="in" type="email" autoComplete="username" value={em} onChange={(e) => setEm(e.target.value)} /></label>
          <label className="f"><span>Password</span><input className="in" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" type="button" onClick={submit}>Sign in</button>
        </div>
      </div>
      <Card title="Demo credentials" icon="info"><p className="muted">Tap a row to fill the form.</p>
        <div className="stack">{demo.map((a) => <button key={a.email} type="button" className="mini btn-row" onClick={() => { setEm(a.email); setPw(a.password); setErr(''); }}><b>{a.role}{a.companyId ? ' - ' + cname(a.companyId) : ''}</b><span>{a.email} / {a.password}</span></button>)}</div></Card>
      {!admin && <p className="muted center">GRA staff? Use the separate admin portal address you were given.</p>}
    </div>
  );
}

const ALLOWED: Record<Role, string[]> = { 'GRA Admin': ['', 'companies', 'invoices', 'exceptions', 'reports', 'audit'], Owner: ['', 'invoices', 'new', 'refunds', 'reports', 'team', 'audit'], Manager: ['', 'invoices', 'new', 'refunds', 'reports'], Cashier: ['', 'new', 'invoices'], Auditor: ['', 'invoices', 'refunds', 'reports', 'audit'] };
function Routed({ rel }: { rel: string }) {
  const { user } = useStore();
  const seg = rel.split('/').filter(Boolean); const top = seg[0] ?? '';
  if (!user) return null;
  if (!['', 'companies', 'invoices', 'exceptions', 'refunds', 'reports', 'audit', 'new', 'team'].includes(top)) return <NotFound />;
  if (!ALLOWED[user.role].includes(top)) return <div className="wrap"><PageHead title="Not available for your role" icon="lock" sub={`${user.role} accounts cannot open this page.`} /><Link className="btn" to={(user.portal === 'admin' ? ADMIN_BASE : BIZ_BASE)}>Back to dashboard</Link></div>;
  const admin = user.role === 'GRA Admin';
  if (top === '') return <Dashboard />;
  if (top === 'companies') return seg[1] ? <CompanyPage id={seg[1]} /> : <Companies />;
  if (top === 'invoices') return seg[1] ? <InvoicePage id={decodeURIComponent(seg[1])} /> : <Invoices />;
  if (top === 'exceptions') return <Exceptions />;
  if (top === 'refunds') return <Exceptions />;
  if (top === 'reports') return <Reports fixed={admin ? undefined : user.companyId} />;
  if (top === 'audit') return <AuditPage />;
  if (top === 'new') return <NewInvoice />;
  if (top === 'team') return <Team />;
  return <NotFound />;
}

const scopeOf = (user: Account | null) => (user?.role === 'GRA Admin' ? undefined : user?.companyId);
function useScoped() {
  const s = useStore(); const cid = scopeOf(s.user);
  let invoices = cid ? s.invoices.filter((i) => i.companyId === cid) : s.invoices;
  if (s.user?.role === 'Cashier') invoices = invoices.filter((i) => day(i.createdAt) >= '2026-09-27');
  return { ...s, invoices, refunds: cid ? s.refunds.filter((r) => r.companyId === cid) : s.refunds, audit: cid ? s.audit.filter((a) => a.companyId === cid) : s.audit, cid };
}

const PERIODS: Period[] = [];
function PeriodPicker({ value, onChange }: { value: { key: string; from: string; to: string }; onChange: (v: { key: string; from: string; to: string }) => void }) {
  void PERIODS;
  const months = ['2026-08', '2026-09', '2026-10'];
  const set = (key: string) => {
    if (key === 'all') onChange({ key, ...FULL });
    else if (key === 'custom') onChange({ key, from: value.from, to: value.to });
    else { const [y, m] = key.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); onChange({ key, from: `${key}-01`, to: `${key}-${String(last).padStart(2, '0')}` }); }
  };
  return (
    <div className="period">
      <label className="f"><span><Icon name="calendar" size={14} /> Period</span><select className="in" value={value.key} onChange={(e) => set(e.target.value)}>{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}<option value="all">All time (Aug - Oct 2026)</option><option value="custom">Custom range</option></select></label>
      {value.key === 'custom' && <><label className="f"><span>From</span><input className="in" type="date" value={value.from} max={value.to} onChange={(e) => onChange({ ...value, from: e.target.value })} /></label><label className="f"><span>To</span><input className="in" type="date" value={value.to} min={value.from} onChange={(e) => onChange({ ...value, to: e.target.value })} /></label></>}
    </div>
  );
}
const initPeriod = { key: 'all', ...FULL };

function Dashboard() {
  const s = useScoped(); const { user, base } = s;
  const [p, setP] = useState(initPeriod);
  if (!user) return null;
  const admin = user.role === 'GRA Admin';
  const t = totalsFor(s.invoices, s.refunds, p);
  const byCo = companies.filter((c) => !s.cid || c.id === s.cid).map((c) => ({ c, t: totalsFor(s.invoices.filter((i) => i.companyId === c.id), s.refunds, p) }));
  const recent = s.invoices.slice(0, 6);
  const exc = s.invoices.filter((i) => i.status === 'Cancelled').slice(0, 3);
  return (
    <div className="wrap">
      <PageHead title={admin ? 'National overview' : `${cname(user.companyId!)} dashboard`} icon="dashboard" sub={admin ? 'Every registered company in one view.' : `Signed in as ${user.role}. Figures use certified invoices in the chosen period.`} right={<PeriodPicker value={p} onChange={setP} />} />
      <div className="grid g4">
        <Stat icon="receipt" label="Invoices certified" value={String(t.count)} sub={t.pending ? `${t.pending} pending` : 'none pending'} />
        <Stat icon="wallet" label="Total sales" value={money(t.sales)} sub={`Tax in sales ${money(t.vat)}`} />
        <Stat icon="undo" label="Total refunded" value={money(t.refunded)} sub={`${t.refundCount} credit note${t.refundCount === 1 ? '' : 's'}`} tone="info" />
        <Stat icon="trend" label={admin ? 'Total tax to be paid' : 'Tax to be paid'} value={money(t.payable)} sub="Tax collected minus tax on refunds" tone="good" />
      </div>
      <div className="grid g2">
        <Card title={admin ? 'Companies in this period' : 'Cancelled and pending'} icon={admin ? 'building' : 'ban'}>
          {admin ? <Bars data={byCo.map(({ c, t: x }) => ({ label: c.name, value: x.payable, sub: money(x.payable) }))} /> : <div className="stack"><div className="mini"><b>{t.cancelledCount} cancelled</b><span>{money(t.cancelledValue)}</span></div>{exc.map((i) => <Link className="mini" key={i.id} to={`${base}/invoices/${i.id}`}><b>{i.id}</b><span>{i.cancelReason}</span></Link>)}</div>}
          {admin && <Link className="btn ghost sm" to={base + '/companies'}>Search companies<Icon name="arrow" size={16} /></Link>}
        </Card>
        <Card title="Needs attention" icon="flag">
          <div className="stack">
            <div className="mini"><b>{t.cancelledCount} cancelled</b><span>{money(t.cancelledValue)} voided</span></div>
            <div className="mini"><b>{t.refundCount} refund{t.refundCount === 1 ? '' : 's'}</b><span>{money(t.refunded)} returned</span></div>
            <div className="mini"><b>{s.invoices.filter((i) => i.flagged).length} flagged for review</b><span>by GRA</span></div>
          </div>
          {(admin || can(user.role, 'create')) && <Link className="btn ghost sm" to={base + (admin ? '/exceptions' : '/new')}>{admin ? 'Open cancelled & refunds' : 'New invoice'}<Icon name="arrow" size={16} /></Link>}
        </Card>
      </div>
      <Card title="Latest invoices" icon="receipt" aside={<Link className="link" to={base + '/invoices'}>All invoices</Link>}><InvoiceTable rows={recent} refunds={s.refunds} showCo={admin} /></Card>
    </div>
  );
}

function InvoiceTable({ rows, refunds, showCo }: { rows: Invoice[]; refunds: Refund[]; showCo?: boolean }) {
  const { base } = useStore();
  if (!rows.length) return <p className="muted pad">No invoices match.</p>;
  return (
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Invoice</th>{showCo && <th>Company</th>}<th>Status</th><th>Created (UTC)</th><th>Certified (UTC)</th><th className="r">Total</th><th className="r">Refunded</th></tr></thead>
      <tbody>{rows.map((i) => { const x = refundedOf(i, refunds); return (
        <tr key={i.id}><td data-l="Invoice"><Link className="link strong" to={`${base}/invoices/${i.id}`}>{i.id}</Link>{i.flagged && <span className="flag"><Icon name="flag" size={13} />flagged</span>}</td>{showCo && <td data-l="Company">{cname(i.companyId)}</td>}<td data-l="Status"><Badge s={shownStatus(i, refunds)} /></td><td data-l="Created">{stamp(i.createdAt).slice(0, 19)}</td><td data-l="Certified">{i.certifiedAt ? stamp(i.certifiedAt).slice(0, 19) : '-'}</td><td className="r" data-l="Total">{money(i.total)}</td><td className="r" data-l="Refunded">{x ? money(x) : '-'}</td></tr>); })}</tbody></table></div>
  );
}

function Invoices({ presetCo, hideCo }: { presetCo?: string; hideCo?: boolean }) {
  const s = useScoped(); const admin = s.user?.role === 'GRA Admin';
  const [q, setQ] = useState(''); const [st, setSt] = useState('All'); const [co, setCo] = useState(presetCo || 'all');
  const [p, setP] = useState({ key: 'all', ...FULL }); const [n, setN] = useState(20);
  const rows = s.invoices.filter((i) => {
    const text = (i.id + i.order + i.customer + cname(i.companyId)).toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (co === 'all' || i.companyId === co) && (st === 'All' || shownStatus(i, s.refunds) === st) && day(i.createdAt) >= p.from && day(i.createdAt) <= p.to;
  });
  const body = (
    <>
      <div className="filters">
        <label className="f grow"><span><Icon name="search" size={14} /> Search</span><input className="in" placeholder={admin ? 'Invoice, order, customer or company' : 'Invoice, order or customer'} value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {admin && !hideCo && <label className="f"><span>Company</span><select className="in" value={co} onChange={(e) => setCo(e.target.value)}><option value="all">All companies</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
        <label className="f"><span>Status</span><select className="in" value={st} onChange={(e) => setSt(e.target.value)}>{['All', 'Pending', 'Certified', 'Part refunded', 'Refunded', 'Cancelled'].map((x) => <option key={x}>{x}</option>)}</select></label>
        <PeriodPicker value={p} onChange={setP} />
      </div>
      <p className="muted">{rows.length} invoice{rows.length === 1 ? '' : 's'}{s.user?.role === 'Cashier' ? ' from the last 7 days (cashier view)' : ''}</p>
      <InvoiceTable rows={rows.slice(0, n)} refunds={s.refunds} showCo={admin && !hideCo} />
      {rows.length > n && <button className="btn ghost" onClick={() => setN(n + 20)}>Show 20 more</button>}
    </>
  );
  if (hideCo) return body;
  return <div className="wrap"><PageHead title={s.user?.role === 'Cashier' ? 'My shift invoices' : 'Invoices'} icon="receipt" sub="Timestamps are UTC. Open an invoice for its QR code." />{body}</div>;
}

function InvoicePage({ id }: { id: string }) {
  const s = useStore(); const { user, base } = s;
  const inv = s.invoices.find((i) => i.id === id);
  const [reason, setReason] = useState(''); const [rreason, setRreason] = useState(''); const [amt, setAmt] = useState(''); const [msg, setMsg] = useState('');
  if (!user) return null;
  if (!inv || (user.role !== 'GRA Admin' && inv.companyId !== user.companyId)) return <div className="wrap"><PageHead title="Invoice not found" icon="info" /><Link className="btn" to={base + '/invoices'}>Back to invoices</Link></div>;
  const rfs = s.refunds.filter((f) => f.invoiceId === inv.id);
  const done = refundedOf(inv, s.refunds); const left = inv.total - done; const shown = shownStatus(inv, s.refunds);
  const certify = () => { s.patch(inv.id, (i) => ({ ...i, status: 'Certified', certifiedAt: new Date().toISOString() })); s.log('Invoice certified (demo)', inv.id, inv.companyId); setMsg('Certified with a demo timestamp.'); };
  const cancel = () => { if (!reason.trim()) return setMsg('Add a cancellation reason first.'); s.patch(inv.id, (i) => ({ ...i, status: 'Cancelled', cancelledAt: new Date().toISOString(), cancelReason: reason.trim() })); s.log('Invoice cancelled', inv.id, inv.companyId); setMsg('Invoice cancelled.'); };
  const refund = () => {
    const g = Math.round(parseFloat(amt) * 100);
    if (!g || g <= 0) return setMsg('Enter a refund amount.'); if (g > left) return setMsg(`Refund cannot exceed ${money(left)} still refundable.`); if (!rreason.trim()) return setMsg('Add a refund reason.');
    const n = s.refunds.filter((f) => f.companyId === inv.companyId).length + 1;
    const cn = `CN-${companies.find((c) => c.id === inv.companyId)!.code}-${String(n).padStart(4, '0')}`;
    s.addRefund({ id: cn, invoiceId: inv.id, companyId: inv.companyId, amount: g, tax: taxOf(g, modeOf(inv)), reason: rreason.trim(), at: new Date().toISOString(), by: user.email }); s.log('Credit note issued', cn, inv.companyId); setAmt(''); setRreason(''); setMsg(`Credit note ${cn} issued. The original invoice stays unchanged.`);
  };
  const flag = () => { s.patch(inv.id, (i) => ({ ...i, flagged: !i.flagged })); s.log(inv.flagged ? 'Flag removed' : 'Flagged for review', inv.id, inv.companyId); };
  const url = ROOT + '/verify/' + inv.id;
  const timeline: [string, string][] = [['Reserved', inv.createdAt]]; if (inv.certifiedAt) timeline.push(['Certified (demo)', inv.certifiedAt]); if (inv.cancelledAt) timeline.push(['Cancelled', inv.cancelledAt]); rfs.slice().reverse().forEach((f) => timeline.push([`Credit note ${f.id}`, f.at]));
  return (
    <div className="wrap">
      <PageHead title={inv.id} icon="receipt" sub={`${cname(inv.companyId)} - order ${inv.order}`} right={<Badge s={shown} />} />
      <div className="grid g4">
        <Stat icon="wallet" label="Invoice total" value={money(inv.total)} sub={`Tax ${money(inv.tax)}`} />
        <Stat icon="undo" label="Refunded" value={money(done)} sub={`${money(left)} refundable`} tone="info" />
        <Stat icon="clock" label="Created" value={day(inv.createdAt)} sub={stamp(inv.createdAt).slice(11)} />
        <Stat icon="check" label="Certified" value={inv.certifiedAt ? day(inv.certifiedAt) : 'Not yet'} sub={inv.certifiedAt ? stamp(inv.certifiedAt).slice(11) : ''} tone="good" />
      </div>
      <div className="grid g2">
        <Card title="Items" icon="receipt">
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Unit</th><th className="r">Amount</th></tr></thead><tbody>{inv.lines.map((l, k) => <tr key={k}><td data-l="Item">{l.name}</td><td className="r" data-l="Qty">{l.qty}</td><td className="r" data-l="Unit">{money(l.unit)}</td><td className="r" data-l="Amount">{money(l.qty * l.unit)}</td></tr>)}</tbody></table></div>
          <dl className="kv"><dt>Customer</dt><dd>{inv.customer}</dd><dt>Net</dt><dd>{money(inv.net)}</dd>{taxParts(inv.net, modeOf(inv)).map((p) => <React.Fragment key={p.name}><dt>{p.name} ({p.pct}%)</dt><dd>{money(p.amount)}</dd></React.Fragment>)}<dt>Total</dt><dd><b>{money(inv.total)}</b></dd><dt>Rates</dt><dd>{RATE_MODES[modeOf(inv)].short}</dd><dt>Created by</dt><dd>{inv.by}</dd>{inv.cancelReason && <><dt>Cancel reason</dt><dd>{inv.cancelReason}</dd></>}</dl>
        </Card>
        <Card title="Verification QR" icon="qr">
          <div className="qr-box"><QR url={url} /><div><p className="muted">Encodes the demo verification page for this invoice. It points at this app's own demo page, never a GRA address.</p><p className="mono">Demo fingerprint {fingerprint(inv.id + inv.total + (inv.certifiedAt || ''))}</p><Link className="btn ghost sm" to={'/verify/' + inv.id}>Open customer page<Icon name="arrow" size={16} /></Link></div></div>
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Timeline" icon="clock"><ol className="tl">{timeline.map(([a, b], k) => <li key={k}><b>{a}</b><span>{stamp(b)}</span></li>)}</ol></Card>
        <Card title="Credit notes" icon="undo">{rfs.length ? <div className="stack">{rfs.map((f) => <div className="mini" key={f.id}><b>{f.id} - {money(f.amount)}</b><span>{stamp(f.at).slice(0, 10)} - {f.reason}</span></div>)}</div> : <p className="muted">No refunds on this invoice.</p>}</Card>
      </div>
      <Card title="Actions" icon="shield">
        {msg && <p className="note" role="status">{msg}</p>}
        {user.role === 'GRA Admin' && <><p className="muted">GRA accounts are read-only on business records. You can flag an invoice for follow-up.</p><button className="btn ghost" onClick={flag}><Icon name="flag" size={16} />{inv.flagged ? 'Remove flag' : 'Flag for review'}</button></>}
        {user.role === 'Auditor' && <p className="muted">Auditors can read invoices but cannot change them.</p>}
        {user.role !== 'GRA Admin' && user.role !== 'Auditor' && (
          <div className="form">
            {inv.status === 'Pending' && can(user.role, 'certify') && <div className="row"><button className="btn" onClick={certify}><Icon name="check" size={16} />Certify invoice (demo)</button></div>}
            {inv.status !== 'Cancelled' && ((inv.status === 'Pending' && can(user.role, 'cancelPending')) || (inv.status === 'Certified' && can(user.role, 'cancel') && done === 0)) && <div className="row end"><label className="f grow"><span>Reason</span><input className="in" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Cancellation or refund reason" /></label><button className="btn danger" onClick={cancel}><Icon name="ban" size={16} />Cancel invoice</button></div>}
            {inv.status === 'Certified' && can(user.role, 'refund') && left > 0 && <div className="row end"><label className="f grow"><span>Refund reason</span><input className="in" value={rreason} onChange={(e) => setRreason(e.target.value)} placeholder="Why is this being refunded?" /></label><label className="f"><span>Refund amount (GHS), max {(left / 100).toFixed(2)}</span><input className="in" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" /></label><button className="btn" onClick={refund}><Icon name="undo" size={16} />Issue credit note</button></div>}
            {inv.status === 'Certified' && !can(user.role, 'refund') && <p className="muted">Cashiers cannot refund or cancel certified invoices. Ask a manager.</p>}
            {inv.status === 'Cancelled' && <p className="muted">This invoice is cancelled. No further actions.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

function Companies() {
  const s = useStore(); const [q, setQ] = useState(''); const [p, setP] = useState(initPeriod);
  const list = companies.filter((c) => (c.name + c.tin + c.sector).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="wrap">
      <PageHead title="Companies" icon="building" sub="Search by company name or TIN, then open one to track it." right={<PeriodPicker value={p} onChange={setP} />} />
      <label className="f"><span><Icon name="search" size={14} /> Search companies</span><input className="in" placeholder="Type a company name" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="grid g3">{list.map((c) => { const t = totalsFor(s.invoices.filter((i) => i.companyId === c.id), s.refunds, p); return (
        <Card key={c.id} title={c.name} icon="building" aside={<span className="tag">{c.sector}</span>}>
          <p className="mono">{c.tin}</p>
          <dl className="kv"><dt>Invoices</dt><dd>{t.count}</dd><dt>Sales</dt><dd>{money(t.sales)}</dd><dt>Refunded</dt><dd>{money(t.refunded)}</dd><dt>Cancelled</dt><dd>{t.cancelledCount}</dd><dt>Tax to be paid</dt><dd><b>{money(t.payable)}</b></dd></dl>
          <Link className="btn sm" to={`${s.base}/companies/${c.id}`}>Track company<Icon name="arrow" size={16} /></Link>
        </Card>); })}</div>
      {!list.length && <p className="muted pad">No company matches "{q}".</p>}
    </div>
  );
}

function monthRows(invoices: Invoice[], refunds: Refund[]) {
  return ['2026-08', '2026-09', '2026-10'].map((m) => { const last = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5), 0)).getUTCDate(); return { m, t: totalsFor(invoices, refunds, { from: m + '-01', to: `${m}-${last}` }) }; });
}
function Breakdown({ invoices, refunds }: { invoices: Invoice[]; refunds: Refund[] }) {
  const rows = monthRows(invoices, refunds);
  return (
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Month</th><th className="r">Invoices</th><th className="r">Sales</th><th className="r">Refunded</th><th className="r">Cancelled</th><th className="r">Tax to be paid</th></tr></thead><tbody>{rows.map(({ m, t }) => <tr key={m}><td data-l="Month">{monthLabel(m)}</td><td className="r" data-l="Invoices">{t.count}</td><td className="r" data-l="Sales">{money(t.sales)}</td><td className="r" data-l="Refunded">{money(t.refunded)}</td><td className="r" data-l="Cancelled">{t.cancelledCount}</td><td className="r" data-l="Tax">{money(t.payable)}</td></tr>)}</tbody></table></div>
  );
}

function CompanyPage({ id }: { id: string }) {
  const s = useStore(); const c = companies.find((x) => x.id === id); const [p, setP] = useState(initPeriod);
  if (!c) return <div className="wrap"><PageHead title="Company not found" icon="info" /><Link className="btn" to={s.base + '/companies'}>Back</Link></div>;
  const inv = s.invoices.filter((i) => i.companyId === id); const rf = s.refunds.filter((r) => r.companyId === id); const t = totalsFor(inv, rf, p);
  return (
    <div className="wrap">
      <PageHead title={c.name} icon="building" sub={`${c.sector} - ${c.tin}`} right={<PeriodPicker value={p} onChange={setP} />} />
      <div className="grid g4">
        <Stat icon="receipt" label="Invoices certified" value={String(t.count)} sub={`${t.pending} pending`} />
        <Stat icon="wallet" label="Total sales" value={money(t.sales)} sub={`Tax ${money(t.vat)}`} />
        <Stat icon="undo" label="Refunded" value={money(t.refunded)} sub={`${t.refundCount} credit note${t.refundCount === 1 ? '' : 's'}`} tone="info" />
        <Stat icon="trend" label="Tax to be paid" value={money(t.payable)} sub={`${t.cancelledCount} cancelled (${money(t.cancelledValue)})`} tone="good" />
      </div>
      <Card title="Month by month" icon="chart"><Breakdown invoices={inv} refunds={rf} /></Card>
      <Card title={`Invoices for ${c.name}`} icon="receipt"><Invoices presetCo={id} hideCo /></Card>
    </div>
  );
}

function Exceptions() {
  const s = useScoped(); const admin = s.user?.role === 'GRA Admin'; const [tab, setTab] = useState<'cancelled' | 'refunds'>('refunds');
  const [q, setQ] = useState('');
  const cancelled = s.invoices.filter((i) => i.status === 'Cancelled' && (cname(i.companyId) + i.id + (i.cancelReason || '')).toLowerCase().includes(q.toLowerCase()));
  const rf = s.refunds.filter((r) => (cname(r.companyId) + r.id + r.invoiceId + r.reason).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="wrap">
      <PageHead title={admin ? 'Cancelled & refunded' : 'Refunds and cancellations'} icon="undo" sub="Every cancelled invoice and every credit note, with timestamps." />
      <div className="seg"><button className={tab === 'refunds' ? 'on' : ''} onClick={() => setTab('refunds')}>Refunds ({rf.length})</button><button className={tab === 'cancelled' ? 'on' : ''} onClick={() => setTab('cancelled')}>Cancelled ({cancelled.length})</button></div>
      <label className="f"><span><Icon name="search" size={14} /> Search</span><input className="in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Company, invoice or reason" /></label>
      {tab === 'refunds' ? (
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Credit note</th>{admin && <th>Company</th>}<th>Invoice</th><th>Issued (UTC)</th><th>Reason</th><th className="r">Refunded</th><th className="r">Tax reversed</th></tr></thead><tbody>{rf.slice(0, 60).map((r) => <tr key={r.id}><td data-l="Credit note"><b>{r.id}</b></td>{admin && <td data-l="Company">{cname(r.companyId)}</td>}<td data-l="Invoice"><Link className="link" to={`${s.base}/invoices/${r.invoiceId}`}>{r.invoiceId}</Link></td><td data-l="Issued">{stamp(r.at).slice(0, 19)}</td><td data-l="Reason">{r.reason}</td><td className="r" data-l="Refunded">{money(r.amount)}</td><td className="r" data-l="Tax">{money(r.tax)}</td></tr>)}</tbody></table></div>
      ) : (
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Invoice</th>{admin && <th>Company</th>}<th>Cancelled (UTC)</th><th>Reason</th><th className="r">Value</th></tr></thead><tbody>{cancelled.slice(0, 60).map((i) => <tr key={i.id}><td data-l="Invoice"><Link className="link strong" to={`${s.base}/invoices/${i.id}`}>{i.id}</Link></td>{admin && <td data-l="Company">{cname(i.companyId)}</td>}<td data-l="Cancelled">{stamp(i.cancelledAt).slice(0, 19)}</td><td data-l="Reason">{i.cancelReason}</td><td className="r" data-l="Value">{money(i.total)}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

function Reports({ fixed }: { fixed?: string }) {
  const s = useStore(); const [p, setP] = useState(initPeriod); const [co, setCo] = useState(fixed || 'all');
  const cid = fixed || (co === 'all' ? undefined : co);
  const inv = cid ? s.invoices.filter((i) => i.companyId === cid) : s.invoices; const rf = cid ? s.refunds.filter((r) => r.companyId === cid) : s.refunds;
  const t = totalsFor(inv, rf, p);
  const per = companies.filter((c) => !cid || c.id === cid).map((c) => ({ c, t: totalsFor(inv.filter((i) => i.companyId === c.id), rf, p) }));
  return (
    <div className="wrap">
      <PageHead title="Reports" icon="chart" sub="Totals for a month or any custom date range." right={<PeriodPicker value={p} onChange={setP} />} />
      {!fixed && <label className="f"><span>Company</span><select className="in" value={co} onChange={(e) => setCo(e.target.value)}><option value="all">All companies</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <div className="grid g4">
        <Stat icon="wallet" label="Total sales" value={money(t.sales)} sub={`${t.count} invoices`} />
        <Stat icon="undo" label="Total refunded" value={money(t.refunded)} sub={`${t.refundCount} credit note${t.refundCount === 1 ? '' : 's'}`} tone="info" />
        <Stat icon="ban" label="Cancelled" value={String(t.cancelledCount)} sub={money(t.cancelledValue)} tone="bad" />
        <Stat icon="trend" label="Total tax to be paid" value={money(t.payable)} sub={`${money(t.vat)} collected - ${money(t.vatBack)} reversed`} tone="good" />
      </div>
      <Card title="By company" icon="building"><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Company</th><th className="r">Invoices</th><th className="r">Sales</th><th className="r">Refunded</th><th className="r">Net sales</th><th className="r">Tax to be paid</th></tr></thead><tbody>{per.map(({ c, t: x }) => <tr key={c.id}><td data-l="Company"><b>{c.name}</b></td><td className="r" data-l="Invoices">{x.count}</td><td className="r" data-l="Sales">{money(x.sales)}</td><td className="r" data-l="Refunded">{money(x.refunded)}</td><td className="r" data-l="Net">{money(x.net)}</td><td className="r" data-l="Tax"><b>{money(x.payable)}</b></td></tr>)}<tr className="sum"><td data-l="Company">Total</td><td className="r" data-l="Invoices">{t.count}</td><td className="r" data-l="Sales">{money(t.sales)}</td><td className="r" data-l="Refunded">{money(t.refunded)}</td><td className="r" data-l="Net">{money(t.net)}</td><td className="r" data-l="Tax">{money(t.payable)}</td></tr></tbody></table></div></Card>
      <Card title="Month by month" icon="calendar"><Breakdown invoices={inv} refunds={rf} /><Bars data={monthRows(inv, rf).map(({ m, t: x }) => ({ label: monthLabel(m), value: x.sales, sub: money(x.sales) }))} /></Card>
    </div>
  );
}

function AuditPage() {
  const s = useScoped(); const admin = s.user?.role === 'GRA Admin'; const [q, setQ] = useState('');
  const rows = s.audit.filter((a) => (a.actor + a.action + a.target + cname(a.companyId)).toLowerCase().includes(q.toLowerCase())).slice(0, 80);
  return (
    <div className="wrap">
      <PageHead title="Audit log" icon="history" sub="Who did what and when. Actions you take in this demo appear at the top." />
      <label className="f"><span><Icon name="search" size={14} /> Search</span><input className="in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Person, action or invoice" /></label>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Time (UTC)</th>{admin && <th>Company</th>}<th>Who</th><th>Role</th><th>Action</th><th>Target</th></tr></thead><tbody>{rows.map((a, k) => <tr key={k}><td data-l="Time">{stamp(a.at).slice(0, 19)}</td>{admin && <td data-l="Company">{cname(a.companyId)}</td>}<td data-l="Who">{a.actor}</td><td data-l="Role">{a.role}</td><td data-l="Action">{a.action}</td><td data-l="Target">{a.target}</td></tr>)}</tbody></table></div>
    </div>
  );
}

function Team() {
  const { user } = useStore(); const list = accounts.filter((a) => a.companyId === user?.companyId);
  return (
    <div className="wrap">
      <PageHead title="Team" icon="users" sub={`People with a login for ${cname(user!.companyId!)}.`} />
      <div className="grid g2">{list.map((a) => <Card key={a.email} title={a.name} icon="user" aside={<span className="tag">{a.role}</span>}><p className="mono">{a.email}</p><p className="muted">{ROLE_INFO.find((r) => r.role === a.role)?.can}</p></Card>)}</div>
      <Card title="What each role can do" icon="shield"><div className="stack">{ROLE_INFO.filter((r) => r.role !== 'GRA Admin').map((r) => <div className="mini" key={r.role}><b>{r.role}</b><span>{r.sees}</span></div>)}</div></Card>
    </div>
  );
}

function NewInvoice() {
  const s = useStore(); const { user, base } = s; const [cust, setCust] = useState('Walk-in customer');
  const [lines, setLines] = useState<{ name: string; qty: string; unit: string }[]>([{ name: '', qty: '1', unit: '' }]); const [msg, setMsg] = useState(''); const [made, setMade] = useState<string | null>(null); const [mode, setMode] = useState<RateMode>('ghana');
  if (!user || !user.companyId) return null;
  const clean: Line[] = lines.map((l) => ({ name: l.name.trim(), qty: Math.max(0, Math.floor(+l.qty)), unit: Math.round(parseFloat(l.unit || '0') * 100) })).filter((l) => l.name && l.qty > 0 && l.unit > 0);
  const net = clean.reduce((a, l) => a + l.qty * l.unit, 0); const tax = taxFor(net, mode);
  const upd = (k: number, f: Partial<{ name: string; qty: string; unit: string }>) => setLines((x) => x.map((l, i) => (i === k ? { ...l, ...f } : l)));
  const submit = () => {
    if (!clean.length) return setMsg('Add at least one item with a name, quantity and price.');
    const co = companies.find((c) => c.id === user.companyId)!; const n = s.invoices.filter((i) => i.companyId === co.id).length + 1;
    const id = `INV-${co.code}-${9000 + n}`;
    s.addInvoice({ id, companyId: co.id, order: `ORD-${co.code}-${String(n + 100).padStart(4, '0')}`, customer: cust.trim() || 'Walk-in customer', mode, lines: clean, net, tax, total: net + tax, status: 'Pending', createdAt: new Date().toISOString(), by: user.email });
    s.log('Invoice reserved', id, co.id); setMade(id); setMsg(''); setLines([{ name: '', qty: '1', unit: '' }]);
  };
  return (
    <div className="wrap">
      <PageHead title="New invoice" icon="plus" sub="Reserve an invoice, then certify it with a demo timestamp." />
      {made && <div className="note" role="status">Reserved {made}. <Link className="link" to={`${base}/invoices/${made}`}>Open it to certify and get its QR code</Link>.</div>}
      <Card title="Invoice details" icon="receipt">
        <div className="form">
          <label className="f"><span>Customer</span><input className="in" value={cust} onChange={(e) => setCust(e.target.value)} /></label>
          {lines.map((l, k) => <div className="line" key={k}><label className="f grow"><span>Item</span><input className="in" value={l.name} onChange={(e) => upd(k, { name: e.target.value })} placeholder="Item name" /></label><label className="f sm"><span>Qty</span><input className="in" inputMode="numeric" value={l.qty} onChange={(e) => upd(k, { qty: e.target.value })} /></label><label className="f sm"><span>Unit (GHS)</span><input className="in" inputMode="decimal" value={l.unit} onChange={(e) => upd(k, { unit: e.target.value })} placeholder="0.00" /></label>{lines.length > 1 && <button className="btn ghost sm" type="button" onClick={() => setLines((x) => x.filter((_, i) => i !== k))}>Remove</button>}</div>)}
          <label className="f"><span>Tax rates</span><select className="in" value={mode} onChange={(e) => setMode(e.target.value as RateMode)}>{(Object.keys(RATE_MODES) as RateMode[]).map((m) => <option key={m} value={m}>{RATE_MODES[m].label}</option>)}</select></label>
          <div className="row"><button className="btn ghost sm" type="button" onClick={() => setLines((x) => [...x, { name: '', qty: '1', unit: '' }])}><Icon name="plus" size={16} />Add item</button></div>
          <dl className="kv"><dt>Net</dt><dd>{money(net)}</dd>{taxParts(net, mode).map((p) => <React.Fragment key={p.name}><dt>{p.name} ({p.pct}%)</dt><dd>{money(p.amount)}</dd></React.Fragment>)}<dt>Total</dt><dd><b>{money(net + tax)}</b></dd></dl>
          <p className="muted">{RATE_MODES[mode].note}</p>
          {msg && <p className="err" role="alert">{msg}</p>}
          <button className="btn" onClick={submit}>Reserve invoice</button>
        </div>
      </Card>
    </div>
  );
}

function Verify({ id }: { id: string }) {
  const { invoices, refunds } = useStore(); const inv = invoices.find((i) => i.id === id);
  return (
    <div className="wrap narrow">
      <div className="verify">
        <p className="eyebrow">Demo certification</p>
        <h1>Invoice check</h1>
        <div className="callout"><Icon name="info" size={18} /><span><b>Not verified by GRA.</b> This is a Mabbin GRA demo. It is not an official Ghana Revenue Authority certificate.</span></div>
        {!inv ? <Card title="No record found" icon="ban"><p className="muted">No invoice "{id}" exists in this demo session. New invoices only exist until you reload the page.</p><Link className="btn" to="/">Home</Link></Card> : (
          <Card title={inv.id} icon="receipt" aside={<Badge s={shownStatus(inv, refunds)} />}>
            <dl className="kv"><dt>Company</dt><dd>{cname(inv.companyId)}</dd><dt>Net</dt><dd>{money(inv.net)}</dd>{taxParts(inv.net, modeOf(inv)).map((p) => <React.Fragment key={p.name}><dt>{p.name} ({p.pct}%)</dt><dd>{money(p.amount)}</dd></React.Fragment>)}<dt>Total</dt><dd><b>{money(inv.total)}</b></dd><dt>Rates</dt><dd>{RATE_MODES[modeOf(inv)].short}</dd><dt>Created</dt><dd>{stamp(inv.createdAt)}</dd><dt>Demo certified</dt><dd>{stamp(inv.certifiedAt)}</dd>{inv.cancelledAt && <><dt>Cancelled</dt><dd>{stamp(inv.cancelledAt)}</dd></>}{refundedOf(inv, refunds) > 0 && <><dt>Refunded</dt><dd>{money(refundedOf(inv, refunds))}</dd></>}</dl>
            <div className="qr-box"><QR url={ROOT + '/verify/' + inv.id} /><p className="muted">Demo QR. It opens this demo page on the same site. Demo invoices created in a session only exist until you reload.</p></div>
          </Card>)}
      </div>
    </div>
  );
}
