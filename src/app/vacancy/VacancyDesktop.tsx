'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

type Tenant = Record<string, string>;

/* ─── Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF', text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

/* ─── Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>;

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconGrid, active: true },
];

type StatusTab = 'all' | 'available' | 'vacant' | 'soon';

/* ─── Helpers ─── */
function getDday(dateStr: string) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}
function roomCodeShort(code: string) {
  const m = code.match(/^[A-Za-z]-?\d*/);
  return m ? m[0] : code.slice(0, 4);
}

/* ─── Main ─── */
export default function VacancyDesktop() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [gu, setGu] = useState('전체');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [roomType, setRoomType] = useState('전체');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then(d => setTenants(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const guList = useMemo(() => [...new Set(tenants.map(t => t['구']).filter(Boolean))].sort(), [tenants]);

  const filtered = useMemo(() => {
    let list = tenants;
    if (gu !== '전체') list = list.filter(t => t['구'] === gu);
    if (search) { const q = search.toLowerCase(); list = list.filter(t => (t['지점명'] || '').toLowerCase().includes(q)); }
    return list;
  }, [tenants, gu, search]);

  // KPI
  const totalRooms = filtered.length;
  const occupiedCount = useMemo(() => filtered.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중').length, [filtered]);
  const vacantCount = useMemo(() => filtered.filter(t => t['상태'] === '공실').length, [filtered]);
  const soonCount = useMemo(() => filtered.filter(t => t['상태'] === '공실예정').length, [filtered]);

  // Group by house
  type HouseGroup = { name: string; gu: string; rooms: Tenant[]; vacant: number; soon: number };
  const houseGroups = useMemo((): HouseGroup[] => {
    const map = new Map<string, Tenant[]>();
    for (const t of filtered) { const n = t['지점명'] || '-'; if (!map.has(n)) map.set(n, []); map.get(n)!.push(t); }
    const groups: HouseGroup[] = [];
    for (const [name, rooms] of map) {
      rooms.sort((a, b) => (a['방코드'] || '').localeCompare(b['방코드'] || '', 'ko'));
      const vacant = rooms.filter(r => r['상태'] === '공실').length;
      const soon = rooms.filter(r => r['상태'] === '공실예정').length;
      groups.push({ name, gu: rooms[0]?.['구'] || '', rooms, vacant, soon });
    }
    groups.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return groups;
  }, [filtered]);

  // Room types
  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach(t => { const rt = t['방타입']; if (rt) set.add(rt); });
    return [...set].sort();
  }, [filtered]);

  // Filter by status tab + room type
  const visibleGroups = useMemo(() => {
    return houseGroups.map(g => {
      let rooms = g.rooms;
      // Room type filter
      if (roomType !== '전체') rooms = rooms.filter(r => r['방타입'] === roomType);
      // Status filter
      if (statusTab === 'vacant') rooms = rooms.filter(r => r['상태'] === '공실');
      else if (statusTab === 'soon') rooms = rooms.filter(r => r['상태'] === '공실예정');
      else if (statusTab === 'available') rooms = rooms.filter(r => r['상태'] === '공실' || r['상태'] === '공실예정');
      if (rooms.length === 0) return null;
      return { ...g, rooms, vacant: rooms.filter(r => r['상태'] === '공실').length, soon: rooms.filter(r => r['상태'] === '공실예정').length };
    }).filter(Boolean) as HouseGroup[];
  }, [houseGroups, statusTab, roomType]);

  // Gu counts for sidebar
  const guCounts = useMemo(() => {
    const map: Record<string, number> = {};
    tenants.filter(t => t['상태'] === '공실').forEach(t => { const g = t['구'] || ''; map[g] = (map[g] || 0) + 1; });
    return map;
  }, [tenants]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 18px' }}><div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div><div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div></div>
        <div style={{ padding: '0 16px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}><IconSearch /><span style={{ fontSize: 12, color: T.textMute }}>검색</span></div></div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {MENU.map(m => (<Link key={m.label} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: m.active ? T.blueLight : 'transparent', color: m.active ? T.blueDark : T.textSub, fontWeight: m.active ? 600 : 400, fontSize: 13, textDecoration: 'none' }}><m.icon />{m.label}</Link>))}
        </nav>
        <SidebarLogout />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px 16px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>공실 관리</div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: District sidebar */}
          <div style={{ width: 220, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, borderRadius: 8, padding: '7px 10px' }}>
                <IconSearch />
                <input placeholder="지점명 검색" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: T.text, fontFamily: 'inherit' }} />
              </div>
            </div>
            {['전체', ...guList].map(g => {
              const cnt = g === '전체' ? vacantCount : (guCounts[g] || 0);
              const isActive = gu === g;
              return (
                <button key={g} onClick={() => setGu(g)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', border: 'none', background: isActive ? T.blueLight : 'transparent',
                  color: isActive ? T.blueDark : T.textSub, fontWeight: isActive ? 600 : 400,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                }}>
                  {g}
                  {cnt > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? T.blueDark : T.red }}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          {/* Right: Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {/* KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: '전체 방', value: totalRooms, color: T.text, tab: 'all' as StatusTab },
                { label: '입주중', value: occupiedCount, color: T.green, tab: 'all' as StatusTab },
                { label: '즉시공실', value: vacantCount, color: T.red, tab: 'vacant' as StatusTab },
                { label: '공실예정', value: soonCount, color: T.orange, tab: 'soon' as StatusTab },
              ].map(k => (
                <div key={k.label} onClick={() => setStatusTab(k.tab)} style={{ background: T.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${T.divider}`, cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Status tabs + room type filter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { key: 'all' as const, label: '전체현황' },
                  { key: 'available' as const, label: '입주가능' },
                  { key: 'vacant' as const, label: '즉시공실' },
                  { key: 'soon' as const, label: '공실예정' },
                ]).map(t => (
                  <button key={t.key} onClick={() => setStatusTab(t.key)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    background: statusTab === t.key ? T.text : T.card, color: statusTab === t.key ? '#fff' : T.textSub,
                    border: statusTab === t.key ? 'none' : `1px solid ${T.line}`,
                  }}>{t.label}</button>
                ))}
              </div>
              {roomTypes.length > 1 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {['전체', ...roomTypes].map(rt => (
                    <button key={rt} onClick={() => setRoomType(rt)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      background: roomType === rt ? T.blueDark : T.card, color: roomType === rt ? '#fff' : T.textMute,
                      border: roomType === rt ? 'none' : `1px solid ${T.line}`,
                    }}>{rt}</button>
                  ))}
                </div>
              )}
            </div>

            {/* House cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
            ) : visibleGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMute, fontSize: 13 }}>조건에 맞는 지점이 없어요</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                {visibleGroups.map(g => {
                  const isOpen = !!expanded[g.name];
                  const previewRooms = isOpen ? g.rooms : g.rooms.slice(0, 6);
                  return (
                    <div key={g.name} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                      {/* Card header */}
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{g.name}</span>
                          <span style={{ fontSize: 12, color: T.textMute }}>{g.gu}</span>
                          {(() => {
                            const typeCounts: Record<string, number> = {};
                            g.rooms.forEach(r => { const rt = r['방타입']; if (rt) typeCounts[rt] = (typeCounts[rt] || 0) + 1; });
                            const entries = Object.entries(typeCounts).sort((a, b) => a[0].localeCompare(b[0]));
                            if (entries.length === 0) return null;
                            return <span style={{ fontSize: 11, color: T.textMute }}>{entries.map(([k, v]) => `${k} ${v}`).join(' · ')}</span>;
                          })()}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {g.vacant > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: T.redLight, color: T.redDark }}>공실 {g.vacant}</span>}
                          {g.soon > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: T.orangeLight, color: T.orangeDark }}>예정 {g.soon}</span>}
                          <span style={{ fontSize: 10, color: T.textMute }}>/{g.rooms.length}</span>
                        </div>
                      </div>

                      {/* Room rows */}
                      {previewRooms.map(t => {
                        const st = t['상태'];
                        const isVacant = st === '공실';
                        const isSoon = st === '공실예정';
                        const dday = isSoon ? getDday(t['퇴실일']) : 0;
                        return (
                          <div key={t['입주자ID'] || t['방코드']} style={{
                            display: 'flex', alignItems: 'center', padding: '8px 18px', borderTop: `1px solid ${T.divider}`,
                            borderLeft: isVacant ? `4px solid ${T.red}` : isSoon ? `4px solid ${T.orange}` : '4px solid transparent',
                            background: isVacant ? '#FFF7F7' : isSoon ? '#FFFCF5' : T.card,
                          }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: T.textMute, width: 40, flexShrink: 0 }}>{roomCodeShort(t['방코드'])}</span>
                            <span style={{ fontSize: 12, color: T.textSub, width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t['방타입'] || '-'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {isVacant ? (
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.red }}>공실</span>
                              ) : (
                                <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{t['이름'] || '-'}</span>
                              )}
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                              {isVacant ? (
                                <span style={{ fontSize: 10, color: T.textMute }}>즉시 입주 가능</span>
                              ) : isSoon ? (
                                <span style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>{t['퇴실일']?.slice(2, 10) || ''} {dday >= 0 ? `(D-${dday})` : ''}</span>
                              ) : (
                                <span style={{ fontSize: 11, color: T.textMute }}>{t['퇴실일']?.slice(2, 10) || ''}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Expand toggle */}
                      {g.rooms.length > 6 && (
                        <button onClick={() => setExpanded(p => ({ ...p, [g.name]: !p[g.name] }))} style={{
                          width: '100%', padding: '8px 0', border: 'none', borderTop: `1px solid ${T.divider}`,
                          background: '#FAFBFC', color: T.blue, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}>
                          {isOpen ? '접기' : `${g.rooms.length - 6}개 더 보기`}
                          <span style={{ transform: isOpen ? 'rotate(180deg)' : '', display: 'flex', transition: 'transform .2s' }}><IconChevronDown /></span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
