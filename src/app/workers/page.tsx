'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1';
const GREEN_BG = '#D1FAE5', GREEN_FG = '#065F46';
const AMBER_BG = '#FFFBEB', AMBER_FG = '#92400E';
const fmt = (n: number) => n.toLocaleString() + '원';

type Work = { 용역ID: string; 예정일: string; 지점명: string; 담당자명: string; 작업종류: string; 정산금액: string; 메모: string; 완료여부: string };

const STAFF_ORDER = ['이인실', '이미경', '이한나', '진진수'];
const TOKEN_MAP: Record<string, string> = {
  '이인실': 'b775a18c876534ee',
  '이미경': '4b594c769b0aa6ab',
  '이한나': 'e8f27ed8eab30c68',
  '진진수': '2d79c5c07cfb8e4c',
};

function fmtDate(d: string) {
  if (!d) return '-';
  const p = d.split('-');
  return `${Number(p[1])}/${Number(p[2])}`;
}

export default function WorkersPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [toast, setToast] = useState('');
  const [copiedStaff, setCopiedStaff] = useState('');

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const isFuture = year > nowYear || (year === nowYear && month >= nowMonth);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isFuture) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workers?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => setSchedules(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const monthData = useMemo(() => schedules.filter(s => s.예정일.startsWith(prefix)), [schedules, prefix]);
  const totalCount = monthData.length;
  const totalAmount = monthData.reduce((s, w) => s + (Number(w.정산금액) || 0), 0);

  // Staff list sorted by STAFF_ORDER then alphabetical
  const staffList = useMemo(() => {
    const names = [...new Set(monthData.map(w => w.담당자명).filter(Boolean))];
    return names.sort((a, b) => {
      const ai = STAFF_ORDER.indexOf(a);
      const bi = STAFF_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b, 'ko');
    });
  }, [monthData]);

  // Auto-select first staff
  useEffect(() => {
    if (staffList.length > 0 && !staffList.includes(selectedStaff)) {
      setSelectedStaff(staffList[0]);
    }
  }, [staffList, selectedStaff]);

  // Grouped data for 정산 tab
  const grouped = useMemo(() => {
    const map = new Map<string, Work[]>();
    for (const w of monthData) {
      const name = w.담당자명 || '-';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(w);
    }
    const entries = [...map.entries()].sort((a, b) => {
      const ai = STAFF_ORDER.indexOf(a[0]);
      const bi = STAFF_ORDER.indexOf(b[0]);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a[0].localeCompare(b[0], 'ko');
    });
    for (const [, works] of entries) works.sort((a, b) => a.예정일.localeCompare(b.예정일));
    return entries;
  }, [monthData]);

  // Selected staff data
  const staffWorks = useMemo(() =>
    monthData.filter(w => w.담당자명 === selectedStaff).sort((a, b) => a.예정일.localeCompare(b.예정일))
  , [monthData, selectedStaff]);
  const staffAmount = staffWorks.reduce((s, w) => s + (Number(w.정산금액) || 0), 0);
  const staffDone = staffWorks.filter(w => w.완료여부 === 'Y').length;
  const staffPending = staffWorks.length - staffDone;
  const staffToken = TOKEN_MAP[selectedStaff] || '';

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

  const copyLink = (name: string) => {
    const t = TOKEN_MAP[name];
    if (!t) return;
    navigator.clipboard?.writeText(`${window.location.origin}/worker/${t}`);
    setCopiedStaff(name);
    setTimeout(() => setCopiedStaff(''), 1500);
  };

  const tabLabels = ['이달 일정', '정산'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>용역 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>용역 관리</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {tabLabels.map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab 0: 이달 일정 D안 */}
      {tab === 0 && (
        <>
          {/* Month Navigation + Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0', background: '#F7F8FA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{year}년 {month}월</span>
              <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 16, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: '0 8px' }}>▶</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: '#EEF3FF', fontSize: 12, fontWeight: 600, color: BLUE }}>{totalCount}건</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: '#EEF3FF', fontSize: 12, fontWeight: 600, color: BLUE }}>{fmt(totalAmount)}</span>
            </div>
          </div>

          {/* Staff Tabs */}
          <div style={{ overflowX: 'auto', scrollbarWidth: 'none', background: '#fff', borderBottom: '1px solid #f0f0f0', marginTop: 12 }}>
            <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
              {staffList.map(name => {
                const sel = name === selectedStaff;
                return (
                  <button key={name} onClick={() => setSelectedStaff(name)}
                    style={{ padding: '12px 14px', border: 'none', borderBottom: sel ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: sel ? 500 : 400, color: sel ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Staff Info Card */}
          {selectedStaff && (
            <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 14, border: '1px solid #f2f3f5', padding: '16px 18px', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#191f28' }}>{fmt(staffAmount)}</div>
                <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>{staffWorks.length}건 · 완료 {staffDone} · 예정 {staffPending}</div>
              </div>
              {staffToken && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => window.open(`/worker/${staffToken}`, '_blank')}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    개인 페이지
                  </button>
                  <button onClick={() => copyLink(selectedStaff)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', color: '#888', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {copiedStaff === selectedStaff ? '복사됨' : '링크 복사'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Schedule List */}
          <div style={{ padding: '12px 16px 40px' }}>
            {staffWorks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>이달 일정이 없어요</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px', background: '#fafafa', borderBottom: '0.5px solid #f0f0f0' }}>
                  <span style={{ flex: 1, fontSize: 11, color: GRAY }}>지점 · 작업</span>
                  <span style={{ width: 44, textAlign: 'center', fontSize: 11, color: GRAY }}>날짜</span>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 11, color: GRAY }}>상태</span>
                  <span style={{ width: 70, textAlign: 'right', fontSize: 11, color: GRAY }}>금액</span>
                </div>
                {staffWorks.map((w, i) => {
                  const isDone = w.완료여부 === 'Y';
                  return (
                    <div key={w.용역ID} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{w.지점명}</span>
                        <span style={{ fontSize: 12, color: GRAY, marginLeft: 6 }}>{w.작업종류}</span>
                      </div>
                      <span style={{ width: 44, textAlign: 'center', fontSize: 12, color: GRAY }}>{fmtDate(w.예정일)}</span>
                      <div style={{ width: 40, textAlign: 'center' }}>
                        {isDone ? (
                          <button onClick={() => markUndone(w.용역ID)} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: GREEN_BG, color: GREEN_FG, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>완료</button>
                        ) : (
                          <button onClick={() => markDone(w.용역ID)} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: AMBER_BG, color: AMBER_FG, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>예정</button>
                        )}
                      </div>
                      <span style={{ width: 70, textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#191f28' }}>{fmt(Number(w.정산금액) || 0)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 1: 정산 */}
      {tab === 1 && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>{year}년 {month}월 정산</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#fafafa', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ flex: 1, fontSize: 11, color: GRAY }}>담당자</span>
              <span style={{ width: 50, textAlign: 'center', fontSize: 11, color: GRAY }}>건수</span>
              <span style={{ width: 90, textAlign: 'right', fontSize: 11, color: GRAY }}>합계금액</span>
            </div>
            {grouped.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY, fontSize: 13 }}>데이터가 없어요</div>
            ) : (
              <>
                {grouped.map(([staffName, works], i, arr) => {
                  const sa = works.reduce((s, w) => s + (Number(w.정산금액) || 0), 0);
                  return (
                    <div key={staffName} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : '1px solid #f0f0f0' }}>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#191f28' }}>{staffName}</span>
                      <span style={{ width: 50, textAlign: 'center', fontSize: 13, color: GRAY }}>{works.length}건</span>
                      <span style={{ width: 90, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#191f28' }}>{fmt(sa)}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa' }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#191f28' }}>합계</span>
                  <span style={{ width: 50, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#191f28' }}>{totalCount}건</span>
                  <span style={{ width: 90, textAlign: 'right', fontSize: 14, fontWeight: 700, color: BLUE }}>{fmt(totalAmount)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
