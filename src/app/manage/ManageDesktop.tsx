'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  purple: '#8B5CF6', purpleLight: '#EDE4FF',
  line: '#EAEDF0', divider: '#F2F4F6',
};

function kstYM() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const [y, m] = s.replace(/\./g, '').trim().split(/\s+/).map(Number);
  return { y, m };
}

/* ─── SVG Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
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
export default function ManageDesktop() {
  const router = useRouter();
  const { y, m } = kstYM();

  // Data
  const [paySummary, setPaySummary] = useState<{ paid: number; unpaid: number; partial: number; paidAmount: number; unpaidAmount: number } | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/payments?year=${y}&month=${String(m).padStart(2, '0')}`)
      .then(r => r.json()).then(d => setPaySummary(d.summary || null)).catch(() => {});
    fetch('/api/tenants').then(r => r.json()).then(d => setTenants(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/houses').then(r => r.json()).then(d => setHouses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/issues').then(r => r.json()).then(d => setIssues(d.issues || [])).catch(() => {});
    fetch('/api/workers').then(r => r.json()).then(d => setWorkers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/investors').then(r => r.json()).then(d => setInvestors(Array.isArray(d) ? d : [])).catch(() => {});
  }, [y, m]);

  // Computed KPIs
  const vacantCount = useMemo(() => tenants.filter(t => t['상태'] === '공실').length, [tenants]);
  const unpaidCount = paySummary ? (paySummary.unpaid + paySummary.partial) : null;
  const paidAmount = paySummary?.paidAmount ?? null;
  const repairCount = useMemo(() => issues.filter(i => i.status === '접수' || i.status === '처리중').length, [issues]);
  const workerCount = useMemo(() => {
    const names = new Set(workers.map(w => (w.담당자명 || '').trim()).filter(Boolean));
    return names.size;
  }, [workers]);
  const investorCount = useMemo(() => investors.length, [investors]);
  const investorHouses = useMemo(() => {
    const set = new Set<string>();
    investors.forEach((inv: any) => { if (inv.houses) inv.houses.forEach((h: any) => set.add(h.houseName || h['지점명'] || '')); });
    return set.size;
  }, [investors]);

  const fmt = (n: number) => n.toLocaleString();

  type SubMenu = { label: string; href: string; badge?: number | null };

  const boxes: { title: string; tag: string; tagBg: string; tagColor: string; kpis: { label: string; value: string | null; color: string }[]; todo?: string; menus: SubMenu[] }[] = [
    {
      title: '재무', tag: 'FINANCE', tagBg: T.blueLight, tagColor: T.blueDark,
      kpis: [
        { label: '이번 달 수납', value: paidAmount !== null ? `${fmt(paidAmount)}원` : null, color: T.blue },
        { label: '미납 건수', value: unpaidCount !== null ? `${unpaidCount}건` : null, color: T.red },
      ],
      todo: unpaidCount && unpaidCount > 0 ? `미납 독촉 ${unpaidCount}건 대기` : undefined,
      menus: [
        { label: '수납 관리', href: '/payments', badge: unpaidCount && unpaidCount > 0 ? unpaidCount : null },
        { label: '공과금 관리', href: '/utilities' },
        { label: '지출 관리', href: '/expenses' },
        { label: '수익 현황', href: '/revenue' },
        { label: '플랫폼 이체', href: '/payments/platform' },
      ],
    },
    {
      title: '공간', tag: 'SPACE', tagBg: T.greenLight, tagColor: T.greenDark,
      kpis: [
        { label: '지점 수', value: houses.length > 0 ? `${houses.length}개` : null, color: T.text },
        { label: '공실 수', value: `${vacantCount}실`, color: vacantCount > 0 ? T.red : T.text },
      ],
      todo: undefined,
      menus: [
        { label: '지점 관리', href: '/houses' },
        { label: '공실 관리', href: '/vacancy', badge: vacantCount > 0 ? vacantCount : null },
        { label: '퇴실자 관리', href: '/checkout' },
      ],
    },
    {
      title: '운영', tag: 'OPERATIONS', tagBg: T.orangeLight, tagColor: T.orangeDark,
      kpis: [
        { label: '수리 대기', value: repairCount > 0 ? `${repairCount}건` : '0건', color: repairCount > 0 ? T.orange : T.text },
        { label: '담당자 수', value: workerCount > 0 ? `${workerCount}명` : null, color: T.text },
      ],
      todo: repairCount > 0 ? `수리 배정 ${repairCount}건 대기` : undefined,
      menus: [
        { label: '청소/수리', href: '/issues', badge: repairCount > 0 ? repairCount : null },
        { label: '담당자 관리', href: '/management/workers' },
        { label: '당번 관리', href: '/duty' },
      ],
    },
    {
      title: '투자자', tag: 'INVESTOR', tagBg: T.blueLight, tagColor: T.blueDark,
      kpis: [
        { label: '활성 투자자', value: investorCount > 0 ? `${investorCount}명` : '0명', color: T.text },
        { label: '보유 지점', value: investorHouses > 0 ? `${investorHouses}개` : '0개', color: T.text },
      ],
      menus: [
        { label: '투자자 관리', href: '/investors' },
      ],
    },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 18px' }}><div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div><div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div></div>
        <div style={{ padding: '0 16px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}><IconSearch /><span style={{ fontSize: 12, color: T.textMute }}>검색</span></div></div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {MENU.map(mi => (
            <Link key={mi.label} href={mi.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: mi.active ? T.blueLight : 'transparent', color: mi.active ? T.blueDark : T.textSub, fontWeight: mi.active ? 600 : 400, fontSize: 13, textDecoration: 'none' }}>
              <mi.icon />{mi.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 20px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>관리</div>
          <div style={{ fontSize: 14, color: T.textMute, marginTop: 4 }}>운영 영역별 현황을 확인하고 세부 메뉴로 이동하세요</div>
        </div>

        {/* Bento Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {boxes.map(box => (
              <div key={box.title} style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.divider}`, padding: 22 }}>
                {/* Box header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{box.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: box.tagBg, color: box.tagColor }}>{box.tag}</span>
                </div>

                {/* KPIs */}
                <div style={{ display: 'flex', gap: 20, paddingBottom: 14, borderBottom: `1px solid ${T.divider}`, marginBottom: 12 }}>
                  {box.kpis.filter(k => k.value !== null).map(kpi => (
                    <div key={kpi.label}>
                      <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>{kpi.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Todo line */}
                {box.todo && (
                  <div style={{ background: '#FEF4E6', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, fontWeight: 600, color: T.orangeDark, cursor: 'pointer' }}>
                    {box.todo}
                  </div>
                )}

                {/* Sub menus */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {box.menus.map(menu => (
                    <button key={menu.label} onClick={() => router.push(menu.href)} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: '#F9FAFB', color: T.textSub,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {menu.label}
                      {menu.badge && menu.badge > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, background: T.redLight, color: T.red, minWidth: 16, textAlign: 'center' }}>{menu.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
