'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { mockWorkers, mockTasks as initialTasks, TYPE_COLOR, STATUS_COLOR, fmt, type WorkTask } from '@/../data/mockWorkers';
import { ChevronDown, ChevronUp, Pencil, Check, Undo2, X } from 'lucide-react';

const BLUE = '#3182f6', GREEN = '#00c471', GRAY = '#8b95a1';

function getFirstDay(y: number, m: number) { return new Date(y, m - 1, 1).getDay(); }
function getDaysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();
  const worker = mockWorkers.find(w => w.token === token);

  const [myTasks, setMyTasks] = useState<WorkTask[]>(() => initialTasks.filter(t => t.workerId === worker?.id));
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [month, setMonth] = useState(6);
  const [year] = useState(2025);
  const [editId, setEditId] = useState<number | null>(null);
  const [editAmt, setEditAmt] = useState('');
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  if (!worker) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#BBB', fontSize: 15 }}>존재하지 않는 페이지입니다</p>
      </div>
    );
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const monthTasks = myTasks.filter(t => t.month === month && t.year === year);
  const pendingTasks = monthTasks.filter(t => t.status === '예정' || t.status === '진행중');
  const completedTasks = monthTasks.filter(t => t.status === '완료');
  const completedTotal = completedTasks.reduce((s, t) => s + t.amount, 0);
  const remainCount = pendingTasks.length;
  const doneCount = completedTasks.length;
  const monthIncome = completedTasks.reduce((s, t) => s + t.amount, 0);

  const prevMonths = useMemo(() => {
    const months: Record<string, WorkTask[]> = {};
    for (const t of myTasks) {
      if (t.month === month && t.year === year) continue;
      const key = `${t.year}.${String(t.month).padStart(2, '0')}`;
      if (!months[key]) months[key] = [];
      months[key].push(t);
    }
    return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]));
  }, [myTasks, month, year]);

  const yearData = useMemo(() => {
    const data: Record<string, { tasks: WorkTask[]; total: number; done: number }> = {};
    for (const t of myTasks) {
      if (t.year !== year) continue;
      const key = `${t.month}월`;
      if (!data[key]) data[key] = { tasks: [], total: 0, done: 0 };
      data[key].tasks.push(t);
      data[key].total += t.amount;
      if (t.status === '완료') data[key].done++;
    }
    return Object.entries(data).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
  }, [myTasks, year]);

  const markComplete = (taskId: number) => {
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: '완료' as const } : t));
    showToast('완료 처리되었어요!');
  };

  const undoComplete = (taskId: number) => {
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: '예정' as const } : t));
    setConfirmId(null);
    showToast('완료가 취소되었어요');
  };

  const saveEdit = (taskId: number) => {
    const amt = parseInt(editAmt);
    if (isNaN(amt) || amt <= 0) return;
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, amount: amt } : t));
    setEditId(null);
    showToast('금액이 수정되었어요');
  };

  const toggleMonth = (key: string) => setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));

  const firstDay = getFirstDay(year, month);
  const daysCount = getDaysInMonth(year, month);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysCount; d++) calendarCells.push(d);
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;

  const months4to6 = [4, 5, 6];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ background: BLUE, padding: '24px 20px 20px', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{worker.name} 님 👋</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{worker.role} 담당 · 정규</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: '완료', value: `${doneCount}건` }, { label: '남은 일정', value: `${remainCount}건` }, { label: '이달 수입', value: fmt(monthIncome) }].map(k => (
            <div key={k.label} style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{k.value}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: 0, background: '#F2F4F6', borderRadius: 8, padding: 2 }}>
          {(['month', 'year'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: viewMode === v ? 700 : 400, background: viewMode === v ? '#fff' : 'transparent', color: viewMode === v ? '#191919' : GRAY, cursor: 'pointer', fontFamily: 'inherit', boxShadow: viewMode === v ? '0 1px 2px rgba(0,0,0,.06)' : 'none' }}>
              {v === 'month' ? '월별' : '연간'}
            </button>
          ))}
        </div>
        {viewMode === 'month' && (
          <div style={{ display: 'flex', gap: 4 }}>
            {months4to6.map(m => (
              <button key={m} onClick={() => setMonth(m)}
                style={{ padding: '6px 12px', borderRadius: 16, border: `1px solid ${month === m ? BLUE : '#E8E8E8'}`, background: month === m ? '#EBF4FF' : '#fff', color: month === m ? BLUE : '#666', fontSize: 12, fontWeight: month === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                {m}월
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {viewMode === 'month' ? (
          <>
            {/* Calendar */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>{year}년 {month}월</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, textAlign: 'center' }}>
                {['일','월','화','수','목','금','토'].map(d => (
                  <div key={d} style={{ fontSize: 11, color: GRAY, padding: '4px 0', fontWeight: 600 }}>{d}</div>
                ))}
                {calendarCells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} style={{ padding: '8px 0' }} />;
                  const dayTasks = monthTasks.filter(t => t.day === d);
                  return (
                    <div key={d} style={{ padding: '4px 0' }}>
                      <div style={{ width: 28, height: 28, margin: '0 auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isToday(d) ? 700 : 400, border: isToday(d) ? `2px solid ${BLUE}` : 'none', color: isToday(d) ? BLUE : '#333' }}>{d}</div>
                      {dayTasks.length > 0 && (
                        <div style={{ fontSize: 8, marginTop: 1, color: dayTasks[0].status === '완료' ? GREEN : BLUE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                          {dayTasks[0].loc.split(' ')[1]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: GREEN, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block' }} /> 완료</span>
                <span style={{ fontSize: 10, color: BLUE, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE, display: 'inline-block' }} /> 예정</span>
              </div>
            </div>

            {pendingTasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F04452', marginBottom: 8 }}>처리 필요 {pendingTasks.length}건</div>
                {pendingTasks.map(t => (
                  <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t.loc.split(' ')[1]}하우스</div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 16 }}>{t.room} · {t.date}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#666' }}>작업 금액</span>
                      {editId === t.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input value={editAmt} onChange={e => setEditAmt(e.target.value)} type="number" style={{ width: 100, padding: '6px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
                          <button onClick={() => saveEdit(t.id)} style={{ background: BLUE, border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Check size={14} color="#fff" /></button>
                          <button onClick={() => setEditId(null)} style={{ background: '#F0F0F0', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><X size={14} color="#999" /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700 }}>{fmt(t.amount)}</span>
                          <button onClick={() => { setEditId(t.id); setEditAmt(String(t.amount)); }} style={{ background: '#F5F5F5', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#666' }}><Pencil size={11} /> 수정</button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => markComplete(t.id)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✅ 완료 처리</button>
                  </div>
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 8 }}>완료 {doneCount}건 · {fmt(completedTotal)}</div>
                {completedTasks.map(t => (
                  <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8, opacity: 0.65, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.loc.split(' ')[1]}하우스</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{t.date} · {fmt(t.amount)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#e8faf2', color: GREEN }}>완료</span>
                      <button onClick={() => setConfirmId(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Undo2 size={14} color="#999" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {prevMonths.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 8, textAlign: 'center' }}>── 이전 달 기록 ──</div>
                {prevMonths.map(([key, tasks]) => {
                  const isOpen = openMonths[key] ?? false;
                  const total = tasks.reduce((s, t) => s + t.amount, 0);
                  return (
                    <div key={key} style={{ background: '#fff', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                      <button onClick={() => toggleMonth(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{key.replace('.0', '.').replace('.', '년 ')}월</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: GRAY }}>{tasks.length}건 · {fmt(total)}</span>
                          {isOpen ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
                        </div>
                      </button>
                      {isOpen && tasks.map(t => (
                        <div key={t.id} style={{ padding: '8px 16px', borderTop: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                          <span style={{ fontSize: 12 }}>● {t.loc.split(' ')[1]}하우스 · {t.date}</span>
                          <span style={{ fontSize: 12, color: GRAY }}>{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{year}년 전체 현황</div>
            {yearData.map(([label, data]) => {
              const isOpen = openMonths[label] ?? false;
              return (
                <div key={label} style={{ background: '#fff', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                  <button onClick={() => toggleMonth(label)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{data.tasks.length}건 (완료 {data.done}건) · {fmt(data.total)}</span>
                      {isOpen ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
                    </div>
                  </button>
                  {isOpen && data.tasks.map(t => {
                    const sc = STATUS_COLOR[t.status];
                    return (
                      <div key={t.id} style={{ padding: '8px 16px', borderTop: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12 }}>{t.loc.split(' ')[1]}하우스 · {t.room} · {t.date}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12 }}>{fmt(t.amount)}</span>
                          <span style={{ padding: '2px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: sc.bg, color: sc.color }}>{t.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>

      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setConfirmId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '80%', maxWidth: 300, background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>↩</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>완료를 취소할까요?</div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>운영지출에서도 제거돼요</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>아니요</button>
              <button onClick={() => undoComplete(confirmId)} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#F04452', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>취소할게요</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
