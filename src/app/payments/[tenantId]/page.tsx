'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, MessageSquare, Check, Plus, X } from 'lucide-react';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1';
const fmt = (n: number) => n.toLocaleString() + '원';

type Payment = { 수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 입주자명: string; 연도: string; 월: string; 월세금액: string; 관리비금액: string; 납부여부: string; 납부일: string; 납부방법: string; 메모: string };
type Tenant = Record<string, string>;

export default function PaymentDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regAmount, setRegAmount] = useState('');
  const [regDate, setRegDate] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    Promise.all([
      fetch(`/api/payments?tenantId=${tenantId}`).then(r => r.json()),
      fetch(`/api/tenants?id=${tenantId}`).then(r => r.ok ? r.json() : null),
    ]).then(([payData, tenantData]) => {
      setPayments(Array.isArray(payData) ? payData : []);
      setTenant(tenantData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tenantId]);

  const markPaid = async (paymentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentId, 납부여부: '납부', 납부일: today, 납부방법: '수동' }),
    });
    setPayments(prev => prev.map(p =>
      p.수납ID === paymentId ? { ...p, 납부여부: '납부', 납부일: today } : p
    ));
    showToast('납부 처리됐어요!');
  };

  const handleRegister = async () => {
    if (!tenant || !regAmount) return;
    const today = regDate || new Date().toISOString().split('T')[0];
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        입주자ID: tenantId, 지점명: tenant.지점명, 방코드: tenant.방코드, 입주자명: tenant.이름,
        월세금액: regAmount, 납부여부: '납부', 납부일: today, 납부방법: '수동',
      }),
    });
    const payData = await fetch(`/api/payments?tenantId=${tenantId}`).then(r => r.json());
    setPayments(Array.isArray(payData) ? payData : []);
    setShowRegister(false);
    showToast('입금 등록 완료!');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/payments')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>납부 상세</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/payments')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>납부 상세</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBB' }}>입주자를 찾을 수 없어요</p>
        </div>
      </div>
    );
  }

  const unpaidPayments = payments.filter(p => p.납부여부 !== '납부');
  const paidPayments = payments.filter(p => p.납부여부 === '납부');
  const hasUnpaid = unpaidPayments.length > 0;
  const rent = Number(tenant.월세 || 0);
  const deposit = Number(tenant.보증금 || 0);

  // Group paid by month
  const monthGroups: Record<string, Payment[]> = {};
  for (const p of paidPayments) {
    const key = `${p.연도}.${p.월.padStart(2, '0')}`;
    if (!monthGroups[key]) monthGroups[key] = [];
    monthGroups[key].push(p);
  }
  const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/payments')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>납부 상세</span>
        </div>
        {hasUnpaid && (
          <button onClick={() => { setShowRegister(true); setRegAmount(String(rent)); setRegDate(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            <Plus size={14} /> 입금등록
          </button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {/* Profile */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: hasUnpaid ? '#FFF0F0' : '#E8FBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: hasUnpaid ? RED : GREEN, flexShrink: 0 }}>
              {(tenant.이름 || '?')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{tenant.이름}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: hasUnpaid ? '#FFF0F0' : '#E8FBF5', color: hasUnpaid ? RED : GREEN }}>
                  {hasUnpaid ? '미납' : '납부완료'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{tenant.지점명} {tenant.방코드} · {tenant.연락처}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '월세', value: fmt(rent), color: '#191919' },
              { label: '보증금', value: fmt(deposit), color: '#191919' },
              { label: '상태', value: tenant.상태 || '-', color: hasUnpaid ? RED : GREEN },
              { label: '납부 내역', value: `${paidPayments.length}건`, color: '#191919' },
            ].map(item => (
              <div key={item.label} style={{ background: '#F7F8FA', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {hasUnpaid && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: '1px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                <MessageSquare size={14} /> 카카오 독촉
              </button>
              <button onClick={() => { setShowRegister(true); setRegAmount(String(rent)); setRegDate(''); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: 'none', background: BLUE, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Check size={14} /> 입금 등록
              </button>
            </div>
          )}
        </div>

        {/* Unpaid */}
        {unpaidPayments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>처리 필요 {unpaidPayments.length}건</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #FEE2E2' }}>
              {unpaidPayments.map((p, i) => (
                <div key={p.수납ID}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: RED }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{p.연도}년 {p.월}월 월세</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: RED }}>{Number(p.월세금액) > 0 ? fmt(Number(p.월세금액)) : '—'}</span>
                      <button onClick={() => markPaid(p.수납ID)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${BLUE}`, background: '#fff', fontSize: 11, fontWeight: 600, color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>
                        납부
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paid History */}
        {sortedMonths.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>납부 이력</span>
            </div>
            {sortedMonths.map(month => {
              const items = monthGroups[month];
              return (
                <div key={month} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F5F5F5' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{month.replace('.', '년 ')}월</span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF5', color: GREEN }}>납부</span>
                  </div>
                  {items.map((p, i) => (
                    <div key={p.수납ID}>
                      {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>월세</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>{fmt(Number(p.월세금액) || 0)}</span>
                          <span style={{ fontSize: 11, color: GRAY }}>{p.납부일?.slice(5)}</span>
                          <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: '#E8FBF5', color: GREEN }}>납부</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {payments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY }}>
            <p style={{ fontSize: 14 }}>수납 내역이 없어요</p>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowRegister(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>입금 등록</span>
              <button onClick={() => setShowRegister(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{tenant.이름}</div>
              <div style={{ fontSize: 12, color: GRAY }}>{tenant.지점명} {tenant.방코드}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>금액</label>
              <input value={regAmount} onChange={e => setRegAmount(e.target.value)} type="number" placeholder="0"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>입금일</label>
              <input value={regDate} onChange={e => setRegDate(e.target.value)} type="date"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button onClick={handleRegister}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              등록 완료
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
