'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, X, ArrowUpDown, ShieldOff, Check, Undo2 } from 'lucide-react';
import { mockDutyHouses, mockSchedule, mockExchangeRequests, THIS_WEEK, fmtWeek, type DutySlot, type DutyStatus, type ExchangeRequest } from '@/../data/mockDuty';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#f59f00';

const StatusBadge = ({ status }: { status: DutyStatus }) => {
  const cfg: Record<DutyStatus, { bg: string; color: string; label: string }> = {
    '완료': { bg: '#e8faf2', color: GREEN, label: '완료' },
    '예정': { bg: '#f2f4f6', color: GRAY, label: '예정' },
    '미완료': { bg: '#fff0f1', color: RED, label: '미완료' },
    '면제': { bg: '#f2f4f6', color: GRAY, label: '면제' },
    '건너뜀': { bg: '#f2f4f6', color: GRAY, label: '공실·건너뜀' },
    '스킵': { bg: '#ebf3ff', color: BLUE, label: '청소주·스킵' },
  };
  const c = cfg[status];
  return <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>;
};

export default function DutyPage() {
  const router = useRouter();
  const [selHouse, setSelHouse] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const [schedule, setSchedule] = useState<DutySlot[]>(mockSchedule);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>(mockExchangeRequests);
  const [swapSheet, setSwapSheet] = useState<string | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [exemptSheet, setExemptSheet] = useState<string | null>(null);
  const [exemptReason, setExemptReason] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const anySheet = swapSheet || exemptSheet;
  useEffect(() => {
    document.body.style.overflow = anySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anySheet]);

  const thisWeekSlot = schedule.find(s => s.weekStart === THIS_WEEK);
  const futureSlots = schedule.filter(s => s.weekStart > THIS_WEEK);
  const pastSlots = schedule.filter(s => s.weekStart < THIS_WEEK).sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  const markComplete = (weekStart: string) => {
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}월 ${now.getDate()}일 ${now.getHours() < 12 ? '오전' : '오후'} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSchedule(prev => prev.map(s =>
      s.weekStart === weekStart ? { ...s, status: '완료' as const, completedAt: timeStr, completedBy: 'admin' as const } : s
    ));
    showToast('완료 처리됐어요!');
  };

  const undoComplete = (weekStart: string) => {
    setSchedule(prev => prev.map(s =>
      s.weekStart === weekStart ? { ...s, status: '예정' as const, completedAt: null, completedBy: null } : s
    ));
    showToast('되돌렸어요');
  };

  const handleExempt = () => {
    if (!exemptSheet) return;
    setSchedule(prev => prev.map(s =>
      s.weekStart === exemptSheet ? { ...s, status: '면제' as const, exemptReason: exemptReason || null } : s
    ));
    setExemptSheet(null);
    setExemptReason('');
    showToast('면제 처리됐어요');
  };

  const handleSwap = () => {
    if (!swapSheet || !swapTarget) return;
    showToast('교환 신청 완료!');
    setSwapSheet(null);
    setSwapTarget(null);
  };

  const acceptExchange = (id: number) => {
    setExchanges(prev => prev.filter(e => e.id !== id));
    showToast('교환 수락! 순서가 바뀌었어요');
  };

  const rejectExchange = (id: number) => {
    setExchanges(prev => prev.filter(e => e.id !== id));
    showToast('거절했어요');
  };

  // ===== House Selection =====
  if (selHouse === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>당번 관리</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            {mockDutyHouses.map((h, i) => {
              const tw = thisWeekSlot;
              const label = tw ? (tw.type === '청소주' ? '스킵' : tw.type === '공실' ? '공실' : tw.name) : '—';
              return (
                <div key={h.id}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                  <button onClick={() => { setSelHouse(h.id); setTab(0); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>{h.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: GRAY }}>이번주: {label}</span>
                      <ChevronRight size={16} color="#CCC" />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
      </div>
    );
  }

  // ===== House Detail =====
  const house = mockDutyHouses.find(h => h.id === selHouse)!;
  const tabLabels = ['현황', '이력', '교환요청'];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <button onClick={() => setSelHouse(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{house.name} 당번</span>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #F0F0F0' }}>
          {tabLabels.map((label, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
              {label}
              {i === 2 && exchanges.length > 0 && (
                <span style={{ position: 'absolute', top: 8, right: '25%', width: 7, height: 7, borderRadius: '50%', background: RED }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Tab 0: 현황 */}
        {tab === 0 && (
          <>
            {/* This week card */}
            {thisWeekSlot && (
              <div style={{ background: thisWeekSlot.type === '청소주' ? '#f2f4f6' : '#f0f7ff', borderRadius: 14, padding: 20, marginBottom: 16, border: thisWeekSlot.type === '청소주' ? 'none' : `1.5px solid ${BLUE}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: BLUE, color: '#fff' }}>이번주</span>
                  <span style={{ fontSize: 13, color: GRAY }}>{fmtWeek(thisWeekSlot.weekStart)}</span>
                </div>

                {thisWeekSlot.type === '청소주' ? (
                  <div style={{ fontSize: 14, color: GRAY }}>정기청소 주 · 당번 없음</div>
                ) : thisWeekSlot.type === '공실' ? (
                  <div style={{ fontSize: 14, color: GRAY }}>공실 · 건너뜀</div>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#191f28', marginBottom: 2 }}>{thisWeekSlot.name}</div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 14 }}>{thisWeekSlot.room}</div>

                    {thisWeekSlot.status === '완료' ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>✓ 완료 · {thisWeekSlot.completedAt}{thisWeekSlot.completedBy === 'admin' ? ' (관리자)' : ''}</span>
                        <button onClick={() => undoComplete(thisWeekSlot.weekStart)}
                          style={{ fontSize: 12, color: GRAY, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                          되돌리기
                        </button>
                      </div>
                    ) : thisWeekSlot.status === '면제' ? (
                      <div style={{ fontSize: 13, color: GRAY }}>면제 처리됨{thisWeekSlot.exemptReason ? ` · ${thisWeekSlot.exemptReason}` : ''}</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setSwapSheet(thisWeekSlot.weekStart); setSwapTarget(null); }}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <ArrowUpDown size={13} /> 교환
                        </button>
                        <button onClick={() => { setExemptSheet(thisWeekSlot.weekStart); setExemptReason(''); }}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <ShieldOff size={13} /> 면제
                        </button>
                        <button onClick={() => markComplete(thisWeekSlot.weekStart)}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Check size={13} /> 완료 처리
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Future */}
            {futureSlots.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>앞으로 당번</div>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  {futureSlots.map((s, i) => (
                    <div key={s.weekStart}>
                      {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', opacity: s.type !== '당번' ? 0.6 : 1 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: s.type !== '당번' ? GRAY : '#191f28' }}>
                            {s.type === '당번' ? s.name : s.type === '공실' ? '공실' : '정기청소'}
                          </div>
                          <div style={{ fontSize: 11, color: GRAY }}>{s.type === '당번' ? s.room + ' · ' : ''}{fmtWeek(s.weekStart)}</div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Tab 1: 이력 */}
        {tab === 1 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 10 }}>최근 2개월 당번 이력</div>
            {pastSlots.map(s => (
              <div key={s.weekStart} style={{ background: '#fff', borderRadius: 12, border: '1px solid #f2f4f6', padding: '14px 18px', marginBottom: 8, opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>
                      {s.type === '당번' ? `${s.name}   ${s.room}` : s.type === '공실' ? '공실 · 건너뜀' : '정기청소 · 스킵'}
                    </div>
                    <div style={{ fontSize: 12, color: GRAY }}>{fmtWeek(s.weekStart)}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                {s.completedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: GREEN }}>✓ {s.completedAt}{s.completedBy === 'admin' ? ' (관리자)' : ''}</span>
                    <button style={{ fontSize: 11, color: GRAY, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>수정</button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Tab 2: 교환요청 */}
        {tab === 2 && (
          exchanges.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE, marginBottom: 10 }}>교환 요청 {exchanges.length}건</div>
              {exchanges.map(ex => (
                <div key={ex.id} style={{ background: '#fffbeb', borderRadius: 14, border: '1px solid #fde68a', padding: 20, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#191f28' }}>🔄 {ex.fromName}님이 교환을 신청했어요</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: GRAY }}>내 주</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtWeek(ex.myWeekStart)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: GRAY }}>상대 주</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtWeek(ex.theirWeekStart)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => rejectExchange(ex.id)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                      거절
                    </button>
                    <button onClick={() => acceptExchange(ex.id)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: BLUE, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                      수락
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>교환 요청이 없어요</div>
              <div style={{ fontSize: 13, color: GRAY }}>새로운 요청이 오면 여기에 표시돼요</div>
            </div>
          )
        )}
      </div>

      {/* ===== Swap Sheet ===== */}
      {swapSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setSwapSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>당번 교환 신청</span>
              <button onClick={() => setSwapSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>내 당번: {fmtWeek(swapSheet)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>교환할 상대 선택</div>
            {[...futureSlots.filter(s => s.type === '당번' && s.weekStart !== swapSheet), ...(thisWeekSlot && thisWeekSlot.type === '당번' && thisWeekSlot.weekStart !== swapSheet ? [thisWeekSlot] : [])].map(s => {
              const selected = swapTarget === s.weekStart;
              return (
                <button key={s.weekStart} onClick={() => setSwapTarget(s.weekStart)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${selected ? BLUE : '#E8E8E8'}`, background: selected ? '#EBF4FF' : '#fff', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}  {fmtWeek(s.weekStart)}</span>
                  {selected && <span style={{ color: BLUE, fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
            <button onClick={handleSwap} disabled={!swapTarget}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: swapTarget ? BLUE : '#e5e8eb', color: swapTarget ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: swapTarget ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>
              신청하기
            </button>
          </div>
        </div>
      )}

      {/* ===== Exempt Sheet ===== */}
      {exemptSheet && (() => {
        const slot = schedule.find(s => s.weekStart === exemptSheet);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={() => setExemptSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>면제 처리</span>
                <button onClick={() => setExemptSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
              </div>
              <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>
                {slot?.name} · {slot?.room} · {fmtWeek(exemptSheet)}
              </div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>면제 사유 (선택)</label>
              <textarea value={exemptReason} onChange={e => setExemptReason(e.target.value)}
                placeholder="예: 출장 중, 퇴실 직후 등..."
                style={{ width: '100%', height: 100, padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none', marginBottom: 12 }} />
              <button onClick={handleExempt}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                면제 처리
              </button>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
