'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { mockHouses, mockBills, totalBill, perPerson, isOver, overAmt, fmt, type UtilityBill, type House } from '@/../data/mockUtilities';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1', ORANGE = '#f59f00';

export default function UtilityPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(6);
  const [year] = useState(2025);
  const [bills, setBills] = useState(mockBills);
  const [detailHouseId, setDetailHouseId] = useState<number | null>(null);
  const [inputHouseId, setInputHouseId] = useState<number | null>(null);
  const [inputElec, setInputElec] = useState('');
  const [inputWater, setInputWater] = useState('');
  const [inputGas, setInputGas] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const monthBills = useMemo(() => bills.filter(b => b.month === month && b.year === year), [bills, month, year]);

  const housesWithBills = useMemo(() => {
    return mockHouses.map(h => {
      const bill = monthBills.find(b => b.houseId === h.id);
      return { ...h, bill };
    });
  }, [monthBills]);

  const inputted = housesWithBills.filter(h => h.bill);
  const notInputted = housesWithBills.filter(h => !h.bill);
  const overHouses = inputted.filter(h => h.bill && isOver(h.bill, h.tenants, h.baseAmount));
  const totalExpense = inputted.reduce((s, h) => s + (h.bill ? totalBill(h.bill) : 0), 0);
  const avgPerPerson = inputted.length > 0 ? Math.round(inputted.reduce((s, h) => s + (h.bill ? perPerson(h.bill, h.tenants) : 0), 0) / inputted.length) : 0;

  // Sort: notInputted → over → normal
  const sortedHouses = useMemo(() => {
    const ni = housesWithBills.filter(h => !h.bill);
    const ov = housesWithBills.filter(h => h.bill && isOver(h.bill, h.tenants, h.baseAmount));
    const nm = housesWithBills.filter(h => h.bill && !isOver(h.bill, h.tenants, h.baseAmount));
    return [...ni, ...ov, ...nm];
  }, [housesWithBills]);

  // Input modal
  const openInput = (h: { id: number; bill?: UtilityBill | undefined }) => {
    setInputHouseId(h.id);
    setInputElec(h.bill ? String(h.bill.elec) : '');
    setInputWater(h.bill ? String(h.bill.water) : '');
    setInputGas(h.bill ? String(h.bill.gas) : '');
  };

  const saveInput = () => {
    if (!inputHouseId) return;
    const house = mockHouses.find(h => h.id === inputHouseId)!;
    const e = Number(inputElec) || 0, w = Number(inputWater) || 0, g = Number(inputGas) || 0;
    if (e === 0 && w === 0 && g === 0) return;

    setBills(prev => {
      const filtered = prev.filter(b => !(b.houseId === inputHouseId && b.month === month && b.year === year));
      return [...filtered, { houseId: inputHouseId, month, year, elec: e, water: w, gas: g, inputDate: `${month}월 ${new Date().getDate()}일` }];
    });
    setInputHouseId(null);
    showToast(`${house.name} 공과금 저장 완료!`);
  };

  const inputPreview = useMemo(() => {
    if (!inputHouseId) return null;
    const house = mockHouses.find(h => h.id === inputHouseId)!;
    const e = Number(inputElec) || 0, w = Number(inputWater) || 0, g = Number(inputGas) || 0;
    const total = e + w + g;
    const pp = total > 0 ? Math.round(total / house.tenants) : 0;
    return { total, pp, over: pp > house.baseAmount };
  }, [inputHouseId, inputElec, inputWater, inputGas]);

  // Trend data
  const trendMonths = [4, 5, 6];
  const trendTotals = trendMonths.map(m => {
    const mb = bills.filter(b => b.month === m && b.year === year);
    return mb.reduce((s, b) => s + totalBill(b), 0);
  });
  const maxTrend = Math.max(...trendTotals, 1);

  const tabLabels = ['현황', '입력', '추이', '청구'];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>공과금 관리</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {trendMonths.map(m => (
            <button key={m} onClick={() => setMonth(m)}
              style={{ padding: '6px 12px', borderRadius: 16, border: 'none', background: month === m ? BLUE : '#F2F4F6', color: month === m ? '#fff' : '#666', fontSize: 12, fontWeight: month === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
              {m}월
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {tabLabels.map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
            {label}
            {i === 3 && overHouses.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: '20%', width: 16, height: 16, borderRadius: '50%', background: RED, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{overHouses.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {/* ===== Tab 0: 현황 ===== */}
        {tab === 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: '전체 지출', value: fmt(totalExpense), color: '#191919' },
                { label: '초과 지점', value: `${overHouses.length}곳`, color: overHouses.length > 0 ? RED : GREEN },
                { label: '평균 1인당', value: fmt(avgPerPerson), color: avgPerPerson > 100000 ? ORANGE : GREEN },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {sortedHouses.map(h => {
              const bill = h.bill;
              if (!bill) {
                return (
                  <div key={h.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: '1px dashed #e5e8eb', opacity: 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                        <div style={{ fontSize: 12, color: GRAY }}>{h.gu} · {h.tenants}명</div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#F2F4F6', color: GRAY }}>미입력</span>
                    </div>
                  </div>
                );
              }
              const total = totalBill(bill);
              const pp = perPerson(bill, h.tenants);
              const over = isOver(bill, h.tenants, h.baseAmount);
              const ratio = Math.min((pp / h.baseAmount) * 100, 150);
              return (
                <button key={h.id} onClick={() => setDetailHouseId(h.id)}
                  style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: over ? '1px solid #fde68a' : '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</span>
                      {over && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#fff0f1', color: RED }}>⚠ 초과</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{fmt(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: GRAY }}>{h.gu} · {h.tenants}명</span>
                    <span style={{ fontSize: 12, color: over ? RED : GREEN, fontWeight: 600 }}>1인당 {fmt(pp)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#F2F4F6', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(ratio, 100)}%`, height: '100%', borderRadius: 3, background: over ? RED : GREEN }} />
                  </div>
                </button>
              );
            })}
          </>
        )}

        {/* ===== Tab 1: 입력 ===== */}
        {tab === 1 && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>{inputted.length}곳</div>
                <div style={{ fontSize: 11, color: GRAY }}>입력완료</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: notInputted.length > 0 ? RED : GRAY }}>{notInputted.length}곳</div>
                <div style={{ fontSize: 11, color: GRAY }}>미입력</div>
              </div>
            </div>

            {[...notInputted, ...inputted].map(h => (
              <button key={h.id} onClick={() => openInput(h)}
                style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: !h.bill ? '1px dashed #e5e8eb' : '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: h.bill ? 6 : 0 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{h.gu} · {h.tenants}명</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: h.bill ? '#e8faf2' : '#FFF0F0', color: h.bill ? GREEN : RED }}>
                    {h.bill ? '입력완료' : '미입력'}
                  </span>
                </div>
                {h.bill && (
                  <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>
                    전기 {fmt(h.bill.elec)} · 수도 {fmt(h.bill.water)} · 가스 {fmt(h.bill.gas)}
                  </div>
                )}
              </button>
            ))}
          </>
        )}

        {/* ===== Tab 2: 추이 ===== */}
        {tab === 2 && (
          <>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{year}년 공과금 추이</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 120 }}>
                {trendMonths.map((m, i) => {
                  const ratio = (trendTotals[i] / maxTrend) * 100;
                  const active = m === month;
                  return (
                    <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? BLUE : GRAY }}>{Math.round(trendTotals[i] / 10000).toLocaleString()}만</span>
                      <div style={{ width: '100%', maxWidth: 48, height: `${Math.max(ratio, 10)}%`, borderRadius: 6, background: active ? BLUE : 'rgba(49,130,246,0.25)' }} />
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? BLUE : GRAY }}>{m}월</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {mockHouses.map(h => {
              const hBills = trendMonths.map(m => bills.find(b => b.houseId === h.id && b.month === m && b.year === year));
              const hTotals = hBills.map(b => b ? totalBill(b) : 0);
              const hMax = Math.max(...hTotals, 1);
              return (
                <div key={h.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{h.name}</div>
                  {trendMonths.map((m, i) => {
                    const val = hTotals[i];
                    const ratio = (val / hMax) * 100;
                    const active = m === month;
                    const prev = i > 0 ? hTotals[i - 1] : 0;
                    const diff = prev > 0 ? val - prev : 0;
                    return (
                      <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ width: 28, fontSize: 12, color: active ? BLUE : GRAY, fontWeight: active ? 700 : 400 }}>{m}월</span>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F2F4F6', overflow: 'hidden' }}>
                          <div style={{ width: `${ratio}%`, height: '100%', borderRadius: 4, background: active ? BLUE : 'rgba(49,130,246,0.3)' }} />
                        </div>
                        <span style={{ fontSize: 11, color: active ? '#191919' : GRAY, fontWeight: active ? 600 : 400, minWidth: 70, textAlign: 'right' }}>{val > 0 ? fmt(val) : '—'}</span>
                        {diff !== 0 && (
                          <span style={{ fontSize: 10, color: diff > 0 ? RED : GREEN, display: 'flex', alignItems: 'center' }}>
                            {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* ===== Tab 3: 청구 ===== */}
        {tab === 3 && (
          <>
            {overHouses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>이번달은 추가 청구할</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>지점이 없어요</div>
              </div>
            ) : (
              <>
                <div style={{ background: '#FFF0F0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: RED, margin: 0, fontWeight: 600 }}>기준(1인당 {fmt(100000)}) 초과 지점</p>
                  <p style={{ fontSize: 12, color: RED, margin: '4px 0 0', opacity: 0.8 }}>추가 청구 필요</p>
                </div>
                {overHouses.map(h => {
                  const bill = h.bill!;
                  const pp = perPerson(bill, h.tenants);
                  const over = overAmt(bill, h.tenants, h.baseAmount);
                  const chargeTotal = over * h.tenants;
                  return (
                    <div key={h.id} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 10, border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{h.name}</span>
                        <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#fff0f1', color: RED }}>⚠ 초과</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        {[
                          { l: '1인당 공과금', v: fmt(pp), c: RED },
                          { l: '기준 초과분', v: `+${fmt(over)}`, c: RED },
                          { l: '입주자 수', v: `${h.tenants}명`, c: '#191919' },
                          { l: '추가 청구 합계', v: fmt(chargeTotal), c: RED },
                        ].map(row => (
                          <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: row.c }}>{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => showToast(`${h.name} 추가 청구서 발송 완료!`)}
                        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        추가 청구서 발송 ({fmt(chargeTotal)})
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* ===== Detail Modal ===== */}
      {detailHouseId && (() => {
        const h = mockHouses.find(x => x.id === detailHouseId)!;
        const bill = monthBills.find(b => b.houseId === detailHouseId);
        if (!bill) { setDetailHouseId(null); return null; }
        const total = totalBill(bill);
        const pp = perPerson(bill, h.tenants);
        const over = isOver(bill, h.tenants, h.baseAmount);
        const oa = overAmt(bill, h.tenants, h.baseAmount);
        const avgElec = Math.round(bill.elec / h.tenants);
        const avgWater = Math.round(bill.water / h.tenants);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={() => setDetailHouseId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{h.name} · {month}월</span>
                <button onClick={() => setDetailHouseId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { l: '지점 총액', v: fmt(total), c: '#191919' },
                  { l: '입주자 수', v: `${h.tenants}명`, c: '#191919' },
                  { l: '1인당', v: fmt(pp), c: over ? RED : GREEN },
                  { l: '기준 대비', v: over ? `+${fmt(oa)}` : '기준 이내', c: over ? RED : GREEN },
                ].map(row => (
                  <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: row.c }}>{row.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: '#F0F0F0', margin: '8px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { icon: '⚡', label: '전기', value: bill.elec, high: avgElec > 40000 },
                  { icon: '💧', label: '수도', value: bill.water, high: avgWater > 10000 },
                  { icon: '🔥', label: '가스', value: bill.gas, high: false },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>{item.icon} {item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{fmt(item.value)}</span>
                      {item.high && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FFF0F0', color: RED }}>높음</span>}
                    </div>
                  </div>
                ))}
              </div>
              {over && (
                <>
                  <div style={{ height: 1, background: '#F0F0F0', margin: '8px 0' }} />
                  <div style={{ background: '#FFF8E8', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ORANGE, marginBottom: 4 }}>⚠ 추가 청구 필요</div>
                    <div style={{ fontSize: 12, color: '#666' }}>1인당 초과: {fmt(oa)}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{h.tenants}명 × {fmt(oa)} = {fmt(oa * h.tenants)}</div>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {over && (
                  <button onClick={() => { showToast(`${h.name} 추가 청구서 발송 완료!`); setDetailHouseId(null); }}
                    style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: RED, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    추가 청구서 발송
                  </button>
                )}
                <button onClick={() => setDetailHouseId(null)}
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid #E8E8E8', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== Input Modal ===== */}
      {inputHouseId && (() => {
        const house = mockHouses.find(h => h.id === inputHouseId)!;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={() => setInputHouseId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>고지서 입력</span>
                <button onClick={() => setInputHouseId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
              </div>
              <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>{house.name} · {month}월</div>

              {[
                { icon: '⚡', label: '전기요금', val: inputElec, set: setInputElec },
                { icon: '💧', label: '수도요금', val: inputWater, set: setInputWater },
                { icon: '🔥', label: '가스요금', val: inputGas, set: setInputGas },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>{f.icon} {f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} type="number" placeholder="0"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}

              {inputPreview && inputPreview.total > 0 && (
                <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: GRAY }}>예상 1인당</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: inputPreview.over ? RED : GREEN }}>{fmt(inputPreview.pp)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: GRAY }}>기준</span>
                    <span style={{ fontSize: 12, color: GRAY }}>{fmt(house.baseAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: GRAY }}>상태</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: inputPreview.over ? RED : GREEN }}>
                      {inputPreview.over ? '⚠ 기준 초과' : '✅ 기준 이내'}
                    </span>
                  </div>
                </div>
              )}

              <button onClick={saveInput}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                저장하기
              </button>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
