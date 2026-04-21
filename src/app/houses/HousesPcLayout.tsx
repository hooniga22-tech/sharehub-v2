'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ─── */
type House = Record<string, string>;
type TenantRecord = Record<string, string>;

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA', blueVeryLight: '#F0F7FF',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

const fmt = (n: number) => n.toLocaleString() + '원';
const TABS = ['기본정보', '방현황', '운영정보', '공과금계정'];

/* ─── SVG Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconCopy = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconZap = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const IconFlame = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
const IconDroplet = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
const IconGlobe = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const IconCup = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>;

const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding, active: true },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconSettings },
];

const UTIL_ICONS: Record<string, () => React.ReactElement> = { '전기': IconZap, '가스': IconFlame, '수도': IconDroplet, '인터넷': IconGlobe, '정수기': IconCup };

/* ─── Main Layout ─── */
export default function HousesPcLayout({ selectedHouseId }: { selectedHouseId?: string }) {
  const router = useRouter();
  const [houses, setHouses] = useState<House[]>([]);
  const [allTenants, setAllTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [gu, setGu] = useState('전체');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(selectedHouseId || null);

  // Detail state
  const [detail, setDetail] = useState<House | null>(null);
  const [detailTenants, setDetailTenants] = useState<TenantRecord[]>([]);
  const [investor, setInvestor] = useState<any>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Edit states
  const [editing, setEditing] = useState(false);
  const [addr, setAddr] = useState('');
  const [doorPw, setDoorPw] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPw, setWifiPw] = useState('');
  const [memo, setMemo] = useState('');
  const [utilAccounts, setUtilAccounts] = useState<Record<string, { vendor: string; account: string }>>({});
  const [editUtil, setEditUtil] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };
  const copyText = (text: string) => { navigator.clipboard?.writeText(text); showToast('복사됐어요!'); };

  // Load list
  useEffect(() => {
    Promise.all([
      fetch('/api/houses').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([hData, tData]) => {
      const hs = Array.isArray(hData) ? hData : [];
      const ts = Array.isArray(tData) ? tData : [];
      setHouses(hs);
      setAllTenants(ts);
      if (!activeId && hs.length > 0) setActiveId(hs[0]['지점ID']);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Load detail when activeId changes
  useEffect(() => {
    if (!activeId) return;
    setDetailLoading(true);
    setEditing(false);
    setEditUtil(false);
    setDetailTab(0);
    fetch(`/api/houses?id=${activeId}`).then(r => r.json()).then(h => {
      setDetail(h);
      setAddr(h['주소'] || '');
      setDoorPw(h['현관비번'] || '');
      setWifiSsid(h['와이파이SSID'] || '');
      setWifiPw(h['와이파이PW'] || '');
      setMemo(h['메모'] || '');
      try {
        const m = h['메모'] || '';
        const jsonMatch = m.match(/\{"전기.*\}/);
        if (jsonMatch) setUtilAccounts(JSON.parse(jsonMatch[0]));
        else setUtilAccounts({});
      } catch { setUtilAccounts({}); }

      const ts = allTenants.filter(t => t['지점명'] === h['지점명'] && t['상태'] !== '퇴실완료');
      setDetailTenants(ts);

      if (h['투자자토큰']) {
        fetch(`/api/investors?token=${h['투자자토큰']}`).then(r => r.json()).then(d => { if (!d.error) setInvestor(d); else setInvestor(null); }).catch(() => setInvestor(null));
      } else setInvestor(null);

      setDetailLoading(false);
    }).catch(() => setDetailLoading(false));
  }, [activeId, allTenants]);

  const guList = useMemo(() => [...new Set(houses.map(h => h['구']).filter(Boolean))] as string[], [houses]);
  const filtered = useMemo(() => {
    let list = gu === '전체' ? houses : houses.filter(h => h['구'] === gu);
    if (search) { const q = search.toLowerCase(); list = list.filter(h => (h['지점명'] || '').toLowerCase().includes(q)); }
    return list;
  }, [houses, gu, search]);

  const getStats = (name: string) => {
    const ht = allTenants.filter(t => t['지점명'] === name);
    const active = ht.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중').length;
    const total = Number(houses.find(h => h['지점명'] === name)?.['총방수']) || ht.length || 1;
    const vacancy = ht.filter(t => t['상태'] === '공실').length;
    const soon = ht.filter(t => t['상태'] === '공실예정').length;
    return { active, total, vacancy, soon };
  };

  const totalActive = filtered.reduce((a, h) => a + getStats(h['지점명']).active, 0);
  const totalRooms = filtered.reduce((a, h) => a + getStats(h['지점명']).total, 0);
  const totalVacancy = filtered.reduce((a, h) => a + getStats(h['지점명']).vacancy, 0);
  const occupancy = totalRooms > 0 ? Math.round(totalActive / totalRooms * 100) : 0;

  const selectHouse = (id: string) => { setActiveId(id); router.push(`/houses/${id}`); };

  // Detail helpers
  const detailActive = detailTenants.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중').length;
  const detailLeaving = detailTenants.filter(t => t['상태'] === '공실예정').length;
  const detailTotalRooms = Number(detail?.['총방수']) || detailTenants.length || 1;
  const detailVacancy = Math.max(0, detailTotalRooms - detailActive - detailLeaving);
  const getDday = (d: string) => { if (!d) return 0; return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); };

  const saveBasic = async () => {
    await fetch('/api/houses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeId, 주소: addr, 현관비번: doorPw, 와이파이SSID: wifiSsid, 와이파이PW: wifiPw, 메모: memo }) });
    setDetail(prev => prev ? { ...prev, 주소: addr, 현관비번: doorPw, 와이파이SSID: wifiSsid, 와이파이PW: wifiPw, 메모: memo } : prev);
    setEditing(false); showToast('저장됐어요!');
  };
  const saveUtil = async () => {
    const jsonStr = JSON.stringify(utilAccounts);
    const baseMemo = (memo || '').replace(/\{"전기.*\}/, '').trim();
    const newMemo = baseMemo ? `${baseMemo}\n${jsonStr}` : jsonStr;
    await fetch('/api/houses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeId, 메모: newMemo }) });
    setMemo(newMemo); setEditUtil(false); showToast('저장됐어요!');
  };

  const InfoRow = ({ label, value, canCopy }: { label: string; value: string; canCopy?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.textMute }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value || '-'}</span>
        {canCopy && value && <button onClick={() => copyText(value)} style={{ background: T.divider, border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCopy /></button>}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 18px' }}><div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div><div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div></div>
        <div style={{ padding: '0 16px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}><IconSearch /><span style={{ fontSize: 12, color: T.textMute }}>검색</span></div></div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {MENU.map(m => (<Link key={m.label} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: m.active ? T.blueLight : 'transparent', color: m.active ? T.blueDark : T.textSub, fontWeight: m.active ? 600 : 400, fontSize: 13, textDecoration: 'none' }}><m.icon />{m.label}</Link>))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>지점 관리</div>
          <div style={{ fontSize: 13, color: T.textMute, marginTop: 2 }}>총 {houses.length}개 지점 · 전체 입주율 {occupancy}%</div>
        </div>

        {/* Body: List + Detail */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: House List */}
          <div style={{ width: 360, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* KPI */}
            <div style={{ display: 'flex', padding: '12px 16px', gap: 8, borderBottom: `1px solid ${T.line}` }}>
              <div style={{ flex: 1, background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: T.textMute }}>입주율</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{occupancy}%</div>
                <div style={{ fontSize: 10, color: T.textMute }}>{totalActive}/{totalRooms}명</div>
              </div>
              <div style={{ flex: 1, background: T.bg, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: T.textMute }}>공실</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: totalVacancy > 0 ? T.red : T.text }}>{totalVacancy}개</div>
                <div style={{ fontSize: 10, color: T.textMute }}>총 {filtered.length}지점</div>
              </div>
            </div>
            {/* Search */}
            <div style={{ padding: '10px 16px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 34, borderRadius: 8, background: T.bg }}>
                <IconSearch />
                <input placeholder="지점명 검색" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: 'transparent', fontSize: 12, color: T.text, border: 'none', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
            {/* Gu chips */}
            <div style={{ display: 'flex', gap: 5, padding: '4px 16px 10px', overflowX: 'auto', flexShrink: 0 }}>
              {['전체', ...guList].map(g => (
                <button key={g} onClick={() => setGu(g)} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: gu === g ? 600 : 400, background: gu === g ? T.text : T.card, color: gu === g ? '#fff' : T.textSub, border: gu === g ? 'none' : `1px solid ${T.line}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{g}</button>
              ))}
            </div>
            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 12 }}>불러오는 중...</div> :
                filtered.map(h => {
                  const stats = getStats(h['지점명']);
                  const isActive = h['지점ID'] === activeId;
                  let statusText = '만실', statusColor = T.green, statusBg = T.greenLight;
                  if (stats.vacancy > 0) { statusText = `공실 ${stats.vacancy}`; statusColor = T.redDark; statusBg = T.redLight; }
                  else if (stats.soon > 0) { statusText = `예정 ${stats.soon}`; statusColor = T.orangeDark; statusBg = T.orangeLight; }
                  return (
                    <div key={h['지점ID']} onClick={() => selectHouse(h['지점ID'])} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: isActive ? T.blueVeryLight : T.card, borderLeft: isActive ? `3px solid ${T.blue}` : '3px solid transparent', borderBottom: `1px solid ${T.divider}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{h['지점명']}</div>
                        <div style={{ fontSize: 11, color: T.textMute }}>{h['구']}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: T.textSub }}>{stats.active}/{stats.total}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: statusBg, color: statusColor }}>{statusText}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right: Detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {detailLoading || !detail ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMute, fontSize: 13 }}>{loading ? '불러오는 중...' : '지점을 선택해주세요'}</div>
            ) : (
              <>
                {/* Detail header */}
                <div style={{ padding: '16px 24px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{detail['지점명']}</div>
                      <div style={{ fontSize: 13, color: T.textMute }}>{detail['구']}</div>
                    </div>
                    {detailTab === 0 && !editing && (
                      <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.line}`, background: T.card, color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><IconEdit /> 수정</button>
                    )}
                  </div>
                  {/* Tab bar */}
                  <div style={{ display: 'flex', marginTop: 12, gap: 4 }}>
                    {TABS.map((label, i) => (
                      <button key={i} onClick={() => { setDetailTab(i); setEditing(false); setEditUtil(false); }} style={{ padding: '8px 14px', border: 'none', borderBottom: detailTab === i ? `2px solid ${T.blue}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: detailTab === i ? 600 : 400, color: detailTab === i ? T.blue : T.textMute, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Detail content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  {/* Tab 0: 기본정보 */}
                  {detailTab === 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.line}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>접근 정보</div>
                        {editing ? (
                          <>
                            {[{ l: '주소', v: addr, s: setAddr }, { l: '현관 비번', v: doorPw, s: setDoorPw }, { l: '와이파이 SSID', v: wifiSsid, s: setWifiSsid }, { l: '와이파이 PW', v: wifiPw, s: setWifiPw }].map(f => (
                              <div key={f.l} style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 11, color: T.textMute, display: 'block', marginBottom: 3 }}>{f.l}</label>
                                <input value={f.v} onChange={e => f.s(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, fontWeight: 600, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                              <button onClick={saveBasic} style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: T.blue, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <InfoRow label="주소" value={addr} canCopy />
                            <InfoRow label="현관 비번" value={doorPw} canCopy />
                            <InfoRow label="와이파이 SSID" value={wifiSsid} canCopy />
                            <InfoRow label="와이파이 PW" value={wifiPw} canCopy />
                          </>
                        )}
                      </div>
                      <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.line}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>임대차 정보</div>
                        <InfoRow label="건물주명" value={detail['건물주명'] || ''} />
                        <InfoRow label="건물주 연락처" value={detail['건물주연락처'] || ''} canCopy />
                        <InfoRow label="집 월세" value={detail['집월세'] ? fmt(Number(detail['집월세'])) : '-'} />
                        <InfoRow label="총 방수" value={detail['총방수'] ? `${detail['총방수']}개` : '-'} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.line}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>메모</div>
                        {editing ? (
                          <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none' }} />
                        ) : (
                          <p style={{ fontSize: 13, color: memo ? T.text : T.textMute, lineHeight: 1.5 }}>{memo?.replace(/\{"전기.*\}/, '').trim() || '메모 없음'}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 1: 방현황 */}
                  {detailTab === 1 && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                        {[{ l: '입주중', v: detailActive, c: T.green }, { l: '공실', v: detailVacancy, c: detailVacancy > 0 ? T.red : T.textMute }, { l: '공실예정', v: detailLeaving, c: detailLeaving > 0 ? T.orange : T.textMute }].map(k => (
                          <div key={k.l} style={{ background: T.card, borderRadius: 10, padding: '14px 12px', textAlign: 'center', border: `1px solid ${T.line}` }}>
                            <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>{k.l}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: k.c }}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 90px', borderBottom: `1px solid ${T.line}` }}>
                          {['방코드', '입주자', '상태', '만료일'].map(h => (
                            <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: T.textMute, background: '#FAFBFC' }}>{h}</div>
                          ))}
                        </div>
                        {detailTenants.length > 0 ? detailTenants.map(t => {
                          const status = t['상태'] || '입주중';
                          const dday = getDday(t['퇴실일']);
                          const sc: Record<string, { bg: string; color: string }> = { '입주중': { bg: T.greenLight, color: T.greenDark }, '계약중': { bg: T.greenLight, color: T.greenDark }, '공실예정': { bg: T.orangeLight, color: T.orangeDark } };
                          const s = sc[status] || sc['입주중'];
                          return (
                            <div key={t['입주자ID']} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 90px', borderBottom: `1px solid ${T.divider}` }}>
                              <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: T.textSub }}>{t['방코드']}</div>
                              <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: T.text }}>{t['이름']}</div>
                              <div style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: s.bg, color: s.color }}>{status}</span></div>
                              <div style={{ padding: '10px 12px', fontSize: 12, color: dday > 0 && dday <= 30 ? T.red : T.textMute }}>{t['퇴실일'] ? (t['퇴실일'] as string).slice(0, 10) : '-'}</div>
                            </div>
                          );
                        }) : <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 13 }}>입주자가 없어요</div>}
                      </div>
                    </>
                  )}

                  {/* Tab 2: 운영정보 */}
                  {detailTab === 2 && (
                    investor ? (
                      <div style={{ background: T.card, borderRadius: 12, padding: 18, border: `1px solid ${T.line}` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>투자자 정보</div>
                        <InfoRow label="투자자명" value={investor.investor?.['투자자명'] || '-'} />
                        <InfoRow label="연락처" value={investor.investor?.['연락처'] || '-'} canCopy />
                        {investor.houses?.map((h: any) => (
                          <div key={h.houseName}>
                            <InfoRow label="배분 비율" value={`투자자 ${Math.round(h.ratio * 100)}% · 운영자 ${Math.round((1 - h.ratio) * 100)}%`} />
                            <InfoRow label="순이익" value={fmt(h.profit)} />
                            <InfoRow label="투자자 배분" value={fmt(h.myShare)} />
                            <InfoRow label="운영자 몫" value={fmt(h.profit - h.myShare)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: T.card, borderRadius: 12, padding: 24, textAlign: 'center', color: T.textMute, border: `1px solid ${T.line}` }}>직영 지점 (투자자 없음)</div>
                    )
                  )}

                  {/* Tab 3: 공과금계정 */}
                  {detailTab === 3 && (
                    <>
                      <div style={{ fontSize: 12, color: T.textMute, marginBottom: 12 }}>고지서 납부 시 필요한 계정 정보</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {['전기', '가스', '수도', '인터넷', '정수기'].map(key => {
                          const IconComp = UTIL_ICONS[key] || IconGlobe;
                          const acc = utilAccounts[key] || { vendor: '', account: '' };
                          return (
                            <div key={key} style={{ background: T.card, borderRadius: 10, padding: 14, border: `1px solid ${T.line}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <IconComp />
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{key}</span>
                              </div>
                              {editUtil ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <input value={acc.vendor} onChange={e => setUtilAccounts(prev => ({ ...prev, [key]: { ...prev[key], vendor: e.target.value } }))} placeholder="업체명" style={{ padding: '6px 8px', border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 11, outline: 'none' }} />
                                  <input value={acc.account} onChange={e => setUtilAccounts(prev => ({ ...prev, [key]: { ...prev[key], account: e.target.value } }))} placeholder="고객번호" style={{ padding: '6px 8px', border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 11, outline: 'none' }} />
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div><div style={{ fontSize: 11, color: T.textMute }}>{acc.vendor || '-'}</div><div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{acc.account || '-'}</div></div>
                                  {acc.account && <button onClick={() => copyText(acc.account)} style={{ background: T.divider, border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCopy /></button>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 16 }}>
                        {editUtil ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setEditUtil(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, fontWeight: 600, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                            <button onClick={saveUtil} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: T.blue, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditUtil(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, fontWeight: 600, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit' }}><IconEdit /> 계정 정보 수정</button>
                        )}
                      </div>
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
