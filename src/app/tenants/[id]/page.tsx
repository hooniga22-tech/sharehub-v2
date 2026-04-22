'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useParams, useRouter } from 'next/navigation';
import { Phone, MessageSquare, FileText, Plus } from 'lucide-react';
import { getDaysInMonth } from '@/lib/prorata';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#d97706';
const fmt = (n: number) => n.toLocaleString() + '원';

type Tenant = Record<string, string>;
type Payment = { 수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 이름: string; 연월: string; 청구액: string; 납부액: string; 납부일: string; status: string; 납부방법: string; 메모: string };
type Issue = { id: string; title: string; category: string; status: string; createdAt: string };

const calcDday = (dateStr: string): number => {
  if (!dateStr) return 0;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const statusBadge: Record<string, { bg: string; color: string }> = {
  active: { bg: '#e8faf2', color: '#0e6245' },
  pending: { bg: '#fff8e1', color: '#b7791f' },
  moved_out: { bg: '#f2f4f6', color: GRAY },
  cancelled: { bg: '#f2f4f6', color: GRAY },
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
  const [toast, setToast] = useState('');
  const [payProcessing, setPayProcessing] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelFee, setCancelFee] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelProcessing, setCancelProcessing] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    if (tenant?.메모 !== undefined) setMemo(tenant.메모 || '');
  }, [tenant?.메모]);


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

  const markPaid = async (p: Payment) => {
    if (payProcessing) return;
    setPayProcessing(p.수납ID);
    const todayStr = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\./g, '').trim().split(/\s+/).map(s => s.padStart(2, '0'));
    const payDate = `${todayStr[0]}-${todayStr[1]}-${todayStr[2]}`;
    try {
      await fetch('/api/payments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.수납ID, status: 'paid', 납부액: p.청구액, 납부일: payDate }),
      });
      mutatePayments(payments.map(pp =>
        pp.수납ID === p.수납ID ? { ...pp, status: 'paid', 납부액: pp.청구액, 납부일: payDate } : pp
      ), false);
      showToast('납부 완료 처리됐어요');
    } catch { }
    finally { setPayProcessing(null); }
  };

  const handleCancelContract = async () => {
    if (!tenant || cancelProcessing) return;
    setCancelProcessing(true);
    try {
      const memoAppend = `계약취소: ${cancelReason || '사유없음'} / 위약금: ${cancelFee || '0'}원`;
      const existingMemo = tenant.메모 || '';
      const newMemo = existingMemo ? `${existingMemo} / ${memoAppend}` : memoAppend;

      // Step 1: 상태 + 메모 업데이트
      await fetch('/api/tenants', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenant.입주자ID, 상태: '계약취소', 메모: newMemo }),
      });

      // Step 2: 위약금 수납 등록
      const fee = Number(cancelFee) || 0;
      if (fee > 0) {
        const kst = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\./g, '').trim().split(/\s+/).map(s => s.padStart(2, '0'));
        const todayStr = `${kst[0]}-${kst[1]}-${kst[2]}`;
        const ymStr = `${kst[0]}-${kst[1]}`;
        await fetch('/api/payments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            입주자ID: tenant.입주자ID,
            지점명: tenant.지점명,
            방코드: tenant.방코드,
            이름: tenant.이름,
            연월: ymStr,
            청구액: String(fee),
            납부액: String(fee),
            납부일: todayStr,
            status: 'paid',
            메모: '계약취소 위약금',
          }),
        });
      }

      // Step 3: 완료
      setShowCancelModal(false);
      setCancelFee('');
      setCancelReason('');
      mutateTenant();
      mutatePayments();
      const msg = fee > 0 ? `계약취소 처리 완료. 위약금 ${fee.toLocaleString()}원 수납 등록됨.` : '계약취소 처리 완료.';
      setToast(msg);
      setTimeout(() => setToast(''), 2500);
    } catch {
      showToast('처리 중 오류가 발생했어요');
    } finally {
      setCancelProcessing(false);
    }
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

  const status = tenant.status || 'active';
  const badge = statusBadge[status] || statusBadge['active'];
  const dday = calcDday(tenant.퇴실일);
  const rent = Number(tenant.월세) || 0;
  const mgmt = Number(tenant.관리비) || 0;
  const deposit = Number(tenant.보증금) || 0;

  const now = new Date();

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
            <button onClick={() => window.open(`${window.location.origin}/portal/tenant/${tenant['링크토큰']}`, '_blank')}
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

      {/* Section 3: 납부 내역 C안 */}
      {(() => {
        const kstStr = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
        const [nowY, nowM] = kstStr.replace(/\./g, '').trim().split(/\s+/).map(Number);
        const currentYM = `${nowY}-${String(nowM).padStart(2, '0')}`;

        // 월별 수납 데이터 (연월이 YYYY-MM 형식인 것만)
        const monthlyPayments = payments.filter(p => /^\d{4}-\d{2}$/.test(p.연월));
        const thisMonthPays = monthlyPayments.filter(p => p.연월 === currentYM);
        const unpaidThisMonth = thisMonthPays.filter(p => p.status !== 'paid');
        const allPaid = thisMonthPays.length > 0 && unpaidThisMonth.length === 0;
        const hasUnpaid = unpaidThisMonth.length > 0;

        // 납부 이력 (완납된 것들 + 이전달 전체), 최신순 정렬
        const historyItems = monthlyPayments
          .filter(p => hasUnpaid ? (p.status === 'paid') : true)
          .sort((a, b) => b.연월.localeCompare(a.연월));

        // 월별 그룹화 (같은 연월 합산)
        const groupByMonth = (items: Payment[]) => {
          const map = new Map<string, { ym: string; total: number; date: string; count: number }>();
          for (const p of items) {
            const existing = map.get(p.연월);
            const amt = Number(p.납부액) || Number(p.청구액) || 0;
            if (existing) {
              existing.total += amt;
              existing.count++;
              if (p.납부일 && (!existing.date || p.납부일 > existing.date)) existing.date = p.납부일;
            } else {
              map.set(p.연월, { ym: p.연월, total: amt, date: p.납부일 || '', count: 1 });
            }
          }
          return [...map.values()].sort((a, b) => b.ym.localeCompare(a.ym));
        };

        const grouped = groupByMonth(historyItems);
        const visibleHistory = historyOpen ? grouped : grouped.slice(0, 3);
        const hasMore = grouped.length > 3;

        // 잔금 항목 (초기 납부)
        const moveInDate = tenant.입주일 || '';
        const hasInitial = !!moveInDate;
        const moveD = moveInDate ? new Date(moveInDate) : null;
        const moveDay = moveD ? moveD.getDate() : 1;
        const moveYear = moveD ? moveD.getFullYear() : 0;
        const moveMonth = moveD ? moveD.getMonth() + 1 : 0;
        const daysInMonth = moveYear ? getDaysInMonth(moveYear, moveMonth) : 30;
        const remDays = daysInMonth - moveDay + 1;
        const isProrata = moveDay > 1;
        const firstRent = isProrata ? Math.round(rent / daysInMonth * remDays) : rent;
        const firstMgmt = isProrata ? Math.round(mgmt / daysInMonth * remDays) : mgmt;
        const depositBalance = deposit - 500000;
        const initialTotal = (depositBalance + firstRent) + firstMgmt;

        return (
          <div style={{ marginBottom: 8 }}>
            {/* CASE 1: 미납 있을 때 */}
            {hasUnpaid && (
              <>
                <div style={{ background: '#fff', padding: '12px 16px 6px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#e03131' }}>처리 필요 {unpaidThisMonth.length}건</span>
                </div>
                {unpaidThisMonth.map(p => {
                  const chargeAmt = Number(p.청구액) || 0;
                  return (
                    <div key={p.수납ID} style={{ background: '#fff', padding: '14px 16px', marginBottom: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{nowM}월 월세 + 관리비</div>
                          <div style={{ fontSize: 12, color: '#b0b8c1', marginTop: 2 }}>{tenant.지점명} 계좌</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{fmt(chargeAmt)}</span>
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff2f2', color: '#e03131' }}>미납</span>
                        </div>
                      </div>
                      <button onClick={() => markPaid(p)} disabled={payProcessing === p.수납ID}
                        style={{ width: '100%', padding: 11, borderRadius: 10, border: 'none', background: '#3182F6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: payProcessing === p.수납ID ? 0.5 : 1 }}>
                        {payProcessing === p.수납ID ? '처리 중...' : '납부 완료 처리'}
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* CASE 2: 완납 상태 */}
            {allPaid && (
              <div style={{ background: '#f0f6ff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #deeafb' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#3182F6"/>
                  <polyline points="8 12 11 15 16 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#3182F6' }}>{nowM}월 납부 완료</span>
              </div>
            )}

            {/* CASE 3: 예정 상태 (이번달 데이터 없음, 다음달 데이터 있을 때) */}
            {thisMonthPays.length === 0 && (() => {
              const nextM = nowM === 12 ? 1 : nowM + 1;
              const nextY = nowM === 12 ? nowY + 1 : nowY;
              const nextYM = `${nextY}-${String(nextM).padStart(2, '0')}`;
              const nextPays = monthlyPayments.filter(p => p.연월 === nextYM);
              if (nextPays.length === 0) return null;
              const nextTotal = nextPays.reduce((s, p) => s + (Number(p.청구액) || 0), 0);
              return (
                <>
                  <div style={{ background: '#fff', padding: '12px 16px 6px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#3182F6' }}>{nextM}월 납부 예정</span>
                  </div>
                  <div style={{ background: '#fff', padding: '14px 16px', marginBottom: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{nextM}월 월세 + 관리비</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{fmt(nextTotal)}</span>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#f0f6ff', color: '#3182F6' }}>예정</span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* 구분선 */}
            <div style={{ height: 6, background: '#f5f5f5' }} />

            {/* 납부 이력 */}
            <div style={{ background: '#fff' }}>
              <div style={{ padding: '12px 16px 6px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#b0b8c1' }}>납부 이력</span>
              </div>

              {visibleHistory.length === 0 && !hasInitial ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#b0b8c1', fontSize: 13 }}>납부 내역이 없어요</div>
              ) : (
                <>
                  {visibleHistory.map(g => {
                    const m = Number(g.ym.split('-')[1]);
                    return (
                      <div key={g.ym}>
                        <div style={{ height: 1, background: '#f5f5f5', margin: '0 16px' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#191919' }}>{m}월 월세 + 관리비</div>
                            {g.date && <div style={{ fontSize: 11, color: '#b0b8c1', marginTop: 1 }}>{g.date}</div>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>{fmt(g.total)}</span>
                            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e8f1fd', color: '#3182F6' }}>완납</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 잔금 이력 */}
                  {hasInitial && (historyOpen || grouped.length <= 3) && (
                    <>
                      <div style={{ height: 1, background: '#f5f5f5', margin: '0 16px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#b0b8c1' }}>잔금 + 관리비</div>
                          <div style={{ fontSize: 11, color: '#b0b8c1', marginTop: 1 }}>입주 초기 납부</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#b0b8c1' }}>{fmt(initialTotal)}</span>
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e8f1fd', color: '#3182F6' }}>완납</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 더 보기 */}
                  {hasMore && !historyOpen && (
                    <>
                      <div style={{ height: 1, background: '#f5f5f5', margin: '0 16px' }} />
                      <button onClick={() => setHistoryOpen(true)}
                        style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: '#3182F6', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                        이전 내역 더 보기
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

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

      {/* 계약 취소 버튼 */}
      {(status === 'pending' || status === 'active') && (
        <div style={{ padding: '0 16px', marginTop: 8 }}>
          <button onClick={() => setShowCancelModal(true)}
            style={{ width: '100%', padding: 13, borderRadius: 12, border: '1px solid #E24B4A', background: '#fff', color: '#E24B4A', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            계약 취소 처리
          </button>
        </div>
      )}

      {/* 계약 취소 바텀시트 */}
      {showCancelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCancelModal(false); }}>
          <div style={{ width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>계약 취소 처리</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 18, lineHeight: 1.5 }}>입주 전 계약 해지입니다. 위약금 발생 시 수납 내역에 자동 등록됩니다.</p>

            <input type="number" value={cancelFee} onChange={e => setCancelFee(e.target.value)}
              placeholder="위약금 (원, 없으면 0)"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e8eb', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 14 }} />

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['입주자 변심', '연락두절', '기타'].map(r => (
                <button key={r} onClick={() => setCancelReason(r)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: cancelReason === r ? 'none' : '1px solid #e5e8eb', background: cancelReason === r ? '#3182F6' : '#fff', color: cancelReason === r ? '#fff' : '#333', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {r}
                </button>
              ))}
            </div>

            <button onClick={handleCancelContract} disabled={cancelProcessing}
              style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: '#E24B4A', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, opacity: cancelProcessing ? 0.5 : 1 }}>
              {cancelProcessing ? '처리 중...' : '계약 취소 확정'}
            </button>
            <button onClick={() => setShowCancelModal(false)}
              style={{ width: '100%', padding: 13, borderRadius: 12, border: '1px solid #e5e8eb', background: '#fff', color: '#333', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              닫기
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
