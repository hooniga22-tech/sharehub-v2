'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type Duty = { 당번ID: string; 지점명: string; 주차시작일: string; 방코드: string; 입주자명: string; 당번유형: string; 완료여부: string; 완료일시: string; 완료처리자: string; 면제사유: string };

/* ─── Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF', text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA', blueVeryLight: '#F0F7FF',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  '완료': { bg: T.greenLight, color: T.greenDark, label: '완료' },
  '예정': { bg: T.divider, color: T.textMute, label: '예정' },
  '미완료': { bg: T.redLight, color: T.redDark, label: '미완료' },
  '면제': { bg: T.divider, color: T.textMute, label: '면제' },
  '건너뜀': { bg: T.divider, color: T.textMute, label: '공실' },
  '스킵': { bg: T.blueLight, color: T.blue, label: '청소주' },
};

const fmtWeek = (ws: string) => {
  const d = new Date(ws); const e = new Date(d); e.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;
};

/* ─── Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconUndo = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>;
const IconShield = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="8" y1="11" x2="16" y2="11" /></svg>;
const IconRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconGrid, active: true },
];

/* ─── Main ─── */
export default function DutyDesktop() {
  const [houses, setHouses] = useState<string[]>([]);
  const [houseGuMap, setHouseGuMap] = useState<Record<string, string>>({});
  const [gu, setGu] = useState('전체');
  const [search, setSearch] = useState('');
  const [selHouse, setSelHouse] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [thisWeek, setThisWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Per-house "this week" cache for left panel preview
  const [houseThisWeek, setHouseThisWeek] = useState<Record<string, { name: string; type: string }>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  // Load houses
  useEffect(() => {
    Promise.all([
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
    ]).then(([tenantData, houseData]) => {
      const names = [...new Set((Array.isArray(tenantData) ? tenantData : []).map((t: any) => t.지점명))].filter(Boolean) as string[];
      setHouses(names.sort());
      const map: Record<string, string> = {};
      (Array.isArray(houseData) ? houseData : []).forEach((h: any) => { if (h['지점명'] && h['구']) map[h['지점명']] = h['구']; });
      setHouseGuMap(map);

      // Fetch this week preview for all houses
      names.forEach(h => {
        fetch(`/api/duty?house=${encodeURIComponent(h)}&weeks=1`).then(r => r.json()).then(d => {
          const tw = d.thisWeek || '';
          const slot = (d.duties || []).find((du: Duty) => du.주차시작일 === tw);
          if (slot) {
            setHouseThisWeek(prev => ({ ...prev, [h]: { name: slot.당번유형 === '당번' ? slot.입주자명 : slot.당번유형 === '청소주' ? '정기청소 스킵' : '당번 없음', type: slot.당번유형 } }));
          }
        }).catch(() => {});
      });

      if (names.length > 0) { setSelHouse(names[0]); fetchDuty(names[0]); }
    });
  }, []);

  const fetchDuty = (house: string) => {
    setLoading(true);
    fetch(`/api/duty?house=${encodeURIComponent(house)}&weeks=8`)
      .then(r => r.json())
      .then(d => { setDuties(d.duties || []); setThisWeek(d.thisWeek || ''); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const selectHouse = (h: string) => { setSelHouse(h); setTab(0); fetchDuty(h); };

  const markDone = async (id: string) => {
    await fetch('/api/duty', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: '완료', 완료처리자: 'admin' }) });
    setDuties(prev => prev.map(d => d.당번ID === id ? { ...d, 완료여부: '완료' } : d));
    showToast('완료 처리됐어요!');
  };
  const markUndone = async (id: string) => {
    await fetch('/api/duty', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: '예정', 완료일시: '', 완료처리자: '' }) });
    setDuties(prev => prev.map(d => d.당번ID === id ? { ...d, 완료여부: '예정' } : d));
    showToast('되돌렸어요');
  };
  const generateDuty = async (house: string) => {
    showToast('스케줄 생성 중...');
    const res = await fetch('/api/duty/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ house, weeksAhead: 8 }) }).then(r => r.json());
    if (res.duties?.length > 0) {
      await fetch('/api/duty', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batch: true, duties: res.duties }) });
      showToast(`스케줄 ${res.count}주 생성 완료!`);
      fetchDuty(house);
    } else { showToast('이미 스케줄이 있어요'); }
  };

  const guList = useMemo(() => [...new Set(Object.values(houseGuMap).filter(Boolean))].sort(), [houseGuMap]);
  const filteredHouses = useMemo(() => {
    let list = gu === '전체' ? houses : houses.filter(h => houseGuMap[h] === gu);
    if (search) { const q = search.toLowerCase(); list = list.filter(h => h.toLowerCase().includes(q)); }
    return list;
  }, [houses, gu, houseGuMap, search]);

  const thisWeekSlot = duties.find(d => d.주차시작일 === thisWeek);
  const futureSlots = duties.filter(d => d.주차시작일 > thisWeek);
  const pastSlots = duties.filter(d => d.주차시작일 < thisWeek).sort((a, b) => b.주차시작일.localeCompare(a.주차시작일));

  const StatusBadge = ({ status }: { status: string }) => {
    const c = STATUS_CFG[status] || STATUS_CFG['예정'];
    return <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>;
  };

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
        <div style={{ padding: '18px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>당번 관리</div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: House list */}
          <div style={{ width: 360, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Search */}
            <div style={{ padding: '10px 16px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, borderRadius: 8, padding: '7px 10px' }}>
                <IconSearch />
                <input placeholder="지점명 검색" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: T.text, fontFamily: 'inherit' }} />
              </div>
            </div>
            {/* Gu chips */}
            {guList.length > 0 && (
              <div style={{ display: 'flex', gap: 5, padding: '4px 16px 10px', overflowX: 'auto', flexShrink: 0 }}>
                {['전체', ...guList].map(g => (
                  <button key={g} onClick={() => setGu(g)} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: gu === g ? 600 : 400, background: gu === g ? T.blue : T.card, color: gu === g ? '#fff' : T.textSub, border: gu === g ? 'none' : `1px solid ${T.line}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{g}</button>
                ))}
              </div>
            )}
            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredHouses.map(h => {
                const isActive = selHouse === h;
                const preview = houseThisWeek[h];
                return (
                  <div key={h} onClick={() => selectHouse(h)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    cursor: 'pointer', background: isActive ? T.blueVeryLight : T.card,
                    borderLeft: isActive ? `3px solid ${T.blue}` : '3px solid transparent',
                    borderBottom: `1px solid ${T.divider}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{h}</div>
                      <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
                        {preview ? (preview.type === '청소주' ? '이번주 · 정기청소 스킵' : preview.type === '당번' ? `이번주 · ${preview.name}` : '이번주 · 당번 없음') : ''}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selHouse ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMute, fontSize: 13 }}>지점을 선택해주세요</div>
            ) : (
              <>
                {/* Detail header */}
                <div style={{ padding: '16px 24px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{selHouse}</div>
                      <div style={{ fontSize: 13, color: T.textMute }}>{houseGuMap[selHouse] || ''}</div>
                    </div>
                    <button onClick={() => generateDuty(selHouse)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <IconRefresh /> 스케줄 생성
                    </button>
                  </div>
                  {/* Tabs */}
                  <div style={{ display: 'flex', marginTop: 12, gap: 4 }}>
                    {['현황', '이력'].map((label, i) => (
                      <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', borderBottom: tab === i ? `2px solid ${T.blue}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.blue : T.textMute, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Detail content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
                  ) : duties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: T.textSub, marginBottom: 12 }}>당번 스케줄이 없어요</div>
                      <button onClick={() => generateDuty(selHouse)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: T.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>스케줄 자동 생성</button>
                    </div>
                  ) : (
                    <>
                      {/* 현황 탭 */}
                      {tab === 0 && (
                        <>
                          {/* This week */}
                          {thisWeekSlot && (
                            <div style={{ background: thisWeekSlot.당번유형 === '청소주' ? T.divider : T.blueVeryLight, borderRadius: 14, padding: 20, marginBottom: 16, border: thisWeekSlot.당번유형 === '청소주' ? 'none' : `1.5px solid ${T.blue}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: T.blue, color: '#fff' }}>이번주</span>
                                <span style={{ fontSize: 13, color: T.textMute }}>{fmtWeek(thisWeekSlot.주차시작일)}</span>
                              </div>
                              {thisWeekSlot.당번유형 === '청소주' ? (
                                <div style={{ fontSize: 14, color: T.textMute }}>정기청소 주 · 당번 없음</div>
                              ) : (
                                <>
                                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 2 }}>{thisWeekSlot.입주자명}</div>
                                  <div style={{ fontSize: 12, color: T.textMute, marginBottom: 14 }}>{thisWeekSlot.방코드}</div>
                                  {thisWeekSlot.완료여부 === '완료' ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>완료{thisWeekSlot.완료일시 ? ` · ${thisWeekSlot.완료일시}` : ''}</span>
                                      <button onClick={() => markUndone(thisWeekSlot.당번ID)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textMute, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><IconUndo /> 되돌리기</button>
                                    </div>
                                  ) : thisWeekSlot.완료여부 === '면제' ? (
                                    <div style={{ fontSize: 13, color: T.textMute }}>면제 처리됨{thisWeekSlot.면제사유 ? ` · ${thisWeekSlot.면제사유}` : ''}</div>
                                  ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button onClick={() => showToast('면제 기능은 모바일에서 이용해주세요')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, fontWeight: 600, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><IconShield /> 면제</button>
                                      <button onClick={() => markDone(thisWeekSlot.당번ID)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: T.blue, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><IconCheck /> 완료 처리</button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Future */}
                          {futureSlots.length > 0 && (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, marginBottom: 10 }}>앞으로 당번</div>
                              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                                {futureSlots.map((s, i) => (
                                  <div key={s.당번ID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: i > 0 ? `1px solid ${T.divider}` : 'none', opacity: s.당번유형 !== '당번' ? 0.6 : 1 }}>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: s.당번유형 !== '당번' ? T.textMute : T.text }}>{s.당번유형 === '당번' ? s.입주자명 : s.당번유형 === '청소주' ? '정기청소' : '공실'}</div>
                                      <div style={{ fontSize: 11, color: T.textMute }}>{s.당번유형 === '당번' ? `${s.방코드} · ` : ''}{fmtWeek(s.주차시작일)}</div>
                                    </div>
                                    <StatusBadge status={s.완료여부} />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* 이력 탭 */}
                      {tab === 1 && (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, marginBottom: 10 }}>당번 이력</div>
                          {pastSlots.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {pastSlots.map(s => (
                                <div key={s.당번ID} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, padding: '14px 18px', opacity: 0.85 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                    <div>
                                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.당번유형 === '당번' ? `${s.입주자명}  ${s.방코드}` : s.당번유형 === '청소주' ? '정기청소 · 스킵' : '공실 · 건너뜀'}</div>
                                      <div style={{ fontSize: 12, color: T.textMute }}>{fmtWeek(s.주차시작일)}</div>
                                    </div>
                                    <StatusBadge status={s.완료여부} />
                                  </div>
                                  {s.완료일시 && <span style={{ fontSize: 12, color: T.green }}>완료 · {s.완료일시}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 13 }}>이력이 없어요</div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
