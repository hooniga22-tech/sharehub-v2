'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types (from DashboardMobile) ─── */
type Tenant = Record<string, string>;
type Issue = { id: string; title: string; category: string; status: string; createdAt: string; houseName?: string };
type Payment = { 연월: string; 청구액: string; 상태: string };
type Worker = { 용역ID: string; 예정일: string; 지점명: string; 담당자명: string; 작업종류: string; 완료여부: string };
type Task = {
  id: string; title: string; houseName: string; assignedTo: string;
  tags: string[]; status: string; startDate: string; endDate: string; registeredAt: string;
};

type CalFilter = '전체' | '청소' | '수리' | '기타' | '입주' | '퇴실';
const FILTERS: CalFilter[] = ['전체', '청소', '수리', '기타', '입주', '퇴실'];

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  blueGrad: 'linear-gradient(135deg, #3182F6 0%, #2772E3 100%)',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  purple: '#8B5CF6', purpleLight: '#EDE4FF', purpleDark: '#6D28D9',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

type CatKey = 'clean' | 'repair' | 'etc' | 'checkin' | 'checkout';
const CAT_COLORS: Record<CatKey, { solid: string; bg: string; text: string }> = {
  clean: { solid: T.blue, bg: T.blueLight, text: T.blueDark },
  repair: { solid: T.orange, bg: T.orangeLight, text: T.orangeDark },
  etc: { solid: T.purple, bg: T.purpleLight, text: T.purpleDark },
  checkin: { solid: T.green, bg: T.greenLight, text: T.greenDark },
  checkout: { solid: T.red, bg: T.redLight, text: T.redDark },
};

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

/* ─── Helpers ─── */
function kstParts() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const [y, m, d] = s.replace(/\./g, '').trim().split(/\s+/).map(Number);
  return { y, m, d };
}
function kstDate() { const { y, m, d } = kstParts(); return new Date(y, m - 1, d); }
function koreaDateStr() {
  const { y, m, d } = kstParts();
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dow = new Date(y, m - 1, d).getDay();
  return `${y}년 ${m}월 ${d}일 ${weekdays[dow]}`;
}
function koreaKey() {
  const { y, m, d } = kstParts();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function getWeekEnd() {
  const now = kstDate(); const day = now.getDay();
  const sun = new Date(now); sun.setDate(now.getDate() + (day === 0 ? 0 : 7 - day));
  return sun;
}
const monthPrefix = (y: number, m1: number) => `${y}-${String(m1).padStart(2, '0')}`;
const dateRangeArr = (start: string, end: string): string[] => {
  if (!start) return [];
  const s = start.slice(0, 10); const e = (end && end.slice(0, 10)) || s;
  if (e < s) return [s];
  const out: string[] = [];
  const d = new Date(s + 'T00:00:00'); const stop = new Date(e + 'T00:00:00');
  while (d <= stop) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

/* ─── SVG Icons ─── */
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
  { label: '대시보드', href: '/', icon: IconHome, active: true },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconSettings },
];

/* ─── Main Component ─── */
type AppItem = { id: string; name: string; phone: string; status: string; createdAt: string; _type: string; houseName?: string; roomCode?: string };

const APP_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  tour: { bg: '#E6F0FE', color: '#1B64DA', label: '투어' },
  cleaning: { bg: '#DBF5EA', color: '#009A6F', label: '청소' },
  aircon: { bg: '#E0F2FE', color: '#0284C7', label: '에어컨' },
  checkout: { bg: '#FEE2E2', color: '#DC2626', label: '퇴실' },
  supplies: { bg: '#FFEDD5', color: '#C2410C', label: '물품' },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return '방금';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DashboardDesktop() {
  const router = useRouter();
  /* ─── Data (same as DashboardMobile) ─── */
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = kstDate();
    Promise.all([
      fetch('/api/tenants').then(r => r.json()).catch(() => []),
      fetch('/api/issues').then(r => r.json()).catch(() => ({ issues: [] })),
      fetch(`/api/payments?year=${now.getFullYear()}&month=${now.getMonth() + 1}`).then(r => r.json()).catch(() => []),
      fetch('/api/workers').then(r => r.json()).catch(() => []),
    ]).then(([tenantData, issueData, paymentData, workerData]) => {
      setTenants(Array.isArray(tenantData) ? tenantData : []);
      setIssues(issueData.issues || []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setWorkers(Array.isArray(workerData) ? workerData : []);
      setLoading(false);
    });
  }, []);

  /* ─── Applications ─── */
  const [apps, setApps] = useState<AppItem[]>([]);
  useEffect(() => {
    const TYPES = ['tour', 'cleaning', 'aircon', 'checkout', 'supplies'];
    Promise.all(TYPES.map(t =>
      fetch(`/api/apply/${t}`).then(r => r.json())
        .then((d: any[]) => (Array.isArray(d) ? d : []).map(item => ({
          id: item.id || '', name: item.name || item.tenantName || '', phone: item.phone || '',
          status: item.status || '', createdAt: item.createdAt || '',
          _type: t, houseName: item.houseName || '', roomCode: item.roomCode || '',
        })))
        .catch(() => [])
    )).then(results => {
      const pending = results.flat()
        .filter(a => a.status === '신청접수' || a.status === '처리중')
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setApps(pending);
    });
  }, []);

  /* ─── Calendar state ─── */
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selFilter, setSelFilter] = useState<CalFilter>('전체');

  const calYear = currentMonth.getFullYear();
  const calMonth = currentMonth.getMonth();
  const prefix = monthPrefix(calYear, calMonth + 1);
  const todayStr = useMemo(() => koreaKey(), []);

  /* Calendar grid (Mon first) */
  const calendarDays = useMemo(() => {
    const firstDow = new Date(calYear, calMonth, 1).getDay();
    const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < mondayOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  const fmtDate = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  /* Build calendar items */
  type CalItem = { label: string; cat: CatKey };
  const dateItemsMap = useMemo(() => {
    const map: Record<string, CalItem[]> = {};
    const add = (date: string, item: CalItem) => {
      const d = date.slice(0, 10);
      if (!d.startsWith(prefix)) return;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    };

    // Tenants: checkin/checkout
    if (selFilter === '전체' || selFilter === '입주') {
      tenants.forEach(t => {
        if (t['입주일'] && t['입주일'].startsWith(prefix)) {
          add(t['입주일'], { label: `${t['이름'] || ''} 입주`, cat: 'checkin' });
        }
      });
    }
    if (selFilter === '전체' || selFilter === '퇴실') {
      tenants.forEach(t => {
        if (t['퇴실일'] && t['퇴실일'].startsWith(prefix)) {
          add(t['퇴실일'], { label: `${t['이름'] || ''} 퇴실`, cat: 'checkout' });
        }
      });
    }

    // Workers (clean)
    if (selFilter === '전체' || selFilter === '청소') {
      workers.forEach(w => {
        if (w.예정일 && w.예정일.startsWith(prefix) && (w.작업종류 || '').includes('청소')) {
          add(w.예정일, { label: `${w.지점명} 청소`, cat: 'clean' });
        }
      });
    }

    // Issues (repair)
    if (selFilter === '전체' || selFilter === '수리') {
      issues.forEach(i => {
        if (i.status === '완료') return;
        if ((i.createdAt || '').startsWith(prefix)) {
          add(i.createdAt, { label: i.title, cat: 'repair' });
        }
      });
    }

    // Workers (etc - non-clean)
    if (selFilter === '전체' || selFilter === '기타') {
      workers.forEach(w => {
        if (w.예정일 && w.예정일.startsWith(prefix) && !(w.작업종류 || '').includes('청소')) {
          add(w.예정일, { label: `${w.지점명} ${w.작업종류}`, cat: 'etc' });
        }
      });
    }

    // Tasks
    tasks.forEach(t => {
      if (t.status !== '예정' || !t.startDate) return;
      const cat: CatKey = t.tags?.some(g => g.includes('청소')) ? 'clean' :
        t.tags?.some(g => g.includes('수리')) ? 'repair' : 'etc';
      if (selFilter !== '전체') {
        if (selFilter === '청소' && cat !== 'clean') return;
        if (selFilter === '수리' && cat !== 'repair') return;
        if (selFilter === '기타' && cat !== 'etc') return;
        if (selFilter === '입주' || selFilter === '퇴실') return;
      }
      dateRangeArr(t.startDate, t.endDate).forEach(d => {
        if (d.startsWith(prefix)) {
          add(d, { label: t.title || `${t.houseName} 작업`, cat });
        }
      });
    });

    return map;
  }, [tenants, issues, workers, tasks, selFilter, prefix]);

  /* ─── KPIs ─── */
  const todayDate = useMemo(() => { const d = kstDate(); d.setHours(0, 0, 0, 0); return d; }, []);
  const weekEnd = useMemo(() => getWeekEnd(), []);

  const activeCount = useMemo(() => tenants.filter(t => t['상태'] === '입주중').length, [tenants]);
  const vacantCount = useMemo(() => tenants.filter(t => t['상태'] === '공실').length, [tenants]);
  const totalRooms = activeCount + vacantCount;
  const occupancy = totalRooms > 0 ? Math.round(activeCount / totalRooms * 100) : 0;

  const weeklyCheckouts = useMemo(() =>
    tenants.filter(t => { if (!t['퇴실일']) return false; const d = new Date(t['퇴실일']); return d >= todayDate && d <= weekEnd; }).length
  , [tenants, todayDate, weekEnd]);

  const unpaidCount = useMemo(() => payments.filter(p => p.상태 === '미납').length, [payments]);
  const unpaidAmount = useMemo(() => payments.filter(p => p.상태 === '미납').reduce((sum, p) => sum + (Number(p.청구액) || 0), 0), [payments]);

  /* ─── Nav handlers ─── */
  const handlePrev = () => setCurrentMonth(new Date(calYear, calMonth - 1, 1));
  const handleNext = () => setCurrentMonth(new Date(calYear, calMonth + 1, 1));
  const handleToday = () => setCurrentMonth(new Date());

  /* ─── Render ─── */
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* ═══ Sidebar ═══ */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column' }}>
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
              fontWeight: m.active ? 600 : 400,
              fontSize: 13, textDecoration: 'none',
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
        {/* Page header */}
        <div style={{
          height: 70, padding: '0 28px', background: T.card, borderBottom: `1px solid ${T.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>대시보드</div>
            <div style={{ fontSize: 13, color: T.textMute }}>전체 현황 한눈에</div>
          </div>
          <div style={{ fontSize: 13, color: T.textMute }}>{koreaDateStr()}</div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, padding: 24, overflow: 'hidden' }}>
          {/* Left: Calendar */}
          <div style={{ overflowY: 'auto' }}>
            {/* Nav + Filters */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{calYear}년 {calMonth + 1}월</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={handlePrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronLeft /></button>
                  <button onClick={handleToday} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit' }}>오늘</button>
                  <button onClick={handleNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronRight /></button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setSelFilter(f)} style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                    background: selFilter === f ? T.text : T.card,
                    color: selFilter === f ? '#fff' : T.textSub,
                    border: selFilter === f ? 'none' : `1px solid ${T.line}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMute, fontSize: 14 }}>불러오는 중...</div>
            ) : (
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.line}` }}>
                  {WEEKDAYS.map((w, i) => (
                    <div key={w} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 500, color: i >= 5 ? T.textMute : T.textSub }}>{w}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`e-${idx}`} style={{ minHeight: 110, borderBottom: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}` }} />;
                    const ds = fmtDate(day);
                    const isToday = ds === todayStr;
                    const items = dateItemsMap[ds] || [];
                    const dow = idx % 7;
                    const isWeekend = dow >= 5;
                    return (
                      <div key={ds} style={{
                        minHeight: 110, padding: 6,
                        borderBottom: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
                        display: 'flex', flexDirection: 'column',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: isToday ? 700 : 400,
                          background: isToday ? T.blue : 'transparent',
                          color: isToday ? '#fff' : isWeekend ? T.textMute : T.text,
                          marginBottom: 4,
                        }}>{day}</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                          {items.slice(0, 3).map((item, i) => {
                            const colors = CAT_COLORS[item.cat];
                            return (
                              <div key={i} style={{
                                fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: 4,
                                borderLeft: `3px solid ${colors.solid}`,
                                background: colors.bg, color: colors.text,
                                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                              }}>
                                {item.label}
                              </div>
                            );
                          })}
                          {items.length > 3 && (
                            <div style={{ fontSize: 10, color: T.textMute, paddingLeft: 6 }}>+{items.length - 3}건 더</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: KPI Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {/* Card 1: 입주율 */}
            <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMute, marginBottom: 8 }}>전체 입주율</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.blue, letterSpacing: -0.5 }}>
                {loading ? '—' : `${occupancy}%`}
              </div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 4 }}>
                {loading ? '' : `${activeCount}실 / ${totalRooms}실`}
              </div>
              {!loading && (
                <div style={{ marginTop: 12, height: 8, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${occupancy}%`, background: T.blueGrad, borderRadius: 4 }} />
                </div>
              )}
            </div>

            {/* Card 2: 공실 */}
            <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMute, marginBottom: 8 }}>공실 현황</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: -0.5 }}>
                {loading ? '—' : `${vacantCount}실`}
              </div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 4 }}>
                {loading ? '' : `이번주 ${weeklyCheckouts}실 퇴실 예정`}
              </div>
              {!loading && totalRooms > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.divider}` }}>
                  <div style={{ fontSize: 11, color: T.textMute }}>
                    공실률 {totalRooms > 0 ? Math.round(vacantCount / totalRooms * 100) : 0}%
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: 미납 */}
            <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textMute, marginBottom: 8 }}>이번달 미납</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: unpaidCount > 0 ? T.red : T.text, letterSpacing: -0.5 }}>
                {loading ? '—' : `${unpaidCount}건`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 4 }}>
                {loading ? '' : `${unpaidAmount.toLocaleString()}원`}
              </div>
            </div>

            {/* Card 4: 미처리 신청 */}
            <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>미처리 신청</span>
                  {apps.length > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B' }}>{apps.length}건</span>}
                </div>
                <button onClick={() => router.push('/applications')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.textSub, fontFamily: 'inherit' }}>전체보기 &rsaquo;</button>
              </div>
              {apps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: T.textMute }}>새로운 신청이 없어요</div>
              ) : (
                <div>
                  {apps.slice(0, 5).map((a, i) => {
                    const badge = APP_BADGE[a._type] || APP_BADGE.tour;
                    const stBadge = a.status === '신청접수'
                      ? { label: '신규', bg: '#FEF3C7', color: '#92400E' }
                      : { label: '처리중', bg: '#DBEAFE', color: '#1E40AF' };
                    const sub = [a.houseName, a.roomCode].filter(Boolean).join(' ');
                    const timePart = timeAgo(a.createdAt);
                    const subLine = sub ? `${sub} · ${timePart}` : timePart;
                    return (
                      <div key={`${a._type}-${a.id}`}
                        onClick={() => router.push('/applications')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer',
                          borderTop: i > 0 ? `1px solid ${T.divider}` : 'none',
                        }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: badge.color, flexShrink: 0 }}>{badge.label}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name || '(이름 없음)'}</div>
                          <div style={{ fontSize: 11, color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subLine}</div>
                        </div>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: stBadge.bg, color: stBadge.color, fontWeight: 600, flexShrink: 0 }}>{stBadge.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
