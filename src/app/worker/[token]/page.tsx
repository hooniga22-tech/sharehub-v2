'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── 타입 ───────────────────────────────────────────────
type Worker = { name: string; type: string; token: string };
type Schedule = {
  id: string; date: string; houseName: string; type: string;
  amount: number; isDone: boolean; memo: string;
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
const BackArrow = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 18L9 12L15 6" stroke={TEXT_MAIN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}>
    <path d="M9 6L15 12L9 18" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

// ── 페이지 ──────────────────────────────────────────────
export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'main' | 'full'>('main');
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});

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
    } catch { /* 시트 에러 무시 (로컬은 이미 반영) */ }
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

  // ── 완료 판정: 미래 날짜의 isDone=true는 예정으로 취급 ─
  const isActuallyDone = (s: Schedule) => s.isDone === true && s.date <= todayStr;

  // ── 파생 데이터 ──────────────────────────────────────
  const todayAll = schedules.filter(s => s.date === todayStr);
  const todayPending = todayAll.filter(s => !isActuallyDone(s));
  const nextUpcoming = schedules
    .filter(s => s.date > todayStr && !isActuallyDone(s))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const monthRemaining = schedules.filter(s => !isActuallyDone(s) && s.date >= todayStr).length;

  // Full view data
  const monthTotalAmount = schedules.reduce((sum, s) => sum + s.amount, 0);

  // ══════════════════════════════════════════════════════
  // FULL VIEW
  // ══════════════════════════════════════════════════════
  if (view === 'full') {
    const todayForFull = todayAll.filter(s => !isActuallyDone(s));

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

    // 이번달 완료/예정 건수
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

    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <div style={{ maxWidth: 430, margin: '0 auto', background: BG, padding: '20px 20px 40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <button onClick={() => setView('main')}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              <BackArrow />
            </button>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.4px' }}>이번 달 전체 일정</div>
              <div style={{ fontSize: 17, color: TEXT_SUB, marginTop: 2 }}>
                {worker.name}님 · {viewMonth}월 · {schedules.length}건
              </div>
            </div>
          </div>

          {/* 캘린더 */}
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

                // 상태 판별
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

                // 오늘 강조: 파란 테두리 + 파랑 계열로 통일
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

                // 표시할 일정 (예정 우선)
                const sorted = [...daySchedules].sort((a, b) => {
                  const ad = isActuallyDone(a) ? 1 : 0;
                  const bd = isActuallyDone(b) ? 1 : 0;
                  return ad - bd;
                });
                const topHouse = sorted[0] ? shortHouse(sorted[0].houseName) : '';

                return (
                  <div key={dateStr} style={{
                    height: 54, background: bg, borderRadius: 7, padding, border,
                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
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
                  </div>
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

          {/* 오늘 */}
          {todayForFull.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: BLUE, marginBottom: 10 }}>오늘</div>
              {todayForFull.map(s => (
                <div key={s.id} style={{
                  background: CARD, border: `2px solid ${BLUE}`, borderRadius: 18, padding: 24, marginBottom: 8,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 500, color: BLUE, marginBottom: 8 }}>{fmtDay(s.date)}</div>
                  <div style={{ fontSize: 30, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.6px', marginBottom: 4 }}>{s.houseName}</div>
                  <div style={{ fontSize: 19, color: TEXT_SUB }}>{s.type} · {comma(s.amount)}원</div>
                </div>
              ))}
            </div>
          )}

          {/* 합계 */}
          <div style={{ height: 1, background: LINE_THIN, margin: '24px 0' }} />
          <div style={{
            background: CARD, borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 17, color: TEXT_SUB }}>이번 달 받을 돈</span>
            <span style={{ fontSize: 24, fontWeight: 500, color: TEXT_MAIN }}>{comma(monthTotalAmount)}원</span>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // MAIN VIEW
  // ══════════════════════════════════════════════════════
  const renderPendingCard = (s: Schedule, size: 'big' | 'small') => {
    const isBig = size === 'big';
    return (
      <div key={s.id} style={{
        background: CARD, borderRadius: 18, padding: isBig ? '28px 24px' : '24px 20px',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: BLUE, marginBottom: 6 }}>오늘 해야 할 일</div>
        <div style={{ fontSize: 18, color: TEXT_SUB }}>{fmtDay(s.date)}</div>
        <div style={{ height: 1, background: LINE_LIGHT, margin: '24px 0' }} />
        <div style={{
          fontSize: isBig ? 36 : 32, fontWeight: 500, color: TEXT_MAIN,
          letterSpacing: isBig ? '-0.8px' : '-0.6px', marginBottom: 6,
        }}>{s.houseName}</div>
        <div style={{ fontSize: isBig ? 22 : 20, color: TEXT_SUB }}>{s.type}</div>
        <div style={{ height: 1, background: LINE_LIGHT, margin: '24px 0' }} />
        <div style={{ fontSize: 18, color: TEXT_SUB, marginBottom: 6 }}>받으실 금액</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
          <span style={{ fontSize: isBig ? 40 : 28, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.6px' }}>
            {comma(s.amount)}
          </span>
          <span style={{ fontSize: 22, color: TEXT_SUB }}>원</span>
        </div>
        <button onClick={() => handleDone(s.id)}
          style={{
            width: '100%', padding: '22px 0', border: 'none', borderRadius: 14,
            background: BLUE, color: '#fff', fontSize: 22, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          {worker.type === '수리' ? '수리 끝났어요' : '청소 끝났어요'}
        </button>
      </div>
    );
  };

  const renderDoneCard = (s: Schedule, size: 'big' | 'small') => {
    const isBig = size === 'big';
    const remaining = undoTimers[s.id];
    return (
      <div key={s.id} style={{
        background: CARD, borderRadius: 18, padding: isBig ? '32px 24px' : '24px 20px',
        marginBottom: 10, textAlign: 'center',
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: '50%', background: GREEN,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <CheckBig />
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, color: TEXT_MAIN, marginBottom: 8 }}>수고하셨어요!</div>
        <div style={{ fontSize: 20, color: TEXT_SUB, marginBottom: 20 }}>
          {s.houseName} {worker.type || '청소'} 완료
        </div>
        <div style={{
          background: LINE_LIGHT, borderRadius: 12, padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 17, color: TEXT_SUB }}>정산 예정</span>
          <span style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN }}>{comma(s.amount)}원</span>
        </div>

        {remaining !== undefined && remaining > 0 ? (
          <>
            <div style={{
              background: WARN_BG, borderRadius: 10, padding: '14px 16px',
              fontSize: 15, color: WARN_FG, marginTop: 18, lineHeight: 1.4,
            }}>
              실수로 눌렀나요? {remaining}초 안에 되돌릴 수 있어요
            </div>
            <button onClick={() => handleUndone(s.id)}
              style={{
                width: '100%', marginTop: 10, padding: '20px 0',
                background: CARD, border: `1px solid ${GRAY_DISABLED}`, borderRadius: 12,
                fontSize: 20, fontWeight: 500, color: TEXT_MAIN,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              되돌리기
            </button>
          </>
        ) : (
          <div style={{ fontSize: 17, color: TEXT_SUB, marginTop: 18 }}>
            끝냈어요. 매니저에게 보고되었습니다
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: 430, margin: '0 auto', background: BG, padding: '24px 20px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, color: TEXT_SUB, marginBottom: 6 }}>안녕하세요</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.5px' }}>
            {worker.name}님
          </div>
        </div>

        {/* Today Section */}
        {todayAll.length === 0 && (
          <div style={{
            background: CARD, borderRadius: 18, padding: '28px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.4px' }}>
              오늘은 일정이 없어요
            </div>
            {nextUpcoming && (
              <div style={{ fontSize: 18, color: TEXT_SUB, marginTop: 14 }}>
                다음 일정: {fmtDay(nextUpcoming.date)} · {nextUpcoming.houseName}
              </div>
            )}
          </div>
        )}

        {todayAll.length === 1 && (
          isActuallyDone(todayAll[0])
            ? renderDoneCard(todayAll[0], 'big')
            : renderPendingCard(todayAll[0], 'big')
        )}

        {todayAll.length >= 2 && todayPending.length === 0 && (
          <div style={{
            background: CARD, borderRadius: 18, padding: '36px 28px', textAlign: 'center',
          }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', background: GREEN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <CheckBig />
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, color: TEXT_MAIN, marginBottom: 6 }}>
              오늘 일정 모두 끝냈어요!
            </div>
            <div style={{ fontSize: 20, color: TEXT_SUB }}>수고하셨습니다</div>
          </div>
        )}

        {todayAll.length >= 2 && todayPending.length > 0 && (
          <>
            <div style={{
              background: BLUE, borderRadius: 14, padding: '14px 20px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>
                오늘 할 일 {todayPending.length}건 남았어요
              </div>
            </div>
            {todayAll.map(s => isActuallyDone(s) ? renderDoneCard(s, 'small') : renderPendingCard(s, 'small'))}
          </>
        )}

        {/* Footer */}
        <div style={{ height: 1, background: LINE_THIN, margin: '24px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, color: TEXT_SUB }}>이번 달 남은 일정</span>
          <span style={{ fontSize: 20, fontWeight: 500, color: TEXT_MAIN }}>{monthRemaining}건</span>
        </div>
        <button onClick={() => setView('full')}
          style={{
            width: '100%', marginTop: 16, background: CARD, border: `1px solid ${LINE_THIN}`,
            padding: '18px 0', borderRadius: 12, fontSize: 18, fontWeight: 500, color: TEXT_MAIN,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          이번 달 전체 보기
        </button>
      </div>
    </div>
  );
}
