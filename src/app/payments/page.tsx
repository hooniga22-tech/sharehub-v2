'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, ChevronDown, ChevronUp, ChevronRight, Check, AlertTriangle, X, Search, FileSpreadsheet } from 'lucide-react';
import { paymentTenants, paymentRecords, uploadHistories, getDistrictSummary, formatWon, type PaymentTenant, type MatchResult } from '@/lib/paymentMockData';

type Tab = 'all' | 'unpaid' | 'paid' | 'upload';

const DISTRICTS = ['전체', '강남구', '마포구', '송파구', '서대문구'];

// ===== 업로드 매칭 Mock =====
const mockMatchResults: MatchResult[] = [
  { id: 'm1', sender: '이지은', amount: 650000, date: '2025-06-01', matchType: 'confirmed', matchedTenant: paymentTenants.find(t => t.id === 't2') },
  { id: 'm2', sender: '최수민', amount: 580000, date: '2025-06-01', matchType: 'confirmed', matchedTenant: paymentTenants.find(t => t.id === 't3') },
  { id: 'm3', sender: '한유진', amount: 580000, date: '2025-06-01', matchType: 'confirmed', matchedTenant: paymentTenants.find(t => t.id === 't6') },
  { id: 'm4', sender: '박지호부', amount: 720000, date: '2025-06-01', matchType: 'review_name', matchedTenant: paymentTenants.find(t => t.id === 't1'), confidence: '이름유사' },
  { id: 'm5', sender: '알수없음', amount: 490000, date: '2025-06-02', matchType: 'unmatched' },
];

export default function PaymentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const [districtFilter, setDistrictFilter] = useState('전체');
  const [openDistricts, setOpenDistricts] = useState<Record<string, boolean>>({});
  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [matchFilter, setMatchFilter] = useState<'all' | 'confirmed' | 'review' | 'unmatched'>('all');
  // Manual payment modal
  const [showManual, setShowManual] = useState(false);
  const [manualTenant, setManualTenant] = useState<PaymentTenant | null>(null);
  const [manualType, setManualType] = useState<'월세' | '공과금' | '보증금'>('월세');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState('');

  // Computed
  const unpaidTenants = paymentTenants.filter(t => t.status === 'unpaid');
  const paidTenants = paymentTenants.filter(t => t.status === 'paid');
  const totalUnpaid = unpaidTenants.reduce((s, t) => s + t.monthlyRent, 0);
  const totalPaid = paidTenants.reduce((s, t) => s + t.monthlyRent, 0);
  const rate = Math.round((paidTenants.length / paymentTenants.length) * 100);

  const filteredTenants = useMemo(() => {
    let list = paymentTenants;
    if (tab === 'unpaid') list = list.filter(t => t.status === 'unpaid');
    if (tab === 'paid') list = list.filter(t => t.status === 'paid');
    if (districtFilter !== '전체') list = list.filter(t => t.district === districtFilter);
    return list;
  }, [tab, districtFilter]);

  const districtData = useMemo(() => getDistrictSummary(filteredTenants), [filteredTenants]);

  const toggleDistrict = (d: string) => setOpenDistricts(prev => ({ ...prev, [d]: !prev[d] }));

  const handleKpiClick = (t: Tab) => { setTab(t); if (t !== 'upload') setDistrictFilter('전체'); };

  // Upload flow
  const startUpload = () => { setShowUpload(true); setUploadStep(1); setSelectedFile(null); setMatchResults([]); };
  const runMatching = () => { setMatchResults(mockMatchResults); setUploadStep(2); };
  const confirmAll = () => { setUploadStep(3); };
  const finishUpload = () => { setShowUpload(false); setUploadStep(1); };

  // Manual payment
  const openManual = () => { setShowManual(true); setManualTenant(null); setManualAmount(''); setManualDate(''); };
  const submitManual = () => {
    if (!manualTenant || !manualAmount) return;
    alert('입금이 등록되었습니다!');
    setShowManual(false);
  };

  // Match helpers
  const confirmedCount = matchResults.filter(r => r.matchType === 'confirmed').length;
  const reviewCount = matchResults.filter(r => r.matchType === 'review_name' || r.matchType === 'review_amount').length;
  const unmatchedCount = matchResults.filter(r => r.matchType === 'unmatched').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>수납 관리</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={startUpload} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
            <Upload size={14} /> 업로드
          </button>
          <button onClick={openManual} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#3182F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            <Plus size={14} /> 입금
          </button>
        </div>
      </div>

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 16px', background: '#fff' }}>
        <button style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>2025년 6월</span>
        <button style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>›</button>
      </div>

      <div style={{ padding: 16 }}>
        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <KpiCard active={tab === 'unpaid'} onClick={() => handleKpiClick('unpaid')} label="미납자" value={`${unpaidTenants.length}명`} sub={formatWon(totalUnpaid)} color="#F04452" />
          <KpiCard active={tab === 'paid'} onClick={() => handleKpiClick('paid')} label="납부완료" value={`${paidTenants.length}명`} sub={formatWon(totalPaid)} color="#00C471" />
          <KpiCard active={tab === 'all'} onClick={() => handleKpiClick('all')} label="수납률" value={`${rate}%`} sub={`${paidTenants.length} / ${paymentTenants.length}명`} color="#3182F6" />
          <KpiCard active={tab === 'upload'} onClick={() => handleKpiClick('upload')} label="업로드" value={`${uploadHistories.length}회`} sub="이번 달" color="#8B95A1" />
        </div>

        {/* Progress Bar */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>수납 진행률</span>
            <span style={{ fontSize: 12, color: '#8B95A1' }}>{paidTenants.length} / {paymentTenants.length}명</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#F2F4F6', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${rate}%`, background: '#00C471', borderRadius: 4, transition: 'width .3s' }} />
            <div style={{ width: `${100 - rate}%`, background: '#F04452', borderRadius: '0 4px 4px 0' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: '#00C471', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C471', display: 'inline-block' }} /> 납부완료</span>
            <span style={{ fontSize: 11, color: '#F04452', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F04452', display: 'inline-block' }} /> 미납</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: '#F2F4F6', borderRadius: 10, padding: 3 }}>
          {([['all', '전체'], ['unpaid', `미납 ${unpaidTenants.length}`], ['paid', `납부완료 ${paidTenants.length}`], ['upload', '업로드이력']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: tab === key ? 700 : 500, background: tab === key ? '#fff' : 'transparent', color: tab === key ? '#191919' : '#8B95A1', cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Upload History Tab */}
        {tab === 'upload' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {uploadHistories.length > 0 ? uploadHistories.map(h => (
              <div key={h.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{h.bank} · {h.date}</div>
                  <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>자동확정 {h.confirmed}명{h.review > 0 ? ` · 검토 ${h.review}건` : ''}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF5', color: '#00C471' }}>완료</span>
              </div>
            )) : (
              <div style={{ background: '#fff', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
                <FileSpreadsheet size={40} color="#CCC" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, color: '#8B95A1', marginBottom: 16 }}>아직 업로드 내역이 없어요</p>
                <button onClick={startUpload} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3182F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>지금 업로드하기</button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* District Filter Chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, WebkitOverflowScrolling: 'touch' }}>
              {DISTRICTS.map(d => (
                <button key={d} onClick={() => setDistrictFilter(d)}
                  style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `1px solid ${districtFilter === d ? '#3182F6' : '#E8E8E8'}`, background: districtFilter === d ? '#EBF4FF' : '#fff', color: districtFilter === d ? '#3182F6' : '#666', fontSize: 12, fontWeight: districtFilter === d ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {d}
                </button>
              ))}
            </div>

            {/* District Accordion List */}
            {Object.entries(districtData).map(([district, data]) => {
              const isOpen = openDistricts[district] !== false; // default open
              return (
                <div key={district} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
                  <button onClick={() => toggleDistrict(district)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{district}</span>
                      {data.unpaid > 0 && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#FFF0F0', color: '#F04452' }}>미납 {data.unpaid}</span>}
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF5', color: '#00C471' }}>납부 {data.paid}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} color="#999" /> : <ChevronDown size={16} color="#999" />}
                  </button>
                  {isOpen && (
                    <div>
                      {data.tenants.map((t, i) => (
                        <div key={t.id}>
                          {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                          <button onClick={() => router.push(`/payments/${t.id}`)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            {/* Avatar */}
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.status === 'unpaid' ? '#FFF0F0' : '#E8FBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: t.status === 'unpaid' ? '#F04452' : '#00C471', flexShrink: 0 }}>
                              {t.name[0]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{t.name}</div>
                              <div style={{ fontSize: 11, color: '#8B95A1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.district} {t.house} {t.room}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: t.status === 'unpaid' ? '#F04452' : '#00C471' }}>{formatWon(t.monthlyRent)}</div>
                              {t.status === 'unpaid' ? (
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#F04452' }}>D+{t.lateDays}</span>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#00C471' }}>납부</span>
                              )}
                            </div>
                            <ChevronRight size={16} color="#CCC" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(districtData).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8B95A1' }}>
                <p style={{ fontSize: 14 }}>해당 조건의 입주자가 없어요</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== Upload Modal (Bottom Sheet) ===== */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowUpload(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', overflow: 'auto' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                {uploadStep === 1 && '파일 선택'}
                {uploadStep === 2 && '매칭 결과'}
                {uploadStep === 3 && '완료 🎉'}
              </span>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ display: 'flex', gap: 0, padding: '0 20px', marginTop: 12 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= uploadStep ? '#3182F6' : '#E8E8E8', marginRight: s < 3 ? 4 : 0 }} />
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {/* STEP 1: File selection */}
              {uploadStep === 1 && (
                <>
                  {['국민은행_6월.xlsx', '신한은행_6월.xlsx', '카카오뱅크_6월.xlsx'].map(f => {
                    const processed = f.includes('국민') || f.includes('신한');
                    const selected = selectedFile === f;
                    return (
                      <button key={f} onClick={() => !processed && setSelectedFile(f)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${selected ? '#3182F6' : '#E8E8E8'}`, background: processed ? '#FAFAFA' : selected ? '#EBF4FF' : '#fff', marginBottom: 10, cursor: processed ? 'default' : 'pointer', opacity: processed ? 0.5 : 1, fontFamily: 'inherit', textAlign: 'left' }}>
                        <FileSpreadsheet size={20} color={selected ? '#3182F6' : '#8B95A1'} />
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#333' }}>{f}</span>
                        {processed && <span style={{ fontSize: 11, color: '#8B95A1', fontWeight: 500 }}>처리완료</span>}
                        {selected && <Check size={16} color="#3182F6" />}
                      </button>
                    );
                  })}
                  <button onClick={runMatching} disabled={!selectedFile}
                    style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: selectedFile ? '#3182F6' : '#E8E8E8', color: selectedFile ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: selectedFile ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>
                    자동매칭 시작
                  </button>
                </>
              )}

              {/* STEP 2: Match results */}
              {uploadStep === 2 && (
                <>
                  {/* Match KPIs */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: '자동확정', count: confirmedCount, bg: '#E8FBF5', color: '#00C471' },
                      { label: '검토필요', count: reviewCount, bg: '#FFF8E8', color: '#D97706' },
                      { label: '미매칭', count: unmatchedCount, bg: '#FFF0F0', color: '#F04452' },
                    ].map(k => (
                      <div key={k.label} style={{ flex: 1, background: k.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.count}</div>
                        <div style={{ fontSize: 11, color: k.color, fontWeight: 500 }}>{k.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Match filter */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {([['all', '전체'], ['confirmed', '✅ 확정'], ['review', '🟡 검토'], ['unmatched', '❌ 미매칭']] as const).map(([k, l]) => (
                      <button key={k} onClick={() => setMatchFilter(k)}
                        style={{ padding: '5px 10px', borderRadius: 16, border: `1px solid ${matchFilter === k ? '#3182F6' : '#E8E8E8'}`, background: matchFilter === k ? '#EBF4FF' : '#fff', fontSize: 11, fontWeight: matchFilter === k ? 600 : 400, color: matchFilter === k ? '#3182F6' : '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {l}
                      </button>
                    ))}
                  </div>

                  {/* Match items */}
                  {matchResults.filter(r => {
                    if (matchFilter === 'confirmed') return r.matchType === 'confirmed';
                    if (matchFilter === 'review') return r.matchType === 'review_name' || r.matchType === 'review_amount';
                    if (matchFilter === 'unmatched') return r.matchType === 'unmatched';
                    return true;
                  }).map(r => (
                    <div key={r.id} style={{ background: '#F7F8FA', borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{r.sender}</span>
                          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                            background: r.matchType === 'confirmed' ? '#E8FBF5' : r.matchType === 'unmatched' ? '#FFF0F0' : '#FFF8E8',
                            color: r.matchType === 'confirmed' ? '#00C471' : r.matchType === 'unmatched' ? '#F04452' : '#D97706',
                          }}>
                            {r.matchType === 'confirmed' ? '자동확정' : r.matchType === 'unmatched' ? '미매칭' : r.confidence}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{formatWon(r.amount)}</span>
                      </div>
                      {r.matchedTenant && (
                        <div style={{ fontSize: 12, color: '#8B95A1' }}>→ {r.matchedTenant.name} · {r.matchedTenant.house} {r.matchedTenant.room} · 월세 {formatWon(r.matchedTenant.monthlyRent)}</div>
                      )}
                      {r.matchType === 'unmatched' && (
                        <button style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, color: '#3182F6', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          👤 입주자 직접 연결
                        </button>
                      )}
                    </div>
                  ))}

                  <button onClick={confirmAll}
                    style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#3182F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                    확정하러 가기 ({confirmedCount + reviewCount}건) →
                  </button>
                </>
              )}

              {/* STEP 3: Confirm & Done */}
              {uploadStep === 3 && (
                <>
                  <div style={{ background: '#EBF4FF', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#3182F6', marginBottom: 4 }}>확정 완료!</div>
                    <div style={{ fontSize: 14, color: '#666' }}>{confirmedCount + reviewCount}명 · 총 {formatWon(matchResults.filter(r => r.matchType !== 'unmatched').reduce((s, r) => s + r.amount, 0))}</div>
                  </div>
                  {matchResults.filter(r => r.matchType !== 'unmatched').map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{r.matchedTenant?.name}</span>
                        <span style={{ fontSize: 11, color: '#8B95A1', marginLeft: 8 }}>{r.matchType === 'confirmed' ? '자동매칭' : '수동연결'}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#00C471' }}>{formatWon(r.amount)}</span>
                    </div>
                  ))}
                  {unmatchedCount > 0 && (
                    <div style={{ background: '#FFF8E8', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
                      <span style={{ fontSize: 12, color: '#D97706' }}>⚠️ 미처리 {unmatchedCount}건은 수동 등록이 필요합니다</span>
                    </div>
                  )}
                  <button onClick={finishUpload}
                    style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#00C471', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16 }}>
                    ✅ 확인
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Manual Payment Modal ===== */}
      {showManual && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setShowManual(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{manualTenant ? '입금 등록' : '입주자 선택'}</span>
              <button onClick={() => setShowManual(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ padding: 20 }}>
              {!manualTenant ? (
                <>
                  {/* Unpaid first */}
                  {unpaidTenants.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#F04452', marginBottom: 8 }}>🔴 미납자</div>
                      {unpaidTenants.map(t => (
                        <button key={t.id} onClick={() => { setManualTenant(t); setManualAmount(String(t.monthlyRent)); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid #F5F5F5', background: '#fff', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#F04452' }}>{t.name[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: '#8B95A1' }}>{t.house} {t.room}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#F04452' }}>{formatWon(t.monthlyRent)}</span>
                        </button>
                      ))}
                    </>
                  )}
                  <div style={{ height: 1, background: '#F0F0F0', margin: '12px 0' }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#00C471', marginBottom: 8 }}>✅ 납부완료 (추가납부)</div>
                  {paidTenants.map(t => (
                    <button key={t.id} onClick={() => { setManualTenant(t); setManualAmount(''); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid #F5F5F5', background: '#fff', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8FBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#00C471' }}>{t.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#8B95A1' }}>{t.house} {t.room}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#00C471' }}>납부</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{manualTenant.name}</div>
                    <div style={{ fontSize: 12, color: '#8B95A1' }}>{manualTenant.house} {manualTenant.room}</div>
                  </div>
                  {/* Type selector */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {(['월세', '공과금', '보증금'] as const).map(tp => (
                      <button key={tp} onClick={() => setManualType(tp)}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${manualType === tp ? '#3182F6' : '#E8E8E8'}`, background: manualType === tp ? '#EBF4FF' : '#fff', color: manualType === tp ? '#3182F6' : '#666', fontSize: 13, fontWeight: manualType === tp ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {tp}
                      </button>
                    ))}
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
                    style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#3182F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    등록 완료
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== KPI Card Component =====
function KpiCard({ active, onClick, label, value, sub, color }: { active: boolean; onClick: () => void; label: string; value: string; sub: string; color: string }) {
  return (
    <button onClick={onClick}
      style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${active ? '#3182F6' : '#F2F4F6'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', ...(active ? { background: '#EBF4FF' } : {}) }}>
      <div style={{ fontSize: 12, color: '#8B95A1', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 2 }}>{sub}</div>
    </button>
  );
}
