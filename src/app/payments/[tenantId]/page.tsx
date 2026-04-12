'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, MessageSquare, Check, Plus, X } from 'lucide-react';
import { paymentTenants, paymentRecords, formatWon, type PaymentRecord } from '@/lib/paymentMockData';

export default function PaymentDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [showAllHistory, setShowAllHistory] = useState(false);
  // Manual register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regType, setRegType] = useState<'월세' | '공과금' | '보증금'>('월세');
  const [regAmount, setRegAmount] = useState('');
  const [regDate, setRegDate] = useState('');

  const tenant = paymentTenants.find(t => t.id === tenantId);
  if (!tenant) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/payments')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>납부 상세</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBB' }}>입주자를 찾을 수 없어요</p>
        </div>
      </div>
    );
  }

  const records = paymentRecords.filter(r => r.tenantId === tenantId);
  const currentMonth = '2025.06';
  const unpaidRecords = records.filter(r => r.month === currentMonth && !r.paid);
  const paidRecords = records.filter(r => r.paid);

  // Group paid records by month
  const monthGroups: Record<string, PaymentRecord[]> = {};
  for (const r of paidRecords) {
    if (!monthGroups[r.month]) monthGroups[r.month] = [];
    monthGroups[r.month].push(r);
  }
  const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
  const displayMonths = showAllHistory ? sortedMonths : sortedMonths.slice(0, 3);

  const isUnpaid = tenant.status === 'unpaid';

  const handleRegister = () => {
    if (!regAmount) return;
    alert('입금이 등록되었습니다!');
    setShowRegister(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/payments')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>납부 상세</span>
        </div>
        {isUnpaid && (
          <button onClick={() => setShowRegister(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#3182F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            <Plus size={14} /> 입금등록
          </button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {/* Profile Card */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: isUnpaid ? '#FFF0F0' : '#E8FBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: isUnpaid ? '#F04452' : '#00C471', flexShrink: 0 }}>
              {tenant.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{tenant.name}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: isUnpaid ? '#FFF0F0' : '#E8FBF5', color: isUnpaid ? '#F04452' : '#00C471' }}>
                  {isUnpaid ? '미납' : '납부완료'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>{tenant.district} {tenant.house} {tenant.room} · {tenant.phone}</div>
            </div>
          </div>

          {/* Contract Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '월세', value: formatWon(tenant.monthlyRent), color: '#191919' },
              { label: '납부일', value: `매월 ${tenant.paymentDay}일`, color: '#191919' },
              { label: '보증금', value: `${formatWon(tenant.deposit)} ✓납부완료`, color: '#00C471' },
              { label: '상태', value: isUnpaid ? `미납 D+${tenant.lateDays}` : '납부완료', color: isUnpaid ? '#F04452' : '#00C471' },
            ].map(item => (
              <div key={item.label} style={{ background: '#F7F8FA', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#8B95A1', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Action Buttons for unpaid */}
          {isUnpaid && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: '1px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                <MessageSquare size={14} /> 카카오 독촉
              </button>
              <button onClick={() => setShowRegister(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: 'none', background: '#3182F6', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Check size={14} /> 입금 등록
              </button>
            </div>
          )}
        </div>

        {/* ===== Payment History ===== */}

        {/* Unpaid Section */}
        {unpaidRecords.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F04452', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F04452' }}>처리 필요 {unpaidRecords.length}건</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #FEE2E2' }}>
              <div style={{ padding: '12px 20px', background: '#FFFBFB', borderBottom: '1px solid #FEE2E2' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{currentMonth.replace('.', '년 ')}월</span>
              </div>
              {unpaidRecords.map((r, i) => (
                <div key={r.id}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F04452', display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{r.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#F04452' }}>{r.amount > 0 ? formatWon(r.amount) : '—'}</span>
                      <button onClick={() => setShowRegister(true)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #F04452', background: '#fff', fontSize: 11, fontWeight: 600, color: '#F04452', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {r.amount > 0 ? '등록' : '예정'}
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
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C471', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#00C471' }}>완납 이력</span>
            </div>

            {displayMonths.map(month => {
              const items = monthGroups[month];
              const allPaid = items.every(r => r.paid);
              return (
                <div key={month} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F5F5F5' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{month.replace('.', '년 ')}월</span>
                    {allPaid && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF5', color: '#00C471' }}>완납</span>}
                  </div>
                  {items.map((r, i) => (
                    <div key={r.id}>
                      {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C471', display: 'inline-block' }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{r.type}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>{formatWon(r.amount)}</span>
                          <span style={{ fontSize: 11, color: '#8B95A1' }}>{r.paidDate?.slice(5)}</span>
                          <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: '#E8FBF5', color: '#00C471' }}>납부</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {!showAllHistory && sortedMonths.length > 3 && (
              <button onClick={() => setShowAllHistory(true)}
                style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 500, color: '#8B95A1', cursor: 'pointer', fontFamily: 'inherit' }}>
                이전 이력 더보기
              </button>
            )}
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowRegister(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>입금 등록</span>
              <button onClick={() => setShowRegister(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{tenant.name}</div>
              <div style={{ fontSize: 12, color: '#8B95A1' }}>{tenant.house} {tenant.room}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['월세', '공과금', '보증금'] as const).map(tp => (
                <button key={tp} onClick={() => setRegType(tp)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${regType === tp ? '#3182F6' : '#E8E8E8'}`, background: regType === tp ? '#EBF4FF' : '#fff', color: regType === tp ? '#3182F6' : '#666', fontSize: 13, fontWeight: regType === tp ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {tp}
                </button>
              ))}
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
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#3182F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              등록 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
