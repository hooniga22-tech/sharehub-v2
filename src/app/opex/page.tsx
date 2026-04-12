'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { mockUtility, mockOpex, utilTotal, CAT_COLOR, HOUSES, CATEGORIES, fmt, type OpexItem } from '@/../data/mockExpense';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#f04452', GREEN = '#00c471';

export default function ExpensePage() {
  const router = useRouter();
  const [month, setMonth] = useState(6);
  const [year] = useState(2025);
  const [showForm, setShowForm] = useState(false);
  const [opex, setOpex] = useState<OpexItem[]>(mockOpex);
  const [toast, setToast] = useState('');

  // Step form
  const [step, setStep] = useState(1);
  const [selHouse, setSelHouse] = useState('');
  const [selCat, setSelCat] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const utilTotalAll = mockUtility.reduce((a, d) => a + utilTotal(d), 0);
  const opexTotalAll = opex.reduce((a, d) => a + d.amount, 0);
  const grandTotal = utilTotalAll + opexTotalAll;

  const resetForm = () => { setStep(1); setSelHouse(''); setSelCat(''); setAmount(''); setMemo(''); };

  const openForm = () => { resetForm(); setShowForm(true); };
  const closeForm = () => { setShowForm(false); resetForm(); };

  const submitForm = () => {
    const newItem: OpexItem = {
      id: Date.now(),
      date: `${month}월 ${new Date().getDate()}일`,
      house: selHouse,
      category: selCat as OpexItem['category'],
      amount: parseInt(amount) || 0,
      memo: memo || '-',
      by: '재훈',
    };
    setOpex(prev => [newItem, ...prev]);
    closeForm();
    showToast('지출 등록 완료!');
  };

  const stepLabels = ['지점', '분류', '금액', '확인'];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>지출 관리</span>
          </div>
          {showForm ? (
            <button onClick={closeForm} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f2f4f6', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
              <X size={14} /> 닫기
            </button>
          ) : (
            <button onClick={openForm} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
              <Plus size={14} /> 지출 등록
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 12px' }}>
          <button onClick={() => setMonth(m => m > 1 ? m - 1 : m)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e8eb', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#191f28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{year}년 {month}월</div>
          <button onClick={() => setMonth(m => m < 12 ? m + 1 : m)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e8eb', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#191f28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* ===== Step Form ===== */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, border: `1.5px solid ${BLUE}` }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const done = s < step;
                const current = s === step;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: done ? '#e8faf2' : current ? BLUE : '#f2f4f6', color: done ? '#0e6245' : current ? '#fff' : GRAY }}>
                        {done ? '✓' : s}
                      </div>
                      <span style={{ fontSize: 10, color: current ? BLUE : GRAY, fontWeight: current ? 600 : 400 }}>{label}</span>
                    </div>
                    {s < 4 && <div style={{ width: 24, height: 2, background: done ? GREEN : '#f2f4f6', margin: '0 2px', marginBottom: 16 }} />}
                  </div>
                );
              })}
            </div>

            {/* Step 1: House */}
            {step === 1 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>어떤 지점인가요?</div>
                {HOUSES.map(h => (
                  <button key={h} onClick={() => setSelHouse(h)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${selHouse === h ? BLUE : '#E8E8E8'}`, background: selHouse === h ? '#ebf3ff' : '#fff', color: selHouse === h ? BLUE : '#333', fontSize: 13, fontWeight: selHouse === h ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, textAlign: 'left' }}>
                    {h}
                  </button>
                ))}
                <button onClick={() => selHouse && setStep(2)} disabled={!selHouse}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: selHouse ? BLUE : '#e5e8eb', color: selHouse ? '#fff' : '#999', fontSize: 13, fontWeight: 600, cursor: selHouse ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>
                  다음 →
                </button>
              </>
            )}

            {/* Step 2: Category */}
            {step === 2 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>어떤 종류인가요?</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CATEGORIES.map(c => {
                    const cc = CAT_COLOR[c];
                    const sel = selCat === c;
                    return (
                      <button key={c} onClick={() => setSelCat(c)}
                        style={{ padding: '14px 0', borderRadius: 10, border: `1.5px solid ${sel ? BLUE : '#E8E8E8'}`, background: sel ? '#ebf3ff' : '#fff', color: sel ? BLUE : '#333', fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>← 이전</button>
                  <button onClick={() => selCat && setStep(3)} disabled={!selCat}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: selCat ? BLUE : '#e5e8eb', color: selCat ? '#fff' : '#999', fontSize: 13, fontWeight: 600, cursor: selCat ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                    다음 →
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Amount */}
            {step === 3 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>금액이 얼마인가요?</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>금액</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0"
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 18, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>내용 (선택)</label>
                  <input value={memo} onChange={e => setMemo(e.target.value)} type="text" placeholder="예: 보일러 수리"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>← 이전</button>
                  <button onClick={() => amount && setStep(4)} disabled={!amount}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: amount ? BLUE : '#e5e8eb', color: amount ? '#fff' : '#999', fontSize: 13, fontWeight: 600, cursor: amount ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                    다음 →
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>등록 내용 확인</div>
                <div style={{ background: '#f8f9fa', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                  {[
                    { l: '지점', v: selHouse },
                    { l: '분류', v: selCat },
                    { l: '금액', v: fmt(parseInt(amount) || 0) },
                    { l: '내용', v: memo || '-' },
                  ].map((row, i) => (
                    <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < 3 ? '1px solid #eee' : 'none' }}>
                      <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{row.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>수정</button>
                  <button onClick={submitForm}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: GREEN, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Check size={14} /> 등록 완료
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== Summary ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 2 }}>공과금</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{Math.round(utilTotalAll / 10000).toLocaleString()}만원</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 2 }}>기타지출</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{Math.round(opexTotalAll / 10000).toLocaleString()}만원</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>총 지출</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: RED }}>{fmt(grandTotal)}</span>
        </div>

        {/* ===== 공과금 ===== */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>공과금 · {Math.round(utilTotalAll / 10000).toLocaleString()}만원</div>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          {mockUtility.map((d, i) => (
            <div key={d.house}>
              {i > 0 && <div style={{ height: 1, background: '#f2f4f6' }} />}
              <div style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.house}</span>
                    <span style={{ fontSize: 11, color: GRAY, marginLeft: 6 }}>{d.gu}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(utilTotal(d))}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { l: '전기', v: d.elec },
                    { l: '수도', v: d.water },
                    { l: '가스', v: d.gas },
                    { l: '인터넷', v: d.internet },
                    { l: '정수기', v: d.purifier },
                  ].map(item => (
                    <span key={item.l} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, background: '#f8f9fa', color: GRAY }}>
                      {item.l} {(item.v / 10000).toFixed(1)}만
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== 기타지출 ===== */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>기타지출 · {Math.round(opexTotalAll / 10000).toLocaleString()}만원</div>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          {opex.map((d, i) => {
            const cc = CAT_COLOR[d.category] || CAT_COLOR['기타'];
            return (
              <div key={d.id}>
                {i > 0 && <div style={{ height: 1, background: '#f2f4f6' }} />}
                <div style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: cc.bg, color: cc.color }}>{d.category}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.memo}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{fmt(d.amount)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 4, paddingLeft: 0 }}>
                    {d.house} · {d.date} · {d.by}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
