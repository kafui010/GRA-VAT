export type Role = 'GRA Admin' | 'Owner' | 'Manager' | 'Cashier' | 'Auditor';
export interface Company { id: string; name: string; tin: string; sector: string; code: string }
export interface Line { name: string; qty: number; unit: number }
export type Status = 'Pending' | 'Certified' | 'Cancelled';
export interface Invoice { id: string; companyId: string; order: string; customer: string; lines: Line[]; net: number; tax: number; total: number; status: Status; createdAt: string; certifiedAt?: string; cancelledAt?: string; cancelReason?: string; flagged?: boolean; by: string }
export interface Refund { id: string; invoiceId: string; companyId: string; amount: number; tax: number; reason: string; at: string; by: string }
export interface Audit { at: string; actor: string; role: Role; companyId: string; action: string; target: string }
export interface Account { email: string; password: string; name: string; role: Role; companyId?: string; portal: 'admin' | 'business' }

export const RATE = 10;
export const NOW = '2026-10-04T01:00:00.000Z';
export const ADMIN_BASE = '/gra-admin-7q4k';
export const BIZ_BASE = '/app';

export const companies: Company[] = [
  { id: 'ak', code: 'AK', name: 'Akwaaba Kitchen', tin: 'DEMO-C0012345678', sector: 'Restaurant' },
  { id: 'cr', code: 'CR', name: 'Coastline Retail', tin: 'DEMO-C0023456789', sector: 'Retail' },
  { id: 'os', code: 'OS', name: 'Osu Stay', tin: 'DEMO-C0034567890', sector: 'Hospitality' },
];
export const accounts: Account[] = [
  { email: 'gra.admin@mabbin.demo', password: 'GRA-Admin@2026', name: 'Efua Mensah', role: 'GRA Admin', portal: 'admin' },
  { email: 'owner@akwaaba.demo', password: 'Demo@2026', name: 'Kofi Asante', role: 'Owner', companyId: 'ak', portal: 'business' },
  { email: 'manager@akwaaba.demo', password: 'Demo@2026', name: 'Ama Boateng', role: 'Manager', companyId: 'ak', portal: 'business' },
  { email: 'cashier@akwaaba.demo', password: 'Demo@2026', name: 'Yaw Darko', role: 'Cashier', companyId: 'ak', portal: 'business' },
  { email: 'auditor@akwaaba.demo', password: 'Demo@2026', name: 'Nana Owusu', role: 'Auditor', companyId: 'ak', portal: 'business' },
  { email: 'owner@coastline.demo', password: 'Demo@2026', name: 'Selorm Amoah', role: 'Owner', companyId: 'cr', portal: 'business' },
  { email: 'owner@osustay.demo', password: 'Demo@2026', name: 'Adwoa Tetteh', role: 'Owner', companyId: 'os', portal: 'business' },
];

export const money = (n: number) => 'GHS ' + (n / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const stamp = (s?: string) => (s ? s.replace('T', ' ').slice(0, 19) + ' UTC' : 'Not yet');
export const day = (s: string) => s.slice(0, 10);
export const monthLabel = (m: string) => new Date(m + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const taxOf = (gross: number) => Math.round((gross * RATE) / (100 + RATE));
export const fingerprint = (s: string) => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
};

const catalog: Record<string, [string, number][]> = {
  ak: [['Jollof rice + chicken', 4500], ['Banku + grilled tilapia', 7000], ['Fufu + light soup', 6000], ['Waakye special', 3500], ['Catering tray (10 pax)', 85000], ['Sobolo (jug)', 2500]],
  cr: [['Phone case', 8000], ['Wireless earbuds', 32000], ['Sneakers', 54000], ['Backpack', 26000], ['Kente scarf', 18000], ['Power bank', 21000]],
  os: [['Room night (standard)', 65000], ['Breakfast buffet', 8000], ['Airport pickup', 20000], ['Conference hall (day)', 150000], ['Laundry service', 6000], ['Spa package', 40000]],
};
const customers = ['Walk-in customer', 'Mensah Logistics', 'Adom Fabrics', 'K. Osei', 'Blue Door Cafe', 'A. Quaye', 'Tema Freight Ltd', 'Eli Services', 'S. Nartey'];
const refundReasons = ['Wrong item served', 'Customer returned goods', 'Overcharged', 'Service not delivered', 'Duplicate payment'];
const cancelReasons = ['Customer changed mind', 'Entered in error', 'Wrong customer name', 'Order not completed'];

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const iso = (d: Date) => d.toISOString();

export function buildSeed() {
  const r = rng(2026);
  const invoices: Invoice[] = []; const refunds: Refund[] = [];
  const staff: Record<string, string[]> = { ak: ['cashier@akwaaba.demo', 'manager@akwaaba.demo'], cr: ['owner@coastline.demo'], os: ['owner@osustay.demo'] };
  const start = Date.UTC(2026, 7, 1); const days = 65;
  companies.forEach((c) => {
    let n = 0;
    for (let d = 0; d < days; d++) {
      const count = Math.floor(r() * (c.id === 'os' ? 2.2 : 2.9));
      for (let k = 0; k < count; k++) {
        n++;
        const when = new Date(start + d * 86400000 + (7 + Math.floor(r() * 14)) * 3600000 + Math.floor(r() * 60) * 60000 + Math.floor(r() * 60) * 1000);
        if (iso(when) > NOW) continue;
        const nl = 1 + Math.floor(r() * 2);
        const lines: Line[] = Array.from({ length: nl }, () => { const [name, unit] = catalog[c.id][Math.floor(r() * 6)]; return { name, qty: 1 + Math.floor(r() * (unit > 50000 ? 2 : 4)), unit }; });
        const net = lines.reduce((s, l) => s + l.qty * l.unit, 0);
        const tax = Math.round((net * RATE) / 100);
        const id = `INV-${c.code}-${pad(n, 4)}`;
        const created = iso(when);
        const roll = r();
        const recent = created > '2026-10-03T12:00:00';
        const inv: Invoice = { id, companyId: c.id, order: `ORD-${c.code}-${pad(n * 7 % 9000 + 100, 4)}`, customer: customers[Math.floor(r() * customers.length)], lines, net, tax, total: net + tax, status: 'Certified', createdAt: created, certifiedAt: iso(new Date(when.getTime() + 2000 + Math.floor(r() * 4000))), by: staff[c.id][Math.floor(r() * staff[c.id].length)] };
        if (recent && roll < 0.35) { inv.status = 'Pending'; delete inv.certifiedAt; }
        else if (roll < 0.09) { inv.status = 'Cancelled'; inv.cancelledAt = iso(new Date(when.getTime() + 3600000 * (1 + Math.floor(r() * 5)))); inv.cancelReason = cancelReasons[Math.floor(r() * cancelReasons.length)]; delete inv.certifiedAt; }
        else if (roll < 0.22 && !recent) {
          const full = r() < 0.4; const gross = full ? inv.total : Math.round(inv.total * (0.2 + r() * 0.4) / 100) * 100;
          const at = iso(new Date(when.getTime() + 86400000 * (1 + Math.floor(r() * 3))));
          if (at <= NOW) refunds.push({ id: `CN-${c.code}-${pad(refunds.filter((x) => x.companyId === c.id).length + 1, 4)}`, invoiceId: id, companyId: c.id, amount: gross, tax: taxOf(gross), reason: refundReasons[Math.floor(r() * refundReasons.length)], at, by: c.id === 'ak' ? 'manager@akwaaba.demo' : staff[c.id][0] });
        }
        if (id === 'INV-OS-0009' || id === 'INV-CR-0003') inv.flagged = false;
        invoices.push(inv);
      }
    }
  });
  invoices.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const roleOf = (e: string): Role => accounts.find((a) => a.email === e)?.role ?? 'Owner';
  const audit: Audit[] = [];
  invoices.slice(0, 40).forEach((i) => {
    audit.push({ at: i.createdAt, actor: i.by, role: roleOf(i.by), companyId: i.companyId, action: 'Invoice reserved', target: i.id });
    if (i.certifiedAt) audit.push({ at: i.certifiedAt, actor: i.by, role: roleOf(i.by), companyId: i.companyId, action: 'Invoice certified (demo)', target: i.id });
    if (i.cancelledAt) audit.push({ at: i.cancelledAt, actor: i.by, role: roleOf(i.by), companyId: i.companyId, action: 'Invoice cancelled', target: i.id });
  });
  refunds.forEach((f) => { if (f.at > '2026-09-10') audit.push({ at: f.at, actor: f.by, role: roleOf(f.by), companyId: f.companyId, action: 'Credit note issued', target: f.id }); });
  audit.sort((a, b) => (a.at < b.at ? 1 : -1));
  return { invoices, refunds, audit };
}

export const refundedOf = (inv: Invoice, refunds: Refund[]) => refunds.filter((f) => f.invoiceId === inv.id).reduce((s, f) => s + f.amount, 0);
export type Shown = 'Pending' | 'Certified' | 'Part refunded' | 'Refunded' | 'Cancelled';
export function shownStatus(inv: Invoice, refunds: Refund[]): Shown {
  if (inv.status !== 'Certified') return inv.status;
  const x = refundedOf(inv, refunds);
  return x <= 0 ? 'Certified' : x >= inv.total ? 'Refunded' : 'Part refunded';
}
export interface Period { from: string; to: string }
export const inPeriod = (iso: string | undefined, p: Period) => !!iso && day(iso) >= p.from && day(iso) <= p.to;
export function totalsFor(invoices: Invoice[], refunds: Refund[], p: Period) {
  const sold = invoices.filter((i) => i.status === 'Certified' && inPeriod(i.certifiedAt, p));
  const rf = refunds.filter((f) => inPeriod(f.at, p) && invoices.some((i) => i.id === f.invoiceId));
  const cancelled = invoices.filter((i) => i.status === 'Cancelled' && inPeriod(i.cancelledAt, p));
  const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
  const sales = sum(sold.map((i) => i.total)); const vat = sum(sold.map((i) => i.tax));
  const refunded = sum(rf.map((f) => f.amount)); const vatBack = sum(rf.map((f) => f.tax));
  return { count: sold.length, sales, vat, refunded, refundCount: rf.length, vatBack, net: sales - refunded, payable: vat - vatBack, cancelledCount: cancelled.length, cancelledValue: sum(cancelled.map((i) => i.total)), pending: invoices.filter((i) => i.status === 'Pending' && inPeriod(i.createdAt, p)).length };
}
export const FULL: Period = { from: '2026-08-01', to: '2026-10-31' };
