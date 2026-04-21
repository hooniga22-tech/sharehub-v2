'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, X, Check, Undo2, ShieldOff, RefreshCw } from 'lucide-react';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#f59f00';

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  '완료': { bg: '#e8faf2', color: GREEN, label: '완료' },
  '예정': { bg: '#f2f4f6', color: GRAY, label: '예정' },
  '미완료': { bg: '#fff0f1', color: RED, label: '미완료' },
  '면제': { bg: '#f2f4f6', color: GRAY, label: '면제' },
  '건너뜀': { bg: '#f2f4f6', color: GRAY, label: '공실·건너뜀' },
  '스킵': { bg: '#ebf3ff', color: BLUE, label: '청소주·스킵' },
};

const fmtWeek = (ws: string) => {
  const d = new Date(ws);
  const e = new Date(d); e.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;
};

type Duty = { 당번ID: string; 지점명: string; 주차시작일: string; 방코드: string; 입주자명: string; 당번유형: string; 완료여부: string; 완료일시: string; 완료처리자: string; 면제사유: string };

export default function DutyMobile() {
  const router = useRouter();
  const [selHouse, setSelHouse] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [thisWeek, setThisWeek] = useState('');
  const [houses, setHouses] = useState<string[]>([]);
  const [houseGuMap, setHouseGuMap] = useState<Record<string, string>>({});
  const [gu, setGu] = useState('전체');
  const [loading, setLoading] = useState(false);
  const [exemptSheet, setExemptSheet] = useState<string | null>(null);
  const [exemptReason, setExemptReason] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    Promise.all([
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
    ]).then(([tenantData, houseData]) => {
      const names = [...new Set((Array.isArray(tenantData) ? tenantData : []).map((t: { 지점명?: string }) => t.지점명))].filter(Boolean) as string[];
      setHouses(names.sort());
      const map: Record<string, string> = {};
      (Array.isArray(houseData) ? houseData : []).forEach((h: any) => { if (h['지점명'] && h['구']) map[h['지점명']] = h['구']; });
      setHouseGuMap(map);
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = exemptSheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [exemptSheet]);

  const fetchDuty = (house: string) => {
    setLoading(true);
    fetch(`/api/duty?house=${encodeURIComponent(house)}&weeks=8`)
      .then(r => r.json())
      .then(data => { setDuties(data.duties || []); setThisWeek(data.thisWeek || ''); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const generateDuty = async (house: string) => {
    showToast('스케줄 생성 중...');
    const res = await fetch('/api/duty/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ house, weeksAhead: 8 }),
    }).then(r => r.json());

    if (res.duties?.length > 0) {
      await fetch('/api/duty', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: true, duties: res.duties }),
      });
      showToast(`스케줄 ${res.count}주 생성 완료!`);
      fetchDuty(house);
    } else {
      showToast('이미 스케줄이 있어요');
    }
  };

  const markDone = async (id: string) => {
    await fetch('/api/duty', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: '완료', 완료처리자: 'admin' }) });
    setDuties(prev => prev.map(d => d.당번ID === id ? { ...d, 완료여부: '완료' } : d));
    showToast('완료 처리됐어요!');
  };

  const markUndone = async (id: string) => {
    await fetch('/api/duty', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: '예정', 완료일시: '', 완료처리자: '' }) });
    setDuties(prev => prev.map(d => d.당번ID === id ? { ...d, 완료여부: '예정' } : d));
    showToast('되돌렸어요');
  };

  const handleExempt = async () => {
    if (!exemptSheet) return;
    await fetch('/api/duty', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: exemptSheet, 완료여부: '면제', 면제여부: 'Y', 면제사유: exemptReason }) });
    setDuties(prev => prev.map(d => d.당번ID === exemptSheet ? { ...d, 완료여부: '면제', 면제사유: exemptReason } : d));
    setExemptSheet(null); setExemptReason('');
    showToast('면제 처리됐어요');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const c = STATUS_CFG[status] || STATUS_CFG['예정'];
    return <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>;
  };

  const thisWeekSlot = duties.find(d => d.주차시작일 === thisWeek);
  const futureSlots = duties.filter(d => d.주차시작일 > thisWeek);
  const pastSlots = duties.filter(d => d.주차시작일 < thisWeek).sort((a, b) => b.주차시작일.localeCompare(a.주차시작일));

  const guList = useMemo(() => [...new Set(Object.values(houseGuMap).filter(Boolean))].sort(), [houseGuMap]);
  const filteredHouses = useMemo(() => gu === '전체' ? houses : houses.filter(h => houseGuMap[h] === gu), [houses, gu, houseGuMap]);

  // House selection
  if (!selHouse) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>당번 관리</span>
        </div>
        {guList.length > 0 && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '12px 16px', scrollbarWidth: 'none', background: '#F7F8FA' }}>
            {['전체', ...guList].map(g => (
              <button key={g} onClick={() => setGu(g)} style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{g}</button>
            ))}
          </div>
        )}
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            {filteredHouses.map((h, i) => (
              <div key={h}>
                {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                <button onClick={() => { setSelHouse(h); setTab(0); fetchDuty(h); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>{h}</span>
                  <ChevronRight size={16} color="#CCC" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
      </div>
    );
  }

  // Detail
  const tabLabels = ['현황', '이력'];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSelHouse(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{selHouse} 당번</span>
          </div>
          <button onClick={() => generateDuty(selHouse)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
            <RefreshCw size={13} /> 생성
          </button>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #F0F0F0' }}>
          {tabLabels.map((label, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
        ) : duties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>당번 스케줄이 없어요</div>
            <button onClick={() => generateDuty(selHouse)}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              스케줄 자동 생성
            </button>
          </div>
        ) : (
          <>
            {tab === 0 && (
              <>
                {/* This week */}
                {thisWeekSlot && (
                  <div style={{ background: thisWeekSlot.당번유형 === '청소주' ? '#f2f4f6' : '#f0f7ff', borderRadius: 14, padding: 20, marginBottom: 16, border: thisWeekSlot.당번유형 === '청소주' ? 'none' : `1.5px solid ${BLUE}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: BLUE, color: '#fff' }}>이번주</span>
                      <span style={{ fontSize: 13, color: GRAY }}>{fmtWeek(thisWeekSlot.주차시작일)}</span>
                    </div>
                    {thisWeekSlot.당번유형 === '청소주' ? (
                      <div style={{ fontSize: 14, color: GRAY }}>정기청소 주 · 당번 없음</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#191f28', marginBottom: 2 }}>{thisWeekSlot.입주자명}</div>
                        <div style={{ fontSize: 12, color: GRAY, marginBottom: 14 }}>{thisWeekSlot.방코드}</div>
                        {thisWeekSlot.완료여부 === '완료' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>✓ 완료{thisWeekSlot.완료일시 ? ` · ${thisWeekSlot.완료일시}` : ''}</span>
                            <button onClick={() => markUndone(thisWeekSlot.당번ID)} style={{ fontSize: 12, color: GRAY, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>되돌리기</button>
                          </div>
                        ) : thisWeekSlot.완료여부 === '면제' ? (
                          <div style={{ fontSize: 13, color: GRAY }}>면제 처리됨{thisWeekSlot.면제사유 ? ` · ${thisWeekSlot.면제사유}` : ''}</div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setExemptSheet(thisWeekSlot.당번ID); setExemptReason(''); }}
                              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <ShieldOff size={13} /> 면제
                            </button>
                            <button onClick={() => markDone(thisWeekSlot.당번ID)}
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
                        <div key={s.당번ID}>
                          {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', opacity: s.당번유형 !== '당번' ? 0.6 : 1 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: s.당번유형 !== '당번' ? GRAY : '#191f28' }}>
                                {s.당번유형 === '당번' ? s.입주자명 : s.당번유형 === '청소주' ? '정기청소' : '공실'}
                              </div>
                              <div style={{ fontSize: 11, color: GRAY }}>{s.당번유형 === '당번' ? `${s.방코드} · ` : ''}{fmtWeek(s.주차시작일)}</div>
                            </div>
                            <StatusBadge status={s.완료여부} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 1 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 10 }}>당번 이력</div>
                {pastSlots.length > 0 ? pastSlots.map(s => (
                  <div key={s.당번ID} style={{ background: '#fff', borderRadius: 12, border: '1px solid #f2f4f6', padding: '14px 18px', marginBottom: 8, opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>
                          {s.당번유형 === '당번' ? `${s.입주자명}  ${s.방코드}` : s.당번유형 === '청소주' ? '정기청소 · 스킵' : '공실 · 건너뜀'}
                        </div>
                        <div style={{ fontSize: 12, color: GRAY }}>{fmtWeek(s.주차시작일)}</div>
                      </div>
                      <StatusBadge status={s.완료여부} />
                    </div>
                    {s.완료일시 && <span style={{ fontSize: 12, color: GREEN }}>✓ {s.완료일시}</span>}
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY }}>이력이 없어요</div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Exempt Sheet */}
      {exemptSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setExemptSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>면제 처리</span>
              <button onClick={() => setExemptSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>면제 사유 (선택)</label>
            <textarea value={exemptReason} onChange={e => setExemptReason(e.target.value)} placeholder="예: 출장 중, 퇴실 직후 등..."
              style={{ width: '100%', height: 100, padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none', marginBottom: 12 }} />
            <button onClick={handleExempt}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              면제 처리
            </button>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
