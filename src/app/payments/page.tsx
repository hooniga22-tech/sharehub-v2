'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182F6', RED = '#e03131', GREEN = '#00B493';
const fmt = (n: number) => n.toLocaleString() + '원';

type Payment = {
  수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 이름: string;
  연월: string; 청구액: string; 납부액: string; 납부일: string; 상태: string; 납부방법: string; 메모: string;
};
type Summary = { total: number; paid: number; unpaid: number; partial: number; paidRate: number; paidAmount: number; unpaidAmount: number };

function kstNow() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const [y, m, d] = s.replace(/\./g, '').trim().split(/\s+/).map(Number);
  return { y, m, d };
}

const badge = (status: string) => {
  if (status === '납부완료') return { bg: '#e8f1fd', color: BLUE, label: '완납' };
  if (status === '부분납부') return { bg: '#f2f4f6', color: '#888', label: '부분' };
  return { bg: '#fff2f2', color: RED, label: '미납' };
};

export default function PaymentsPage() {
  const router = useRouter();
  const kst = kstNow();
  const [items, setItems] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, unpaid: 0, partial: 0, paidRate: 0, paidAmount: 0, unpaidAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(kst.y);
  const [month, setMonth] = useState(kst.m);
  const isFuture = year > kst.y || (year === kst.y && month >= kst.m);

  const [filter, setFilter] = useState('전체');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [partialMode, setPartialMode] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadBanner, setUploadBanner] = useState(false);

  // 구/지점 필터
  const [guList, setGuList] = useState<string[]>([]);
  const [guBranchMap, setGuBranchMap] = useState<Record<string, string[]>>({});
  const [branchGuMap, setBranchGuMap] = useState<Record<string, string>>({});
  const [selectedGu, setSelectedGu] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isFuture) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/payments?year=${year}&month=${String(month).padStart(2, '0')}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        setSummary(d.summary || { total: 0, paid: 0, unpaid: 0, partial: 0, paidRate: 0, paidAmount: 0, unpaidAmount: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 구→지점 맵 로드 (입주자 탭에서)
  useEffect(() => {
    fetch('/api/tenants')
      .then(r => r.json())
      .then((d: { 구: string; 지점명: string }[]) => {
        const arr = Array.isArray(d) ? d : [];
        const map: Record<string, Set<string>> = {};
        const bMap: Record<string, string> = {};
        for (const t of arr) {
          const gu = t.구 || '';
          const branch = t.지점명 || '';
          if (!gu || !branch) continue;
          if (!map[gu]) map[gu] = new Set();
          map[gu].add(branch);
          bMap[branch] = gu;
        }
        const sorted = Object.keys(map).sort();
        setGuList(sorted);
        const mapObj: Record<string, string[]> = {};
        for (const g of sorted) mapObj[g] = [...map[g]].sort();
        setGuBranchMap(mapObj);
        setBranchGuMap(bMap);
      })
      .catch(() => {});
  }, []);

  // Check if upload just completed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('uploaded') === 'true') {
      setUploadBanner(true);
      window.history.replaceState({}, '', '/payments');
      fetchData();
    }
  }, [fetchData]);

  const todayStr = `${kst.y}-${String(kst.m).padStart(2, '0')}-${String(kst.d).padStart(2, '0')}`;

  const markPaid = async (p: Payment) => {
    if (saving) return;
    setSaving(true);
    try {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.수납ID, 상태: '납부완료', 납부액: p.청구액, 납부일: todayStr }),
      });
      setExpanded(null);
      fetchData();
    } catch {
    } finally { setSaving(false); }
  };

  const markPartial = async (p: Payment) => {
    if (saving || !partialAmount) return;
    setSaving(true);
    try {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.수납ID, 상태: '부분납부', 납부액: Number(partialAmount), 납부일: todayStr }),
      });
      setPartialMode(null);
      setPartialAmount('');
      setExpanded(null);
      fetchData();
    } catch {
    } finally { setSaving(false); }
  };

  const getDplus = (p: Payment) => {
    const ym = p.연월;
    if (!ym) return 0;
    const [y2, m2] = ym.split('-').map(Number);
    const due = new Date(y2, m2, 0);
    const today = new Date(kst.y, kst.m - 1, kst.d);
    const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  // 구/지점 필터 적용된 아이템
  const guFiltered = items.filter(p => {
    if (selectedBranch) return p.지점명 === selectedBranch;
    if (selectedGu) {
      const gu = branchGuMap[p.지점명];
      return gu === selectedGu;
    }
    return true;
  });

  // 구/지점 필터 기준 KPI
  const localSummary = (() => {
    const total = guFiltered.length;
    const paid = guFiltered.filter(p => p.상태 === '납부완료').length;
    const partial = guFiltered.filter(p => p.상태 === '부분납부').length;
    const unpaid = total - paid - partial;
    const paidAmount = guFiltered.filter(p => p.상태 === '납부완료').reduce((s, p) => s + (Number(p.청구액) || 0), 0);
    const unpaidAmount = guFiltered.filter(p => p.상태 !== '납부완료').reduce((s, p) => s + (Number(p.청구액) || 0) - (Number(p.납부액) || 0), 0);
    const paidRate = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;
    return { total, paid, unpaid, partial, paidRate, paidAmount, unpaidAmount };
  })();

  const filtered = guFiltered.filter(p => {
    if (filter === '완납') return p.상태 === '납부완료';
    if (filter === '미납') return p.상태 === '미납';
    if (filter === '부분납부') return p.상태 === '부분납부';
    return true;
  }).sort((a, b) => {
    const sa = a.상태 === '납부완료' ? 1 : 0;
    const sb = b.상태 === '납부완료' ? 1 : 0;
    if (sa !== sb) return sa - sb;
    return getDplus(b) - getDplus(a);
  });

  const filterCounts: Record<string, number> = {
    '전체': guFiltered.length,
    '미납': guFiltered.filter(p => p.상태 === '미납').length,
    '완납': guFiltered.filter(p => p.상태 === '납부완료').length,
    '부분납부': guFiltered.filter(p => p.상태 === '부분납부').length,
  };

  const branchOptions = selectedGu ? (guBranchMap[selectedGu] || []) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#191919' }}>수납 관리</div>
              <div style={{ fontSize: 12, color: '#b0b8c1' }}>{year}년 {month}월</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 14, color: '#888', cursor: 'pointer', padding: 4 }}>◀</button>
              <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 14, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: 4 }}>▶</button>
            </div>
            <button onClick={() => router.push('/payments/upload')}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              업로드
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#b0b8c1', fontSize: 13 }}>불러오는 중...</div>
      ) : (
        <>
          {/* 구/지점 드롭다운 */}
          <div style={{ background: '#fff', padding: '10px 14px', display: 'flex', gap: 8, borderBottom: '1px solid #f2f2f2' }}>
            <select value={selectedGu} onChange={e => { setSelectedGu(e.target.value); setSelectedBranch(''); }}
              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 12, background: '#fff', color: '#191919', fontFamily: 'inherit', outline: 'none', appearance: 'auto' }}>
              <option value="">전체 구</option>
              {guList.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 12, background: '#fff', color: '#191919', fontFamily: 'inherit', outline: 'none', appearance: 'auto' }}>
              <option value="">전체 지점</option>
              {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* KPI */}
          <div style={{ background: '#fff', padding: '20px 20px 18px', display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#b0b8c1', marginBottom: 4 }}>미납</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#191919' }}>{localSummary.unpaid + localSummary.partial}<span style={{ fontSize: 14, fontWeight: 400, color: '#b0b8c1', marginLeft: 2 }}>건</span></div>
              <div style={{ fontSize: 12, color: '#b0b8c1', marginTop: 2 }}>{fmt(localSummary.unpaidAmount)}</div>
            </div>
            <div style={{ width: 1, background: '#f0f0f0', margin: '0 16px' }} />
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#b0b8c1', marginBottom: 4 }}>납부율</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: BLUE }}>{localSummary.paidRate}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 1 }}>%</span></div>
              <div style={{ fontSize: 12, color: '#b0b8c1', marginTop: 2 }}>{localSummary.paid} / {localSummary.total}명</div>
            </div>
          </div>

          {/* Upload Banner */}
          {uploadBanner && (
            <div style={{ margin: '12px 16px 0', padding: '12px 16px', borderRadius: 12, background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>업로드 완료</span>
              </div>
              <button onClick={() => setUploadBanner(false)} style={{ background: 'none', border: 'none', fontSize: 16, color: '#b0b8c1', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {/* Filter Chips */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {(['전체', '미납', '완납', '부분납부'] as const).map(f => {
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: active ? `1.5px solid ${BLUE}` : '1px solid #e5e8eb', background: active ? '#EBF5FF' : '#fff', color: active ? BLUE : '#666', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {f} {filterCounts[f]}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div style={{ padding: '0 16px 100px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#b0b8c1', fontSize: 13 }}>데이터가 없어요</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(p => {
                  const isOpen = expanded === p.수납ID;
                  const isPaid = p.상태 === '납부완료';
                  const isPartial = partialMode === p.수납ID;
                  const dplus = getDplus(p);
                  const chargeAmt = Number(p.청구액) || 0;
                  const paidAmt = Number(p.납부액) || 0;
                  const remaining = chargeAmt - paidAmt;
                  const b = badge(p.상태);

                  return (
                    <div key={p.수납ID} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                      <button
                        onClick={() => { if (!isPaid) { setExpanded(isOpen ? null : p.수납ID); setPartialMode(null); } }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: isPaid ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>{p.이름}</span>
                            {!isPaid && dplus > 0 && (
                              <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fff2f2', color: RED }}>D+{dplus}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#b0b8c1' }}>{p.지점명} · {p.방코드}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: isPaid ? '#191919' : RED }}>
                            {fmt(isPaid ? paidAmt : chargeAmt)}
                          </span>
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: b.bg, color: b.color }}>{b.label}</span>
                        </div>
                      </button>

                      {/* Accordion Actions */}
                      {isOpen && !isPaid && (
                        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f2f4f6' }}>
                          {p.상태 === '부분납부' && (
                            <div style={{ fontSize: 12, color: '#888', padding: '10px 0 8px' }}>
                              청구 {fmt(chargeAmt)} · 납부 {fmt(paidAmt)} · 잔액 {fmt(remaining)}
                            </div>
                          )}
                          {!isPartial ? (
                            <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
                              <button onClick={() => markPaid(p)} disabled={saving}
                                style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>
                                납부 완료
                              </button>
                              <button onClick={() => { setPartialMode(p.수납ID); setPartialAmount(''); }}
                                style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                부분납부
                              </button>
                            </div>
                          ) : (
                            <div style={{ paddingTop: 10 }}>
                              <div style={{ fontSize: 12, color: '#b0b8c1', marginBottom: 6 }}>납부 금액</div>
                              <input type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} placeholder="0"
                                style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #e5e8eb', fontSize: 15, textAlign: 'right', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                              <button onClick={() => markPartial(p)} disabled={saving || !partialAmount}
                                style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving || !partialAmount ? 0.5 : 1 }}>
                                저장
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
