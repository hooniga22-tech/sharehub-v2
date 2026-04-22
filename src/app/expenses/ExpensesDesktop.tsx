'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type Item = { id: string; date: string; type: string; houseName: string; category: string; amount: number; memo: string };
type Summary = { houseTotal: number; opsTotal: number; total: number; count: number };

const HOUSE_CATS = ['수리', '소모품', '청소', '기타'];
const OPS_CATS = ['인건비', '교통비', '통신비', '기타'];
const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  '지점별': { bg: '#E6F0FE', color: '#1B64DA' },
  '전체운영': { bg: '#FFF4DC', color: '#B26A00' },
};
const CAT_BADGE: Record<string, { bg: string; color: string }> = {
  수리: { bg: '#FEF3C7', color: '#92400E' }, 소모품: { bg: '#EFF6FF', color: '#1E40AF' },
  청소: { bg: '#D1FAE5', color: '#065F46' }, 인건비: { bg: '#F2F4F6', color: '#555' },
  교통비: { bg: '#F2F4F6', color: '#555' }, 통신비: { bg: '#F2F4F6', color: '#555' },
  기타: { bg: '#F2F4F6', color: '#555' },
};

/* ─── Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF', text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};
const fmt = (n: number) => n.toLocaleString() + '원';
const INPUT: React.CSSProperties = { background: '#F9FAFB', border: '1px solid #E5E8EB', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' };

/* ─── Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconChevronLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
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
export default function ExpensesDesktop() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<Summary>({ houseTotal: 0, opsTotal: 0, total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState<string[]>([]);
  const [filter, setFilter] = useState('전체');
  const [sort, setSort] = useState<'date' | 'amount'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Form
  const [editId, setEditId] = useState<string | null>(null); // null = new, string = editing
  const [fType, setFType] = useState('지점별');
  const [fHouse, setFHouse] = useState('');
  const [fCat, setFCat] = useState('');
  const [fDate, setFDate] = useState(todayStr);
  const [fAmountRaw, setFAmountRaw] = useState('');
  const [fMemo, setFMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (isFuture) return; if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/expenses?year=${year}&month=${month}`).then(r => r.json()).then(d => {
      setItems(d.items || []); setSummary(d.summary || { houseTotal: 0, opsTotal: 0, total: 0, count: 0 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(d => {
      const list = (Array.isArray(d) ? d : []).map((h: any) => h['지점명'] || '').filter(Boolean).sort();
      setHouses(list); if (list.length > 0 && !fHouse) setFHouse(list[0]);
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1500); };

  const resetForm = () => {
    setEditId(null); setFType('지점별'); setFCat(''); setFDate(todayStr); setFAmountRaw(''); setFMemo('');
    if (houses.length > 0) setFHouse(houses[0]);
  };

  const save = async () => {
    if (!fAmountRaw || saving) return;
    if (!fCat) { showToast('카테고리를 선택하세요'); return; }
    setSaving(true);
    try {
      // If editing, delete old then create new
      if (editId) await fetch(`/api/expenses?id=${encodeURIComponent(editId)}`, { method: 'DELETE' });
      await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: fDate, type: fType, houseName: fType === '지점별' ? fHouse : '', category: fCat, amount: Number(fAmountRaw), memo: fMemo }),
      });
      resetForm();
      fetchData();
      showToast(editId ? '수정 완료' : '등록 완료');
    } catch {} finally { setSaving(false); }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠어요?')) return;
    await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    fetchData();
    showToast('삭제 완료');
  };

  const startEdit = (item: Item) => {
    setEditId(item.id); setFType(item.type); setFHouse(item.houseName || (houses[0] || ''));
    setFCat(item.category); setFDate(item.date); setFAmountRaw(String(item.amount)); setFMemo(item.memo);
  };

  const filtered = items
    .filter(i => filter === '전체' || i.type === filter)
    .sort((a, b) => sort === 'date' ? b.date.localeCompare(a.date) : b.amount - a.amount);

  const cats = fType === '지점별' ? HOUSE_CATS : OPS_CATS;
  const amountDisplay = amountFocused ? fAmountRaw : (fAmountRaw ? Number(fAmountRaw).toLocaleString('ko-KR') : '');

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
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>지출 관리</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, maxWidth: 1400 }}>
            {/* ═══ Left: Form ═══ */}
            <div style={{ background: T.card, borderRadius: 14, padding: 24, border: `1px solid ${T.divider}`, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{editId ? '지출 수정' : '지출 등록'}</div>
                {editId && <button onClick={resetForm} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>}
              </div>

              {/* Type */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.textMute, marginBottom: 6, fontWeight: 600 }}>유형</div>
                <div style={{ display: 'flex', background: T.bg, borderRadius: 8, padding: 3 }}>
                  {['지점별', '전체운영'].map(t => (
                    <button key={t} onClick={() => { setFType(t); setFCat(''); }} style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
                      background: fType === t ? T.card : 'transparent', color: fType === t ? T.text : T.textMute,
                      fontWeight: fType === t ? 600 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: fType === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* House */}
              {fType === '지점별' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: T.textMute, marginBottom: 6, fontWeight: 600 }}>지점</div>
                  <select value={fHouse} onChange={e => setFHouse(e.target.value)} style={INPUT}>
                    <option value="">지점 선택</option>
                    {houses.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              )}

              {/* Category */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.textMute, marginBottom: 6, fontWeight: 600 }}>카테고리</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cats.map(c => (
                    <button key={c} onClick={() => setFCat(c)} style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      border: fCat === c ? `1.5px solid ${T.blue}` : `1px solid ${T.line}`,
                      background: fCat === c ? T.blueLight : T.card, color: fCat === c ? T.blue : T.textSub,
                    }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.textMute, marginBottom: 6, fontWeight: 600 }}>날짜</div>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={INPUT} />
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.textMute, marginBottom: 6, fontWeight: 600 }}>금액</div>
                <input type="text" inputMode="numeric" value={amountDisplay} placeholder=""
                  onChange={e => setFAmountRaw(e.target.value.replace(/[^0-9]/g, ''))}
                  onFocus={() => setAmountFocused(true)} onBlur={() => setAmountFocused(false)}
                  style={{ ...INPUT, textAlign: 'right' }} />
              </div>

              {/* Memo */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: T.textMute, marginBottom: 6, fontWeight: 600 }}>메모</div>
                <textarea value={fMemo} onChange={e => setFMemo(e.target.value)} placeholder="메모 입력 (선택)" rows={2}
                  style={{ ...INPUT, resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              <button onClick={save} disabled={saving || !fAmountRaw} style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: T.blue, color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: (saving || !fAmountRaw) ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: (saving || !fAmountRaw) ? 0.5 : 1,
              }}>{saving ? '저장 중...' : editId ? '수정' : '저장'}</button>
            </div>

            {/* ═══ Right: List ═══ */}
            <div>
              {/* Header + month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>지출 내역</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronLeft /></button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text, minWidth: 90, textAlign: 'center' }}>{year}년 {month}월</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: isFuture ? 'default' : 'pointer', padding: 4, display: 'flex', opacity: isFuture ? 0.3 : 1 }}><IconChevronRight /></button>
                  <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 4 }}>이번달</button>
                </div>
              </div>

              {/* KPI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                {[
                  { label: '지점별 지출', value: fmt(summary.houseTotal), color: T.red },
                  { label: '전체운영', value: fmt(summary.opsTotal), color: T.red },
                  { label: '이달 합계', value: fmt(summary.total), color: T.blue, sub: `${summary.count}건` },
                ].map(k => (
                  <div key={k.label} style={{ background: T.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${T.divider}` }}>
                    <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
                    {k.sub && <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{k.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Filter + sort */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['전체', '지점별', '전체운영'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      background: filter === f ? T.text : T.card, color: filter === f ? '#fff' : T.textSub,
                      border: filter === f ? 'none' : `1px solid ${T.line}`,
                    }}>{f}</button>
                  ))}
                </div>
                <select value={sort} onChange={e => setSort(e.target.value as 'date' | 'amount')} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.line}`, fontSize: 11, color: T.textSub, background: T.card, fontFamily: 'inherit', outline: 'none' }}>
                  <option value="date">날짜순</option>
                  <option value="amount">금액순</option>
                </select>
              </div>

              {/* List */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
              ) : (
                <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.divider}`, overflow: 'hidden' }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: T.textMute, fontSize: 13 }}>이번 달 등록된 지출이 없어요</div>
                  ) : filtered.map((item, i) => {
                    const tb = TYPE_BADGE[item.type] || TYPE_BADGE['지점별'];
                    const cb = CAT_BADGE[item.category] || CAT_BADGE['기타'];
                    const isOpen = expandedId === item.id;
                    return (
                      <div key={item.id}>
                        <div onClick={() => setExpandedId(isOpen ? null : item.id)} style={{
                          display: 'grid', gridTemplateColumns: '80px 70px 1fr 80px 100px 60px',
                          alignItems: 'center', padding: '12px 14px', cursor: 'pointer',
                          borderTop: i > 0 ? `1px solid ${T.divider}` : 'none',
                        }}>
                          <span style={{ fontSize: 12, color: T.textMute }}>{item.date.slice(5).replace('-', '/')}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: tb.bg, color: tb.color, textAlign: 'center' }}>{item.type === '지점별' ? '지점' : '운영'}</span>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{item.type === '지점별' ? item.houseName : '\u2014'}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: cb.bg, color: cb.color, marginLeft: 6 }}>{item.category}</span>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text }}>{item.amount.toLocaleString()}</div>
                          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text }}>원</div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <button onClick={e => { e.stopPropagation(); startEdit(item); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconEdit /></button>
                            <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconTrash /></button>
                          </div>
                        </div>
                        {isOpen && item.memo && (
                          <div style={{ padding: '0 14px 12px 14px' }}>
                            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{item.memo}</div>
                          </div>
                        )}
                        {isOpen && !item.memo && (
                          <div style={{ padding: '0 14px 12px', fontSize: 12, color: T.textMute, fontStyle: 'italic' }}>메모 없음</div>
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

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
