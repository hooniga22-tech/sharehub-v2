'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { getMonthlyCharge } from '@/lib/prorata';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1', ORANGE = '#f59f00';
const fmt = (n: number) => n.toLocaleString() + '원';

type Payment = { 수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 이름: string; 연월: string; 청구액: string; 납부액: string; 납부일: string; 상태: string; 납부방법: string; 메모: string };
type Tenant = Record<string, string>;

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [toast, setToast] = useState('');
  const [guFilter, setGuFilter] = useState('전체');
  const [investorFilter, setInvestorFilter] = useState('전체');
  const [guDropOpen, setGuDropOpen] = useState(false);
  const [invDropOpen, setInvDropOpen] = useState(false);

  // Upload state
  const [uploaded, setUploaded] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [matchResult, setMatchResult] = useState<{ auto: number; review: number; unmatched: number; items: { name: string; amount: number; status: 'auto' | 'review' | 'unmatched' }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pay register modal
  const [payTarget, setPayTarget] = useState<{ tenantId: string; paymentId: string; name: string; house: string; amount: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('계좌이체');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/payments?year=${year}&month=${String(month).padStart(2, '0')}`).then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([payData, tenantData]) => {
      setPayments(Array.isArray(payData) ? payData : []);
      setTenants(Array.isArray(tenantData) ? tenantData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [month, year]);

  const tenantPayments = useMemo(() => {
    const active = tenants.filter((t: Tenant) => t.상태 === '입주중' || t.상태 === '계약중');
    return active.map(t => {
      const pay = payments.find(p => p.입주자ID === t.입주자ID);
      const isPaid = pay?.상태 === '납부완료';
      const r = Number(t.월세 || 0), m = Number(t.관리비 || 0);
      const charge = getMonthlyCharge(r, m, t.입주일 || '', year, month);
      const chargeAmount = Number(pay?.청구액 || 0) || charge.amount;
      return { ...t, paymentId: pay?.수납ID || '', paid: isPaid, chargeAmount, rent: r, mgmt: m, isProrata: charge.isProrata } as Tenant & { paymentId: string; paid: boolean; chargeAmount: number; rent: number; mgmt: number; isProrata: boolean };
    });
  }, [tenants, payments, year, month]);

  const guList = useMemo(() => {
    const set = new Set(tenants.map(t => t.구).filter(Boolean));
    return ['전체', ...Array.from(set).sort()];
  }, [tenants]);

  const investorList = useMemo(() => {
    const set = new Set(tenants.map(t => t.투자자).filter(Boolean));
    return ['전체', ...Array.from(set).sort()];
  }, [tenants]);

  const filtered = useMemo(() => {
    let list = tenantPayments;
    if (guFilter !== '전체') list = list.filter(t => t.구 === guFilter);
    if (investorFilter !== '전체') list = list.filter(t => t.투자자 === investorFilter);
    return list;
  }, [tenantPayments, guFilter, investorFilter]);

  const paidList = filtered.filter(t => t.paid);
  const unpaidList = filtered.filter(t => !t.paid);
  const total = filtered.length;
  const rate = total > 0 ? Math.round((paidList.length / total) * 100) : 0;

  const prevMonth = () => {
    if (month > 1) setMonth(m => m - 1);
    else { setYear(y => y - 1); setMonth(12); }
  };
  const nextMonth = () => {
    if (month < 12) setMonth(m => m + 1);
    else { setYear(y => y + 1); setMonth(1); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected].slice(0, 4));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleAnalyze = () => {
    setAnalyzing(true);
    setAnalyzeProgress(0);
    const steps = [20, 45, 70, 90, 100];
    let i = 0;
    const timer = setInterval(() => {
      setAnalyzeProgress(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(timer);
        setTimeout(() => {
          setAnalyzing(false);
          // Simulated match result based on unpaid
          const autoCount = Math.min(unpaidList.length, Math.floor(Math.random() * 5) + 3);
          const reviewCount = Math.min(2, unpaidList.length - autoCount);
          const unmatchedCount = 1;
          const items: { name: string; amount: number; status: 'auto' | 'review' | 'unmatched' }[] = unpaidList.slice(0, autoCount).map(t => ({ name: t.이름, amount: t.chargeAmount, status: 'auto' as const }));
          if (reviewCount > 0) items.push({ name: '김OO', amount: 500000, status: 'review' });
          items.push({ name: '미확인 입금', amount: 300000, status: 'unmatched' });
          setMatchResult({ auto: autoCount, review: reviewCount, unmatched: unmatchedCount, items });
        }, 300);
      }
    }, 400);
  };

  const handleConfirmUpload = async () => {
    if (!matchResult) return;
    // Simulate marking auto-matched as paid
    const autoItems = matchResult.items.filter(i => i.status === 'auto');
    for (const item of autoItems) {
      const tp = unpaidList.find(t => t.이름 === item.name);
      if (tp?.paymentId) {
        await fetch('/api/payments', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tp.paymentId, 상태: '납부완료', 납부일: new Date().toISOString().split('T')[0], 납부방법: '자동매칭' }),
        });
      }
    }
    setUploadCount(autoItems.length);
    setUploaded(true);
    setShowUpload(false);
    setFiles([]);
    setMatchResult(null);
    // Refresh
    const payData = await fetch(`/api/payments?year=${year}&month=${String(month).padStart(2, '0')}`).then(r => r.json());
    setPayments(Array.isArray(payData) ? payData : []);
    showToast(`${autoItems.length}건 자동확정 완료!`);
  };

  const handlePayRegister = async () => {
    if (!payTarget) return;
    const amt = payAmount || String(payTarget.amount);
    if (payTarget.paymentId) {
      await fetch('/api/payments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payTarget.paymentId, 상태: '납부완료', 납부액: amt, 납부일: payDate, 납부방법: payMethod }),
      });
    } else {
      const t = tenants.find(x => x.입주자ID === payTarget.tenantId);
      if (t) {
        await fetch('/api/payments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 입주자ID: t.입주자ID, 지점명: t.지점명, 방코드: t.방코드, 이름: t.이름, 연월: `${year}-${String(month).padStart(2, '0')}`, 청구액: amt, 납부액: amt, 납부일: payDate, 상태: '납부완료', 납부방법: payMethod }),
        });
      }
    }
    const payData = await fetch(`/api/payments?year=${year}&month=${String(month).padStart(2, '0')}`).then(r => r.json());
    setPayments(Array.isArray(payData) ? payData : []);
    setPayTarget(null);
    showToast('납부 등록 완료!');
  };

  const hasActiveFilter = guFilter !== '전체' || investorFilter !== '전체';
  const resetFilters = () => { setGuFilter('전체'); setInvestorFilter('전체'); };

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
    <div style={{ minHeight: '100vh', background: '#F7F8FA', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>수납 관리</span>
        </div>
      </div>

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f2f4f6' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999', padding: '4px 8px' }}>◀</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>{year}년 {month}월</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999', padding: '4px 8px' }}>▶</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Upload Banner */}
        {!uploaded ? (
          <div onClick={() => setShowUpload(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#edf3ff', borderRadius: 14, padding: '14px 18px', marginBottom: 12, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>은행 입금내역 업로드</div>
              <div style={{ fontSize: 12, color: '#6b7684', marginTop: 2 }}>엑셀 여러 개 한번에 올려 자동 매칭</div>
            </div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/><polyline points="17 8 12 3 7 8" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e6f9f0', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0e6245' }}>업로드 완료 — 자동확정 {uploadCount}건</div>
            </div>
            <button onClick={() => { setShowUpload(true); setUploaded(false); setMatchResult(null); setFiles([]); }}
              style={{ fontSize: 12, fontWeight: 600, color: GREEN, background: 'none', border: 'none', cursor: 'pointer' }}>
              추가 업로드
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>납부완료</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{paidList.length}<span style={{ fontSize: 13, fontWeight: 500 }}>명</span></div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>미납</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: RED }}>{unpaidList.length}<span style={{ fontSize: 13, fontWeight: 500 }}>명</span></div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>수납률</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: BLUE }}>{rate}<span style={{ fontSize: 13, fontWeight: 500 }}>%</span></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ height: 8, borderRadius: 4, background: '#f2f4f6', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${rate}%`, background: GREEN, borderRadius: 4, transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: GREEN }}>완료 {paidList.length}</span>
            <span style={{ fontSize: 11, color: RED }}>미납 {unpaidList.length}</span>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          {/* 구 Dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setGuDropOpen(!guDropOpen); setInvDropOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: `1px solid ${guFilter !== '전체' ? BLUE : '#e5e8eb'}`, background: guFilter !== '전체' ? '#edf3ff' : '#fff', color: guFilter !== '전체' ? BLUE : '#4e5968', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              {guFilter === '전체' ? '구' : guFilter} <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {guDropOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,.12)', zIndex: 20, minWidth: 120, maxHeight: 240, overflowY: 'auto', padding: 4 }}>
                {guList.map(g => (
                  <button key={g} onClick={() => { setGuFilter(g); setGuDropOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: guFilter === g ? '#edf3ff' : 'transparent', color: guFilter === g ? BLUE : '#191f28', fontSize: 13, fontWeight: guFilter === g ? 600 : 400, cursor: 'pointer', textAlign: 'left', borderRadius: 8 }}>
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 투자자 Dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setInvDropOpen(!invDropOpen); setGuDropOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: `1px solid ${investorFilter !== '전체' ? BLUE : '#e5e8eb'}`, background: investorFilter !== '전체' ? '#edf3ff' : '#fff', color: investorFilter !== '전체' ? BLUE : '#4e5968', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              {investorFilter === '전체' ? '투자자' : investorFilter} <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {invDropOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,.12)', zIndex: 20, minWidth: 140, maxHeight: 240, overflowY: 'auto', padding: 4 }}>
                {investorList.map(inv => (
                  <button key={inv} onClick={() => { setInvestorFilter(inv); setInvDropOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: investorFilter === inv ? '#edf3ff' : 'transparent', color: investorFilter === inv ? BLUE : '#191f28', fontSize: 13, fontWeight: investorFilter === inv ? 600 : 400, cursor: 'pointer', textAlign: 'left', borderRadius: 8 }}>
                    {inv}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilter && (
            <button onClick={resetFilters}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#f2f4f6', color: GRAY, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              초기화
            </button>
          )}
        </div>

        {/* Tenant List */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.length > 0 ? filtered.map((t, i) => (
            <div key={t.입주자ID}>
              {i > 0 && <div style={{ height: 1, background: '#f2f4f6', margin: '0 16px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{t.이름}</span>
                    <span style={{ fontSize: 11, color: GRAY }}>{t.구}</span>
                  </div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{t.지점명}</span>
                    <span>·</span>
                    <span>{fmt(t.rent + t.mgmt)}</span>
                  </div>
                  {t.투자자 && <div style={{ fontSize: 10, color: GRAY, marginTop: 2 }}>{t.투자자}</div>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {t.paid ? (
                    <span style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#e6f9f0', color: GREEN }}>완료</span>
                  ) : (
                    <button onClick={() => { setPayTarget({ tenantId: t.입주자ID, paymentId: t.paymentId, name: t.이름, house: t.지점명, amount: t.chargeAmount }); setPayAmount(String(t.chargeAmount)); setPayDate(new Date().toISOString().split('T')[0]); setPayMethod('계좌이체'); }}
                      style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: RED, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      미납 · 등록
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY }}>
              <p style={{ fontSize: 13 }}>{payments.length === 0 ? '이달 수납 데이터가 없어요' : '해당 조건의 입주자가 없어요'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => { setShowUpload(false); setMatchResult(null); setAnalyzing(false); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', overflow: 'auto', padding: '24px 20px 36px' }}>
            <div style={{ width: 36, height: 4, background: '#e5e8eb', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>엑셀 업로드</span>
              <button onClick={() => { setShowUpload(false); setMatchResult(null); setAnalyzing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 16 }}>여러 개 동시에 선택 가능해요</div>

            {!analyzing && !matchResult && (
              <>
                {/* File Select */}
                <input ref={fileRef} type="file" accept=".xlsx,.xls" multiple hidden onChange={handleFileSelect} />
                <button onClick={() => fileRef.current?.click()}
                  style={{ width: '100%', padding: 13, borderRadius: 12, border: '1.5px dashed #3182f6', background: '#edf3ff', color: BLUE, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/><polyline points="17 8 12 3 7 8" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/></svg>
                  파일 선택하기
                </button>

                {/* File List */}
                {files.length > 0 && (
                  <div style={{ background: '#f2f3f5', borderRadius: 12, padding: 10, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {files.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#fff', borderRadius: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0d904f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" strokeWidth="2"/><path d="M9 3v18M3 9h18M3 15h18" stroke="#fff" strokeWidth="1.5"/></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#191f28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                          <div style={{ fontSize: 10, color: GRAY }}>{(f.size / 1024).toFixed(1)}KB</div>
                        </div>
                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={14} color="#999" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleAnalyze} disabled={files.length === 0}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: files.length > 0 ? BLUE : '#e5e8eb', color: files.length > 0 ? '#fff' : GRAY, fontSize: 14, fontWeight: 700, cursor: files.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  {files.length}개 분석하기
                </button>
              </>
            )}

            {/* Analyzing */}
            {analyzing && (
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28', textAlign: 'center', marginBottom: 16 }}>분석 중...</div>
                <div style={{ height: 8, borderRadius: 4, background: '#f2f4f6', overflow: 'hidden' }}>
                  <div style={{ width: `${analyzeProgress}%`, height: '100%', background: BLUE, borderRadius: 4, transition: 'width .3s' }} />
                </div>
                <div style={{ fontSize: 12, color: GRAY, textAlign: 'center', marginTop: 8 }}>{analyzeProgress}%</div>
              </div>
            )}

            {/* Match Result */}
            {matchResult && !analyzing && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#e6f9f0', color: GREEN }}>자동확정 {matchResult.auto}건</span>
                  {matchResult.review > 0 && <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fff8e6', color: ORANGE }}>검토필요 {matchResult.review}건</span>}
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fff0f1', color: RED }}>미매칭 {matchResult.unmatched}건</span>
                </div>

                <div style={{ background: '#f2f3f5', borderRadius: 12, padding: 10, marginBottom: 16, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {matchResult.items.map((item, i) => {
                    const statusMap = { auto: { label: '확정', bg: '#e6f9f0', color: GREEN }, review: { label: '검토', bg: '#fff8e6', color: ORANGE }, unmatched: { label: '미매칭', bg: '#fff0f1', color: RED } };
                    const st = statusMap[item.status];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: GRAY }}>{fmt(item.amount)}</div>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>

                <button onClick={handleConfirmUpload}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {matchResult.auto}건 납부완료 처리
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pay Register Modal */}
      {payTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setPayTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px' }}>
            <div style={{ width: 36, height: 4, background: '#e5e8eb', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>납부 등록</span>
              <button onClick={() => setPayTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 16 }}>{payTarget.name} · {payTarget.house}</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>납부액</label>
              <input value={payAmount} onChange={e => setPayAmount(e.target.value)} type="number" placeholder="0"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>납부일</label>
              <input value={payDate} onChange={e => setPayDate(e.target.value)} type="date"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>납부 방법</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['계좌이체', '현금'].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${payMethod === m ? BLUE : '#E8E8E8'}`, background: payMethod === m ? '#EBF4FF' : '#fff', color: payMethod === m ? BLUE : '#666', fontSize: 13, fontWeight: payMethod === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handlePayRegister}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              등록 완료
            </button>
          </div>
        </div>
      )}

      {/* Click overlay to close dropdowns */}
      {(guDropOpen || invDropOpen) && (
        <div onClick={() => { setGuDropOpen(false); setInvDropOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 15 }} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
