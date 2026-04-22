'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Link from 'next/link';
import { buildTimelines, barStyle, MONTHS, DAYS_IN_MONTH } from '@/lib/timeline';
import type { TenantSpan, HandoverSpan, HouseTimeline } from '@/types/timeline';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type Tenant = {
  입주자ID: string; 구: string; 지점명: string; 방코드: string; 방타입: string;
  이름: string; 입주일: string; 퇴실일: string; 상태: string;
  보증금: string; 월세: string; 관리비: string;
  메모: string; 연락처: string; 링크토큰: string;
};

type ViewMode = 'gantt' | 'table';
type StatusFilter = 'all' | 'soon' | 'out';

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  blueVeryLight: '#F0F7FF',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

const BAR_STYLES = {
  in: { bg: '#dbeafe', border: '#3182f6', fg: '#1d4ed8' },
  soon: { bg: '#fde7b8', border: '#f59e0b', fg: '#92400e' },
  out: { bg: '#ffcfcf', border: '#F04452', fg: '#991b1b' },
} as const;

const TODAY = new Date();
const TODAY_MONTH = TODAY.getMonth();
const TODAY_DAY = TODAY.getDate();
const TODAY_LEFT_PCT = ((TODAY_MONTH + (TODAY_DAY - 1) / DAYS_IN_MONTH[TODAY_MONTH]) / 12) * 100;
const ROW_H = 44;
const LABEL_W = 100;

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
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers, active: true },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconSettings },
];

/* ─── Helpers ─── */
function isActiveNow(t: TenantSpan | HandoverSpan): boolean {
  if (t.type === 'handover') return (t as HandoverSpan).month === TODAY_MONTH;
  const sp = t as TenantSpan;
  return sp.startMonth <= TODAY_MONTH && sp.endMonth >= TODAY_MONTH;
}
function matchesFilter(t: TenantSpan | HandoverSpan, f: StatusFilter): boolean {
  if (f === 'all') return true;
  if (t.type === 'handover') return f === 'out';
  return (t as TenantSpan).type === f;
}
function exitMMDD(raw?: string): string {
  if (!raw) return '';
  const s = String(raw).replace(/\s+/g, '');
  const m = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return '';
  return `${Number(m[2])}/${Number(m[3])}`;
}
function statusBadge(status: string) {
  if (status === '입주중') return { bg: T.greenLight, color: T.greenDark };
  if (status === '퇴실예정' || status === '퇴실확정') return { bg: T.redLight, color: T.redDark };
  if (status.includes('임박')) return { bg: T.orangeLight, color: T.orangeDark };
  return { bg: T.divider, color: T.textMute };
}

/* ─── Main Component ─── */
export default function TenantsDesktop() {
  const { data: rawTenants, isLoading: loading } = useSWR<Tenant[]>('/api/tenants', fetcher, {
    refreshInterval: 0, revalidateOnFocus: true, revalidateOnReconnect: true,
  });
  const { data: rawRooms } = useSWR('/api/rooms', fetcher);

  const allTenants = Array.isArray(rawTenants) ? rawTenants : [];
  const allRooms = Array.isArray(rawRooms) ? rawRooms : [];
  const tenants = allTenants.filter(t => t['상태'] !== '퇴실완료' && t['상태'] !== '계약취소');
  const timelines = useMemo(() => buildTimelines(allTenants, allRooms), [allTenants, allRooms]);

  const [view, setView] = useState<ViewMode>('gantt');
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [gu, setGu] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openHouses, setOpenHouses] = useState<Record<string, boolean>>(() => {
    return {};
  });

  const guList = useMemo(() => [...new Set(tenants.map(t => t['구']).filter(Boolean))].sort(), [tenants]);
  const vacantCount = useMemo(() => {
    let count = 0;
    timelines.forEach(h => h.rooms.forEach(r => { if (r.tenants.length === 0) count++; }));
    return count;
  }, [timelines]);

  // Filter timelines
  const filtered = useMemo(() => {
    let list = timelines;
    if (gu !== '전체') list = list.filter(h => h.district === gu);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => {
        if (h.name.toLowerCase().includes(q)) return true;
        return h.rooms.some(r => r.tenants.some(t =>
          t.type === 'handover'
            ? ((t as HandoverSpan).n1.toLowerCase().includes(q) || (t as HandoverSpan).n2.toLowerCase().includes(q))
            : (t as TenantSpan).name?.toLowerCase().includes(q)
        ));
      });
    }
    return list;
  }, [timelines, gu, search]);

  // Status counts
  const { inC, soonC, outC } = useMemo(() => {
    let inC = 0, soonC = 0, outC = 0;
    filtered.forEach(h => h.rooms.forEach(r => {
      const cur = r.tenants.find(isActiveNow);
      if (!cur) return;
      if (cur.type === 'handover' || cur.type === 'in') inC++;
      else if (cur.type === 'soon') soonC++;
      else if (cur.type === 'out') outC++;
    }));
    return { inC, soonC, outC };
  }, [filtered]);
  const totalC = inC + soonC + outC;

  // Table data
  const tableData = useMemo(() => {
    let list = tenants;
    if (gu !== '전체') list = list.filter(t => t['구'] === gu);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t['이름'].toLowerCase().includes(q) || t['지점명'].toLowerCase().includes(q));
    }
    return list;
  }, [tenants, gu, search]);

  // Find tenant by id for selecting from gantt
  const selectById = (id: string) => {
    const t = allTenants.find(t => t['입주자ID'] === id);
    if (t) setSelected(t);
  };

  // Auto-open first house
  useMemo(() => {
    if (filtered.length > 0 && Object.keys(openHouses).length === 0) {
      setOpenHouses({ [filtered[0].id]: true });
    }
  }, [filtered.length > 0]);

  const statusChips: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: 'all', label: '전체', count: totalC, color: '#191f28' },
    { key: 'soon', label: '종료임박', count: soonC, color: '#f59e0b' },
    { key: 'out', label: '퇴실확정', count: outC, color: '#F04452' },
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
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              background: m.active ? T.blueLight : 'transparent',
              color: m.active ? T.blueDark : T.textSub,
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
        <div style={{ height: 70, padding: '0 28px', background: T.card, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>입주자</div>
            <div style={{ fontSize: 13, color: T.textMute }}>전체 {tenants.length}명 · 공실 {vacantCount}실</div>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', background: T.bg, borderRadius: 8, padding: 3 }}>
            {(['gantt', 'table'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: view === v ? T.card : 'transparent',
                color: view === v ? T.text : T.textMute,
                fontWeight: view === v ? 600 : 400, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {v === 'gantt' ? '간트' : '표'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            {/* Search + status filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, borderRadius: 8, background: T.card, border: `1px solid ${T.line}` }}>
                <IconSearch />
                <input placeholder="이름 또는 지점�� 검색" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, background: 'transparent', fontSize: 13, color: T.text, border: 'none', outline: 'none', fontFamily: 'inherit' }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><IconClose /></button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {statusChips.map(chip => {
                  const active = statusFilter === chip.key;
                  return (
                    <button key={chip.key} onClick={() => setStatusFilter(chip.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 100,
                        border: `1px solid ${chip.color}`,
                        background: active ? chip.color : '#fff',
                        color: active ? '#fff' : chip.color,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {chip.label}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: active ? 'rgba(255,255,255,0.25)' : '#f2f4f6', color: active ? '#fff' : chip.color }}>{chip.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gu filter chips */}
            {guList.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {['전체', ...guList].map(g => (
                  <button key={g} onClick={() => setGu(g)} style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: gu === g ? 600 : 400,
                    background: gu === g ? T.text : T.card, color: gu === g ? '#fff' : T.textSub,
                    border: gu === g ? 'none' : `1px solid ${T.line}`, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{g}</button>
                ))}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
            ) : view === 'gantt' ? (
              /* ═══ GANTT VIEW ═══ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(house => {
                  const isOpen = !!openHouses[house.id];
                  const vacRooms = house.rooms.filter(r => r.tenants.length === 0).length;
                  return (
                    <div key={house.id} style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                      {/* House header */}
                      <div onClick={() => setOpenHouses(p => ({ ...p, [house.id]: !p[house.id] }))}
                        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{house.name}</span>
                          <span style={{ fontSize: 11, color: T.textMute, marginLeft: 8 }}>{house.district} · {house.total}실</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {vacRooms > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: T.divider, color: T.textMute }}>공실 {vacRooms}</span>}
                          <svg style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : '' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* Timeline rows */}
                      {isOpen && (
                        <div style={{ overflowX: 'auto' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: `${LABEL_W}px repeat(12,1fr)`, minWidth: 700 }}>
                            {/* Month header */}
                            <div style={{ width: LABEL_W, padding: '6px 10px', fontSize: 10, fontWeight: 600, color: T.textMute, background: '#FAFBFC', borderRight: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, position: 'sticky', left: 0, zIndex: 6, boxSizing: 'border-box' }}>호실</div>
                            {MONTHS.map((m, i) => (
                              <div key={m} style={{ padding: '6px 2px', fontSize: 9, fontWeight: 700, textAlign: 'center', background: i === TODAY_MONTH ? T.blueVeryLight : '#FAFBFC', color: i === TODAY_MONTH ? T.blue : T.textMute, borderBottom: `1px solid ${T.line}`, borderRight: `1px solid ${T.divider}` }}>{m}월</div>
                            ))}

                            {/* Room rows */}
                            {house.rooms.map(room => {
                              const isVacant = room.tenants.length === 0;
                              const rowMatches = statusFilter !== 'all' && room.tenants.some(t => isActiveNow(t) && matchesFilter(t, statusFilter));
                              const rowBg = rowMatches ? '#fffbf0' : (isVacant ? '#FAFBFC' : T.card);
                              return (
                                <div key={room.code} style={{ display: 'contents' }}>
                                  <div style={{ width: LABEL_W, padding: '0 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'sticky', left: 0, zIndex: 4, background: rowBg, borderRight: `1px solid ${T.line}`, height: ROW_H, boxSizing: 'border-box' }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: isVacant ? T.textMute : T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.code}</span>
                                    <span style={{ fontSize: 9, color: T.textMute }}>{isVacant ? '공실' : room.loc}</span>
                                  </div>
                                  <div style={{ gridColumn: '2/14', display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', position: 'relative', height: ROW_H, borderBottom: `1px solid ${T.divider}`, background: rowBg }}>
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <div key={i} style={{ borderRight: `1px solid ${T.divider}`, background: i === TODAY_MONTH && !rowMatches ? 'rgba(49,130,246,.03)' : 'transparent' }} />
                                    ))}
                                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${TODAY_LEFT_PCT}%`, width: 1.5, background: T.blue, opacity: 0.5, pointerEvents: 'none', zIndex: 1 }} />
                                    {room.tenants.map((t, ti) => {
                                      const matched = matchesFilter(t, statusFilter);
                                      const dim = statusFilter !== 'all' && !matched;
                                      const opacity = dim ? 0.25 : 1;
                                      if (t.type === 'handover') {
                                        const hov = t as HandoverSpan;
                                        const bs = barStyle(hov.month, hov.month);
                                        return (
                                          <div key={ti} onClick={() => selectById(hov.tenantId2 || hov.tenantId1 || '')}
                                            style={{ position: 'absolute', top: 4, height: ROW_H - 8, left: bs.left, width: bs.width, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', zIndex: 2, opacity, border: `1px solid ${BAR_STYLES.out.border}` }}>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 5px', fontSize: 9, fontWeight: 600, background: BAR_STYLES.out.bg, color: BAR_STYLES.out.fg, overflow: 'hidden', whiteSpace: 'nowrap' }}>{hov.n1}</div>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 5px', fontSize: 9, fontWeight: 600, background: BAR_STYLES[hov.typeN2].bg, color: BAR_STYLES[hov.typeN2].fg, overflow: 'hidden', whiteSpace: 'nowrap' }}>{hov.n2}</div>
                                          </div>
                                        );
                                      }
                                      const sp = t as TenantSpan;
                                      const bs = barStyle(sp.startMonth, sp.endMonth);
                                      const colors = BAR_STYLES[sp.type] || BAR_STYLES.in;
                                      const exit = exitMMDD(sp.contractEnd);
                                      return (
                                        <div key={ti} onClick={() => selectById(sp.tenantId || '')}
                                          style={{ position: 'absolute', top: 5, height: ROW_H - 10, left: bs.left, width: bs.width, borderRadius: 6, background: colors.bg, color: colors.fg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer', zIndex: 2, opacity }}>
                                          <span style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{sp.name}</span>
                                          {exit && <span style={{ fontSize: 9, opacity: 0.7, flexShrink: 0 }}>{exit}</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ═══ TABLE VIEW ═══ */
              <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 80px 80px 100px 100px 130px', minWidth: 800 }}>
                    {/* Header */}
                    {['상태', '이름', '지점', '방', '방타입', '입주일', '퇴실일', '연락처'].map(col => (
                      <div key={col} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: T.textMute, background: '#FAFBFC', borderBottom: `1px solid ${T.line}` }}>{col}</div>
                    ))}
                    {/* Rows */}
                    {tableData.map(t => {
                      const badge = statusBadge(t['상태']);
                      const isSelected = selected?.['입주자ID'] === t['입주자ID'];
                      return (
                        <div key={t['입주자ID']} onClick={() => setSelected(t)} style={{ display: 'contents', cursor: 'pointer' }}>
                          <div style={{ padding: '10px 12px', fontSize: 12, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: badge.bg, color: badge.color }}>{t['상태']}</span>
                          </div>
                          <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: T.text, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t['이름']}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>{t['지점명']}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>{t['방코드']}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>{t['방타입']}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>{(t['입주일'] || '').slice(0, 10)}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>{(t['퇴실일'] || '').slice(0, 10)}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, borderBottom: `1px solid ${T.divider}`, background: isSelected ? T.blueLight : T.card }}>{t['연락처']}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Right Detail Panel ═══ */}
          {selected && (
            <div style={{ width: 320, background: T.card, borderLeft: `1px solid ${T.line}`, padding: 20, overflowY: 'auto', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, marginBottom: 4 }}>선택한 입주자</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{selected['이름']}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconClose /></button>
              </div>

              {/* Personal page buttons */}
              {selected['링크토큰'] ? (
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/tenant/${selected['링크토큰']}`;
                      navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
                    }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    {copied ? '복사됨!' : '링크 복사'}
                  </button>
                  <button
                    onClick={() => window.open(`/tenant/${selected['링크토큰']}`, '_blank')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: 'none', background: T.blue, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    개인 페이지
                  </button>
                </div>
              ) : null}

              {/* Section 1: Basic info */}
              <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, marginBottom: 10 }}>기본 정보</div>
                {[
                  ['지점', selected['지점명']],
                  ['방', `${selected['방코드']} (${selected['방타입'] || '-'})`],
                  ['상태', selected['상태']],
                  ['구', selected['구']],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                    <span style={{ color: T.textMute }}>{k}</span>
                    <span style={{ fontWeight: 600, color: T.text }}>{v || '-'}</span>
                  </div>
                ))}
              </div>

              {/* Section 2: Contract */}
              <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, marginBottom: 10 }}>계약 정보</div>
                {[
                  ['입주일', (selected['입주일'] || '').slice(0, 10)],
                  ['퇴실 예정', (selected['퇴실일'] || '').slice(0, 10)],
                  ['보증금', selected['보증금'] ? `${Number(selected['보증금']).toLocaleString()}원` : '-'],
                  ['월세', selected['월세'] ? `${Number(selected['월세']).toLocaleString()}원` : '-'],
                  ['관리비', selected['관리비'] ? `${Number(selected['관리비']).toLocaleString()}원` : '-'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                    <span style={{ color: T.textMute }}>{k}</span>
                    <span style={{ fontWeight: 600, color: k === '월세' ? T.blue : T.text }}>{v || '-'}</span>
                  </div>
                ))}
              </div>

              {/* Section 3: Contact */}
              {selected['연락처'] && (
                <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, marginBottom: 10 }}>연락처</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconPhone />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{selected['연락처']}</span>
                  </div>
                </div>
              )}

              {/* Memo */}
              {selected['메모'] && (
                <div style={{ background: T.bg, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, marginBottom: 6 }}>메모</div>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{selected['메모']}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
