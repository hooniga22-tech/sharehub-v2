'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IssuesMobile from './IssuesMobile';

/* ─── Types (mirrored from IssuesMobile) ─── */
type Issue = {
  id: string; houseName: string; roomCode: string; title: string; content: string;
  category: string; status: string; assignee: string; createdAt: string;
  completedAt: string; cost: number; memo: string;
};
type Work = {
  용역ID: string; 예정일: string; 지점명: string; 담당자명: string;
  작업종류: string; 정산금액: string; 메모: string; 완료여부: string;
};
type InventoryTask = {
  id: string; title: string; houseName: string; roomCode: string;
  assignedTo: string; tags: string[]; memo: string; isUrgent: boolean;
  registeredAt: string; startDate: string; endDate: string; amount: number; status: string;
};

type DesktopTab = 'schedule' | 'workers' | 'settle';

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  green: '#00B493', greenLight: '#D1F5EB',
  orange: '#F9A825', orangeLight: '#FFF4DC',
  purple: '#8B5CF6', purpleLight: '#EDE4FF',
  line: '#EAEDF0', divider: '#F2F4F6',
};

const CAT_COLORS: Record<string, { solid: string; light: string; text: string }> = {
  clean: { solid: T.blue, light: T.blueLight, text: T.blueDark },
  repair: { solid: T.orange, light: T.orangeLight, text: '#B47400' },
  etc: { solid: T.purple, light: T.purpleLight, text: '#6B21A8' },
};

type CalCategory = '전체' | '청소' | '수리' | '기타';
const CATEGORIES: CalCategory[] = ['전체', '청소', '수리', '기타'];
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

/* ─── Helpers ─── */
const monthPrefix = (y: number, m1: number) => `${y}-${String(m1).padStart(2, '0')}`;

const taskCategory = (t: InventoryTask): 'clean' | 'repair' | 'etc' => {
  const tags = t.tags || [];
  if (tags.some(g => g.includes('청소'))) return 'clean';
  if (tags.some(g => g.includes('수리'))) return 'repair';
  return 'etc';
};

const dateRangeArr = (start: string, end: string): string[] => {
  if (!start) return [];
  const s = start.slice(0, 10);
  const e = (end && end.slice(0, 10)) || s;
  if (e < s) return [s];
  const out: string[] = [];
  const d = new Date(s + 'T00:00:00');
  const stop = new Date(e + 'T00:00:00');
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
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

/* ─── Menu items ─── */
const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar, active: true },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconSettings },
];

/* ─── Main Component ─── */
export default function IssuesDesktop() {
  const router = useRouter();
  const [tab, setTab] = useState<DesktopTab>('schedule');

  /* ─── Data fetching (same sources as IssuesMobile) ─── */
  const [issues, setIssues] = useState<Issue[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [tasks, setTasks] = useState<InventoryTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/issues').then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
      fetch('/api/tasks/active', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    ]).then(([issueData, workData, taskData]) => {
      setIssues(issueData.issues || []);
      setWorks(Array.isArray(workData) ? workData : []);
      if (taskData?.success && Array.isArray(taskData.data)) setTasks(taskData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ─── Calendar state ─── */
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selCat, setSelCat] = useState<CalCategory>('전체');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calYear = currentMonth.getFullYear();
  const calMonth = currentMonth.getMonth();
  const prefix = monthPrefix(calYear, calMonth + 1);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const fmtDate = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  /* Calendar grid (Monday first) */
  const calendarDays = useMemo(() => {
    const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < mondayOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  /* Filtered works/issues/tasks for current month */
  const worksInMonth = useMemo(() =>
    works.filter(w => (w.예정일 || '').startsWith(prefix)), [works, prefix]);
  const issuesInMonth = useMemo(() =>
    issues.filter(i => (i.createdAt || '').startsWith(prefix)), [issues, prefix]);
  const tasksInMonth = useMemo(() =>
    tasks.filter(t => {
      if (t.status !== '예정') return false;
      const s = (t.startDate || '').slice(0, 10);
      if (!s) return false;
      const e = (t.endDate || '').slice(0, 10) || s;
      return s.slice(0, 7) <= prefix && e.slice(0, 7) >= prefix;
    }), [tasks, prefix]);

  /* Build date → items map for calendar cells */
  type CalItem = { label: string; cat: 'clean' | 'repair' | 'etc'; location?: string };
  const dateItemsMap = useMemo(() => {
    const map: Record<string, CalItem[]> = {};
    const add = (date: string, item: CalItem) => {
      const d = date.slice(0, 10);
      if (!d.startsWith(prefix)) return;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    };

    worksInMonth.forEach(w => {
      const cat = w.작업종류.includes('청소') ? 'clean' as const : w.작업종류.includes('수리') ? 'repair' as const : 'etc' as const;
      if (selCat !== '전체') {
        if (selCat === '청소' && cat !== 'clean') return;
        if (selCat === '수리' && cat !== 'repair') return;
        if (selCat === '기타' && cat !== 'etc') return;
      }
      add(w.예정일, { label: `${w.지점명} · ${w.작업종류}`, cat, location: w.지점명 });
    });

    issuesInMonth.forEach(i => {
      if (i.status === '완료') return;
      if (selCat !== '전체' && selCat !== '수리') return;
      add(i.createdAt, { label: i.title, cat: 'repair', location: i.houseName });
    });

    tasksInMonth.forEach(t => {
      const cat = taskCategory(t);
      if (selCat !== '전체') {
        if (selCat === '청소' && cat !== 'clean') return;
        if (selCat === '수리' && cat !== 'repair') return;
        if (selCat === '기타' && cat !== 'etc') return;
      }
      const dates = dateRangeArr(t.startDate, t.endDate);
      dates.forEach(d => {
        if (d.startsWith(prefix)) {
          add(d, { label: t.title || `${t.houseName} · ${(t.tags || [])[0] || '작업'}`, cat, location: t.houseName });
        }
      });
    });

    return map;
  }, [worksInMonth, issuesInMonth, tasksInMonth, selCat, prefix]);

  /* Items for the selected date detail panel */
  type DetailItem = { id: string; title: string; cat: 'clean' | 'repair' | 'etc'; location: string; assignee: string; status: string; source: 'work' | 'issue' | 'task' };
  const selectedDateItems = useMemo((): DetailItem[] => {
    if (!selectedDate) return [];
    const items: DetailItem[] = [];

    worksInMonth.forEach(w => {
      if ((w.예정일 || '').slice(0, 10) !== selectedDate) return;
      const cat = w.작업종류.includes('청소') ? 'clean' as const : w.작업종류.includes('수리') ? 'repair' as const : 'etc' as const;
      if (selCat !== '전체') {
        if (selCat === '청소' && cat !== 'clean') return;
        if (selCat === '수리' && cat !== 'repair') return;
        if (selCat === '기타' && cat !== 'etc') return;
      }
      items.push({ id: w.용역ID, title: `${w.지점명} · ${w.작업종류}`, cat, location: w.지점명, assignee: w.담당자명, status: w.완료여부 === 'Y' ? '완료' : '예정', source: 'work' });
    });

    issuesInMonth.forEach(i => {
      if ((i.createdAt || '').slice(0, 10) !== selectedDate) return;
      if (i.status === '완료') return;
      if (selCat !== '전체' && selCat !== '수리') return;
      items.push({ id: i.id, title: i.title, cat: 'repair', location: `${i.houseName} ${i.roomCode || ''}`.trim(), assignee: i.assignee || '', status: i.status, source: 'issue' });
    });

    tasksInMonth.forEach(t => {
      const s = (t.startDate || '').slice(0, 10);
      const e = (t.endDate || '').slice(0, 10) || s;
      if (!s || selectedDate < s || selectedDate > e) return;
      const cat = taskCategory(t);
      if (selCat !== '전체') {
        if (selCat === '청소' && cat !== 'clean') return;
        if (selCat === '수리' && cat !== 'repair') return;
        if (selCat === '기타' && cat !== 'etc') return;
      }
      items.push({ id: t.id, title: t.title || `${t.houseName} 작업`, cat, location: `${t.houseName} ${t.roomCode || ''}`.trim(), assignee: t.assignedTo || '', status: t.status, source: 'task' });
    });

    return items;
  }, [selectedDate, worksInMonth, issuesInMonth, tasksInMonth, selCat]);

  /* ─── Navigation handlers ─── */
  const handlePrev = () => {
    setSelectedDate(null);
    setCurrentMonth(new Date(calYear, calMonth - 1, 1));
  };
  const handleNext = () => {
    setSelectedDate(null);
    setCurrentMonth(new Date(calYear, calMonth + 1, 1));
  };
  const handleToday = () => {
    setSelectedDate(null);
    setCurrentMonth(new Date());
  };

  /* ─── Render ─── */
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* ═══ Left Sidebar ═══ */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column' }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 18px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div>
          <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}>
            <IconSearch />
            <span style={{ fontSize: 12, color: T.textMute }}>검색</span>
          </div>
        </div>

        {/* Main menu */}
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

      </div>

      {/* ═══ Right Main ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Page header */}
        <div style={{ background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ height: 70, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>
                {tab === 'schedule' ? '일정 관리' : tab === 'workers' ? '담당자' : '정산'}
              </div>
              <div style={{ fontSize: 13, color: T.textMute }}>
                {tab === 'schedule' ? `${calYear}년 ${calMonth + 1}월 · 전체 일정 파악` : tab === 'workers' ? '담당자 현황 및 일정' : '월별 정산 내역'}
              </div>
            </div>
            {tab === 'schedule' && (
              <Link href="/issues/register" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 8, border: 'none',
                background: T.blue, color: '#fff',
                fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
              }}>
                <IconPlus />
                새 일정
              </Link>
            )}
          </div>
          {/* Tab bar */}
          <div style={{ display: 'flex', padding: '0 24px' }}>
            {([
              { key: 'schedule' as const, label: '일정' },
              { key: 'workers' as const, label: '담당자' },
              { key: 'settle' as const, label: '정산' },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 16px', background: 'none', border: 'none',
                borderBottom: tab === t.key ? `2px solid ${T.blue}` : '2px solid transparent',
                color: tab === t.key ? T.blue : T.textMute,
                fontWeight: tab === t.key ? 600 : 400,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

      {tab === 'schedule' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Body: calendar + panel */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Calendar area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {/* Nav + filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{calYear}년 {calMonth + 1}월</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={handlePrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronLeft /></button>
                    <button onClick={handleToday} style={{
                      background: T.card, border: `1px solid ${T.line}`, borderRadius: 6,
                      padding: '4px 10px', fontSize: 12, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit',
                    }}>오늘</button>
                    <button onClick={handleNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronRight /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setSelCat(c)} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: selCat === c ? T.text : T.card,
                      color: selCat === c ? '#fff' : T.textSub,
                      border: selCat === c ? 'none' : `1px solid ${T.line}`,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMute, fontSize: 14 }}>불러오는 중...</div>
              ) : (
                /* Calendar grid */
                <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                  {/* Weekday header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.line}` }}>
                    {WEEKDAYS.map((w, i) => (
                      <div key={w} style={{
                        padding: '10px 0', textAlign: 'center',
                        fontSize: 12, fontWeight: 500,
                        color: i >= 5 ? T.textMute : T.textSub,
                      }}>{w}</div>
                    ))}
                  </div>
                  {/* Date cells */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {calendarDays.map((day, idx) => {
                      if (day === null) return <div key={`e-${idx}`} style={{ minHeight: 110, borderBottom: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}` }} />;
                      const ds = fmtDate(day);
                      const isToday = ds === todayStr;
                      const isSelected = ds === selectedDate;
                      const items = dateItemsMap[ds] || [];
                      const dow = (idx % 7);
                      const isWeekend = dow >= 5;
                      return (
                        <div key={ds}
                          onClick={() => setSelectedDate(prev => prev === ds ? null : ds)}
                          style={{
                            minHeight: 110, padding: '6px 6px 4px',
                            borderBottom: `1px solid ${T.line}`,
                            borderRight: `1px solid ${T.line}`,
                            background: isSelected ? T.blueLight : 'transparent',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column',
                          }}
                        >
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
                                  fontSize: 10, padding: '3px 6px', borderRadius: 4,
                                  borderLeft: `3px solid ${colors.solid}`,
                                  background: colors.light, color: colors.text,
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

            {/* Right slide panel */}
            {selectedDate && (
              <div style={{
                width: 320, background: T.card, borderLeft: `1px solid ${T.line}`,
                padding: 20, overflowY: 'auto', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.textMute }}>{calYear}년 {calMonth + 1}월</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{parseInt(selectedDate.split('-')[2])}일</div>
                  </div>
                  <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <IconClose />
                  </button>
                </div>

                {selectedDateItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMute, fontSize: 13 }}>일정이 없습니다</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedDateItems.map(item => {
                      const colors = CAT_COLORS[item.cat];
                      const catLabel = item.cat === 'clean' ? '청소' : item.cat === 'repair' ? '수리' : '기타';
                      const href = item.source === 'work' ? `/issues/work/${item.id}` : item.source === 'issue' ? `/issues/${item.id}` : null;
                      return (
                        <div key={item.id}
                          onClick={() => { if (href) router.push(href); }}
                          style={{
                            background: T.bg, borderRadius: 10, padding: '12px 14px',
                            cursor: href ? 'pointer' : 'default',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                              background: colors.light, color: colors.text,
                            }}>{catLabel}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                              background: item.status === '완료' ? T.greenLight : T.divider,
                              color: item.status === '완료' ? T.green : T.textMute,
                            }}>{item.status || '대기'}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>{item.title}</div>
                          {item.location && <div style={{ fontSize: 11, color: T.textMute, marginBottom: 2 }}>{item.location}</div>}
                          {item.assignee && <div style={{ fontSize: 11, color: T.textSub }}>{item.assignee}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══ Workers / Settle tab: embed IssuesMobile ═══ */
        <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
          <div style={{ maxWidth: 500, margin: '40px auto', padding: '24px 0', background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
            <IssuesMobile key={tab} initialTab={tab} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
