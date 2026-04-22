'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Chip from '@/components/ui/Chip';

const BLUE = '#3182F6', GRAY = '#888888';
const CHECKOUT_COLOR = '#E24B4A', CHECKIN_COLOR = '#3182F6', REPAIR_COLOR = '#F59E0B', CLEAN_COLOR = '#00B493';

type CalEvent = {
  date: string;
  type: 'checkout' | 'checkin' | 'repair' | 'clean';
  color: string;
  title: string;
  sub: string;
  link?: string;
};
type WeekItem = { date: string; color: string; title: string; sub: string; link?: string };

function kstParts() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const [y, m, d] = s.replace(/\./g, '').trim().split(/\s+/).map(Number);
  return { y, m, d };
}

function kstDate() {
  const { y, m, d } = kstParts();
  return new Date(y, m - 1, d);
}

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
  const now = kstDate();
  const day = now.getDay();
  const sun = new Date(now);
  sun.setDate(now.getDate() + (day === 0 ? 0 : 7 - day));
  sun.setHours(23, 59, 59, 999);
  return sun;
}

function getWeekStart() {
  const now = kstDate();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function elapsed(dateStr: string) {
  if (!dateStr) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

type Issue = { id: string; title: string; category: string; status: string; createdAt: string; houseName?: string };
type Tenant = Record<string, string>;
type Payment = { 연월: string; 청구액: string; status: string };
type Worker = { 용역ID: string; 예정일: string; 지점명: string; 담당자명: string; 작업종류: string; 완료여부: string };
type Task = {
  id: string; title: string; houseName: string; assignedTo: string;
  tags: string[]; status: string; startDate: string; endDate: string; registeredAt: string;
};

type WeekFilter = 'all' | 'move' | 'clean' | 'repair';

export default function DashboardMobile() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingI, setLoadingI] = useState(true);
  const [loadingP, setLoadingP] = useState(true);
  const [weekFilter, setWeekFilter] = useState<WeekFilter>('all');

  const todayKey = useMemo(() => koreaKey(), []);
  const todayDate = useMemo(() => { const d = kstDate(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayKey);

  useEffect(() => {
    const now = kstDate();
    fetch('/api/tenants').then(r => r.json()).then(d => setTenants(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingT(false));
    fetch('/api/issues').then(r => r.json()).then(d => setIssues(d.issues || [])).catch(() => {}).finally(() => setLoadingI(false));
    fetch(`/api/payments?year=${now.getFullYear()}&month=${now.getMonth() + 1}`).then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingP(false));
    fetch('/api/workers').then(r => r.json()).then(d => setWorkers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/rooms').then(r => r.json()).then(d => setRooms(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // KPIs
  const occupancy = useMemo(() => {
    const active = tenants.filter(t => t.status === 'active').length;
    const total = rooms.length || 1;
    return Math.round(active / total * 100);
  }, [tenants, rooms]);
  const pendingIssues = useMemo(() => issues.filter(i => i.status === 'pending' || i.status === 'in_progress').length, [issues]);
  const weekEnd = useMemo(() => getWeekEnd(), []);
  const weekStart = useMemo(() => getWeekStart(), []);
  const weeklyCheckouts = useMemo(() => tenants.filter(t => { if (!t['퇴실일']) return false; const d = new Date(t['퇴실일']); return d >= todayDate && d <= weekEnd; }).length, [tenants, weekEnd, todayDate]);
  const unpaidAmount = useMemo(() => payments.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + (Number(p.청구액) || 0), 0), [payments]);
  const todoIssues = useMemo(() => {
    const fromIssues: Issue[] = issues
      .filter(i => i.status === 'pending' || i.status === 'in_progress');
    const fromTasks: Issue[] = tasks
      .filter(t => t.status === 'scheduled')
      .map(t => ({
        id: t.id,
        title: t.title || `${(t.tags && t.tags[0]) || '할일'} · ${t.houseName || ''}`,
        category: (t.tags && t.tags[0]) || '기타',
        status: '예정',
        createdAt: t.startDate || t.registeredAt || '',
        houseName: t.houseName,
      }));
    return [...fromIssues, ...fromTasks].slice(0, 4);
  }, [issues, tasks]);

  // Calendar events
  const calEvents = useMemo(() => {
    const events: CalEvent[] = [];
    for (const t of tenants) {
      if (t['퇴실일']) events.push({ date: t['퇴실일'].slice(0, 10), type: 'checkout', color: CHECKOUT_COLOR, title: `퇴실 — ${t['지점명'] || ''}`, sub: `${t['이름'] || ''} · ${t['방코드'] || ''}`, link: t['id'] ? `/tenants/${t['id']}` : undefined });
      if (t['입주일']) events.push({ date: t['입주일'].slice(0, 10), type: 'checkin', color: CHECKIN_COLOR, title: `입주 — ${t['지점명'] || ''}`, sub: `${t['이름'] || ''} · ${t['방코드'] || ''}`, link: t['id'] ? `/tenants/${t['id']}` : undefined });
    }
    for (const i of issues) {
      if (i.category === '수리' || i.category === '민원') {
        events.push({ date: (i.createdAt || '').slice(0, 10), type: 'repair', color: REPAIR_COLOR, title: `${i.category} — ${i.houseName || ''}`, sub: i.title, link: `/issues/${i.id}` });
      }
    }
    for (const w of workers) {
      if (w.예정일 && (w.작업종류 || '').includes('청소')) {
        events.push({ date: w.예정일.slice(0, 10), type: 'clean', color: CLEAN_COLOR, title: `청소 — ${w.지점명 || ''}`, sub: w.담당자명 || '' });
      }
    }
    // 할일 시트 머지 (status != '완료' && 시작일 있음): 시작일~마감일 모든 날짜에 점
    const expandRange = (start: string, end: string): string[] => {
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
    for (const t of tasks) {
      if (t.status !== '예정' || !t.startDate) continue;
      const cat: 'clean' | 'repair' | 'etc' =
        t.tags?.some(g => g.includes('청소')) ? 'clean' :
        t.tags?.some(g => g.includes('수리')) ? 'repair' : 'etc';
      const color = cat === 'clean' ? CLEAN_COLOR : cat === 'repair' ? REPAIR_COLOR : '#8B95A1';
      const labelHead = cat === 'clean' ? '청소' : cat === 'repair' ? '수리' : '할일';
      for (const d of expandRange(t.startDate, t.endDate)) {
        events.push({
          date: d,
          type: cat === 'repair' ? 'repair' : 'clean',
          color,
          title: t.title || `${labelHead} — ${t.houseName || ''}`,
          sub: t.assignedTo || '',
        });
      }
    }
    return events;
  }, [tenants, issues, workers, tasks]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of calEvents) { if (!map.has(e.date)) map.set(e.date, []); map.get(e.date)!.push(e); }
    return map;
  }, [calEvents]);

  const calendarDays = useMemo(() => {
    const first = new Date(calYear, calMonth - 1, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const calPrev = useCallback(() => { if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); } else setCalMonth(m => m - 1); }, [calMonth]);
  const calNext = useCallback(() => { if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); } else setCalMonth(m => m + 1); }, [calMonth]);

  const selectedEvents = useMemo(() => eventsByDate.get(selectedDate) || [], [eventsByDate, selectedDate]);

  // Week events with filter
  const rawWeekEvents = useMemo(() => {
    return calEvents
      .filter(e => { const d = new Date(e.date); return d >= todayDate && d <= weekEnd; })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [calEvents, todayDate, weekEnd]);

  // Grouped week items based on filter
  const weekItems = useMemo((): WeekItem[] => {
    let filtered = rawWeekEvents;
    if (weekFilter === 'move') filtered = rawWeekEvents.filter(e => e.type === 'checkout' || e.type === 'checkin');
    else if (weekFilter === 'clean') filtered = rawWeekEvents.filter(e => e.type === 'clean');
    else if (weekFilter === 'repair') filtered = rawWeekEvents.filter(e => e.type === 'repair');

    // When "all", group clean events by date
    if (weekFilter === 'all') {
      const items: WeekItem[] = [];
      const cleanByDate = new Map<string, CalEvent[]>();
      for (const ev of filtered) {
        if (ev.type === 'clean') {
          if (!cleanByDate.has(ev.date)) cleanByDate.set(ev.date, []);
          cleanByDate.get(ev.date)!.push(ev);
        } else {
          items.push({ date: ev.date, color: ev.color, title: ev.title, sub: ev.sub, link: ev.link });
        }
      }
      for (const [date, evs] of cleanByDate) {
        const names = [...new Set(evs.map(e => e.sub))].join(' · ');
        items.push({ date, color: CLEAN_COLOR, title: `청소 ${evs.length}건`, sub: names });
      }
      items.sort((a, b) => a.date.localeCompare(b.date));
      return items;
    }

    return filtered.map(ev => ({ date: ev.date, color: ev.color, title: ev.title, sub: ev.sub, link: ev.link }));
  }, [rawWeekEvents, weekFilter]);

  const weekLabel = useMemo(() => `${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`, [weekStart, weekEnd]);

  const filterChips: { key: WeekFilter; label: string; activeBg: string; activeColor: string; dotColor?: string }[] = [
    { key: 'all', label: '전체', activeBg: '#111', activeColor: '#fff' },
    { key: 'move', label: '입퇴실', activeBg: '#FEF2F2', activeColor: '#E24B4A', dotColor: '#E24B4A' },
    { key: 'clean', label: '청소', activeBg: '#F0FDF4', activeColor: '#00B493', dotColor: '#00B493' },
    { key: 'repair', label: '수리', activeBg: '#FFFBEB', activeColor: '#F59E0B', dotColor: '#F59E0B' },
  ];

  const kpiStyle = { background: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' } as const;
  const kpiLabel = { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 } as const;
  const kpiVal = (color?: string) => ({ fontSize: 22, fontWeight: 700 as const, color: color || '#fff' });

  return (
    <div style={{ paddingBottom: 16, background: '#F7F8FA', minHeight: '100vh' }}>
      {/* 파란 헤더 */}
      <div style={{ background: BLUE, padding: '32px 20px 20px', borderRadius: '0 0 24px 24px' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{koreaDateStr()}</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20 }}>안녕하세요</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={kpiStyle} onClick={() => router.push('/tenants')}>
            <div style={kpiLabel}>전체 입주율</div>
            <div style={kpiVal()}>{loadingT ? '—' : <>{occupancy}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span></>}</div>
          </div>
          <div style={kpiStyle} onClick={() => router.push('/issues')}>
            <div style={kpiLabel}>미처리 이슈</div>
            <div style={kpiVal('#FCD34D')}>{loadingI ? '—' : <>{pendingIssues}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>건</span></>}</div>
          </div>
          <div style={kpiStyle} onClick={() => router.push('/vacancy')}>
            <div style={kpiLabel}>이번주 퇴실</div>
            <div style={kpiVal()}>{loadingT ? '—' : <>{weeklyCheckouts}<span style={{ fontSize: 13, fontWeight: 400 }}>건</span></>}</div>
          </div>
          <div style={kpiStyle} onClick={() => router.push('/payments')}>
            <div style={kpiLabel}>이번달 미납</div>
            <div style={kpiVal(unpaidAmount > 0 ? '#FCA5A5' : '#fff')}>{loadingP ? '—' : <>{unpaidAmount > 0 ? Math.round(unpaidAmount / 10000) : 0}<span style={{ fontSize: 13, fontWeight: 400 }}>만원</span></>}</div>
          </div>
        </div>
      </div>

      {/* 오늘 할 일 */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>오늘 할 일</h2>
            <button onClick={() => router.push('/issues')} style={{ fontSize: 12, color: GRAY, background: 'none', border: 'none', cursor: 'pointer' }}>전체보기</button>
          </div>
          {loadingI ? (
            <p style={{ fontSize: 13, color: GRAY, textAlign: 'center', padding: '16px 0' }}>불러오는 중...</p>
          ) : todoIssues.length === 0 ? (
            <p style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '16px 0' }}>처리할 이슈가 없어요</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {todoIssues.map((issue, i) => {
                const isUrgent = elapsed(issue.createdAt) >= 3;
                return (
                  <div key={issue.id}>
                    <button onClick={() => router.push(`/issues/${issue.id}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isUrgent ? CHECKOUT_COLOR : '#D97706', flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                        {isUrgent && <Chip type="urgent" />}
                        <Chip type={issue.category} />
                      </div>
                    </button>
                    {i < todoIssues.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 캘린더 카드 */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <button onClick={calPrev} style={{ background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>{calYear}년 {calMonth}월</span>
            <button onClick={calNext} style={{ background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer', padding: '0 8px' }}>▶</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#ccc', paddingBottom: 6 }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} style={{ minHeight: 48 }} />;
              const dateKey = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate && !isToday;
              const isPast = new Date(dateKey) < todayDate;
              const dayEvents = eventsByDate.get(dateKey) || [];
              const dots = [...new Set(dayEvents.map(e => e.type))].slice(0, 3);
              return (
                <button key={dateKey} onClick={() => setSelectedDate(dateKey)} style={{
                  background: isToday ? BLUE : isSelected ? '#EFF6FF' : 'none',
                  border: isSelected ? `1.5px solid ${BLUE}` : '1.5px solid transparent',
                  borderRadius: isToday ? '50%' : 6, width: '100%', minHeight: 48,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 3, cursor: 'pointer', fontFamily: 'inherit', padding: 2,
                }}>
                  <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : isPast ? '#ccc' : '#111' }}>{day}</span>
                  {dots.length > 0 && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {dots.map(type => (
                        <div key={type} style={{ width: 4, height: 4, borderRadius: '50%', background: type === 'checkout' ? CHECKOUT_COLOR : type === 'checkin' ? CHECKIN_COLOR : type === 'repair' ? REPAIR_COLOR : CLEAN_COLOR }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12, marginBottom: 12 }}>
            {[{ label: '퇴실', color: CHECKOUT_COLOR }, { label: '입주', color: CHECKIN_COLOR }, { label: '수리', color: REPAIR_COLOR }, { label: '청소', color: CLEAN_COLOR }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10, color: GRAY }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* 선택된 날 이벤트 */}
          <div style={{ borderTop: '1px solid #f2f4f6', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: BLUE, marginBottom: 8 }}>
              {selectedDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, _y, m, d) => `${Number(m)}월 ${Number(d)}일`)} 일정
            </div>
            {selectedEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>일정이 없어요</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedEvents.map((ev, i) => (
                  <button key={i} onClick={() => ev.link && router.push(ev.link)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    background: 'none', border: 'none', cursor: ev.link ? 'pointer' : 'default',
                    fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    borderTop: i > 0 ? '1px solid #f8f8f8' : 'none',
                  }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      <span style={{ fontSize: 11, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 이번주 섹션 */}
          <div style={{ borderTop: '1px solid #f2f4f6', marginTop: 8, paddingTop: 12 }}>
            {/* 헤더 + 필터 칩 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#191919' }}>이번주 {weekLabel}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {filterChips.map(chip => {
                  const active = weekFilter === chip.key;
                  return (
                    <button key={chip.key} onClick={() => setWeekFilter(chip.key)} style={{
                      background: active ? chip.activeBg : '#F2F4F6',
                      color: active ? chip.activeColor : '#888',
                      border: 'none', borderRadius: 20, padding: '6px 12px',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {active && chip.dotColor && <div style={{ width: 6, height: 6, borderRadius: '50%', background: chip.dotColor }} />}
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 이벤트 리스트 */}
            {weekItems.length === 0 ? (
              <p style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>이번주 일정이 없어요</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {weekItems.map((ev, i) => {
                  const d = new Date(ev.date);
                  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                  return (
                    <button key={i} onClick={() => ev.link && router.push(ev.link)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      background: 'none', border: 'none', cursor: ev.link ? 'pointer' : 'default',
                      fontFamily: 'inherit', textAlign: 'left', width: '100%',
                      borderTop: i > 0 ? '1px solid #f8f8f8' : 'none',
                    }}>
                      <div style={{ width: 3, height: 32, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                        <span style={{ fontSize: 11, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.sub}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{dateLabel}</span>
                    </button>
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
