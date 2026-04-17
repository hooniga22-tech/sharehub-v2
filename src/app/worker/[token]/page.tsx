'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';

const BLUE = '#3182F6', GREEN_D = '#16A34A', GREEN_BG = '#D1FAE5', GREEN_FG = '#065F46';
const AMBER_D = '#D97706', AMBER_BG = '#FFFBEB', AMBER_FG = '#92400E';
const fmt = (n: number) => n.toLocaleString() + '원';

type Worker = { name: string; type: string; token: string };
type Schedule = { id: string; date: string; houseName: string; type: string; amount: number; isDone: boolean; memo: string };

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

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
      .catch(() => { setSchedules([]); })
      .finally(() => setLoading(false));
  }, [token, viewYear, viewMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const doneCount = useMemo(() => schedules.filter(s => s.isDone && s.date <= todayStr).length, [schedules, todayStr]);
  const pendingCount = useMemo(() => schedules.filter(s => !s.isDone || s.date > todayStr).length, [schedules, todayStr]);
  const totalAmount = useMemo(() => schedules.reduce((s, w) => s + w.amount, 0), [schedules]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of schedules) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return map;
  }, [schedules]);

  const isActuallyDone = (s: Schedule) => s.isDone && s.date <= todayStr;
  const isActuallyPending = (s: Schedule) => !s.isDone || s.date > todayStr;
  const todaySchedules = useMemo(() => schedulesByDate.get(todayStr) || [], [schedulesByDate, todayStr]);
  const pendingSchedules = useMemo(() => schedules.filter(s => isActuallyPending(s) && s.date !== todayStr).sort((a, b) => a.date.localeCompare(b.date)), [schedules, todayStr]);
  const doneSchedules = useMemo(() => schedules.filter(s => isActuallyDone(s)).sort((a, b) => b.date.localeCompare(a.date)), [schedules, todayStr]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  const handleDone = async (id: string) => {
    if (!confirm('완료 처리할까요?')) return;
    await fetch(`/api/workers/schedule/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDone: true }) });
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isDone: true } : s));
    showToast('완료 처리됐어요!');
  };

  const handleUndone = async (id: string) => {
    if (!confirm('완료를 취소할까요?')) return;
    await fetch(`/api/workers/schedule/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDone: false }) });
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isDone: false } : s));
    showToast('되돌렸어요');
  };

  const handleEditAmount = async (s: Schedule) => {
    const input = prompt('새 금액을 입력하세요', String(s.amount));
    if (input === null) return;
    const newAmount = Number(input);
    if (isNaN(newAmount) || newAmount < 0) return;
    await fetch(`/api/workers/schedule/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: newAmount }) });
    setSchedules(prev => prev.map(x => x.id === s.id ? { ...x, amount: newAmount } : x));
    showToast('금액이 수정됐어요');
  };

  const fmtMD = (d: string) => {
    const p = d.split('-');
    return `${Number(p[1])}월 ${Number(p[2])}일`;
  };

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 15 }}>존재하지 않는 페이지입니다</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 15 }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '32px 20px 24px', borderBottom: '0.5px solid #f0f0f0' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: '#111', marginBottom: 4 }}>{worker.name}</div>
        <div style={{ fontSize: 15, color: '#888', marginBottom: 20 }}>{worker.type} 담당 · {viewYear}년 {viewMonth}월</div>
        {loading ? (
          <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 13 }}>불러오는 중...</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: GREEN_D }}>{doneCount}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>완료</div>
            </div>
            <div style={{ width: 1, height: 32, background: '#f0f0f0' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: AMBER_D }}>{pendingCount}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>예정</div>
            </div>
            <div style={{ width: 1, height: 32, background: '#f0f0f0' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{fmt(totalAmount)}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>이달 합계</div>
            </div>
          </div>
        )}
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '14px 0' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#888', padding: '4px 8px' }}>◀</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{viewYear}년 {viewMonth}월</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#888', padding: '4px 8px' }}>▶</button>
      </div>

      {/* Calendar */}
      {!loading && (
        <div style={{ padding: '0 12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ fontSize: 11, color: '#aaa', padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} style={{ minHeight: 42 }} />;
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySchedules = schedulesByDate.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const hasDone = daySchedules.some(s => s.isDone && dateStr <= todayStr);
              const hasPending = daySchedules.some(s => !s.isDone || dateStr > todayStr);

              let bg = 'transparent';
              let color = '#D1D5DB';
              let border = 'none';
              if (isToday) { bg = '#EFF6FF'; border = '2px solid #3182F6'; color = '#1D4ED8'; }
              else if (daySchedules.length > 0 && hasDone && !hasPending) { bg = '#DCFCE7'; color = '#15803D'; }
              else if (daySchedules.length > 0 && hasPending) { bg = '#FEF9C3'; color = '#854D0E'; }

              const houseLabel = daySchedules.length > 0
                ? daySchedules.length <= 2
                  ? daySchedules.map(s => s.houseName.replace(/하우스$/, '')).join('·')
                  : `${daySchedules[0].houseName.replace(/하우스$/, '')} +${daySchedules.length - 1}`
                : '';

              return (
                <div key={dateStr} style={{ minHeight: 42, background: bg, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border, padding: '2px 1px' }}>
                  <span style={{ fontSize: 12, fontWeight: daySchedules.length > 0 || isToday ? 700 : 400, color }}>{day}</span>
                  {houseLabel && <span style={{ fontSize: 9, color, marginTop: 1, lineHeight: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{houseLabel}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Cards */}
      {!loading && (
        <div style={{ background: '#f8f8f8', padding: '16px 16px 40px', minHeight: 200 }}>

          {/* Today Card */}
          {todaySchedules.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e8eb', padding: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: BLUE, fontWeight: 600, marginBottom: 8 }}>오늘 · {fmtMD(todayStr)}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#111', marginBottom: 4 }}>{s.houseName}</div>
              <div style={{ fontSize: 15, color: '#888', marginBottom: 20 }}>{s.type} · {fmt(s.amount)}</div>
              {isActuallyPending(s) ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleEditAmount(s)} style={{ flex: 1, height: 52, borderRadius: 12, border: '1px solid #e5e8eb', background: '#fff', fontSize: 16, color: '#333', cursor: 'pointer', fontFamily: 'inherit' }}>수정</button>
                  <button onClick={() => handleDone(s.id)} style={{ flex: 2, height: 52, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>완료 처리</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 14, color: GREEN_D, fontWeight: 600 }}>완료됨</div>
              )}
            </div>
          ))}

          {/* Pending Cards */}
          {pendingSchedules.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: AMBER_D, marginBottom: 8, padding: '0 4px' }}>예정 {pendingSchedules.length}건</div>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #f0f0f0', overflow: 'hidden' }}>
                {pendingSchedules.map((s, i, arr) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{s.houseName}</div>
                      <div style={{ fontSize: 14, color: AMBER_D, marginTop: 2 }}>{fmtMD(s.date)} · {s.type} · {fmt(s.amount)}</div>
                    </div>
                    <button onClick={() => handleDone(s.id)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>완료</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done Cards */}
          {doneSchedules.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: GREEN_D, marginBottom: 8, padding: '0 4px' }}>완료 {doneSchedules.length}건</div>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #f0f0f0', overflow: 'hidden', opacity: 0.5 }}>
                {doneSchedules.map((s, i, arr) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{s.houseName}</div>
                      <div style={{ fontSize: 14, color: GREEN_D, marginTop: 2 }}>{fmtMD(s.date)} · 완료 · {fmt(s.amount)}</div>
                    </div>
                    <button onClick={() => handleUndone(s.id)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 14, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>되돌리기</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {schedules.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 14 }}>이달 일정이 없어요</div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
