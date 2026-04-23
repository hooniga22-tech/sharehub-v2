'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'
import { RevenueGenCard } from '@/components/PaymentGenerationCard'

/* ─── Types ─── */
type HouseData = {
  id: number; house: string; gu: string; tenantCount: number;
  revenue: number; rentTotal: number; mgmtTotal: number;
  expense: number; utilTotal: number; workerTotal: number; opexTotal: number;
  profit: number; ownShare: number;
  investor: { name: string; ratio: number; share: number; token?: string } | null;
  tenants: { 방코드: string; 이름: string; 월세: string; 관리비: string }[];
};

/* ─── Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF', text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA', blueVeryLight: '#F0F7FF',
  blueGrad: 'linear-gradient(135deg, #3182F6 0%, #2772E3 100%)',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};
const fmt = (n: number) => n.toLocaleString() + '원';
const fmtShort = (n: number) => { if (Math.abs(n) >= 10000) return `${Math.round(n / 10000)}만`; return n.toLocaleString(); };

/* ─── Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconChevronLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>;
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
export default function RevenueDesktop() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<HouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null); // null = "전체"
  const [gu, setGu] = useState('전체');
  const [search, setSearch] = useState('');

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/revenue?year=${year}&month=${month}`).then(r => r.json())
      .then(res => { setData((res.houses || []).sort((a: HouseData, b: HouseData) => b.profit - a.profit)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const guList = useMemo(() => [...new Set(data.map(h => h.gu).filter(Boolean))].sort(), [data]);
  const filtered = useMemo(() => {
    let list = gu === '전체' ? data : data.filter(h => h.gu === gu);
    if (search) { const q = search.toLowerCase(); list = list.filter(h => h.house.toLowerCase().includes(q)); }
    return list;
  }, [data, gu, search]);

  // Summary
  const totals = useMemo(() => {
    const src = selected ? data.filter(h => h.house === selected) : data;
    const revenue = src.reduce((s, h) => s + h.revenue, 0);
    const expense = src.reduce((s, h) => s + h.expense, 0);
    const profit = src.reduce((s, h) => s + h.profit, 0);
    const investorShare = src.reduce((s, h) => s + (h.investor?.share || 0), 0);
    const myProfit = src.reduce((s, h) => s + h.ownShare, 0);
    const rentTotal = src.reduce((s, h) => s + h.rentTotal, 0);
    const mgmtTotal = src.reduce((s, h) => s + h.mgmtTotal, 0);
    const utilTotal = src.reduce((s, h) => s + h.utilTotal, 0);
    const workerTotal = src.reduce((s, h) => s + h.workerTotal, 0);
    const opexTotal = src.reduce((s, h) => s + h.opexTotal, 0);
    return { revenue, expense, profit, investorShare, myProfit, rentTotal, mgmtTotal, utilTotal, workerTotal, opexTotal };
  }, [data, selected]);

  const selectedHouse = selected ? data.find(h => h.house === selected) : null;

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
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>수익 현황</div>
        </div>

        <div style={{ padding: '12px 28px 0', flexShrink: 0 }}>
          <RevenueGenCard />
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: House list */}
          <div style={{ width: 280, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${T.divider}` }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronLeft /></button>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text, minWidth: 100, textAlign: 'center' }}>{year}년 {month}월</span>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronRight /></button>
            </div>
            {/* Search + gu */}
            <div style={{ padding: '10px 16px 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg, borderRadius: 8, padding: '7px 10px' }}>
                <IconSearch />
                <input placeholder="지점 검색" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: T.text, fontFamily: 'inherit' }} />
              </div>
            </div>
            {guList.length > 0 && (
              <div style={{ display: 'flex', gap: 5, padding: '4px 16px 10px', overflowX: 'auto', flexShrink: 0 }}>
                {['전체', ...guList].map(g => (
                  <button key={g} onClick={() => setGu(g)} style={{ padding: '3px 8px', borderRadius: 100, fontSize: 10, fontWeight: gu === g ? 600 : 400, background: gu === g ? T.text : T.card, color: gu === g ? '#fff' : T.textSub, border: gu === g ? 'none' : `1px solid ${T.line}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{g}</button>
                ))}
              </div>
            )}
            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* "전체" row */}
              <div onClick={() => setSelected(null)} style={{
                padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.divider}`,
                background: selected === null ? T.blueVeryLight : '#FAFBFC',
                borderLeft: selected === null ? `3px solid ${T.blue}` : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>전체</div>
                    <div style={{ fontSize: 11, color: T.textMute }}>{data.length}개 지점 합계</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: totals.myProfit >= 0 ? T.blue : T.red }}>{fmtShort(totals.myProfit)}원</div>
                    <div style={{ fontSize: 10, color: T.textMute }}>내 몫</div>
                  </div>
                </div>
              </div>
              {/* Houses */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 12 }}>불러오는 중...</div>
              ) : filtered.map((h, i) => (
                <div key={h.house} onClick={() => setSelected(h.house)} style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.divider}`,
                  background: selected === h.house ? T.blueVeryLight : T.card,
                  borderLeft: selected === h.house ? `3px solid ${T.blue}` : '3px solid transparent',
                  minHeight: 48,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.house}</div>
                      <div style={{ fontSize: 11, color: T.textMute }}>{h.gu}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: h.profit >= 0 ? T.blue : T.red }}>{fmtShort(h.profit)}원</div>
                      <div style={{ fontSize: 10, color: T.textMute }}>{i + 1}위</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Detail */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{selected || '전체 수익 현황'}</div>
                    <div style={{ fontSize: 13, color: T.textMute }}>
                      {selected ? `${selectedHouse?.gu || ''} · ${year}년 ${month}월 · ${selectedHouse?.tenantCount || 0}실` : `${data.length}개 지점 합계 · ${year}년 ${month}월`}
                    </div>
                  </div>
                  <button onClick={() => router.push('/investors')} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, color: T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>투자자 정산</button>
                </div>

                {/* Hero card */}
                <div style={{ background: T.blueGrad, borderRadius: 14, padding: '22px 24px', marginBottom: 16, color: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>내 몫 순이익</div>
                    <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{fmt(totals.myProfit)}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>투자자 배분 후</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ opacity: 0.8 }}>총 순이익</span>
                      <span style={{ fontWeight: 700 }}>{fmt(totals.profit)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ opacity: 0.8 }}>투자자 정산</span>
                      <span style={{ fontWeight: 700 }}>-{fmt(totals.investorShare)}</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>수익 분해</div>
                  {[
                    { label: '수입 (월세+관리비)', value: totals.revenue, sign: '+', color: T.text },
                    { label: '공과금', value: totals.utilTotal, sign: '-', color: T.textSub },
                    { label: '운영지출', value: totals.opexTotal, sign: '-', color: T.textSub },
                    { label: '용역비', value: totals.workerTotal, sign: '-', color: T.textSub },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <span style={{ color: T.textMute }}>{r.sign} {r.label}</span>
                      <span style={{ fontWeight: 600, color: r.color }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: T.text }}>총 순이익</span>
                    <span style={{ fontWeight: 800, color: totals.profit >= 0 ? T.green : T.red }}>{fmt(totals.profit)}</span>
                  </div>
                </div>

                {/* Branch ranking (when "전체") or Room detail (when house selected) */}
                {!selected ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>지점별 순이익 랭킹</div>
                    </div>
                    <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px 110px', borderBottom: `1px solid ${T.line}`, background: '#FAFBFC' }}>
                        {['순위', '지점', '수입', '지출', '순이익'].map(h => (
                          <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: T.textMute, textAlign: h === '지점' ? 'left' : 'right' }}>{h}</div>
                        ))}
                      </div>
                      {data.map((h, i) => (
                        <div key={h.house} onClick={() => setSelected(h.house)} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px 110px', borderBottom: `1px solid ${T.divider}`, cursor: 'pointer' }}>
                          <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: i < 3 ? 700 : 400, color: i < 3 ? T.orange : T.textMute, textAlign: 'right' }}>{i + 1}</div>
                          <div style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{h.house}</div>
                            <div style={{ fontSize: 10, color: T.textMute }}>{h.gu}</div>
                          </div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, textAlign: 'right' }}>{fmtShort(h.revenue)}</div>
                          <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, textAlign: 'right' }}>{fmtShort(h.expense)}</div>
                          <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: h.profit >= 0 ? T.blue : T.red, textAlign: 'right' }}>{fmt(h.profit)}</div>
                        </div>
                      ))}
                      {/* Total row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px 110px', background: '#FAFBFC', borderTop: `1px solid ${T.line}` }}>
                        <div style={{ padding: '10px 12px' }} />
                        <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: T.text }}>합계</div>
                        <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'right' }}>{fmtShort(totals.revenue)}</div>
                        <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'right' }}>{fmtShort(totals.expense)}</div>
                        <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 800, color: totals.profit >= 0 ? T.blue : T.red, textAlign: 'right' }}>{fmt(totals.profit)}</div>
                      </div>
                    </div>
                  </>
                ) : selectedHouse && (
                  <>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: '총 방', value: `${selectedHouse.tenantCount}실`, color: T.text },
                        { label: '입주중', value: `${selectedHouse.tenants.length}실`, color: T.green },
                        { label: '입주율', value: selectedHouse.tenantCount > 0 ? `${Math.round(selectedHouse.tenants.length / selectedHouse.tenantCount * 100)}%` : '-', color: T.blue },
                      ].map(k => (
                        <div key={k.label} style={{ background: T.card, borderRadius: 10, padding: '12px 14px', border: `1px solid ${T.line}`, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.textMute }}>{k.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Investor info */}
                    {selectedHouse.investor && (
                      <div style={{ background: T.blueLight, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: T.blueDark, fontWeight: 600 }}>투자자: {selectedHouse.investor.name}</div>
                          <div style={{ fontSize: 11, color: T.textMute }}>배분 {Math.round(selectedHouse.investor.ratio * 100)}% · 정산 {fmt(selectedHouse.investor.share)}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.blueDark }}>내 몫 {fmt(selectedHouse.ownShare)}</div>
                      </div>
                    )}

                    {/* Room list */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>방별 수입 현황</div>
                    <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 100px 100px', borderBottom: `1px solid ${T.line}`, background: '#FAFBFC' }}>
                        {['방', '입주자', '월세', '관리비', '합계'].map(h => (
                          <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: T.textMute, textAlign: h === '방' || h === '입주자' ? 'left' : 'right' }}>{h}</div>
                        ))}
                      </div>
                      {selectedHouse.tenants.map(t => {
                        const rent = Number(t.월세) || 0;
                        const mgmt = Number(t.관리비) || 0;
                        return (
                          <div key={t.방코드} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 100px 100px', borderBottom: `1px solid ${T.divider}` }}>
                            <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: T.textSub }}>{t.방코드}</div>
                            <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: T.text }}>{t.이름}</div>
                            <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, textAlign: 'right' }}>{rent > 0 ? fmtShort(rent) : '-'}</div>
                            <div style={{ padding: '10px 12px', fontSize: 12, color: T.textSub, textAlign: 'right' }}>{mgmt > 0 ? fmtShort(mgmt) : '-'}</div>
                            <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'right' }}>{(rent + mgmt) > 0 ? fmtShort(rent + mgmt) : '-'}</div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 100px 100px', background: '#FAFBFC', borderTop: `1px solid ${T.line}` }}>
                        <div style={{ padding: '10px 12px' }} />
                        <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text }}>합계</div>
                        <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'right' }}>{fmtShort(selectedHouse.rentTotal)}</div>
                        <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'right' }}>{fmtShort(selectedHouse.mgmtTotal)}</div>
                        <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 800, color: T.blue, textAlign: 'right' }}>{fmtShort(selectedHouse.revenue)}</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
