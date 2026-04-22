'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type AppItem = {
  id: string; name: string; phone: string; status: string; createdAt: string;
  _type: string; // injected: tour/cleaning/aircon/checkout/supplies
  [key: string]: string | number | boolean | undefined;
};

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; api: string; link: string }> = {
  tour: { label: '투어', color: '#1B64DA', bg: '#E6F0FE', api: '/api/apply/tour', link: '/apply/tour' },
  cleaning: { label: '방청소', color: '#00785C', bg: '#D1F5EB', api: '/api/apply/cleaning', link: '/apply/cleaning' },
  aircon: { label: '에어컨', color: '#0891B2', bg: '#CFFAFE', api: '/api/apply/aircon', link: '/apply/aircon' },
  checkout: { label: '퇴실', color: '#B42318', bg: '#FFE5E5', api: '/api/apply/checkout', link: '/apply/checkout' },
  supplies: { label: '물품', color: '#B26A00', bg: '#FFF4DC', api: '/api/apply/supplies', link: '' },
};
const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  '신청접수': { color: '#B42318', bg: '#FFE5E5' },
  '처리중': { color: '#B26A00', bg: '#FFF4DC' },
  '완료': { color: '#4E5968', bg: '#F2F4F6' },
  '처리완료': { color: '#4E5968', bg: '#F2F4F6' },
  '입금완료': { color: '#00785C', bg: '#D1F5EB' },
  '투어완료': { color: '#4E5968', bg: '#F2F4F6' },
  '취소': { color: '#B42318', bg: '#FFE5E5' },
};
const TYPES = Object.keys(TYPE_CFG);

/* ─── Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF', text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA', blueVeryLight: '#F0F7FF',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

/* ─── Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconClose = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconCopy = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
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

/* ─── Helpers ─── */
function getFields(item: AppItem): { label: string; value: string }[] {
  const f: { label: string; value: string }[] = [];
  const t = item._type;
  if (t === 'tour') {
    if (item.gender) f.push({ label: '성별', value: String(item.gender) });
    if (item.region) f.push({ label: '희망지역', value: String(item.region) });
    if (item.houseName) f.push({ label: '희망하우스', value: String(item.houseName) });
    if (item.roomType) f.push({ label: '방타입', value: String(item.roomType) });
    if (item.tourDate) f.push({ label: '투어일시', value: `${item.tourDate} ${item.tourTime || ''}` });
    if (item.moveInDate) f.push({ label: '입주일', value: String(item.moveInDate) });
    if (item.contractPeriod) f.push({ label: '계약기간', value: String(item.contractPeriod) });
    if (item.inquiry) f.push({ label: '문의', value: String(item.inquiry) });
  } else if (t === 'cleaning') {
    if (item.houseName) f.push({ label: '지점', value: String(item.houseName) });
    if (item.roomType) f.push({ label: '방타입', value: String(item.roomType) });
    if (item.cleanDate) f.push({ label: '청소날짜', value: String(item.cleanDate) });
    if (item.request) f.push({ label: '요청', value: String(item.request) });
  } else if (t === 'aircon') {
    if (item.houseName) f.push({ label: '지점', value: String(item.houseName) });
    if (item.roomCode) f.push({ label: '방코드', value: String(item.roomCode) });
    if (item.acLocation) f.push({ label: '에어컨위치', value: String(item.acLocation) });
    if (item.request) f.push({ label: '요청', value: String(item.request) });
  } else if (t === 'checkout') {
    if (item.houseName) f.push({ label: '지점', value: String(item.houseName) });
    if (item.roomCode) f.push({ label: '방코드', value: String(item.roomCode) });
    if (item.checkoutDate) f.push({ label: '퇴실일', value: String(item.checkoutDate) });
    if (item.reason) f.push({ label: '사유', value: String(item.reason) });
  } else if (t === 'supplies') {
    if (item.houseName) f.push({ label: '지점', value: String(item.houseName) });
    if (item.roomCode) f.push({ label: '방코드', value: String(item.roomCode) });
    if (item.items) f.push({ label: '요청물품', value: String(item.items) });
    if (item.detail) f.push({ label: '상세', value: String(item.detail) });
  }
  return f;
}

function getSummary(item: AppItem): string {
  const t = item._type;
  if (t === 'tour') return `${item.region || ''} · ${item.tourDate || ''} ${item.tourTime || ''}`.trim();
  if (t === 'cleaning') return `${item.houseName || ''} · ${item.cleanDate || ''}`;
  if (t === 'aircon') return `${item.houseName || ''} · ${item.roomCode || ''}`;
  if (t === 'checkout') return `${item.houseName || ''} · ${item.checkoutDate || ''}`;
  if (t === 'supplies') return `${item.houseName || ''} · ${item.items || ''}`;
  return '';
}

/* ─── Main ─── */
export default function ApplicationsDesktop() {
  const [allItems, setAllItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppItem | null>(null);
  const [statusTab, setStatusTab] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState('');
  const [showLinks, setShowLinks] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1500); };

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all(TYPES.map(t =>
      fetch(TYPE_CFG[t].api).then(r => r.json())
        .then((d: any[]) => (Array.isArray(d) ? d : []).map(item => ({ ...item, _type: t, name: item.name || item.tenantName || '' })))
        .catch(() => [])
    )).then(results => {
      const merged = results.flat().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setAllItems(merged);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Normalized status for filtering
  const normStatus = (s: string) => {
    if (s === '신청접수') return '신규';
    if (s === '처리중') return '처리중';
    if (['완료', '처리완료', '입금완료', '투어완료'].includes(s)) return '완료';
    if (s === '취소') return '완료';
    return '신규';
  };

  const newCount = allItems.filter(i => normStatus(i.status) === '신규').length;
  const progressCount = allItems.filter(i => normStatus(i.status) === '처리중').length;
  const doneCount = allItems.filter(i => normStatus(i.status) === '완료').length;

  const filtered = useMemo(() => {
    let list = allItems;
    if (statusTab !== '전체') list = list.filter(i => normStatus(i.status) === statusTab);
    if (typeFilter !== '전체') list = list.filter(i => i._type === typeFilter);
    return list;
  }, [allItems, statusTab, typeFilter]);

  const updateStatus = async (item: AppItem, newStatus: string) => {
    setSaving(true);
    try {
      await fetch('/api/apply/manage', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item._type, id: item.id, status: newStatus }),
      });
      setAllItems(prev => prev.map(i => i.id === item.id && i._type === item._type ? { ...i, status: newStatus } : i));
      if (selected?.id === item.id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      showToast('상태 변경 완료');
    } catch {} finally { setSaving(false); }
  };

  const deleteItem = async (item: AppItem) => {
    if (!window.confirm('정말 삭제하시겠어요?')) return;
    try {
      await fetch(`/api/apply/manage?type=${item._type}&id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      setAllItems(prev => prev.filter(i => !(i.id === item.id && i._type === item._type)));
      if (selected?.id === item.id) setSelected(null);
      showToast('삭제 완료');
    } catch {}
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
        {/* Header */}
        <div style={{ padding: '18px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>신청서 관리</div>
              <button onClick={fetchAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: T.textMute }}><IconRefresh /></button>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowLinks(p => !p)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>공개 폼 링크</button>
              {showLinks && (
                <div style={{ position: 'absolute', top: 38, right: 0, background: T.card, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12, zIndex: 10, minWidth: 320 }}>
                  {TYPES.filter(t => TYPE_CFG[t].link).map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.divider}` }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: TYPE_CFG[t].bg, color: TYPE_CFG[t].color }}>{TYPE_CFG[t].label}</span>
                        <span style={{ fontSize: 11, color: T.textMute, marginLeft: 6 }}>sharehub-v2.vercel.app{TYPE_CFG[t].link}</span>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(`https://sharehub-v2.vercel.app${TYPE_CFG[t].link}`); setCopied(t); setTimeout(() => setCopied(''), 1500); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: copied === t ? T.green : T.textMute }}>
                        <IconCopy />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
            {[
              { label: '신규', value: newCount, color: T.red, tab: '신규' },
              { label: '처리중', value: progressCount, color: T.orange, tab: '처리중' },
              { label: '완료', value: doneCount, color: T.textMute, tab: '완료' },
              { label: '전체', value: allItems.length, color: T.text, tab: '전체' },
            ].map(k => (
              <div key={k.label} onClick={() => setStatusTab(k.tab)} style={{
                background: T.bg, borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                border: statusTab === k.tab ? `1.5px solid ${T.blue}` : '1.5px solid transparent',
              }}>
                <div style={{ fontSize: 10, color: T.textMute }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['전체', '신규', '처리중', '완료'].map(s => (
              <button key={s} onClick={() => setStatusTab(s)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                background: statusTab === s ? T.text : T.card, color: statusTab === s ? '#fff' : T.textSub,
                border: statusTab === s ? 'none' : `1px solid ${T.line}`,
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['전체', ...TYPES].map(t => {
              const cfg = t === '전체' ? null : TYPE_CFG[t];
              return (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  background: typeFilter === t ? (cfg?.bg || T.text) : T.card,
                  color: typeFilter === t ? (cfg?.color || '#fff') : T.textMute,
                  border: typeFilter === t ? 'none' : `1px solid ${T.line}`,
                }}>{cfg?.label || '전체'}</button>
              );
            })}
          </div>
        </div>

        {/* List + Detail */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMute, fontSize: 13 }}>신청 내역이 없어요</div>
            ) : (
              <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '90px 70px 80px 100px 1fr 70px', borderBottom: `1px solid ${T.line}`, background: '#FAFBFC' }}>
                  {['신청일', '종류', '신청자', '연락처', '내용', '상태'].map(h => (
                    <div key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textMute }}>{h}</div>
                  ))}
                </div>
                {filtered.map(item => {
                  const tcfg = TYPE_CFG[item._type];
                  const scfg = STATUS_CFG[item.status] || { color: T.textMute, bg: T.divider };
                  const isSel = selected?.id === item.id && selected?._type === item._type;
                  return (
                    <div key={`${item._type}-${item.id}`} onClick={() => setSelected(item)} style={{
                      display: 'grid', gridTemplateColumns: '90px 70px 80px 100px 1fr 70px',
                      borderBottom: `1px solid ${T.divider}`, cursor: 'pointer',
                      background: isSel ? T.blueVeryLight : T.card,
                      borderLeft: isSel ? `3px solid ${T.blue}` : '3px solid transparent',
                    }}>
                      <div style={{ padding: '10px 10px', fontSize: 12, color: T.textMute }}>{(item.createdAt || '').slice(0, 10)}</div>
                      <div style={{ padding: '10px 6px' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: tcfg?.bg, color: tcfg?.color }}>{tcfg?.label}</span></div>
                      <div style={{ padding: '10px 10px', fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</div>
                      <div style={{ padding: '10px 10px', fontSize: 12, color: T.textSub }}>{item.phone}</div>
                      <div style={{ padding: '10px 10px', fontSize: 12, color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSummary(item)}</div>
                      <div style={{ padding: '10px 6px' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: scfg.bg, color: scfg.color }}>{item.status}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: 340, background: T.card, borderLeft: `1px solid ${T.line}`, overflowY: 'auto', flexShrink: 0, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: TYPE_CFG[selected._type]?.bg, color: TYPE_CFG[selected._type]?.color }}>{TYPE_CFG[selected._type]?.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>신청 상세</span>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconClose /></button>
              </div>

              {/* Applicant info */}
              <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: T.blue, flexShrink: 0 }}>{selected.name?.[0] || '?'}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: T.textMute }}>{selected.phone}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textMute }}>신청일: {selected.createdAt}</div>
              </div>

              {/* Detail fields */}
              <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                {getFields(selected).map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.card}`, fontSize: 12 }}>
                    <span style={{ color: T.textMute }}>{f.label}</span>
                    <span style={{ fontWeight: 600, color: T.text, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Status change */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, marginBottom: 8 }}>상태 변경</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['신청접수', '처리중', '완료'].map(s => (
                    <button key={s} onClick={() => updateStatus(selected, s)} disabled={saving || selected.status === s}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                        cursor: saving || selected.status === s ? 'default' : 'pointer', fontFamily: 'inherit',
                        background: selected.status === s ? T.text : T.bg,
                        color: selected.status === s ? '#fff' : T.textSub,
                        opacity: saving ? 0.5 : 1,
                      }}>{s === '신청접수' ? '신규' : s}</button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button onClick={() => deleteItem(selected)} style={{
                width: '100%', padding: '10px 0', borderRadius: 8, border: `1px solid ${T.red}`,
                background: T.card, color: T.red, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>삭제</button>
            </div>
          )}
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
