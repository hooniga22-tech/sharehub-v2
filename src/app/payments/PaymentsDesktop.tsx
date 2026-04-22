'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type Payment = {
  수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 이름: string;
  연월: string; 청구액: string; 납부액: string; 납부일: string; 상태: string; 납부방법: string; 메모: string;
};
type Summary = { total: number; paid: number; unpaid: number; partial: number; paidRate: number; paidAmount: number; unpaidAmount: number };
type Tab = 'overview' | 'unpaid' | 'match' | 'platform';

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  blueVeryLight: '#F0F7FF',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  purple: '#8B5CF6', purpleLight: '#EDE4FF', purpleDark: '#6D28D9',
  line: '#EAEDF0', divider: '#F2F4F6',
};

const fmt = (n: number) => n.toLocaleString() + '원';

function kstNow() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const [y, m, d] = s.replace(/\./g, '').trim().split(/\s+/).map(Number);
  return { y, m, d };
}

/* ─── SVG Icons ─── */
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18" />
  </svg>
);
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconMoney = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney, active: true },
  { label: '관리', href: '/manage', icon: IconSettings },
];

/* ─── Main ─── */
export default function PaymentsDesktop() {
  const router = useRouter();
  const kst = kstNow();
  const [items, setItems] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, unpaid: 0, partial: 0, paidRate: 0, paidAmount: 0, unpaidAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(kst.y);
  const [month, setMonth] = useState(kst.m);
  const isFuture = year > kst.y || (year === kst.y && month >= kst.m);

  const [tab, setTab] = useState<Tab>('overview');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gu/branch filter
  const [guList, setGuList] = useState<string[]>([]);
  const [guBranchMap, setGuBranchMap] = useState<Record<string, string[]>>({});
  const [branchGuMap, setBranchGuMap] = useState<Record<string, string>>({});
  const [selectedGu, setSelectedGu] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isFuture) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/payments?year=${year}&month=${String(month).padStart(2, '0')}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setSummary(d.summary || { total: 0, paid: 0, unpaid: 0, partial: 0, paidRate: 0, paidAmount: 0, unpaidAmount: 0 }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then((d: { 구: string; 지점명: string }[]) => {
      const arr = Array.isArray(d) ? d : [];
      const map: Record<string, Set<string>> = {};
      const bMap: Record<string, string> = {};
      for (const t of arr) {
        const gu = t.구 || '', branch = t.지점명 || '';
        if (!gu || !branch) continue;
        if (!map[gu]) map[gu] = new Set();
        map[gu].add(branch);
        bMap[branch] = gu;
      }
      const sorted = Object.keys(map).sort();
      setGuList(sorted);
      const mapObj: Record<string, string[]> = {};
      for (const g of sorted) mapObj[g] = [...map[g]].sort();
      setGuBranchMap(mapObj);
      setBranchGuMap(bMap);
    }).catch(() => {});
  }, []);

  const todayStr = `${kst.y}-${String(kst.m).padStart(2, '0')}-${String(kst.d).padStart(2, '0')}`;

  const getDplus = (p: Payment) => {
    const ym = p.연월; if (!ym) return 0;
    const [y2, m2] = ym.split('-').map(Number);
    const due = new Date(y2, m2, 0);
    const today = new Date(kst.y, kst.m - 1, kst.d);
    const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const markPaid = async (p: Payment) => {
    if (saving) return;
    setSaving(true);
    try {
      await fetch('/api/payments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.수납ID, 상태: '납부완료', 납부액: p.청구액, 납부일: todayStr }),
      });
      setSelected(null);
      fetchData();
    } catch {} finally { setSaving(false); }
  };

  // Filtered items
  const guFiltered = useMemo(() => items.filter(p => {
    if (selectedBranch) return p.지점명 === selectedBranch;
    if (selectedGu) return branchGuMap[p.지점명] === selectedGu;
    return true;
  }), [items, selectedGu, selectedBranch, branchGuMap]);

  const localSummary = useMemo(() => {
    const total = guFiltered.length;
    const paid = guFiltered.filter(p => p.상태 === '납부완료').length;
    const partial = guFiltered.filter(p => p.상태 === '부분납부').length;
    const unpaid = total - paid - partial;
    const paidAmount = guFiltered.filter(p => p.상태 === '납부완료').reduce((s, p) => s + (Number(p.청구액) || 0), 0);
    const unpaidAmount = guFiltered.filter(p => p.상태 !== '납부완료').reduce((s, p) => s + (Number(p.청구액) || 0) - (Number(p.납부액) || 0), 0);
    const paidRate = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;
    return { total, paid, unpaid, partial, paidRate, paidAmount, unpaidAmount };
  }, [guFiltered]);

  const unpaidItems = useMemo(() => {
    let list = guFiltered.filter(p => p.상태 !== '납부완료');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.이름.toLowerCase().includes(q) || p.지점명.toLowerCase().includes(q));
    }
    return list.sort((a, b) => getDplus(b) - getDplus(a));
  }, [guFiltered, search]);

  // Branch stats for overview
  const branchStats = useMemo(() => {
    const map: Record<string, { gu: string; total: number; unpaid: number; unpaidAmt: number }> = {};
    guFiltered.forEach(p => {
      const b = p.지점명 || '미분류';
      if (!map[b]) map[b] = { gu: branchGuMap[b] || '', total: 0, unpaid: 0, unpaidAmt: 0 };
      map[b].total++;
      if (p.상태 !== '납부완료') { map[b].unpaid++; map[b].unpaidAmt += (Number(p.청구액) || 0) - (Number(p.납부액) || 0); }
    });
    return Object.entries(map).sort((a, b) => b[1].unpaid - a[1].unpaid);
  }, [guFiltered, branchGuMap]);

  const copyDunning = async (p: Payment) => {
    const dplus = getDplus(p);
    const amt = Number(p.청구액) || 0;
    const text = `안녕하세요, ${p.이름}님.\n${p.지점명} ${p.방코드} 월세 ${fmt(amt)}이 ${dplus}일 연체되었습니다.\n확인 부탁드립니다.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const unpaidCount = localSummary.unpaid + localSummary.partial;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: '현황' },
    { key: 'unpaid', label: '미납', count: unpaidCount },
    { key: 'match', label: '매칭 대기' },
    { key: 'platform', label: '플랫폼 이체' },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* ═══ Sidebar ═══ */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 18px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div>
          <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div>
        </div>
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}>
            <IconSearch />
            <span style={{ fontSize: 12, color: T.textMute }}>검색</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {MENU.map(m => (
            <Link key={m.label} href={m.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              background: m.active ? T.blueLight : 'transparent', color: m.active ? T.blueDark : T.textSub,
              fontWeight: m.active ? 600 : 400, fontSize: 13, textDecoration: 'none',
            }}>
              <m.icon />
              {m.label}
            </Link>
          ))}
        </nav>
        <SidebarLogout />
      </div>

      {/* ═══ Main ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>수납 관리</div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: T.blueLight, color: T.blueDark }}>{year}년 {month}월</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronLeft /></button>
              <button onClick={() => { setYear(kst.y); setMonth(kst.m); }} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit' }}>이번달</button>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: isFuture ? 'default' : 'pointer', padding: 4, display: 'flex', opacity: isFuture ? 0.3 : 1 }}><IconChevronRight /></button>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.textMute, marginTop: 4 }}>
            전체 {localSummary.total}명 · 납부율 {localSummary.paidRate}% · 미납 {unpaidCount}건
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0, padding: '0 24px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelected(null); }} style={{
              padding: '14px 16px', background: 'none', border: 'none', borderBottom: tab === t.key ? `2px solid ${T.blue}` : '2px solid transparent',
              color: tab === t.key ? T.blue : T.textMute, fontWeight: tab === t.key ? 600 : 400,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {t.label}{t.count !== undefined && t.count > 0 ? ` ${t.count}` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMute, fontSize: 14 }}>불러오는 중...</div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

            {/* ═══ Tab: Overview ═══ */}
            {tab === 'overview' && (
              <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                {/* KPI Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: '이번달 총액', value: fmt(localSummary.paidAmount + localSummary.unpaidAmount), color: T.text },
                    { label: '미납', value: `${unpaidCount}건`, color: T.red, sub: fmt(localSummary.unpaidAmount) },
                    { label: '완납', value: `${localSummary.paid}명`, color: T.green, sub: fmt(localSummary.paidAmount) },
                    { label: '납부율', value: `${localSummary.paidRate}%`, color: T.blue },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: T.card, borderRadius: 12, padding: 18, border: `1px solid ${T.line}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.textMute, marginBottom: 6 }}>{kpi.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                      {kpi.sub && <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{kpi.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Two columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
                  {/* Branch table */}
                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, color: T.text, borderBottom: `1px solid ${T.line}` }}>지점별 납부 현황</div>
                    <div style={{ overflowX: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 100px 140px', minWidth: 540 }}>
                        {['구', '지점', '전체', '미납', '미납액', '납부율'].map(h => (
                          <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: T.textMute, background: '#FAFBFC', borderBottom: `1px solid ${T.line}` }}>{h}</div>
                        ))}
                        {branchStats.map(([name, s]) => {
                          const rate = s.total > 0 ? Math.round((1 - s.unpaid / s.total) * 100) : 100;
                          const rateColor = rate >= 90 ? T.green : rate >= 60 ? T.blue : T.orange;
                          return (
                            <div key={name} style={{ display: 'contents' }}>
                              <div style={{ padding: '10px 12px', fontSize: 12, color: T.textMute, borderBottom: `1px solid ${T.divider}` }}>{s.gu}</div>
                              <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: T.text, borderBottom: `1px solid ${T.divider}` }}>{name}</div>
                              <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}` }}>{s.total}</div>
                              <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: s.unpaid > 0 ? T.red : T.textSub, borderBottom: `1px solid ${T.divider}` }}>{s.unpaid}</div>
                              <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}` }}>{s.unpaidAmt > 0 ? fmt(s.unpaidAmt) : '-'}</div>
                              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${rate}%`, background: rateColor, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: rateColor, minWidth: 32 }}>{rate}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Platform summary */}
                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, padding: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>플랫폼 이체</div>
                    {[
                      { name: '맘스테이', color: T.textMute },
                      { name: '앤코', color: T.blue },
                      { name: '우주', color: T.purple },
                    ].map(p => {
                      const count = items.filter(i => i.이름.includes(`(${p.name})`) || i.이름.includes(`(${p.name === '앤코' ? '엔코' : '___'})`)).length;
                      return (
                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.divider}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</span>
                          </div>
                          <span style={{ fontSize: 13, color: T.textSub }}>{count}건</span>
                        </div>
                      );
                    })}
                    <Link href="/payments/platform" style={{
                      display: 'block', marginTop: 14, padding: '10px 0', textAlign: 'center',
                      borderRadius: 8, border: `1px solid ${T.line}`, fontSize: 13, fontWeight: 600,
                      color: T.blue, textDecoration: 'none',
                    }}>
                      이체 관리
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Tab: Unpaid ═══ */}
            {tab === 'unpaid' && (
              <>
                <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                    미납자 {unpaidItems.length}건 · 총 {fmt(localSummary.unpaidAmount)}
                  </div>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, marginTop: 12 }}>
                    <select value={selectedGu} onChange={e => { setSelectedGu(e.target.value); setSelectedBranch(''); }}
                      style={{ padding: '7px 10px', border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 12, background: T.card, color: T.text, fontFamily: 'inherit', outline: 'none' }}>
                      <option value="">전체 구</option>
                      {guList.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                      style={{ padding: '7px 10px', border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 12, background: T.card, color: T.text, fontFamily: 'inherit', outline: 'none' }}>
                      <option value="">전체 지점</option>
                      {(selectedGu ? (guBranchMap[selectedGu] || []) : []).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 34, borderRadius: 8, background: T.card, border: `1px solid ${T.line}` }}>
                      <IconSearch />
                      <input placeholder="이름 검색" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, background: 'transparent', fontSize: 12, color: T.text, border: 'none', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  {/* List */}
                  <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 70px', minWidth: 400 }}>
                      {['입주자', '금액', '연체'].map(h => (
                        <div key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: T.textMute, background: '#FAFBFC', borderBottom: `1px solid ${T.line}` }}>{h}</div>
                      ))}
                      {unpaidItems.map(p => {
                        const dplus = getDplus(p);
                        const amt = Number(p.청구액) || 0;
                        const isSel = selected?.수납ID === p.수납ID;
                        return (
                          <div key={p.수납ID} onClick={() => setSelected(p)} style={{ display: 'contents', cursor: 'pointer' }}>
                            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.divider}`, background: isSel ? T.blueVeryLight : T.card }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.이름}</div>
                              <div style={{ fontSize: 11, color: T.textMute }}>{p.지점명} · {p.방코드}</div>
                            </div>
                            <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: T.red, borderBottom: `1px solid ${T.divider}`, background: isSel ? T.blueVeryLight : T.card, display: 'flex', alignItems: 'center' }}>{fmt(amt)}</div>
                            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.divider}`, background: isSel ? T.blueVeryLight : T.card, display: 'flex', alignItems: 'center' }}>
                              {dplus > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: T.redLight, color: T.redDark }}>D+{dplus}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {unpaidItems.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 13 }}>미납자가 없습니다</div>
                    )}
                  </div>
                </div>
                {/* Action panel */}
                {selected && (
                  <div style={{ width: 320, background: T.card, borderLeft: `1px solid ${T.line}`, padding: 20, overflowY: 'auto', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute }}>선택한 미납자</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 2 }}>{selected.이름}</div>
                      </div>
                      <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconClose /></button>
                    </div>
                    {/* Red amount box */}
                    <div style={{ background: T.redLight, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.redDark }}>{fmt(Number(selected.청구액) || 0)}</div>
                      {getDplus(selected) > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: T.red, marginTop: 4 }}>D+{getDplus(selected)} 연체</div>}
                    </div>
                    {/* Info */}
                    <div style={{ marginBottom: 16 }}>
                      {[['지점', selected.지점명], ['방', selected.방코드]].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                          <span style={{ color: T.textMute }}>{k}</span>
                          <span style={{ fontWeight: 600, color: T.text }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button onClick={() => copyDunning(selected)} style={{
                        padding: '12px 0', borderRadius: 10, border: 'none',
                        background: T.blue, color: '#fff', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        {copied ? '복사됨' : '독촉 문구 복사'}
                      </button>
                      <a href={`tel:${selected.메모 || ''}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '11px 0', borderRadius: 10, border: `1px solid ${T.line}`,
                        background: T.card, color: T.textSub, fontSize: 13, fontWeight: 600,
                        textDecoration: 'none',
                      }}>
                        <IconPhone />
                        전화 걸기
                      </a>
                      <button onClick={() => markPaid(selected)} disabled={saving} style={{
                        padding: '11px 0', borderRadius: 10, border: 'none',
                        background: T.greenLight, color: T.greenDark, fontSize: 13, fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        opacity: saving ? 0.5 : 1,
                      }}>
                        수동 완납 처리
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ Tab: Match ═══ */}
            {tab === 'match' && (
              <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: 800, width: '100%' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>매칭 대기</div>
                  <div onClick={() => router.push('/payments/upload')} style={{
                    background: T.card, border: `2px dashed ${T.blue}`, borderRadius: 16, padding: '48px 24px',
                    textAlign: 'center', cursor: 'pointer', marginBottom: 20,
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.blue, marginBottom: 4 }}>엑셀 파일 업로드</div>
                    <div style={{ fontSize: 12, color: T.textMute }}>은행 거래내역 엑셀을 업로드하면 자동으로 입주자와 매칭됩니다</div>
                  </div>
                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, padding: 24, textAlign: 'center', color: T.textMute, fontSize: 13 }}>
                    최근 업로드 이력이 없습니다
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Tab: Platform ═══ */}
            {tab === 'platform' && (
              <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>플랫폼 이체</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { name: '맘스테이', color: T.textMute },
                    { name: '앤코', color: T.blue },
                    { name: '우주', color: T.purple },
                  ].map(p => {
                    const matched = items.filter(i => i.이름.includes(`(${p.name})`) || (p.name === '앤코' && i.이름.includes('(엔코)')));
                    const count = matched.length;
                    const amount = matched.reduce((s, i) => s + (Number(i.청구액) || 0), 0);
                    return (
                      <div key={p.name} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{p.name}</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 4 }}>{count}건</div>
                        <div style={{ fontSize: 12, color: T.textMute, marginBottom: 16 }}>{fmt(amount)}</div>
                        <Link href="/payments/platform" style={{
                          display: 'block', padding: '10px 0', textAlign: 'center', borderRadius: 8,
                          border: `1px solid ${T.line}`, fontSize: 12, fontWeight: 600,
                          color: T.blue, textDecoration: 'none',
                        }}>
                          세부 내역 관리
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
