'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import KpiCard from '@/components/ui/KpiCard';
import Chip from '@/components/ui/Chip';

const RED = '#F04452', BLUE = '#3182F6', GRAY = '#888888';
const CHECKOUT_COLOR = '#E24B4A', CHECKIN_COLOR = '#3182F6', REPAIR_COLOR = '#F59E0B', CLEAN_COLOR = '#00B493';

type CalEvent = {
  date: string; // YYYY-MM-DD
  type: 'checkout' | 'checkin' | 'repair' | 'clean';
  color: string;
  title: string;
  sub: string;
  link?: string;
};

function getWeekEnd() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const sun = new Date(now);
  sun.setDate(now.getDate() + (day === 0 ? 0 : 7 - day));
  sun.setHours(23, 59, 59, 999);
  return sun;
}

function todayStr() {
  const d = new Date();
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}`;
}

function elapsed(dateStr: string) {
  if (!dateStr) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

type Issue = {
  id: string; title: string; category: string; status: string; createdAt: string;
  houseName?: string; roomCode?: string;
};
type Tenant = Record<string, string>;
type Payment = { 연월: string; 청구액: string; 상태: string };
type Worker = {
  용역ID: string; 예정일: string; 지점명: string; 담당자명: string;
  작업종류: string; 완료여부: string;
};

export default function HomePage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingI, setLoadingI] = useState(true);
  const [loadingP, setLoadingP] = useState(true);

  // Calendar state
  const todayDate = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const todayKey = useMemo(() => todayDate.toISOString().slice(0, 10), [todayDate]);
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayKey);

  useEffect(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}&month=${now.getMonth() + 1}`;

    fetch('/api/tenants').then(r => r.json()).then(d => {
      setTenants(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setLoadingT(false));

    fetch('/api/issues').then(r => r.json()).then(d => {
      setIssues(d.issues || []);
    }).catch(() => {}).finally(() => setLoadingI(false));

    fetch(`/api/payments?year=${now.getFullYear()}&month=${now.getMonth() + 1}`).then(r => r.json()).then(d => {
      setPayments(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setLoadingP(false));

    fetch('/api/workers').then(r => r.json()).then(d => {
      setWorkers(Array.isArray(d) ? d : []);
    }).catch(() => {});
  }, []);

  // KPI 1: 입주율
  const occupancy = useMemo(() => {
    const active = tenants.filter(t => t['상태'] === '입주중').length;
    const vacant = tenants.filter(t => t['상태'] === '공실').length;
    const total = active + vacant;
    return total > 0 ? Math.round(active / total * 100) : 0;
  }, [tenants]);

  // KPI 2: 미처리 이슈
  const pendingIssues = useMemo(() =>
    issues.filter(i => i.status === '접수' || i.status === '처리중').length
  , [issues]);

  // KPI 3: 이번주 퇴실
  const weekEnd = useMemo(() => getWeekEnd(), []);
  const weeklyCheckouts = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return tenants.filter(t => {
      if (!t['퇴실일']) return false;
      const d = new Date(t['퇴실일']);
      return d >= today && d <= weekEnd;
    }).length;
  }, [tenants, weekEnd]);

  // KPI 4: 이번달 미납
  const unpaidAmount = useMemo(() => {
    return payments
      .filter(p => p.상태 === '미납')
      .reduce((sum, p) => sum + (Number(p.청구액) || 0), 0);
  }, [payments]);

  // 오늘 할 일: 미처리 이슈 최대 4개
  const todoIssues = useMemo(() =>
    issues.filter(i => i.status === '접수' || i.status === '처리중').slice(0, 4)
  , [issues]);

  // 이번주 일정: 퇴실/입주
  const weekSchedule = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items: { date: Date; dateLabel: string; title: string; sub: string; color: string }[] = [];
    for (const t of tenants) {
      if (t['퇴실일']) {
        const d = new Date(t['퇴실일']);
        if (d >= today && d <= weekEnd) {
          const name = (t['이름'] || '').length > 6 ? (t['이름'] || '').slice(0, 6) + '...' : (t['이름'] || '');
          items.push({ date: d, dateLabel: `${d.getMonth() + 1}/${d.getDate()}`, title: `퇴실 — ${t['지점명']} ${name}`, sub: t['방코드'] || '', color: RED });
        }
      }
      if (t['입주일']) {
        const d = new Date(t['입주일']);
        if (d >= today && d <= weekEnd) {
          const name = (t['이름'] || '').length > 6 ? (t['이름'] || '').slice(0, 6) + '...' : (t['이름'] || '');
          items.push({ date: d, dateLabel: `${d.getMonth() + 1}/${d.getDate()}`, title: `입주 — ${t['지점명']} ${name}`, sub: t['방코드'] || '', color: BLUE });
        }
      }
    }
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [tenants, weekEnd]);

  // Calendar events
  const calEvents = useMemo(() => {
    const events: CalEvent[] = [];
    for (const t of tenants) {
      if (t['퇴실일']) {
        events.push({ date: t['퇴실일'].slice(0, 10), type: 'checkout', color: CHECKOUT_COLOR, title: `퇴실 — ${t['지점명'] || ''}`, sub: `${t['이름'] || ''} · ${t['방코드'] || ''}`, link: t['id'] ? `/tenants/${t['id']}` : undefined });
      }
      if (t['입주일']) {
        events.push({ date: t['입주일'].slice(0, 10), type: 'checkin', color: CHECKIN_COLOR, title: `입주 — ${t['지점명'] || ''}`, sub: `${t['이름'] || ''} · ${t['방코드'] || ''}`, link: t['id'] ? `/tenants/${t['id']}` : undefined });
      }
    }
    for (const i of issues) {
      if (i.category === '수리') {
        events.push({ date: (i.createdAt || '').slice(0, 10), type: 'repair', color: REPAIR_COLOR, title: `수리 — ${i.houseName || ''}`, sub: i.title, link: `/issues/${i.id}` });
      }
    }
    for (const w of workers) {
      if (w.작업종류 === '정기청소' && w.예정일) {
        events.push({ date: w.예정일.slice(0, 10), type: 'clean', color: CLEAN_COLOR, title: `청소 — ${w.지점명 || ''}`, sub: `${w.담당자명 || ''}`, link: undefined });
      }
    }
    return events;
  }, [tenants, issues, workers]);

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of calEvents) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [calEvents]);

  // Calendar grid
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

  const calPrev = useCallback(() => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  }, [calMonth]);
  const calNext = useCallback(() => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  }, [calMonth]);

  const selectedEvents = useMemo(() => eventsByDate.get(selectedDate) || [], [eventsByDate, selectedDate]);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 상단 */}
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>안녕하세요</h1>
        <p style={{ fontSize: 13, color: GRAY, marginTop: 4 }}>{todayStr()}</p>
      </div>

      {/* KPI 그리드 */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div onClick={() => router.push('/tenants')} style={{ cursor: 'pointer' }}>
          {loadingT
            ? <KpiCard label="전체 입주율" value="—" suffix="%" color="#00B493" />
            : <KpiCard label="전체 입주율" value={occupancy} suffix="%" color="#00B493" />
          }
        </div>
        <div onClick={() => router.push('/issues')} style={{ cursor: 'pointer' }}>
          {loadingI
            ? <KpiCard label="미처리 이슈" value="—" suffix="건" color={RED} />
            : <KpiCard label="미처리 이슈" value={pendingIssues} suffix="건" color={RED} />
          }
        </div>
        <div onClick={() => router.push('/vacancy')} style={{ cursor: 'pointer' }}>
          {loadingT
            ? <KpiCard label="이번주 퇴실" value="—" suffix="건" color="#D97706" />
            : <KpiCard label="이번주 퇴실" value={weeklyCheckouts} suffix="건" color="#D97706" />
          }
        </div>
        <div onClick={() => router.push('/payments')} style={{ cursor: 'pointer' }}>
          {loadingP
            ? <KpiCard label="이번달 미납" value="—" suffix="만원" color={RED} />
            : <KpiCard label="이번달 미납" value={unpaidAmount > 0 ? Math.round(unpaidAmount / 10000) : 0} suffix="만원" color={RED} />
          }
        </div>
      </div>

      {/* 오늘 할 일 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>오늘 할 일</h2>
            <button onClick={() => router.push('/issues')} style={{ fontSize: 12, color: GRAY, background: 'none', border: 'none', cursor: 'pointer' }}>전체보기</button>
          </div>
          {loadingI ? (
            <p style={{ fontSize: 13, color: GRAY, textAlign: 'center', padding: '16px 0' }}>불러오는 중...</p>
          ) : todoIssues.length === 0 ? (
            <p style={{ fontSize: 13, color: GRAY, textAlign: 'center', padding: '16px 0' }}>미처리 이슈가 없어요</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {todoIssues.map((issue, i) => {
                const isUrgent = elapsed(issue.createdAt) >= 3;
                return (
                  <div key={issue.id}>
                    <button
                      onClick={() => router.push(`/issues/${issue.id}`)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isUrgent ? RED : '#D97706', flexShrink: 0 }} />
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

      {/* 이번주 일정 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919', marginBottom: 12 }}>이번주 일정</h2>
          {loadingT ? (
            <p style={{ fontSize: 13, color: GRAY, textAlign: 'center', padding: '16px 0' }}>불러오는 중...</p>
          ) : weekSchedule.length === 0 ? (
            <p style={{ fontSize: 13, color: GRAY, textAlign: 'center', padding: '16px 0' }}>이번주 일정이 없어요</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weekSchedule.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ flexShrink: 0, textAlign: 'right', fontSize: 12, color: GRAY, width: 36, paddingTop: 2 }}>{item.dateLabel}</span>
                  <div style={{ flexShrink: 0, width: 3, borderRadius: 2, background: item.color, minHeight: 36 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#191919', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    <span style={{ fontSize: 12, color: GRAY }}>{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 캘린더 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
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
              const dotTypes = [...new Set(dayEvents.map(e => e.type))];
              const dots = dotTypes.slice(0, 3);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  style={{
                    background: isToday ? BLUE : isSelected ? '#EFF6FF' : 'none',
                    border: isSelected ? `1.5px solid ${BLUE}` : '1.5px solid transparent',
                    borderRadius: isToday ? '50%' : 10,
                    width: '100%', minHeight: 48,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 3, cursor: 'pointer', fontFamily: 'inherit', padding: 2,
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isPast ? '#ccc' : '#111',
                  }}>{day}</span>
                  {dots.length > 0 && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {dots.map(type => (
                        <div key={type} style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: type === 'checkout' ? CHECKOUT_COLOR : type === 'checkin' ? CHECKIN_COLOR : type === 'repair' ? REPAIR_COLOR : CLEAN_COLOR,
                        }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12, marginBottom: 12 }}>
            {[
              { label: '퇴실', color: CHECKOUT_COLOR },
              { label: '입주', color: CHECKIN_COLOR },
              { label: '수리', color: REPAIR_COLOR },
              { label: '청소', color: CLEAN_COLOR },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 11, color: GRAY }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* 선택된 날 이벤트 리스트 */}
          <div style={{ borderTop: '1px solid #f2f4f6', paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>
              {selectedDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => `${Number(m)}월 ${Number(d)}일`)} 일정
            </div>
            {selectedEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>일정이 없어요</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEvents.map((ev, i) => (
                  <button
                    key={i}
                    onClick={() => ev.link && router.push(ev.link)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      background: 'none', border: 'none', cursor: ev.link ? 'pointer' : 'default',
                      fontFamily: 'inherit', textAlign: 'left', width: '100%',
                      borderTop: i > 0 ? '1px solid #f8f8f8' : 'none',
                    }}
                  >
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
        </div>
      </div>
    </div>
  );
}
