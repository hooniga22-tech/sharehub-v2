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

// ── 페이지 ──────────────────────────────────────────────
export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'main' | 'full'>('main');
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});
  const [expandedUpcoming, setExpandedUpcoming] = useState(false);
  const [expandedDone, setExpandedDone] = useState(false);

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

  // ── 파생 데이터 ──────────────────────────────────────
  const todayAll = schedules.filter(s => s.date === todayStr);
  const todayPending = todayAll.filter(s => !s.isDone);
  const nextUpcoming = schedules
    .filter(s => !s.isDone && s.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const monthRemaining = schedules.filter(s => !s.isDone && s.date >= todayStr).length;

  // Full view data
  const upcomingAll = schedules
    .filter(s => s.date > todayStr && !s.isDone)
    .sort((a, b) => a.date.localeCompare(b.date));
  const doneAll = schedules.filter(s => s.isDone).sort((a, b) => b.date.localeCompare(a.date));
  const monthTotalAmount = schedules.reduce((sum, s) => sum + s.amount, 0);

  // ══════════════════════════════════════════════════════
  // FULL VIEW
  // ══════════════════════════════════════════════════════
  if (view === 'full') {
    const upcomingShown = expandedUpcoming ? upcomingAll : upcomingAll.slice(0, 4);
    const upcomingHidden = upcomingAll.length - upcomingShown.length;
    const doneShown = expandedDone ? doneAll : doneAll.slice(0, 2);
    const doneHidden = doneAll.length - doneShown.length;
    const todayForFull = todayAll.filter(s => !s.isDone);

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

          {/* 예정 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, marginBottom: 10 }}>
              예정 <span style={{ fontWeight: 400, color: TEXT_SUB }}>{upcomingAll.length}건</span>
            </div>
            {upcomingAll.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 18, padding: '28px 20px', textAlign: 'center', color: TEXT_SUB, fontSize: 17 }}>
                예정된 일정이 없어요
              </div>
            ) : (
              <div style={{ background: CARD, borderRadius: 18, overflow: 'hidden' }}>
                {upcomingShown.map((s, i) => (
                  <div key={s.id} style={{
                    padding: '20px', borderBottom: i < upcomingShown.length - 1 || upcomingHidden > 0 ? `1px solid ${LINE_LIGHT}` : 'none',
                  }}>
                    <div style={{ fontSize: 16, color: TEXT_SUB, marginBottom: 4 }}>{fmtDay(s.date)}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, marginBottom: 4 }}>{s.houseName}</div>
                    <div style={{ fontSize: 17, color: TEXT_SUB }}>{comma(s.amount)}원</div>
                  </div>
                ))}
                {upcomingHidden > 0 && (
                  <button onClick={() => setExpandedUpcoming(true)}
                    style={{ width: '100%', padding: '20px', background: 'none', border: 'none',
                      fontSize: 17, fontWeight: 500, color: BLUE, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                    남은 {upcomingHidden}건 더 보기<Chevron />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 완료 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_SUB, marginBottom: 10 }}>
              완료 <span style={{ fontWeight: 400 }}>{doneAll.length}건</span>
            </div>
            {doneAll.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 18, padding: '28px 20px', textAlign: 'center', color: TEXT_SUB, fontSize: 17, opacity: 0.6 }}>
                완료한 일정이 없어요
              </div>
            ) : (
              <div style={{ background: CARD, borderRadius: 18, overflow: 'hidden' }}>
                {doneShown.map((s, i) => (
                  <div key={s.id} style={{
                    padding: '20px', opacity: 0.6,
                    borderBottom: i < doneShown.length - 1 || doneHidden > 0 ? `1px solid ${LINE_LIGHT}` : 'none',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: GREEN, marginBottom: 4 }}>{fmtDay(s.date)} · 끝냄</div>
                    <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_MAIN, marginBottom: 4 }}>{s.houseName}</div>
                    <div style={{ fontSize: 16, color: TEXT_SUB }}>{comma(s.amount)}원</div>
                  </div>
                ))}
                {doneHidden > 0 && (
                  <button onClick={() => setExpandedDone(true)}
                    style={{ width: '100%', padding: '20px', background: 'none', border: 'none',
                      fontSize: 17, fontWeight: 500, color: BLUE, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                    지난 {doneHidden}건 더 보기<Chevron />
                  </button>
                )}
              </div>
            )}
          </div>

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
          todayAll[0].isDone
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
            {todayAll.map(s => s.isDone ? renderDoneCard(s, 'small') : renderPendingCard(s, 'small'))}
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
