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
const fmt = (n: number) => n.toLocaleString();

/* ─── SVG Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>;

/* Small icons for bottom grid */
const IconTrend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IconSend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IconWrench = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconUserCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>;
const IconBriefcase = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
const IconLogOut = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

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

  const [paySummary, setPaySummary] = useState<{ paid: number; unpaid: number; partial: number; paidAmount: number; unpaidAmount: number } | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/payments?year=${y}&month=${String(m).padStart(2, '0')}`).then(r => r.json()).then(d => setPaySummary(d.summary || null)).catch(() => {});
    fetch('/api/tenants').then(r => r.json()).then(d => setTenants(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/houses').then(r => r.json()).then(d => setHouses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/issues').then(r => r.json()).then(d => setIssues(d.issues || [])).catch(() => {});
    fetch('/api/workers').then(r => r.json()).then(d => setWorkers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/investors').then(r => r.json()).then(d => setInvestors(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/expenses?year=${y}&month=${m}`).then(r => r.json()).then(d => setExpenses(Array.isArray(d) ? d : [])).catch(() => {});
  }, [y, m]);

  const vacantCount = useMemo(() => tenants.filter(t => t['상태'] === '공실').length, [tenants]);
  const unpaidCount = paySummary ? (paySummary.unpaid + paySummary.partial) : 0;
  const paidAmount = paySummary?.paidAmount ?? 0;
  const unpaidAmount = paySummary?.unpaidAmount ?? 0;
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const repairCount = useMemo(() => issues.filter(i => i.status === '접수' || i.status === '처리중').length, [issues]);
  const workerCount = useMemo(() => new Set(workers.map(w => (w.담당자명 || '').trim()).filter(Boolean)).size, [workers]);
  const investorCount = investors.length;
  const investorHouseCount = useMemo(() => {
    const set = new Set<string>();
    investors.forEach((inv: any) => { if (inv.houses) inv.houses.forEach((h: any) => set.add(h.houseName || '')); });
    return set.size;
  }, [investors]);
  const leavingCount = useMemo(() => tenants.filter(t => t['상태'] === '퇴실예정' || t['상태'] === '퇴실확정').length, [tenants]);

  /* ─── Todo items (0건이면 렌더링 안 함) ─── */
  const todos = useMemo(() => {
    const items: { label: string; count: number; color: string; href: string }[] = [];
    if (unpaidCount > 0) items.push({ label: '미납 독촉 발송', count: unpaidCount, color: T.red, href: '/payments' });
    if (repairCount > 0) items.push({ label: '수리 배정 대기', count: repairCount, color: T.orange, href: '/issues' });
    if (vacantCount > 0) items.push({ label: '공실 모집 관리', count: vacantCount, color: T.blue, href: '/vacancy' });
    return items;
  }, [unpaidCount, repairCount, vacantCount]);

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
        <div style={{ padding: '28px 32px 20px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>관리</div>
          <div style={{ fontSize: 14, color: T.textMute, marginTop: 4 }}>운영 현황 확인과 세부 메뉴 이동</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Section 1: KPI 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: '미납', value: `${unpaidCount}건`, sub: unpaidAmount > 0 ? `${fmt(unpaidAmount)}원` : '', color: unpaidCount > 0 ? T.red : T.text, href: '/payments' },
              { label: '이번 달 수납', value: `${fmt(paidAmount)}원`, sub: '', color: T.text, href: '/payments' },
              { label: '이번 달 지출', value: `${fmt(totalExpense)}원`, sub: '', color: T.text, href: '/expenses' },
              { label: '공실', value: `${vacantCount}실`, sub: `총 ${houses.length}개 지점`, color: vacantCount > 0 ? T.green : T.text, href: '/vacancy' },
            ].map(kpi => (
              <div key={kpi.label} onClick={() => router.push(kpi.href)} style={{ background: T.card, borderRadius: 14, padding: '20px 22px', border: `1px solid ${T.divider}`, cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMute, marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{kpi.sub}</div>}
              </div>
            ))}
          </div>

          {/* Section 2: Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Left: 자주 쓰는 메뉴 */}
            <div style={{ background: T.card, borderRadius: 14, padding: '22px 24px', border: `1px solid ${T.divider}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>자주 쓰는 메뉴</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { n: 1, label: '공과금 관리', sub: '고지서 납부', href: '/utilities', value: null, color: T.text },
                  { n: 2, label: '지출 관리', sub: `이번 달 ${totalExpense > 0 ? Math.round(totalExpense / 10000) + '만원' : '-'}`, href: '/expenses', value: totalExpense > 0 ? `${Math.round(totalExpense / 10000)}만` : null, color: T.text },
                  { n: 3, label: '공실 관리', sub: '모집 및 현황', href: '/vacancy', value: vacantCount > 0 ? `${vacantCount}실` : null, color: vacantCount > 0 ? T.red : T.text },
                  { n: 4, label: '당번 관리', sub: '청소 당번표', href: '/duty', value: null, color: T.text },
                  { n: 5, label: '담당자 관리', sub: `활성 ${workerCount}명`, href: '/management/workers', value: workerCount > 0 ? `${workerCount}명` : null, color: T.text },
                ].map(row => (
                  <div key={row.n} onClick={() => router.push(row.href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: '#F9FAFB', cursor: 'pointer' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{row.n}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{row.label}</div>
                      <div style={{ fontSize: 11, color: T.textMute }}>{row.sub}</div>
                    </div>
                    {row.value && <span style={{ fontSize: 13, fontWeight: 700, color: row.color, flexShrink: 0 }}>{row.value}</span>}
                    <IconChevronRight />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 오늘 할 일 */}
            <div style={{ background: T.card, borderRadius: 14, padding: '22px 24px', border: `1px solid ${T.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>오늘 할 일</span>
                {todos.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>{todos.reduce((s, t) => s + t.count, 0)}</span>}
              </div>
              {todos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 13 }}>오늘 처리할 일이 없어요</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {todos.map(todo => (
                    <div key={todo.label} onClick={() => router.push(todo.href)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: '#F9FAFB', cursor: 'pointer' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: todo.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.text }}>{todo.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: todo.color }}>{todo.count}건</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: 전체 부가 메뉴 */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.textMute, marginBottom: 12 }}>전체 부가 메뉴</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: '수익 현황', sub: '지점 랭킹 / 손익', href: '/revenue', icon: IconTrend },
                { label: '플랫폼 이체', sub: '이체 현황 관리', href: '/payments/platform', icon: IconSend },
                { label: '청소/수리', sub: repairCount > 0 ? `대기 ${repairCount}건` : '일정/이슈', href: '/issues', icon: IconWrench },
                { label: '담당자 관리', sub: workerCount > 0 ? `활성 ${workerCount}명` : '용역 담당자', href: '/management/workers', icon: IconUserCheck },
                { label: '투자자 관리', sub: investorCount > 0 ? `${investorCount}명 · ${investorHouseCount}개 지점` : '투자자 현황', href: '/investors', icon: IconBriefcase },
                { label: '퇴실자 관리', sub: leavingCount > 0 ? `이달 ${leavingCount}명` : '퇴실 이력', href: '/checkout', icon: IconLogOut },
              ].map(card => (
                <div key={card.label} onClick={() => router.push(card.href)} style={{ background: T.card, borderRadius: 14, padding: '18px 16px', border: `1px solid ${T.divider}`, cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><card.icon /></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3 }}>{card.label}</div>
                  <div style={{ fontSize: 12, color: T.textMute }}>{card.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
