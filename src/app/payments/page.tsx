'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#E24B4A', GREEN = '#00B493', YELLOW = '#F59E0B';
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

export default function PaymentsPage() {
  const router = useRouter();
  const kst = kstNow();
  const [items, setItems] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, unpaid: 0, partial: 0, paidRate: 0, paidAmount: 0, unpaidAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(kst.y);
  const [month, setMonth] = useState(kst.m);
  const isFuture = year > kst.y || (year === kst.y && month >= kst.m);

  const [tab, setTab] = useState(0); // 0=미납, 1=전체, 2=청구생성
  const [subFilter, setSubFilter] = useState('전체');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [partialMode, setPartialMode] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ created: number; target: number } | null>(null);
  const [activeTenantCount, setActiveTenantCount] = useState(0);
  const [genMonthCount, setGenMonthCount] = useState(0);

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

  useEffect(() => {
    fetch('/api/tenants')
      .then(r => r.json())
      .then(d => {
        const active = (Array.isArray(d) ? d : []).filter((t: Record<string, string>) => t['상태'] === '입주중');
        setActiveTenantCount(active.length);
      })
      .catch(() => {});
  }, []);

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
    } finally {
      setSaving(false);
    }
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
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    setGenResult(null);
    const genMonth = isFuture ? month : (month === 12 ? 1 : month + 1);
    const genYear = month === 12 && !isFuture ? year + 1 : year;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', year: genYear, month: genMonth }),
      });
      const d = await res.json();
      setGenResult({ created: d.created || 0, target: d.target || 0 });
    } catch {
    } finally {
      setGenerating(false);
    }
  };

  const unpaidItems = items.filter(p => p.상태 !== '납부완료').sort((a, b) => {
    const da = a.납부일 || a.연월;
    const db = b.납부일 || b.연월;
    return da.localeCompare(db);
  });

  const getDplus = (p: Payment) => {
    const ym = p.연월;
    if (!ym) return 0;
    const [y2, m2] = ym.split('-').map(Number);
    const due = new Date(y2, m2, 0);
    const today = new Date(kst.y, kst.m - 1, kst.d);
    const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const filteredAll = items.filter(p => {
    if (subFilter === '완납') return p.상태 === '납부완료';
    if (subFilter === '미납') return p.상태 === '미납';
    if (subFilter === '부분납부') return p.상태 === '부분납부';
    return true;
  });

  const genMonth = isFuture ? month : (month === 12 ? 1 : month + 1);
  const genYear = month === 12 && !isFuture ? year + 1 : year;

  // 청구생성 대상 월 데이터 존재 확인
  useEffect(() => {
    setGenMonthCount(0);
    fetch(`/api/payments?year=${genYear}&month=${String(genMonth).padStart(2, '0')}`)
      .then(r => r.json())
      .then(d => { setGenMonthCount((d.items || []).length); })
      .catch(() => {});
  }, [genYear, genMonth]);

  const statusBadge = (status: string) => {
    if (status === '납부완료') return { bg: '#D1FAE5', color: GREEN, label: '완납' };
    if (status === '부분납부') return { bg: '#FEF3C7', color: YELLOW, label: '부분' };
    return { bg: '#FEE2E2', color: RED, label: '미납' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 8 }}>수납 관리</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer' }}>◀</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>{year}.{String(month).padStart(2, '0')}</span>
          <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 16, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer' }}>▶</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ background: '#fff', padding: '24px 20px', display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>미납</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: RED }}>{summary.unpaid + (summary.partial || 0)}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{fmt(summary.unpaidAmount)}</div>
            </div>
            <div style={{ width: 1, background: '#f0f0f0', margin: '0 16px' }} />
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>납부율</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: GREEN }}>{summary.paidRate}%</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{summary.paid} / {summary.total}명</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
            {[
              { label: `미납 ${summary.unpaid + (summary.partial || 0)}`, color: RED },
              { label: `전체 ${summary.total}`, color: '#111' },
              { label: '청구생성', color: '#111' },
            ].map((t, i) => (
              <button key={i} onClick={() => setTab(i)}
                style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${i === 0 ? RED : BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? t.color : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 0: 미납 */}
          {tab === 0 && (
            <div style={{ padding: 16 }}>
              {unpaidItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>미납 건이 없어요</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {unpaidItems.sort((a, b) => getDplus(b) - getDplus(a)).map(p => {
                    const isOpen = expanded === p.수납ID;
                    const isPartial = partialMode === p.수납ID;
                    const dplus = getDplus(p);
                    const remaining = (Number(p.청구액) || 0) - (Number(p.납부액) || 0);
                    return (
                      <div key={p.수납ID} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f2f3f5', overflow: 'hidden' }}>
                        <button onClick={() => { setExpanded(isOpen ? null : p.수납ID); setPartialMode(null); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: '#191f28' }}>{p.이름}</span>
                              {dplus > 0 && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }}>D+{dplus}</span>}
                              {p.상태 === '부분납부' && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: YELLOW }}>부분</span>}
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>{p.지점명} · {p.방코드}</div>
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: RED }}>{fmt(remaining)}</span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f2f4f6' }}>
                            {p.상태 === '부분납부' && (
                              <div style={{ fontSize: 12, color: '#888', padding: '10px 0 8px' }}>
                                청구 {fmt(Number(p.청구액) || 0)} · 납부 {fmt(Number(p.납부액) || 0)} · 잔액 {fmt(remaining)}
                              </div>
                            )}
                            {!isPartial ? (
                              <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
                                <button onClick={() => markPaid(p)} disabled={saving}
                                  style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>
                                  납부 완료
                                </button>
                                <button onClick={() => { setPartialMode(p.수납ID); setPartialAmount(''); }}
                                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  부분납부
                                </button>
                              </div>
                            ) : (
                              <div style={{ paddingTop: 10 }}>
                                <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>납부 금액</div>
                                <input type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} placeholder="0"
                                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e8eb', fontSize: 14, textAlign: 'right', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                                <button onClick={() => markPartial(p)} disabled={saving || !partialAmount}
                                  style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving || !partialAmount ? 0.5 : 1 }}>
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
          )}

          {/* Tab 1: 전체 */}
          {tab === 1 && (
            <div style={{ padding: 16 }}>
              {/* Sub filter */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['전체', '완납', '미납', '부분납부'].map(f => (
                  <button key={f} onClick={() => setSubFilter(f)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: subFilter === f ? `1.5px solid ${BLUE}` : '1px solid #e5e8eb', background: subFilter === f ? '#EFF6FF' : '#fff', color: subFilter === f ? BLUE : '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f2f3f5', overflow: 'hidden' }}>
                {filteredAll.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: GRAY, fontSize: 13 }}>데이터가 없어요</div>
                ) : filteredAll.map((p, i) => {
                  const badge = statusBadge(p.상태);
                  return (
                    <div key={p.수납ID} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#191f28', marginBottom: 2 }}>{p.이름}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{p.지점명} · {p.방코드}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(p.상태 === '납부완료' ? (Number(p.납부액) || 0) : (Number(p.청구액) || 0))}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: 청구생성 */}
          {tab === 2 && (
            <div style={{ padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f2f3f5' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28', marginBottom: 16 }}>청구 생성</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: '#555' }}>생성 월</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{genYear}년 {genMonth}월</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: '#555' }}>대상</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>입주중 {activeTenantCount}명</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: '#555' }}>청구 기준</span>
                  <span style={{ fontSize: 13, color: '#888' }}>입주자 월세 + 관리비</span>
                </div>

                {genMonthCount > 0 && (
                  <div style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 12 }}>
                    현재 {genMonthCount}건의 청구가 생성되어 있습니다.
                  </div>
                )}

                <button onClick={generate} disabled={generating || genMonthCount > 0}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 600, cursor: generating || genMonthCount > 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generating || genMonthCount > 0 ? 0.4 : 1 }}>
                  {generating ? '생성 중...' : genMonthCount > 0 ? `${genMonth}월 청구가 이미 생성되어 있습니다` : `${genMonth}월 청구 ${activeTenantCount}건 생성`}
                </button>

                {genResult && (
                  <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#F0FDF4', fontSize: 13, color: GREEN, fontWeight: 600, textAlign: 'center' }}>
                    {genResult.created}건 생성 완료 (대상 {genResult.target}명)
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
