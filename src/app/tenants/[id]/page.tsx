'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useParams, useRouter } from 'next/navigation';
import { Phone, MessageSquare, FileText, Plus, X, Check } from 'lucide-react';
import { getMonthlyCharge } from '@/lib/prorata';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#d97706';
const fmt = (n: number) => n.toLocaleString() + '원';

type Tenant = Record<string, string>;
type Payment = { 수납ID: string; 연도: string; 월: string; 월세금액: string; 관리비금액: string; 납부여부: string; 납부일: string; 납부방법: string };
type Issue = { id: string; title: string; category: string; status: string; createdAt: string };

const calcDday = (dateStr: string): number => {
  if (!dateStr) return 0;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const statusBadge: Record<string, { bg: string; color: string }> = {
  '입주중': { bg: '#e8faf2', color: '#0e6245' },
  '계약중': { bg: '#e8faf2', color: '#0e6245' },
  '공실예정': { bg: '#fff8e1', color: '#b7791f' },
  '퇴실완료': { bg: '#f2f4f6', color: GRAY },
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: tenant, isLoading: tenantLoading, mutate: mutateTenant } = useSWR<Tenant | null>(
    id ? `/api/tenants?id=${id}` : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const { data: rawPayments, mutate: mutatePayments } = useSWR<Payment[]>(
    id ? `/api/payments?tenantId=${id}` : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const payments = Array.isArray(rawPayments) ? rawPayments : [];
  const { data: issueData } = useSWR(
    tenant ? `/api/issues?house=${encodeURIComponent(tenant.지점명 || '')}&room=${encodeURIComponent(tenant.방코드 || '')}` : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const issues: Issue[] = issueData?.issues || [];
  const loading = tenantLoading;

  const [memo, setMemo] = useState('');
  const [editMemo, setEditMemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paySheet, setPaySheet] = useState<Payment | null>(null);
  const [payMethod, setPayMethod] = useState('계좌이체');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    if (tenant?.메모 !== undefined) setMemo(tenant.메모 || '');
  }, [tenant?.메모]);

  useEffect(() => {
    document.body.style.overflow = paySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [paySheet]);

  const handleSaveMemo = async () => {
    if (!tenant) return;
    setSaving(true);
    await fetch('/api/tenants', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenant.입주자ID, 메모: memo }),
    });
    mutateTenant({ ...tenant, 메모: memo }, false);
    setSaving(false); setEditMemo(false);
    showToast('메모가 저장됐어요');
  };

  const handlePayRegister = async () => {
    if (!paySheet) return;
    await fetch('/api/payments', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paySheet.수납ID, 납부여부: '납부', 납부일: payDate, 납부방법: payMethod }),
    });
    mutatePayments(payments.map(p =>
      p.수납ID === paySheet.수납ID ? { ...p, 납부여부: '납부', 납부일: payDate, 납부방법: payMethod } : p
    ), false);
    setPaySheet(null);
    showToast('납부 등록 완료!');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>입주자 상세</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>입주자 상세</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBB' }}>입주자를 찾을 수 없어요</p>
        </div>
      </div>
    );
  }

  const status = tenant.상태 || '입주중';
  const badge = statusBadge[status] || statusBadge['입주중'];
  const dday = calcDday(tenant.퇴실일);
  const rent = Number(tenant.월세) || 0;
  const mgmt = Number(tenant.관리비) || 0;
  const deposit = Number(tenant.보증금) || 0;

  const now = new Date();
  const charge = getMonthlyCharge(rent, mgmt, tenant.입주일 || '', now.getFullYear(), now.getMonth() + 1);

  const sortedPayments = [...payments].sort((a, b) => {
    const aKey = `${a.연도}.${a.월.padStart(2, '0')}`;
    const bKey = `${b.연도}.${b.월.padStart(2, '0')}`;
    return bKey.localeCompare(aKey);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>입주자 상세</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {tenant?.['링크토큰'] && (
            <button onClick={() => window.open(`${window.location.origin}/tenant/${tenant['링크토큰']}`, '_blank')}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', color: '#191f28', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              링크
            </button>
          )}
          <button onClick={() => window.open(`/contract/${id}`, '_blank')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            <FileText size={13} /> 계약서
          </button>
        </div>
      </div>

      {/* Section 1: Profile */}
      <div style={{ background: '#fff', padding: '24px 16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            {(tenant.이름 || '?')[0]}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>{tenant.이름}</h2>
          <p style={{ fontSize: 13, color: GRAY, marginTop: 2 }}>{tenant.지점명} · {tenant.방코드}{tenant.국적 ? ` · ${tenant.국적}` : ''}</p>
          <span style={{ marginTop: 8, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>{status}</span>
        </div>
        {tenant.연락처 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`tel:${tenant.연락처}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, border: '1px solid #F0F0F0', fontSize: 14, fontWeight: 500, color: '#191919', textDecoration: 'none' }}>
              <Phone size={16} /> 전화
            </a>
            <button onClick={() => showToast('알림톡 발송 준비 중')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, background: BLUE, fontSize: 14, fontWeight: 500, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <MessageSquare size={16} /> 알림톡
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Contract */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>계약 정보</h3>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { l: '지점·호실', v: `${tenant.지점명} ${tenant.방코드}` },
            { l: '입주일', v: tenant.입주일 || '-' },
            { l: '계약만료', v: tenant.퇴실일 || '-' },
            { l: '잔여기간', v: dday > 0 ? `D-${dday}` : '만료', c: dday > 30 ? BLUE : RED },
            { l: '월세', v: fmt(rent) },
            { l: '관리비', v: fmt(mgmt) },
            { l: '보증금', v: fmt(deposit) },
          ].map((row, i) => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < 6 ? '1px solid #f2f4f6' : 'none' }}>
              <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: (row as { c?: string }).c || '#191f28' }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Payments */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>이달 수납</h3>
          {charge.isProrata && (
            <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff8e6', color: '#f59f00' }}>일할계산</span>
          )}
        </div>
        {charge.isProrata && charge.detail && (
          <div style={{ background: '#fff8ed', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59f00', marginBottom: 8 }}>일할계산 내역</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
              <span>월세: {fmt(rent)} ({charge.detail.days}일/{charge.detail.daysInMonth}일)</span>
              <span style={{ fontWeight: 600 }}>{fmt(charge.detail.rentPart)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 8 }}>
              <span>관리비: {fmt(mgmt)} ({charge.detail.days}일/{charge.detail.daysInMonth}일)</span>
              <span style={{ fontWeight: 600 }}>{fmt(charge.detail.mgmtPart)}</span>
            </div>
            <div style={{ height: 1, background: '#f0e4cc', marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#f59f00' }}>
              <span>합계</span>
              <span>{fmt(charge.detail.total)}</span>
            </div>
          </div>
        )}
        {sortedPayments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedPayments.map((p, i) => {
              const isPaid = p.납부여부 === '납부';
              const total = (Number(p.월세금액) || 0) + (Number(p.관리비금액) || 0);
              return (
                <div key={p.수납ID}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.연도}년 {p.월}월</div>
                      <div style={{ fontSize: 11, color: GRAY }}>월세+관리비 {total > 0 ? fmt(total) : '-'}</div>
                    </div>
                    {isPaid ? (
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e8faf2', color: '#0e6245' }}>납부 {p.납부일?.slice(5)}</span>
                    ) : (
                      <button onClick={() => { setPaySheet(p); setPayMethod('계좌이체'); setPayDate(new Date().toISOString().split('T')[0]); }}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: RED, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        미납 · 등록
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: GRAY }}>
            <p style={{ fontSize: 13 }}>수납 내역이 없어요</p>
          </div>
        )}
      </div>

      {/* Section 4: Issues */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>이슈</h3>
          <button onClick={() => router.push('/issues/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={13} /> 등록
          </button>
        </div>
        {issues.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {issues.slice(0, 5).map((issue, i) => {
              const isComplete = issue.status === '완료';
              return (
                <div key={issue.id}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{issue.title}</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{issue.createdAt} · {issue.category}</div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: isComplete ? '#e8faf2' : '#fff8e1', color: isComplete ? '#0e6245' : '#b7791f' }}>
                      {issue.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: GRAY }}>
            <p style={{ fontSize: 13 }}>이슈가 없어요</p>
          </div>
        )}
      </div>

      {/* Section 5: Memo */}
      <div style={{ background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>관리자 메모</h3>
          {editMemo ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditMemo(false); setMemo(tenant.메모 || ''); }} style={{ fontSize: 12, color: GRAY, background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSaveMemo} disabled={saving} style={{ fontSize: 12, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                {saving ? '저장중...' : '저장'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMemo(true)} style={{ fontSize: 12, color: BLUE, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>편집</button>
          )}
        </div>
        {editMemo ? (
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            style={{ width: '100%', minHeight: 80, padding: '10px 12px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none' }} />
        ) : (
          <p style={{ fontSize: 14, color: tenant.메모 ? '#191919' : '#BBBBBB', lineHeight: 1.6 }}>
            {tenant.메모 || '메모가 없어요'}
          </p>
        )}
      </div>

      {/* Payment Registration Sheet */}
      {paySheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setPaySheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>납부 등록</span>
              <button onClick={() => setPaySheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: charge.isProrata ? 12 : 20 }}>{tenant.이름} · {paySheet.연도}년 {paySheet.월}월분</div>

            {charge.isProrata && charge.detail && (
              <div style={{ background: '#fff8ed', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59f00', marginBottom: 8 }}>일할계산 적용</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                  <span>월세 ({charge.detail.days}일/{charge.detail.daysInMonth}일)</span>
                  <span style={{ fontWeight: 600 }}>{fmt(charge.detail.rentPart)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                  <span>관리비 ({charge.detail.days}일/{charge.detail.daysInMonth}일)</span>
                  <span style={{ fontWeight: 600 }}>{fmt(charge.detail.mgmtPart)}</span>
                </div>
                <div style={{ height: 1, background: '#f0e4cc', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#f59f00' }}>
                  <span>청구금액</span>
                  <span>{fmt(charge.detail.total)}</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>납부 방법</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['계좌이체', '현금', '기타'].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${payMethod === m ? BLUE : '#E8E8E8'}`, background: payMethod === m ? '#EBF4FF' : '#fff', color: payMethod === m ? BLUE : '#666', fontSize: 13, fontWeight: payMethod === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>납부일</label>
              <input value={payDate} onChange={e => setPayDate(e.target.value)} type="date"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <button onClick={handlePayRegister}
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
