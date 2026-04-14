'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

const BLUE = '#3182F6', RED = '#e03131', GREEN = '#00B493';
const fmt = (n: number) => n.toLocaleString() + '원';

type Payment = {
  수납ID: string; 입주자ID: string; 지점명: string; 방코드: string; 이름: string;
  연월: string; 청구액: string; 납부액: string; 납부일: string; 상태: string;
};

type ExcelRow = { 이름: string; 금액: number; 날짜: string; raw: Record<string, unknown> };

type MatchResult = {
  payment: Payment;
  excel: ExcelRow | null;
  status: 'auto' | 'review' | 'unmatched';
  confirmed: boolean;
  manualExcelIdx: number | null;
};

function normalize(s: string) {
  return s.replace(/\s+/g, '').toLowerCase();
}

function parseExcel(data: ArrayBuffer): ExcelRow[] {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  return json.map(row => {
    // Try to find name column
    const nameKey = Object.keys(row).find(k => /이름|성명|입금자|name/i.test(k));
    const amountKey = Object.keys(row).find(k => /금액|납부|입금|amount/i.test(k));
    const dateKey = Object.keys(row).find(k => /날짜|일자|date/i.test(k));

    return {
      이름: nameKey ? String(row[nameKey] || '') : '',
      금액: amountKey ? Number(row[amountKey]) || 0 : 0,
      날짜: dateKey ? String(row[dateKey] || '') : '',
      raw: row,
    };
  }).filter(r => r.이름 && r.금액 > 0);
}

function matchPayments(payments: Payment[], excelRows: ExcelRow[]): MatchResult[] {
  const usedExcel = new Set<number>();
  const results: MatchResult[] = [];

  for (const p of payments) {
    if (p.상태 === '납부완료') continue;

    const charge = Number(p.청구액) || 0;
    let bestIdx = -1;
    let bestStatus: 'auto' | 'review' = 'review';

    for (let i = 0; i < excelRows.length; i++) {
      if (usedExcel.has(i)) continue;
      const ex = excelRows[i];
      const nameMatch = normalize(ex.이름) === normalize(p.이름);
      const amountMatch = ex.금액 === charge;

      if (nameMatch && amountMatch) {
        bestIdx = i;
        bestStatus = 'auto';
        break;
      }
      if (nameMatch && bestIdx === -1) {
        bestIdx = i;
        bestStatus = 'review';
      }
    }

    if (bestIdx >= 0) {
      usedExcel.add(bestIdx);
      results.push({
        payment: p,
        excel: excelRows[bestIdx],
        status: bestStatus,
        confirmed: bestStatus === 'auto',
        manualExcelIdx: null,
      });
    } else {
      results.push({
        payment: p,
        excel: null,
        status: 'unmatched',
        confirmed: false,
        manualExcelIdx: null,
      });
    }
  }

  return results;
}

export default function PaymentUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [linkingIdx, setLinkingIdx] = useState<number | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const data = await file.arrayBuffer();
    const rows = parseExcel(data);
    setExcelRows(rows);
  }, []);

  const startMatching = useCallback(async () => {
    if (excelRows.length === 0) return;
    setProcessing(true);
    try {
      const now = new Date();
      const kstStr = now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
      const [y, m] = kstStr.replace(/\./g, '').trim().split(/\s+/).map(Number);
      const res = await fetch(`/api/payments?year=${y}&month=${String(m).padStart(2, '0')}`);
      const d = await res.json();
      const payments: Payment[] = d.items || [];
      const results = matchPayments(payments, excelRows);
      setMatches(results);
      setStep(2);
    } catch {
    } finally {
      setProcessing(false);
    }
  }, [excelRows]);

  const toggleConfirm = (idx: number) => {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, confirmed: !m.confirmed } : m));
  };

  const linkManual = (matchIdx: number, excelIdx: number) => {
    setMatches(prev => prev.map((m, i) => {
      if (i !== matchIdx) return m;
      return { ...m, excel: excelRows[excelIdx], status: 'review' as const, confirmed: true, manualExcelIdx: excelIdx };
    }));
    setLinkingIdx(null);
  };

  const autoCount = matches.filter(m => m.status === 'auto').length;
  const reviewCount = matches.filter(m => m.status === 'review').length;
  const unmatchedCount = matches.filter(m => m.status === 'unmatched').length;
  const confirmedItems = matches.filter(m => m.confirmed && m.excel);

  const handleConfirm = async () => {
    if (confirmedItems.length === 0 || confirming) return;
    setConfirming(true);

    const kstStr = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
    const [y, m, d] = kstStr.replace(/\./g, '').trim().split(/\s+/).map(Number);
    const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    try {
      const items = confirmedItems.map(c => ({
        id: c.payment.수납ID,
        납부액: c.excel!.금액,
        납부일: c.excel!.날짜 || todayStr,
      }));
      await fetch('/api/payments/bulk-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      setStep(3);
    } catch {
    } finally {
      setConfirming(false);
    }
  };

  // Used excel indices (for manual linking dropdown)
  const usedExcelIndices = new Set(
    matches.filter(m => m.excel).map(m => {
      if (m.manualExcelIdx !== null) return m.manualExcelIdx;
      return excelRows.indexOf(m.excel!);
    }).filter(i => i >= 0)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => step === 3 ? router.push('/payments?uploaded=true') : router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 8, color: '#191919' }}>
          {step === 1 ? '엑셀 업로드' : step === 2 ? '매칭 결과' : '완료'}
        </span>
      </div>

      {/* Step indicator */}
      <div style={{ background: '#fff', padding: '12px 16px 14px', display: 'flex', gap: 6, borderBottom: '1px solid #f0f0f0' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? BLUE : '#e5e8eb' }} />
        ))}
      </div>

      {/* Step 1: File Selection */}
      {step === 1 && (
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 4 }}>엑셀 파일 업로드</div>
              <div style={{ fontSize: 13, color: '#b0b8c1' }}>은행 거래내역 엑셀을 업로드하면<br/>자동으로 입주자와 매칭합니다</div>
            </div>

            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} style={{ display: 'none' }} />

            <button onClick={() => fileRef.current?.click()}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: '2px dashed #d1d5db', background: '#fafafa', color: '#666', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
              {fileName || '파일 선택 (.xlsx)'}
            </button>

            {fileName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#f8f9fa', marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{fileName}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{excelRows.length}건</span>
              </div>
            )}

            {/* Matching criteria info */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f8f9fa', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>매칭 기준</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                • 이름 + 금액 일치 → 자동 확정<br/>
                • 이름만 일치 → 검토 필요<br/>
                • 일치 없음 → 미매칭 (수동 연결)
              </div>
            </div>

            <button onClick={startMatching} disabled={excelRows.length === 0 || processing}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 15, fontWeight: 600, cursor: excelRows.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: excelRows.length === 0 || processing ? 0.4 : 1 }}>
              {processing ? '매칭 중...' : '매칭 시작'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Matching Results */}
      {step === 2 && (
        <div style={{ padding: 16 }}>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#b0b8c1', marginBottom: 2 }}>자동확정</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: GREEN }}>{autoCount}</div>
            </div>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#b0b8c1', marginBottom: 2 }}>검토필요</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>{reviewCount}</div>
            </div>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#b0b8c1', marginBottom: 2 }}>미매칭</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: RED }}>{unmatchedCount}</div>
            </div>
          </div>

          {/* Match list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }}>
            {matches.map((m, idx) => {
              const charge = Number(m.payment.청구액) || 0;
              const exAmt = m.excel?.금액 || 0;
              const amountDiff = m.excel ? exAmt - charge : 0;
              const isLinking = linkingIdx === idx;

              return (
                <div key={m.payment.수납ID} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#191919' }}>{m.payment.이름}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: m.status === 'auto' ? '#E8F5E9' : m.status === 'review' ? '#FFF8E1' : '#fff2f2',
                          color: m.status === 'auto' ? GREEN : m.status === 'review' ? '#F59E0B' : RED,
                        }}>
                          {m.status === 'auto' ? '자동' : m.status === 'review' ? '검토' : '미매칭'}
                        </span>
                      </div>
                      {m.status !== 'unmatched' && (
                        <button onClick={() => toggleConfirm(idx)}
                          style={{ width: 22, height: 22, borderRadius: 6, border: m.confirmed ? 'none' : '2px solid #d1d5db', background: m.confirmed ? BLUE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                          {m.confirmed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#b0b8c1', marginBottom: 4 }}>{m.payment.지점명} · {m.payment.방코드}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#888' }}>청구 {fmt(charge)}</span>
                      {m.excel && (
                        <span style={{ fontWeight: 600, color: amountDiff === 0 ? GREEN : '#F59E0B' }}>
                          입금 {fmt(exAmt)}
                          {amountDiff !== 0 && <span style={{ fontSize: 11, marginLeft: 4 }}>({amountDiff > 0 ? '+' : ''}{amountDiff.toLocaleString()})</span>}
                        </span>
                      )}
                    </div>

                    {/* Manual link button for unmatched */}
                    {m.status === 'unmatched' && !isLinking && (
                      <button onClick={() => setLinkingIdx(idx)}
                        style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', color: '#555', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                        수동 연결
                      </button>
                    )}
                  </div>

                  {/* Manual linking dropdown */}
                  {isLinking && (
                    <div style={{ borderTop: '1px solid #f2f4f6', padding: '10px 16px 14px', background: '#fafbfc' }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>엑셀 데이터 선택</div>
                      {excelRows.map((ex, eIdx) => {
                        if (usedExcelIndices.has(eIdx)) return null;
                        return (
                          <button key={eIdx} onClick={() => linkManual(idx, eIdx)}
                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 4, textAlign: 'left' }}>
                            <span style={{ fontSize: 13, color: '#333' }}>{ex.이름}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{fmt(ex.금액)}</span>
                          </button>
                        );
                      })}
                      <button onClick={() => setLinkingIdx(null)}
                        style={{ marginTop: 4, padding: '6px 0', background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                        취소
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirm button */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 430, margin: '0 auto', padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
            <button onClick={handleConfirm} disabled={confirmedItems.length === 0 || confirming}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 15, fontWeight: 600, cursor: confirmedItems.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: confirmedItems.length === 0 || confirming ? 0.4 : 1 }}>
              {confirming ? '처리 중...' : `${confirmedItems.length}건 납부 확정`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#191919', marginBottom: 8 }}>업로드 완료</div>
            <div style={{ fontSize: 14, color: '#b0b8c1', marginBottom: 24 }}>
              {confirmedItems.length}건의 납부가 확정되었습니다
            </div>
            <button onClick={() => router.push('/payments?uploaded=true')}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              수납 관리로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
