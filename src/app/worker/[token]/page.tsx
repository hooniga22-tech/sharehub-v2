'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Check, Undo2 } from 'lucide-react';

const BLUE = '#3182f6', GREEN = '#00c471', GRAY = '#8b95a1';
const fmt = (n: number) => n.toLocaleString() + '원';

type Staff = { 담당자ID: string; 이름: string; 연락처: string; 분야: string; 구분: string; 링크토큰: string; 기본금액: string };
type Work = { 용역ID: string; 예정일: string; 지점명: string; 담당자명: string; 작업종류: string; 정산금액: string; 메모: string; 완료여부: string };

export default function WorkerTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [schedules, setSchedules] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    fetch(`/api/workers?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoading(false); return; }
        setStaff(data.staff);
        setSchedules(Array.isArray(data.schedules) ? data.schedules : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const pending = schedules.filter(s => s.완료여부 !== 'Y');
  const completed = schedules.filter(s => s.완료여부 === 'Y');
  const totalIncome = completed.reduce((s, w) => s + (Number(w.정산금액) || 0), 0);

  // Group by month
  const monthGroups = useMemo(() => {
    const map: Record<string, Work[]> = {};
    for (const w of schedules) {
      const m = w.예정일?.slice(0, 7) || 'unknown';
      if (!map[m]) map[m] = [];
      map[m].push(w);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [schedules]);

  const markDone = async (id: string) => {
    await fetch('/api/workers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: 'Y' }) });
    setSchedules(prev => prev.map(s => s.용역ID === id ? { ...s, 완료여부: 'Y' } : s));
    showToast('완료 처리됐어요!');
  };

  const markUndone = async (id: string) => {
    await fetch('/api/workers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: 'N' }) });
    setSchedules(prev => prev.map(s => s.용역ID === id ? { ...s, 완료여부: 'N' } : s));
    showToast('되돌렸어요');
  };

  const toggleMonth = (key: string) => setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: GRAY, fontSize: 13 }}>불러오는 중...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#BBB', fontSize: 15 }}>존재하지 않는 페이지입니다</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Blue Header */}
      <div style={{ background: BLUE, padding: '24px 20px 20px', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{staff.이름} 님 👋</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{staff.분야} 담당 · {staff.구분 || '정규'}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: '완료', value: `${completed.length}건` },
            { label: '남은 일정', value: `${pending.length}건` },
            { label: '수입', value: fmt(totalIncome) },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{k.value}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Pending */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F04452', marginBottom: 8 }}>처리 필요 {pending.length}건</div>
            {pending.map(w => (
              <div key={w.용역ID} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{w.지점명}</div>
                <div style={{ fontSize: 12, color: GRAY, marginBottom: 12 }}>{w.작업종류} · {w.예정일}</div>
                {w.메모 && <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>📝 {w.메모}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#666' }}>정산 금액</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{fmt(Number(w.정산금액) || 0)}</span>
                </div>
                <button onClick={() => markDone(w.용역ID)}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ 완료 처리
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 8 }}>완료 {completed.length}건 · {fmt(totalIncome)}</div>
            {completed.map(w => (
              <div key={w.용역ID} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8, opacity: 0.65, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{w.지점명}</div>
                  <div style={{ fontSize: 11, color: GRAY }}>{w.예정일} · {fmt(Number(w.정산금액) || 0)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#e8faf2', color: GREEN }}>완료</span>
                  <button onClick={() => markUndone(w.용역ID)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Undo2 size={14} color="#999" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly groups */}
        {monthGroups.length > 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 8, textAlign: 'center' }}>── 월별 기록 ──</div>
            {monthGroups.map(([month, tasks]) => {
              const isOpen = openMonths[month] ?? false;
              const total = tasks.reduce((s, t) => s + (Number(t.정산금액) || 0), 0);
              const done = tasks.filter(t => t.완료여부 === 'Y').length;
              return (
                <div key={month} style={{ background: '#fff', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                  <button onClick={() => toggleMonth(month)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{month}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{tasks.length}건 (완료 {done}) · {fmt(total)}</span>
                      {isOpen ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
                    </div>
                  </button>
                  {isOpen && tasks.map(t => (
                    <div key={t.용역ID} style={{ padding: '8px 16px', borderTop: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                      <span style={{ fontSize: 12 }}>{t.지점명} · {t.예정일}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: GRAY }}>{fmt(Number(t.정산금액) || 0)}</span>
                        <span style={{ padding: '2px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: t.완료여부 === 'Y' ? '#e8faf2' : '#f2f4f6', color: t.완료여부 === 'Y' ? GREEN : GRAY }}>{t.완료여부 === 'Y' ? '완료' : '예정'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {schedules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}>
            <p style={{ fontSize: 14 }}>일정이 없어요</p>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
