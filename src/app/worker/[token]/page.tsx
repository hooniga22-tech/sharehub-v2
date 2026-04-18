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
const LINE_THIN = '#E5E8EB';

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
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [monthSchedules, setMonthSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const todayStr = ymd(now);

  const [viewYear, setViewYear] = useState<number>(nowYear);
  const [viewMonth, setViewMonth] = useState<number>(nowMonth);
  const isCurrentMonth = viewYear === nowYear && viewMonth === nowMonth;

  // ── 오늘 월 fetch (1회) ──────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`/api/workers/by-token/${token}?year=${nowYear}&month=${nowMonth}`, { cache: 'no-store' })
      .then(async r => {
        if (r.status === 404) { setNotFound(true); setWorker(null); setTodaySchedules([]); return; }
        const data = await r.json();
        if (data.error) { setNotFound(true); setWorker(null); setTodaySchedules([]); return; }
        setNotFound(false);
        setWorker(data.worker || null);
        setTodaySchedules(Array.isArray(data.schedules) ? data.schedules : []);
      })
      .catch(() => { /* 유지 */ })
      .finally(() => setLoading(false));
  }, [token, nowYear, nowMonth]);

  // ── 선택된 월 fetch ──────────────────────────────────
  useEffect(() => {
    setMonthLoading(true);
    fetch(`/api/workers/by-token/${token}?year=${viewYear}&month=${viewMonth}`, { cache: 'no-store' })
      .then(async r => {
        if (r.status === 404) { setMonthSchedules([]); return; }
        const data = await r.json();
        if (data.error) { setMonthSchedules([]); return; }
        setMonthSchedules(Array.isArray(data.schedules) ? data.schedules : []);
      })
      .catch(() => { setMonthSchedules([]); })
      .finally(() => setMonthLoading(false));
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
  // 오늘 카드: 항상 오늘 월 데이터에서 오늘 날짜 건만
  const todayAll = todaySchedules.filter(s => s.date === todayStr);
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

  // 바텀시트 대상 (캘린더 = 선택된 월에서 조회)
  const sheetSchedule = sheetId ? monthSchedules.find(s => s.id === sheetId) || null : null;

  // ── 오늘 카드 렌더 ────────────────────────────────────
  const renderTodayContent = () => {
    if (todayAll.length === 0) {
      return (
        <div style={{ background: CARD, borderRadius: 18, padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.3px' }}>
            오늘은 일정이 없어요
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {todayAll.map(s => (
          <div key={s.id} style={{
            background: 'linear-gradient(135deg, #3182F6 0%, #2772E3 100%)',
            borderRadius: 16, padding: 18, color: '#FFFFFF',
          }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              오늘 · {fmtDay(s.date)}
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.4px', marginTop: 6 }}>
              {s.houseName}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3 }}>
              {s.type} · {s.amount.toLocaleString()}원
            </div>
          </div>
        ))}
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

        {/* 2. 오늘 카드 (항상 고정 — 오늘 월 데이터) */}
        <div style={{ marginBottom: 14 }}>
          {renderTodayContent()}
        </div>

        {/* 3. 월 캘린더 (선택된 월 데이터) */}
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

              const border = isToday ? `2px solid ${BLUE}` : 'none';
              const padding = isToday ? '3px 2px' : '5px 2px';
              if (isToday) {
                bg = BLUE;
                dateColor = '#FFFFFF';
                houseColor = '#FFFFFF';
                amountColor = '#FFFFFF';
                dateWeight = 500;
              }

              const topSchedule = daySchedules[0];
              const topHouse = topSchedule ? shortHouse(topSchedule.houseName) : '';
              const topAmount = topSchedule ? formatAmount(topSchedule.amount) : '';

              return (
                <button key={dateStr}
                  onClick={() => hasSchedule && topSchedule && setSheetId(topSchedule.id)}
                  disabled={!hasSchedule}
                  style={{
                    height: 62, background: bg, borderRadius: 7, padding, border,
                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-start',
                    cursor: hasSchedule ? 'pointer' : 'default',
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

            <div style={{ fontSize: 12, fontWeight: 500, color: BLUE }}>
              {fmtDay(sheetSchedule.date)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: TEXT_MAIN, letterSpacing: '-0.3px', marginTop: 6 }}>
              {sheetSchedule.houseName}
            </div>
            <div style={{ fontSize: 13, color: TEXT_SUB, marginTop: 2 }}>
              {sheetSchedule.type} · {sheetSchedule.amount.toLocaleString()}원
            </div>

            {/* 박스 3개 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {/* 박스 1 - 주소 */}
              <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: '#8B95A1' }}>주소</div>
                <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.4, color: TEXT_MAIN }}>
                  {sheetSchedule.address || '등록된 정보가 없어요'}
                </div>
              </div>

              {/* 박스 2 - 현관 비밀번호 */}
              <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: '#8B95A1' }}>현관 비밀번호</div>
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 3, letterSpacing: '1px', color: TEXT_MAIN }}>
                  {sheetSchedule.doorCode || '등록된 정보가 없어요'}
                </div>
              </div>

              {/* 박스 3 - 요청사항 (작업별, 값 없으면 생략) */}
              {sheetSchedule.request && (
                <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#8B95A1' }}>요청사항</div>
                  <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.45, color: TEXT_MAIN, whiteSpace: 'pre-wrap' }}>
                    {sheetSchedule.request}
                  </div>
                </div>
              )}

              {/* 박스 4 - 운영자 요청사항 (지점별, 값 없으면 생략) */}
              {sheetSchedule.houseMemo && (
                <div style={{ background: '#E6F0FE', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#1B64DA' }}>운영자 요청사항</div>
                  <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.45, color: '#0B4BA3' }}>
                    {sheetSchedule.houseMemo}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
