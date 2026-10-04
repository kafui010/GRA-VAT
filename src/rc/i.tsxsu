import React, { useMemo } from 'react';
import QRCode from './qr/index.js';

const P: Record<string, string> = {
  dashboard: 'M4 4h7v8H4z M13 4h7v5h-7z M13 11h7v9h-7z M4 14h7v6H4z',
  building: 'M5 21V4h9v17 M14 9h5v12 M3 21h18 M8 8h2 M8 12h2 M8 16h2 M16 13h1 M16 17h1',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3z M9 8h6 M9 12h6 M9 16h3',
  undo: 'M9 14L4 9l5-5 M4 9h10a6 6 0 010 12h-3',
  ban: 'M12 3a9 9 0 100 18 9 9 0 000-18z M5.6 5.6l12.8 12.8',
  chart: 'M4 20h16 M7 17v-6 M12 17V5 M17 17v-9',
  shield: 'M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3z M8.5 12l2.5 2.5 4.5-5',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M2.5 20c.500-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5 M16 4.5a3.5 3.5 0 010 6.5 M18 14.8c1.8.7 3 2.4 3.300 5.2',
  plus: 'M12 5v14 M5 12h14',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-4-4',
  logout: 'M9 4H5v16h4 M16 8l4 4-4 4 M20 12H9',
  qr: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 14h2v2 M14 18h2v2 M18 18h2v2',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  flag: 'M5 21V4 M5 4h11l-2 4 2 4H5',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 018 0v3',
  home: 'M4 11l8-7 8 7 M6 10v10h12V10',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  wallet: 'M4 7h15a1 1 0 011 1v11H5a1 1 0 01-1-1V7z M4 7l11-3v3 M16 14h2',
  trend: 'M4 17l5-5 4 4 7-8 M15 8h5v5',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c.500-4 3.5-6 8-6s7.5 2 8 6',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 11v5 M12 8h.01',
  history: 'M4 12a8 8 0 108-8 M4 4v5h5 M12 8v4l3 2',
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[name] || P.info} /></svg>;
}
export function QR({ url }: { url: string }) {
  const q = useMemo(() => { const x = new QRCode(-1, 1); x.addData(url); x.make(); return x; }, [url]);
  const n = q.getModuleCount();
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells.push(<rect key={r * n + c} x={c} y={r} width="1.02" height="1.02" />);
  return <svg className="qr" viewBox={`-3 -3 ${n + 6} ${n + 6}`} role="img" aria-label="Demo QR code for invoice verification"><rect x="-3" y="-3" width={n + 6} height={n + 6} fill="#fff" /><g fill="#111">{cells}</g></svg>;
}
export function Badge({ s }: { s: string }) {
  const k = s === 'Certified' ? 'good' : s === 'Cancelled' ? 'bad' : s === 'Pending' ? 'warn' : s === 'Refunded' || s === 'Part refunded' ? 'info' : '';
  return <span className={'badge ' + k}>{s}</span>;
}
export function Stat({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: string }) {
  return <div className={'stat ' + (tone || '')}><span className="stat-ic"><Icon name={icon} /></span><div><p className="stat-l">{label}</p><p className="stat-v">{value}</p>{sub && <p className="stat-s">{sub}</p>}</div></div>;
}
export function Card({ title, icon, aside, children, className }: { title?: string; icon?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={'card ' + (className || '')}>{(title || aside) && <div className="card-h"><h3>{icon && <Icon name={icon} size={18} />}{title}</h3>{aside}</div>}{children}</section>;
}
export function PageHead({ title, sub, icon, right }: { title: string; sub?: string; icon?: string; right?: React.ReactNode }) {
  return <div className="page-h"><div className="page-t">{icon && <span className="page-ic"><Icon name={icon} size={22} /></span>}<div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div></div>{right}</div>;
}
export function Bars({ data }: { data: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return <div className="bars">{data.map((d) => <div className="bar" key={d.label}><span className="bar-l">{d.label}</span><span className="bar-track"><span className="bar-fill" style={{ width: Math.max(2, (d.value / max) * 100) + '%' }} /></span><span className="bar-v">{d.sub}</span></div>)}</div>;
}
