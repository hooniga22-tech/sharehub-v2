'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#16A34A', RED = '#E24B4A';
const fmt = (n: number) => n.toLocaleString() + '원';

type House = { investId: string; houseName: string; investorRatio: number; jaehoonRatio: number; isJoint: boolean; memo: string };
type Investor = { id: string; name: string; phone: string; account: string; token: string; houses: House[] };
type Tenant = Record<string, string>;

export default function InvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');
  const [copiedName, setCopiedName] = useState('');
  const [settlementStatus, setSettlementStatus] = useState<Record<string, string>>({});

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
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

  useEffect(() => {
    Promise.all([
      fetch('/api/investors').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([invData, tenantData]) => {
      setInvestors(Array.isArray(invData) ? invData : []);
      setTenants(Array.isArray(tenantData) ? tenantData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Revenue by house (active tenants: 입주중/계약중)
  const revenueByHouse = useMemo(() => {
    const map = new Map<string, number>();
    const active = tenants.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중');
    for (const t of active) {
      const house = t['지점명'] || '';
      const rent = (Number(t['월세']) || 0) + (Number(t['관리비']) || 0);
      map.set(house, (map.get(house) || 0) + rent);
    }
    return map;
  }, [tenants]);

  const getHouseShare = (h: House) => {
    const revenue = revenueByHouse.get(h.houseName) || 0;
    return Math.round(revenue * (h.investorRatio / 100));
  };

  const getInvestorTotal = (inv: Investor) => inv.houses.reduce((s, h) => s + getHouseShare(h), 0);

  const toggle = (name: string) => setExpanded(p => ({ ...p, [name]: !p[name] }));

  const copyLink = (inv: Investor) => {
    if (!inv.token) return;
    navigator.clipboard?.writeText(`${window.location.origin}/investor/${inv.token}`);
    setCopiedName(inv.name);
    setTimeout(() => setCopiedName(''), 1500);
  };

  // Settlement rows: flatten investors × houses
  const allSettlementRows = useMemo(() => {
    const rows: { inv: Investor; house: House; share: number }[] = [];
    for (const inv of investors) {
      for (const h of inv.houses) {
        rows.push({ inv, house: h, share: getHouseShare(h) });
      }
    }
    return rows;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investors, revenueByHouse]);

  const totalSettlement = allSettlementRows.reduce((s, r) => s + r.share, 0);

  const toggleStatus = (investId: string) => {
    setSettlementStatus(prev => {
      const cur = prev[investId] || '미완료';
      return { ...prev, [investId]: cur === '완료' ? '미완료' : '완료' };
    });
  };

  const doneCount = allSettlementRows.filter(r => settlementStatus[r.house.investId] === '완료').length;
  const undoneCount = allSettlementRows.length - doneCount;

  const tabLabels = ['투자자', '이달 정산'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>투자자 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 8 }}>투자자 관리</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {tabLabels.map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab 0: 투자자 */}
      {tab === 0 && (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: GRAY, marginBottom: 12 }}>총 {investors.length}명</div>

          {investors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>등록된 투자자가 없어요</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {investors.map((inv) => {
                const isOpen = !!expanded[inv.id];
                const total = getInvestorTotal(inv);
                return (
                  <div key={inv.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
                    {/* Accordion Header */}
                    <button onClick={() => toggle(inv.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: '#191f28' }}>{inv.name}</div>
                        <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>
                          {inv.houses.length}개 지점
                          {inv.account && <span style={{ marginLeft: 8 }}>{inv.account}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 600, color: BLUE, marginRight: 8 }}>{fmt(total)}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                        <path d="M9 18L15 12L9 6" stroke="#c4c9d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #f2f4f6' }}>
                        {inv.houses.map((h, i) => {
                          const revenue = revenueByHouse.get(h.houseName) || 0;
                          const share = getHouseShare(h);
                          return (
                            <div key={h.investId} style={{ padding: '14px 18px', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: 500, color: '#191f28' }}>{h.houseName}</span>
                                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#EFF6FF', color: '#1E40AF' }}>{h.investorRatio}%</span>
                                  {h.isJoint && <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>공동</span>}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>{fmt(share)}</span>
                              </div>
                              <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>월세합계 {fmt(revenue)} x {h.investorRatio}%</div>
                              <div style={{ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(h.investorRatio, 100)}%`, height: '100%', background: BLUE, borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}

                        {/* Actions */}
                        <div style={{ padding: '12px 18px', borderTop: '1px solid #f2f4f6', display: 'flex', gap: 8 }}>
                          {inv.token && (
                            <>
                              <button onClick={() => window.open(`/investor/${inv.token}`, '_blank')}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                개인 페이지
                              </button>
                              <button onClick={() => copyLink(inv)}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', color: '#888', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {copiedName === inv.name ? '복사됨' : '링크 복사'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: 이달 정산 */}
      {tab === 1 && (
        <div style={{ padding: 16 }}>
          {/* Month Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 16, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{year}년 {month}월</span>
              <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 16, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: '0 8px' }}>▶</button>
            </div>
          </div>

          {/* Settlement Table */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#fafafa', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ flex: 1, fontSize: 11, color: GRAY }}>투자자</span>
              <span style={{ width: 60, fontSize: 11, color: GRAY }}>지점</span>
              <span style={{ width: 40, textAlign: 'center', fontSize: 11, color: GRAY }}>비율</span>
              <span style={{ width: 80, textAlign: 'right', fontSize: 11, color: GRAY }}>정산액</span>
              <span style={{ width: 50, textAlign: 'center', fontSize: 11, color: GRAY }}>상태</span>
            </div>

            {allSettlementRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY, fontSize: 13 }}>데이터가 없어요</div>
            ) : (
              <>
                {allSettlementRows.map(({ inv, house, share }, i, arr) => {
                  const status = settlementStatus[house.investId] || '미완료';
                  const isDone = status === '완료';
                  return (
                    <div key={house.investId} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : '1px solid #f0f0f0' }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#191f28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.name}</span>
                      <span style={{ width: 60, fontSize: 12, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{house.houseName}</span>
                      <span style={{ width: 40, textAlign: 'center', fontSize: 11, color: '#1E40AF', fontWeight: 600 }}>{house.investorRatio}%</span>
                      <span style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, color: BLUE }}>{fmt(share)}</span>
                      <div style={{ width: 50, textAlign: 'center' }}>
                        <button onClick={() => toggleStatus(house.investId)}
                          style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: isDone ? '#D1FAE5' : '#FEE2E2', color: isDone ? GREEN : RED }}>
                          {status}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Total */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa' }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#191f28' }}>합계</span>
                  <span style={{ width: 60 }} />
                  <span style={{ width: 40 }} />
                  <span style={{ width: 80, textAlign: 'right', fontSize: 14, fontWeight: 700, color: BLUE }}>{fmt(totalSettlement)}</span>
                  <span style={{ width: 50, textAlign: 'center', fontSize: 10, color: GRAY }}>
                    {doneCount}/{allSettlementRows.length}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 12, color: GRAY }}>
            <span>완료 <span style={{ fontWeight: 600, color: GREEN }}>{doneCount}건</span></span>
            <span>미완료 <span style={{ fontWeight: 600, color: RED }}>{undoneCount}건</span></span>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
