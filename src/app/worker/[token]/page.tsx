'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── 타입 ───────────────────────────────────────────────
type Worker = { name: string; type: string; token: string };
type Schedule = {
  id: string; date: string; houseName: string; type: string;
  amount: number; isDone: boolean; memo: string;
  address: string; doorCode: string; houseMemo: string;
};

// ── 색상 ───────────────────────────────────────────────
const BG = '#F2F4F6';
const CARD = '#FFFFFF';
const TEXT_MAIN = '#191F28';
const TEXT_SUB = '#4E5968';
const BLUE = '#3182F6';
const GREEN = '#00B493';
const GRAY_DISABLED = '#C0C6CD';
const LINE_THIN = '#E5E8EB';
const LINE_LIGHT = '#F2F4F6';
const WARN_BG = '#FFF7E6';
const WARN_FG = '#8A5A00';

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
const comma = (n: number) => n.toLocaleString();

const shortHouse = (name: string): string => {
  if (!name) return '';
  const stripped = name.replace(/하우스$/, '');
  if (stripped.length <= 2) return stripped;
  return stripped.slice(0, 2);
};

// ── SVG 아이콘 ──────────────────────────────────────────
const CheckBig = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
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
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" stroke={TEXT_SUB} strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke={TEXT_SUB} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── 페이지 ──────────────────────────────────────────────
export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});
  const [sheetId, setSheetId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth() + 1;
  const todayStr = ymd(now);

  // ── 데이터 로드 ──────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/workers/by-token/${token}?year=${viewYear}&month=${viewMonth}`, { cache: 'no-store' })
      .then(async r => {
        if (r.status === 404) { setNotFound(true); setWorker(null); setSchedules([]); return; }
        const data = await r.json();
        if (data.error) { setNotFound(true); setWorker(null); setSchedules([]); return; }
        setNotFound(false);
        setWorker(data.worker || null);
        setSchedules(Array.isArray(data.schedules) ? data.schedules : []);
      })
      .catch(() => { /* network error: leave state as-is */ })
      .finally(() => setLoading(false));
  }, [token, viewYear, viewMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── 30초 카운트다운 ──────────────────────────────────
  useEffect(() => {
    if (Object.keys(undoTimers).length === 0) return;
    const iv = setInterval(() => {
      setUndoTimers(prev => {
        const next: Record<string, number> = {};
        for (const [id, sec] of Object.entries(prev)) {
          if (sec > 1) next[id] = sec - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [undoTimers]);

  // ── 액션 ─────────────────────────────────────────────
  const handleDone = async (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isDone: true } : s));
    setUndoTimers(prev => ({ ...prev, [id]: 30 }));
    try {
      await fetch(`/api/workers/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: true }),
      });
    } catch { /* ignore */ }
  };

  const handleUndone = async (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isDone: false } : s));
    setUndoTimers(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      await fetch(`/api/workers/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: false }),
      });
    } catch { /* ignore */ }
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
  const isActuallyDone = (s: Schedule) => s.isDone === true && s.date <= todayStr;

  const todayAll = schedules.filter(s => s.date === todayStr);
  const todaySchedule = todayAll[0] || null; // 오늘은 보통 1~2건, 일단 첫 건 기준
  const monthTotalAmount = schedules.reduce((sum, s) => sum + s.amount, 0);

  // 캘린더 cells
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // 날짜별 일정 맵
  const schedulesByDate = new Map<string, Schedule[]>();
  for (const s of schedules) {
    if (!schedulesByDate.has(s.date)) schedulesByDate.set(s.date, []);
    schedulesByDate.get(s.date)!.push(s);
  }

  const monthDoneCount = schedules.filter(s => isActuallyDone(s)).length;
  const monthPendingCount = schedules.length - monthDoneCount;

  const WEEKDAY_LABELS = [
    { label: '일', color: TEXT_SUB },
    { label: '월', color: TEXT_SUB },
    { label: '화', color: TEXT_SUB },
    { label: '수', color: TEXT_SUB },
    { label: '목', color: TEXT_SUB },
    { label: '금', color: '#E24B4A' },
    { label: '토', color: TEXT_SUB },
  ];

  // 바텀시트 대상
  const sheetSchedule = sheetId ? schedules.find(s => s.id === sheetId) || null : null;

  // ── 오늘 카드 렌더 ────────────────────────────────────
  const renderTodayContent = () => {
    if (!todaySchedule) {
      return (
        <div style={{ background: CARD, borderRadius: 18, padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.3px' }}>
            오늘은 일정이 없어요
          </div>
        </div>
      );
    }

    const s = todaySchedule;
    const done = isActuallyDone(s);
    const remaining = undoTimers[s.id];

    if (done) {
      return (
        <div style={{ background: CARD, borderRadius: 18, padding: '28px 20px', textAlign: 'center' }}>
          <div style={{
            width: 84, height: 84, borderRadius: '50%', background: GREEN,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CheckBig />
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, marginBottom: 6 }}>수고하셨어요!</div>
          <div style={{ fontSize: 14, color: TEXT_SUB, marginBottom: 18 }}>
            {s.houseName} {worker.type || '청소'} 완료
          </div>
          <div style={{
            background: LINE_LIGHT, borderRadius: 10, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: TEXT_SUB }}>정산 예정</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: TEXT_MAIN }}>{comma(s.amount)}원</span>
          </div>
          {remaining !== undefined && remaining > 0 ? (
            <>
              <div style={{
                background: WARN_BG, borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: WARN_FG, marginTop: 14, lineHeight: 1.4,
              }}>
                실수로 눌렀나요? {remaining}초 안에 되돌릴 수 있어요
              </div>
              <button onClick={() => handleUndone(s.id)}
                style={{
                  width: '100%', marginTop: 8, padding: '14px 0',
                  background: CARD, border: `1px solid ${GRAY_DISABLED}`, borderRadius: 10,
                  fontSize: 15, fontWeight: 500, color: TEXT_MAIN,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                되돌리기
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: TEXT_SUB, marginTop: 14 }}>
              끝냈어요. 매니저에게 보고되었습니다
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ background: CARD, borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: BLUE, marginBottom: 6 }}>
          오늘 · {fmtDay(s.date)}
        </div>
        <div style={{ fontSize: 24, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.4px', marginBottom: 4 }}>
          {s.houseName}
        </div>
        <div style={{ fontSize: 13, color: TEXT_SUB, marginBottom: 16 }}>
          {s.type} · {comma(s.amount)}원
        </div>
        <button onClick={() => handleDone(s.id)}
          style={{
            width: '100%', padding: '16px 0', border: 'none', borderRadius: 12,
            background: BLUE, color: '#fff', fontSize: 16, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          {worker.type === '수리' ? '수리 끝났어요' : '청소 끝났어요'}
        </button>
      </div>
    );
  };

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

        {/* 2. 오늘 카드 */}
        <div style={{ marginBottom: 14 }}>
          {renderTodayContent()}
        </div>

        {/* 3. 월 캘린더 */}
        <div style={{ background: CARD, padding: '14px 10px', borderRadius: 14, marginBottom: 14 }}>
          {/* 월 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
            <button onClick={() => { /* TODO: 다음 작업 */ }}
              style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              <CalArrowLeft />
            </button>
            <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_MAIN }}>
              {viewYear}년 {viewMonth}월
            </div>
            <button onClick={() => { /* TODO: 다음 작업 */ }}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e${i}`} style={{ height: 54 }} />;
              }
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySchedules = schedulesByDate.get(dateStr) || [];
              const isToday = dateStr === todayStr;

              const hasPending = daySchedules.some(s => !isActuallyDone(s));
              const hasDone = daySchedules.some(s => isActuallyDone(s));

              let bg = '#FAFBFC';
              let dateColor = '#C0C6CD';
              let houseColor = '#C0C6CD';
              let dateWeight: 400 | 500 = 400;

              if (hasPending) {
                bg = '#E6F0FE';
                dateColor = '#1B64DA';
                houseColor = '#1B64DA';
                dateWeight = 500;
              } else if (hasDone) {
                bg = '#E1F5EE';
                dateColor = '#0F6E56';
                houseColor = '#0F6E56';
                dateWeight = 500;
              }

              const border = isToday ? `2px solid ${BLUE}` : 'none';
              const padding = isToday ? '3px 2px' : '5px 2px';
              if (isToday) {
                if (hasDone && !hasPending) {
                  bg = '#E6F0FE';
                }
                dateColor = '#1B64DA';
                houseColor = '#1B64DA';
                dateWeight = 500;
              }

              const sorted = [...daySchedules].sort((a, b) => {
                const ad = isActuallyDone(a) ? 1 : 0;
                const bd = isActuallyDone(b) ? 1 : 0;
                return ad - bd;
              });
              const topHouse = sorted[0] ? shortHouse(sorted[0].houseName) : '';
              const clickable = daySchedules.length > 0;

              return (
                <button key={dateStr}
                  onClick={() => clickable && sorted[0] && setSheetId(sorted[0].id)}
                  disabled={!clickable}
                  style={{
                    height: 54, background: bg, borderRadius: 7, padding, border,
                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-start',
                    cursor: clickable ? 'pointer' : 'default',
                    fontFamily: 'inherit', textAlign: 'center',
                  }}>
                  <span style={{ fontSize: 11, fontWeight: dateWeight, color: dateColor, lineHeight: 1.2 }}>{day}</span>
                  {topHouse && (
                    <span style={{
                      fontSize: 10, fontWeight: 500, color: houseColor, marginTop: 4, lineHeight: 1,
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {topHouse}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div style={{ display: 'flex', gap: 12, padding: '10px 4px 0', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: '#E1F5EE', borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: TEXT_SUB }}>완료 {monthDoneCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: '#E6F0FE', borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: TEXT_SUB }}>예정 {monthPendingCount}</span>
            </div>
          </div>
        </div>

        {/* 4. 합계 카드 */}
        <div style={{
          background: CARD, borderRadius: 14, padding: '18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 15, color: TEXT_SUB }}>이번 달 받을 돈</span>
          <span style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN }}>{comma(monthTotalAmount)}원</span>
        </div>
      </div>

      {/* 5. 바텀시트 */}
      {sheetSchedule && (
        <>
          <div
            onClick={() => setSheetId(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.4)',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430, zIndex: 50,
            background: CARD,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: '18px 18px 22px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.08)',
          }}>
            {/* 드래그 핸들 */}
            <div style={{
              width: 36, height: 4, background: LINE_THIN,
              borderRadius: 2, margin: '0 auto 14px',
            }} />

            {/* 닫기 버튼 */}
            <button onClick={() => setSheetId(null)}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', border: 'none', padding: 6,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
              }}>
              <CloseIcon />
            </button>

            <div style={{ fontSize: 12, fontWeight: 500, color: BLUE, marginBottom: 6 }}>
              {fmtDay(sheetSchedule.date)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.3px', marginBottom: 4 }}>
              {sheetSchedule.houseName}
            </div>
            <div style={{ fontSize: 13, color: TEXT_SUB, marginBottom: 14 }}>
              {sheetSchedule.type} · {comma(sheetSchedule.amount)}원
            </div>

            <div style={{ fontSize: 12, color: TEXT_SUB, marginBottom: 4 }}>
              주소: {sheetSchedule.address || '등록된 정보 없음'}
            </div>
            <div style={{ fontSize: 12, color: TEXT_SUB, marginBottom: 4 }}>
              비번: {sheetSchedule.doorCode || '—'}
            </div>
            <div style={{ fontSize: 12, color: TEXT_SUB }}>
              메모: {sheetSchedule.houseMemo || '—'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
