'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, ChevronDown, ChevronUp, ChevronRight, Check, X, FileSpreadsheet } from 'lucide-react';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1';
const fmt = (n: number) => n.toLocaleString() + '원';

type Tab = 'all' | 'unpaid' | 'paid';
type Payment = { 수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 입주자명: string; 연도: string; 월: string; 월세금액: string; 관리비금액: string; 납부여부: string; 납부일: string; 납부방법: string; 메모: string };
type Tenant = { 입주자ID: string; 구: string; 지점명: string; 방코드: string; 이름: string; 상태: string; 월세: string; 관리비: string };

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [districtFilter, setDistrictFilter] = useState('전체');
  const [openDistricts, setOpenDistricts] = useState<Record<string, boolean>>({});
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const [toast, setToast] = useState('');
  // Manual modal
  const [showManual, setShowManual] = useState(false);
  const [manualTenantId, setManualTenantId] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/payments?year=${year}&month=${month}`).then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([payData, tenantData]) => {
      setPayments(Array.isArray(payData) ? payData : []);
      setTenants(Array.isArray(tenantData) ? tenantData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [month, year]);

  // Merge: tenants with payment status for this month
  const tenantPayments = useMemo(() => {
    const activeTenants = tenants.filter(t => t.상태 === '입주중' || t.상태 === '계약중');
    return activeTenants.map(t => {
      const pay = payments.find(p => p.입주자ID === t.입주자ID);
      const isPaid = pay?.납부여부 === '납부';
      return {
        ...t,
        paymentId: pay?.수납ID || '',
        paid: isPaid,
        rentAmount: Number(pay?.월세금액 || t.월세 || 0),
        paidDate: pay?.납부일 || '',
      };
    });
  }, [tenants, payments]);

  const unpaid = tenantPayments.filter(t => !t.paid);
  const paid = tenantPayments.filter(t => t.paid);
  const totalUnpaid = unpaid.reduce((s, t) => s + t.rentAmount, 0);
  const totalPaid = paid.reduce((s, t) => s + t.rentAmount, 0);
  const total = tenantPayments.length;
  const rate = total > 0 ? Math.round((paid.length / total) * 100) : 0;

  const filtered = useMemo(() => {
    let list = tenantPayments;
    if (tab === 'unpaid') list = list.filter(t => !t.paid);
    if (tab === 'paid') list = list.filter(t => t.paid);
    if (districtFilter !== '전체') list = list.filter(t => t.구 === districtFilter);
    return list;
  }, [tenantPayments, tab, districtFilter]);

  // Group by 구
  const districtData = useMemo(() => {
    const map: Record<string, { unpaid: number; paid: number; tenants: typeof filtered }> = {};
    for (const t of filtered) {
      const d = t.구 || '미지정';
      if (!map[d]) map[d] = { unpaid: 0, paid: 0, tenants: [] };
      map[d].tenants.push(t);
      if (t.paid) map[d].paid++; else map[d].unpaid++;
    }
    return map;
  }, [filtered]);

  const districts = useMemo(() => {
    const set = new Set(tenants.map(t => t.구).filter(Boolean));
    return ['전체', ...Array.from(set).sort()];
  }, [tenants]);

  const markPaid = async (paymentId: string, tenantId: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (paymentId) {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, 납부여부: '납부', 납부일: today, 납부방법: '수동' }),
      });
    }
    setPayments(prev => prev.map(p =>
      p.수납ID === paymentId ? { ...p, 납부여부: '납부', 납부일: today } : p
    ));
    showToast('납부 처리됐어요!');
  };

  const submitManual = async () => {
    if (!manualTenantId || !manualAmount) return;
    const t = tenants.find(x => x.입주자ID === manualTenantId);
    if (!t) return;
    const today = manualDate || new Date().toISOString().split('T')[0];
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        입주자ID: t.입주자ID, 지점명: t.지점명, 방코드: t.방코드, 입주자명: t.이름,
        연도: String(year), 월: String(month),
        월세금액: manualAmount, 관리비금액: '', 납부여부: '납부', 납부일: today, 납부방법: '수동',
      }),
    });
    // Refresh
    const payData = await fetch(`/api/payments?year=${year}&month=${month}`).then(r => r.json());
    setPayments(Array.isArray(payData) ? payData : []);
    setShowManual(false);
    showToast('입금 등록 완료!');
  };

  const handleKpiClick = (t: Tab) => { setTab(t); setDistrictFilter('전체'); };
  const toggleDistrict = (d: string) => setOpenDistricts(prev => ({ ...prev, [d]: !prev[d] }));
  const prevMonth = () => setMonth(m => m > 1 ? m - 1 : m);
  const nextMonth = () => setMonth(m => m < 12 ? m + 1 : m);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>수납 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>수납 관리</span>
        </div>
        <button onClick={() => { setShowManual(true); setManualTenantId(null); setManualAmount(''); setManualDate(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
          <Plus size={14} /> 입금
        </button>
      </div>

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 16px', background: '#fff' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{year}년 {month}월</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>›</button>
      </div>

      <div style={{ padding: 16 }}>
        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <KpiCard active={tab === 'unpaid'} onClick={() => handleKpiClick('unpaid')} label="미납자" value={`${unpaid.length}명`} sub={fmt(totalUnpaid)} color={RED} />
          <KpiCard active={tab === 'paid'} onClick={() => handleKpiClick('paid')} label="납부완료" value={`${paid.length}명`} sub={fmt(totalPaid)} color={GREEN} />
          <KpiCard active={tab === 'all'} onClick={() => handleKpiClick('all')} label="수납률" value={`${rate}%`} sub={`${paid.length} / ${total}명`} color={BLUE} />
          <KpiCard active={false} onClick={() => {}} label="이달 대상" value={`${total}명`} sub="입주중 기준" color={GRAY} />
        </div>

        {/* Progress */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>수납 진행률</span>
            <span style={{ fontSize: 12, color: GRAY }}>{paid.length} / {total}명</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#F2F4F6', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${rate}%`, background: GREEN, borderRadius: 4 }} />
            {rate < 100 && <div style={{ flex: 1, background: RED, borderRadius: '0 4px 4px 0' }} />}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: GREEN, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, display: 'inline-block' }} /> 납부완료</span>
            <span style={{ fontSize: 11, color: RED, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: RED, display: 'inline-block' }} /> 미납</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: '#F2F4F6', borderRadius: 10, padding: 3 }}>
          {([['all', '전체'], ['unpaid', `미납 ${unpaid.length}`], ['paid', `납부완료 ${paid.length}`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: tab === key ? 700 : 500, background: tab === key ? '#fff' : 'transparent', color: tab === key ? '#191919' : GRAY, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* District Filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, WebkitOverflowScrolling: 'touch' }}>
          {districts.map(d => (
            <button key={d} onClick={() => setDistrictFilter(d)}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `1px solid ${districtFilter === d ? BLUE : '#E8E8E8'}`, background: districtFilter === d ? '#EBF4FF' : '#fff', color: districtFilter === d ? BLUE : '#666', fontSize: 12, fontWeight: districtFilter === d ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
              {d}
            </button>
          ))}
        </div>

        {/* District Accordion */}
        {Object.entries(districtData).map(([district, data]) => {
          const isOpen = openDistricts[district] !== false;
          return (
            <div key={district} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
              <button onClick={() => toggleDistrict(district)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{district}</span>
                  {data.unpaid > 0 && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#FFF0F0', color: RED }}>미납 {data.unpaid}</span>}
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF5', color: GREEN }}>납부 {data.paid}</span>
                </div>
                {isOpen ? <ChevronUp size={16} color="#999" /> : <ChevronDown size={16} color="#999" />}
              </button>
              {isOpen && data.tenants.map((t, i) => (
                <div key={t.입주자ID}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                  <button onClick={() => router.push(`/payments/${t.입주자ID}`)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.paid ? '#E8FBF5' : '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: t.paid ? GREEN : RED, flexShrink: 0 }}>
                      {(t.이름 || '?')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{t.이름}</div>
                      <div style={{ fontSize: 11, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.지점명} {t.방코드}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.paid ? GREEN : RED }}>{fmt(t.rentAmount)}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: t.paid ? GREEN : RED }}>{t.paid ? '납부' : '미납'}</span>
                    </div>
                    <ChevronRight size={16} color="#CCC" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {Object.keys(districtData).length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY }}>
            <p style={{ fontSize: 14 }}>{payments.length === 0 ? '이달 수납 데이터가 없어요' : '해당 조건의 입주자가 없어요'}</p>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      {showManual && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowManual(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{manualTenantId ? '입금 등록' : '입주자 선택'}</span>
              <button onClick={() => setShowManual(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            {!manualTenantId ? (
              <>
                {unpaid.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: RED, marginBottom: 8 }}>미납자</div>
                    {unpaid.map(t => (
                      <button key={t.입주자ID} onClick={() => { setManualTenantId(t.입주자ID); setManualAmount(String(t.rentAmount)); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid #F5F5F5', background: '#fff', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: RED }}>{(t.이름 || '?')[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{t.이름}</div>
                          <div style={{ fontSize: 11, color: GRAY }}>{t.지점명} {t.방코드}</div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: RED }}>{fmt(t.rentAmount)}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                {(() => {
                  const t = tenants.find(x => x.입주자ID === manualTenantId);
                  return t ? (
                    <>
                      <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.이름}</div>
                        <div style={{ fontSize: 12, color: GRAY }}>{t.지점명} {t.방코드}</div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>금액</label>
                        <input value={manualAmount} onChange={e => setManualAmount(e.target.value)} type="number" placeholder="0"
                          style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>입금일</label>
                        <input value={manualDate} onChange={e => setManualDate(e.target.value)} type="date"
                          style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <button onClick={submitManual}
                        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        등록 완료
                      </button>
                    </>
                  ) : null;
                })()}
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

function KpiCard({ active, onClick, label, value, sub, color }: { active: boolean; onClick: () => void; label: string; value: string; sub: string; color: string }) {
  return (
    <button onClick={onClick}
      style={{ background: active ? '#EBF4FF' : '#fff', borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${active ? BLUE : '#F2F4F6'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{sub}</div>
    </button>
  );
}
