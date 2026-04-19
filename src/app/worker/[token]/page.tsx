'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

// ── 타입 ───────────────────────────────────────────────
type Worker = { name: string; type: string; token: string };
type Schedule = {
  id: string; date: string; houseName: string; type: string;
  amount: number; isDone: boolean; memo: string; request: string;
  address: string; doorCode: string; houseMemo: string;
};

// ── 색상 ───────────────────────────────────────────────
const BG = '#F2F4F6';
const CARD = '#FFFFFF';
const TEXT_MAIN = '#191F28';
const TEXT_SUB = '#4E5968';
const BLUE = '#3182F6';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// ── 유틸 ───────────────────────────────────────────────
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDay(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dd = new Date(y, m - 1, d);
  return `${m}월 ${d}일 ${WEEKDAYS[dd.getDay()]}요일`;
}

const shortHouse = (name: string): string => {
  if (!name) return '';
  const stripped = name.replace(/하우스$/, '');
  if (stripped.length <= 2) return stripped;
  return stripped.slice(0, 2);
};

const formatAmount = (amount: number): string => {
  if (!amount || amount === 0) return '';
  const man = Math.floor(amount / 10000);
  return `${man}만`;
};

// ── SVG 아이콘 ──────────────────────────────────────────
const CalArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 18L9 12L15 6" stroke={TEXT_SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CalArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M9 6L15 12L9 18" stroke={TEXT_SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── 페이지 ──────────────────────────────────────────────
export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [monthSchedules, setMonthSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);

  const now = useMemo(() => new Date(), []);
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const todayStr = ymd(now);

  const [viewYear, setViewYear] = useState<number>(nowYear);
  const [viewMonth, setViewMonth] = useState<number>(nowMonth);
  const isCurrentMonth = viewYear === nowYear && viewMonth === nowMonth;
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // ── 선택된 월 fetch (worker 정보도 같이 set) ──────────
  useEffect(() => {
    setMonthLoading(true);
    if (loading) {
      // 첫 fetch 전에는 페이지 로딩 표시
    }
    fetch(`/api/workers/by-token/${token}?year=${viewYear}&month=${viewMonth}`, { cache: 'no-store' })
      .then(async r => {
        if (r.status === 404) { setNotFound(true); setWorker(null); setMonthSchedules([]); return; }
        const data = await r.json();
        if (data.error) { setNotFound(true); setWorker(null); setMonthSchedules([]); return; }
        setNotFound(false);
        if (data.worker) setWorker(data.worker);
        setMonthSchedules(Array.isArray(data.schedules) ? data.schedules : []);
      })
      .catch(() => { setMonthSchedules([]); })
      .finally(() => { setMonthLoading(false); setLoading(false); });
  }, [token, viewYear, viewMonth]);

  // ── 월 이동 핸들러 ───────────────────────────────────
  const handlePrevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  // ── 404 / 로딩 ───────────────────────────────────────
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 17 }}>존재하지 않는 페이지입니다</p>
      </div>
    );
  }
  if (!worker || loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: TEXT_SUB, fontSize: 17 }}>불러오는 중...</p>
      </div>
    );
  }

  // ── 파생 데이터 ──────────────────────────────────────
  // 합계: 선택된 월 데이터 전체
  const monthTotalAmount = monthSchedules.reduce((sum, s) => sum + s.amount, 0);

  // 캘린더 cells (선택된 월 기준)
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // 날짜별 일정 맵 (선택된 월)
  const schedulesByDate = new Map<string, Schedule[]>();
  for (const s of monthSchedules) {
    if (!schedulesByDate.has(s.date)) schedulesByDate.set(s.date, []);
    schedulesByDate.get(s.date)!.push(s);
  }

  const WEEKDAY_LABELS = [
    { label: '일', color: TEXT_SUB },
    { label: '월', color: TEXT_SUB },
    { label: '화', color: TEXT_SUB },
    { label: '수', color: TEXT_SUB },
    { label: '목', color: TEXT_SUB },
    { label: '금', color: '#E24B4A' },
    { label: '토', color: TEXT_SUB },
  ];

  // 인라인 카드 — 선택된 날짜의 첫 작업
  const selectedSchedule = (schedulesByDate.get(selectedDate) || [])[0] || null;
  const selectedIsToday = selectedDate === todayStr;

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: 430, margin: '0 auto', background: BG, padding: '20px 16px 40px' }}>
        {/* 1. 헤더 */}
        <div style={{ padding: '0 2px 14px' }}>
          <div style={{ fontSize: 14, color: TEXT_SUB, marginBottom: 4 }}>안녕하세요</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.3px' }}>
            {worker.name}님
          </div>
        </div>

        {/* 2. 월 캘린더 (선택된 월 데이터) */}
        <div style={{ background: CARD, padding: '14px 10px', borderRadius: 14, marginBottom: 14 }}>
          {/* 월 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
            <button onClick={handlePrevMonth}
              style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              <CalArrowLeft />
            </button>
            <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_MAIN }}>
              {viewYear}년 {viewMonth}월
            </div>
            <button onClick={handleNextMonth}
              style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              <CalArrowRight />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '4px 0 6px' }}>
            {WEEKDAY_LABELS.map(w => (
              <div key={w.label} style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, color: w.color }}>
                {w.label}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3,
            opacity: monthLoading ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}>
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e${i}`} style={{ height: 62 }} />;
              }
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySchedules = schedulesByDate.get(dateStr) || [];
              const isToday = isCurrentMonth && dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasSchedule = daySchedules.length > 0;

              let bg = '#FAFBFC';
              let dateColor = '#C0C6CD';
              let houseColor = '#C0C6CD';
              let amountColor = '#C0C6CD';
              let dateWeight: 400 | 500 = 400;

              if (hasSchedule) {
                bg = '#E6F0FE';
                dateColor = '#1B64DA';
                houseColor = '#1B64DA';
                amountColor = '#1B64DA';
                dateWeight = 500;
              }

              let border: string = 'none';
              let padding: string = '5px 2px';
              if (isSelected) {
                bg = BLUE;
                dateColor = '#FFFFFF';
                houseColor = '#FFFFFF';
                amountColor = '#FFFFFF';
                dateWeight = 500;
                border = `2px solid ${BLUE}`;
                padding = '3px 2px';
              } else if (isToday) {
                border = `1.5px solid ${BLUE}`;
                padding = '3.5px 2px';
              }

              const topSchedule = daySchedules[0];
              const topHouse = topSchedule ? shortHouse(topSchedule.houseName) : '';
              const topAmount = topSchedule ? formatAmount(topSchedule.amount) : '';

              return (
                <button key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    height: 62, background: bg, borderRadius: 7, padding, border,
                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-start',
                    cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'center',
                  }}>
                  <span style={{ fontSize: 10, fontWeight: dateWeight, color: dateColor, lineHeight: 1.2 }}>{day}</span>
                  {topHouse && (
                    <span style={{
                      fontSize: 12, fontWeight: 500, color: houseColor, marginTop: 2, lineHeight: 1,
                      letterSpacing: '-0.2px',
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {topHouse}
                    </span>
                  )}
                  {topAmount && (
                    <span style={{
                      fontSize: 9, marginTop: 1, lineHeight: 1,
                      color: amountColor,
                      opacity: isToday ? 0.85 : 0.75,
                    }}>
                      {topAmount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 인라인 작업 상세 카드 */}
        <div style={{ marginBottom: 14 }}>
          {selectedSchedule ? (
            <div style={{
              background: CARD, borderRadius: 12, padding: 16,
              border: `2px solid ${BLUE}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>
                {fmtDay(selectedSchedule.date)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT_MAIN, letterSpacing: '-0.3px', marginTop: 4 }}>
                {selectedSchedule.houseName}
              </div>
              <div style={{ fontSize: 13, color: '#8B95A1', marginTop: 2 }}>
                {selectedSchedule.type} · {selectedSchedule.amount.toLocaleString()}원
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#8B95A1' }}>주소</div>
                  <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.4, color: TEXT_MAIN }}>
                    {selectedSchedule.address || '등록된 정보가 없어요'}
                  </div>
                </div>

                <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#8B95A1' }}>현관 비밀번호</div>
                  <div style={{ fontSize: 15, fontWeight: 500, marginTop: 3, letterSpacing: '1px', color: TEXT_MAIN }}>
                    {selectedSchedule.doorCode || '등록된 정보가 없어요'}
                  </div>
                </div>

                {selectedSchedule.request && (
                  <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#8B95A1' }}>요청사항</div>
                    <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.45, color: TEXT_MAIN, whiteSpace: 'pre-wrap' }}>
                      {selectedSchedule.request}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#F2F4F6', borderRadius: 12, padding: '24px 16px',
              textAlign: 'center', fontSize: 14, color: '#8B95A1',
            }}>
              {selectedIsToday ? '오늘은 일정이 없어요' : '이 날은 일정이 없어요'}
            </div>
          )}
        </div>

        {/* 4. 합계 카드 (선택된 월 데이터) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '18px 20px',
          opacity: monthLoading ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}>
          <div style={{ fontSize: '12px', color: '#8B95A1', fontWeight: 500 }}>
            {isCurrentMonth ? '이번 달 예상 수익' : `${viewYear}년 ${viewMonth}월 예상 수익`}
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 500,
            marginTop: '4px',
            letterSpacing: '-0.5px',
          }}>
            {monthTotalAmount.toLocaleString()}
            <span style={{
              fontSize: '15px',
              color: '#4E5968',
              fontWeight: 400,
              marginLeft: '3px',
            }}>원</span>
          </div>
        </div>
      </div>

    </div>
  );
}
