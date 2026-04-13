'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1', ORANGE = '#f59f00';
const fmt = (n: number) => n.toLocaleString() + '원';
const BASE_AMOUNT = 100000;

type UtilData = { ID: string; 지점명: string; 연도: string; 월: string; 전기: string; 가스: string; 수도: string; 인터넷: string; 정수기: string; 메모: string };
type HouseInfo = { name: string; tenants: number; district?: string; investor?: string };

function totalBill(d: UtilData) { return ['전기', '가스', '수도', '인터넷', '정수기'].reduce((s, k) => s + (Number((d as Record<string, string>)[k]) || 0), 0); }
function perPerson(d: UtilData, tenants: number) { return tenants > 0 ? Math.round(totalBill(d) / tenants) : 0; }
function isOver(d: UtilData, tenants: number) { return perPerson(d, tenants) > BASE_AMOUNT; }
function overAmt(d: UtilData, tenants: number) { return Math.max(0, perPerson(d, tenants) - BASE_AMOUNT); }

export default function UtilityPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<UtilData[]>([]);
  const [allData, setAllData] = useState<UtilData[]>([]); // For trend tab
  const [houses, setHouses] = useState<HouseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string | null>(null);
  const [inputElec, setInputElec] = useState('');
  const [inputWater, setInputWater] = useState('');
  const [inputGas, setInputGas] = useState('');
  const [inputInternet, setInputInternet] = useState('');
  const [inputPurifier, setInputPurifier] = useState('');
  const [toast, setToast] = useState('');
  const [filterGu, setFilterGu] = useState('전체');
  const [filterInvestor, setFilterInvestor] = useState('전체');
  const [openDrop, setOpenDrop] = useState<'gu' | 'inv' | null>(null);
  const [guList, setGuList] = useState<string[]>(['전체']);
  const [investorList, setInvestorList] = useState<string[]>(['전체']);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/utility?year=${year}&month=${month}`).then(r => r.json()),
      fetch(`/api/utility?year=${year}`).then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
      fetch('/api/investors').then(r => r.json()),
    ]).then(([monthData, yearData, tenantData, houseData, investorData]) => {
      setData(Array.isArray(monthData) ? monthData : []);
      setAllData(Array.isArray(yearData) ? yearData : []);

      const hArr = Array.isArray(houseData) ? houseData : [];
      const invArr = Array.isArray(investorData) ? investorData : [];

      // Build district map & investor map from houses + investors
      const districtMap: Record<string, string> = {};
      const tokenToInvestor: Record<string, string> = {};
      const houseInvestorMap: Record<string, string> = {};

      for (const inv of invArr) { if (inv['링크토큰']) tokenToInvestor[inv['링크토큰']] = inv['투자자명']; }
      for (const h of hArr) {
        const name = h['지점명']?.trim();
        if (!name) continue;
        districtMap[name] = h['구'] || '';
        if (h['투자자토큰'] && tokenToInvestor[h['투자자토큰']]) houseInvestorMap[name] = tokenToInvestor[h['투자자토큰']];
      }

      // Build gu list & investor list
      const gus = [...new Set(Object.values(districtMap).filter(Boolean))].sort();
      setGuList(['전체', ...gus]);
      const invNames = [...new Set(Object.values(houseInvestorMap).filter(Boolean))].sort();
      setInvestorList(['전체', ...invNames]);

      // Build house list with tenant counts + district + investor
      const tArr = Array.isArray(tenantData) ? tenantData : [];
      const active = tArr.filter((t: Record<string, string>) => t['상태'] === '입주중' || t['상태'] === '계약중');
      const houseCountMap: Record<string, number> = {};
      for (const t of active) { const h = t['지점명']; if (h) houseCountMap[h] = (houseCountMap[h] || 0) + 1; }
      setHouses(Object.entries(houseCountMap).map(([name, tenants]) => ({
        name, tenants, district: districtMap[name] || '', investor: houseInvestorMap[name] || '',
      })).sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [month, year]);

  // Filter houses by gu + investor
  const filteredHouses = useMemo(() => {
    return houses.filter(h => {
      if (filterGu !== '전체' && h.district !== filterGu) return false;
      if (filterInvestor !== '전체' && h.investor !== filterInvestor) return false;
      return true;
    });
  }, [houses, filterGu, filterInvestor]);

  // Merge houses with bills
  const housesWithBills = useMemo(() => {
    return filteredHouses.map(h => {
      const bill = data.find(d => d.지점명 === h.name);
      return { ...h, bill };
    });
  }, [filteredHouses, data]);

  const inputted = housesWithBills.filter(h => h.bill);
  const notInputted = housesWithBills.filter(h => !h.bill);
  const overHouses = inputted.filter(h => h.bill && isOver(h.bill, h.tenants));
  const totalExpense = inputted.reduce((s, h) => s + (h.bill ? totalBill(h.bill) : 0), 0);
  const avgPerPerson = inputted.length > 0 ? Math.round(inputted.reduce((s, h) => s + (h.bill ? perPerson(h.bill, h.tenants) : 0), 0) / inputted.length) : 0;

  const sortedHouses = useMemo(() => {
    const ni = housesWithBills.filter(h => !h.bill);
    const ov = housesWithBills.filter(h => h.bill && isOver(h.bill, h.tenants));
    const nm = housesWithBills.filter(h => h.bill && !isOver(h.bill, h.tenants));
    return [...ni, ...ov, ...nm];
  }, [housesWithBills]);

  const openInput = (h: { name: string; bill?: UtilData }) => {
    setInputName(h.name);
    setInputElec(h.bill ? h.bill.전기 : '');
    setInputWater(h.bill ? h.bill.수도 : '');
    setInputGas(h.bill ? h.bill.가스 : '');
    setInputInternet(h.bill ? h.bill.인터넷 : '');
    setInputPurifier(h.bill ? h.bill.정수기 : '');
  };

  const saveInput = async () => {
    if (!inputName) return;
    const e = Number(inputElec) || 0, w = Number(inputWater) || 0, g = Number(inputGas) || 0;
    const inet = Number(inputInternet) || 0, pur = Number(inputPurifier) || 0;
    if (e === 0 && w === 0 && g === 0) return;

    await fetch('/api/utility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 지점명: inputName, 연도: year, 월: month, 전기: e, 가스: g, 수도: w, 인터넷: inet, 정수기: pur }),
    });
    setInputName(null);
    showToast(`${inputName} 공과금 저장 완료!`);
    fetchData();
  };

  const inputPreview = useMemo(() => {
    if (!inputName) return null;
    const house = houses.find(h => h.name === inputName);
    const tenants = house?.tenants || 1;
    const e = Number(inputElec) || 0, w = Number(inputWater) || 0, g = Number(inputGas) || 0;
    const inet = Number(inputInternet) || 0, pur = Number(inputPurifier) || 0;
    const total = e + w + g + inet + pur;
    const pp = total > 0 ? Math.round(total / tenants) : 0;
    return { total, pp, over: pp > BASE_AMOUNT };
  }, [inputName, inputElec, inputWater, inputGas, inputInternet, inputPurifier, houses]);

  // Trend data
  const trendMonths = useMemo(() => {
    const ms = [month - 2, month - 1, month].filter(m => m > 0);
    return ms.map(m => {
      const monthData = allData.filter(d => d.월 === String(m));
      return { m, total: monthData.reduce((s, d) => s + totalBill(d), 0) };
    });
  }, [allData, month]);
  const maxTrend = Math.max(...trendMonths.map(t => t.total), 1);

  const tabLabels = ['현황', '입력', '추이', '청구'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>공과금 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>공과금 관리</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setYear(y => y - 1)} style={{ border: 'none', background: 'none', fontSize: 16, color: '#4e5968', cursor: 'pointer', padding: '0 4px' }}>‹</button>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#4e5968' }}>{year}</span>
            <button onClick={() => setYear(y => y + 1)} style={{ border: 'none', background: 'none', fontSize: 16, color: '#4e5968', cursor: 'pointer', padding: '0 4px' }}>›</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', display: 'flex', gap: 6, padding: '0 16px 12px', scrollbarWidth: 'none' } as React.CSSProperties}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <button key={m} onClick={() => setMonth(m)}
              style={{ padding: '7px 14px', borderRadius: 100, border: `1px solid ${month === m ? '#3182f6' : '#e5e8eb'}`, background: month === m ? '#3182f6' : '#fff', color: month === m ? '#fff' : '#4e5968', fontSize: 13, fontWeight: month === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {m}월
            </button>
          ))}
        </div>
        {/* Filter bar */}
        <div style={{ padding: '0 16px', display: 'flex', gap: 8, marginBottom: 4, position: 'relative' }}>
          {/* 구 드롭다운 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setOpenDrop(openDrop === 'gu' ? null : 'gu')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, border: `1px solid ${filterGu !== '전체' ? '#3182f6' : '#e5e8eb'}`, background: filterGu !== '전체' ? '#edf3ff' : '#fff', color: filterGu !== '전체' ? '#3182f6' : '#4e5968', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {filterGu === '전체' ? '구 선택' : filterGu}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {openDrop === 'gu' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100, background: '#fff', borderRadius: 12, border: '1px solid #e5e8eb', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 8, minWidth: 140, maxHeight: 240, overflowY: 'auto' }}>
                {guList.map(g => (
                  <button key={g} onClick={() => { setFilterGu(g); setOpenDrop(null); }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: filterGu === g ? '#edf3ff' : 'transparent', color: filterGu === g ? '#3182f6' : '#4e5968', fontSize: 14, fontWeight: filterGu === g ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 투자자 드롭다운 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setOpenDrop(openDrop === 'inv' ? null : 'inv')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, border: `1px solid ${filterInvestor !== '전체' ? '#3182f6' : '#e5e8eb'}`, background: filterInvestor !== '전체' ? '#edf3ff' : '#fff', color: filterInvestor !== '전체' ? '#3182f6' : '#4e5968', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {filterInvestor === '전체' ? '투자자 선택' : filterInvestor}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {openDrop === 'inv' && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100, background: '#fff', borderRadius: 12, border: '1px solid #e5e8eb', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 8, minWidth: 140, maxHeight: 240, overflowY: 'auto' }}>
                {investorList.map(inv => (
                  <button key={inv} onClick={() => { setFilterInvestor(inv); setOpenDrop(null); }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: filterInvestor === inv ? '#edf3ff' : 'transparent', color: filterInvestor === inv ? '#3182f6' : '#4e5968', fontSize: 14, fontWeight: filterInvestor === inv ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    {inv}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid #F0F0F0' }}>
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
      </div>

      <div style={{ padding: 16 }}>
        {/* Tab 0: 현황 */}
        {tab === 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: '전체 지출', value: fmt(totalExpense), color: '#191919' },
                { label: '초과 지점', value: `${overHouses.length}곳`, color: overHouses.length > 0 ? RED : GREEN },
                { label: '평균 1인당', value: fmt(avgPerPerson), color: avgPerPerson > BASE_AMOUNT ? ORANGE : GREEN },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {sortedHouses.map(h => {
              if (!h.bill) {
                return (
                  <div key={h.name} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: '1px dashed #e5e8eb', opacity: 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                        <div style={{ fontSize: 12, color: GRAY }}>{h.tenants}명</div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#F2F4F6', color: GRAY }}>미입력</span>
                    </div>
                  </div>
                );
              }
              const total = totalBill(h.bill);
              const pp = perPerson(h.bill, h.tenants);
              const over = isOver(h.bill, h.tenants);
              const ratio = Math.min((pp / BASE_AMOUNT) * 100, 150);
              return (
                <button key={h.name} onClick={() => setDetailName(h.name)}
                  style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: over ? '1px solid #fde68a' : '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</span>
                      {over && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#fff0f1', color: RED }}>⚠ 초과</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{fmt(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: GRAY }}>{h.tenants}명</span>
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

        {/* Tab 1: 입력 */}
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
              <button key={h.name} onClick={() => openInput(h)}
                style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: !h.bill ? '1px dashed #e5e8eb' : '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: h.bill ? 6 : 0 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{h.tenants}명</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: h.bill ? '#e8faf2' : '#FFF0F0', color: h.bill ? GREEN : RED }}>
                    {h.bill ? '입력완료' : '미입력'}
                  </span>
                </div>
                {h.bill && (
                  <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>
                    전기 {fmt(Number(h.bill.전기))} · 수도 {fmt(Number(h.bill.수도))} · 가스 {fmt(Number(h.bill.가스))}
                  </div>
                )}
              </button>
            ))}
          </>
        )}

        {/* Tab 2: 추이 */}
        {tab === 2 && (
          <>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{year}년 공과금 추이</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 120 }}>
                {trendMonths.map(t => {
                  const ratio = (t.total / maxTrend) * 100;
                  const active = t.m === month;
                  return (
                    <div key={t.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? BLUE : GRAY }}>{t.total > 0 ? `${Math.round(t.total / 10000).toLocaleString()}만` : '—'}</span>
                      <div style={{ width: '100%', maxWidth: 48, height: `${Math.max(ratio, 10)}%`, borderRadius: 6, background: active ? BLUE : 'rgba(49,130,246,0.25)' }} />
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? BLUE : GRAY }}>{t.m}월</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {filteredHouses.map(h => {
              const hBills = trendMonths.map(t => allData.find(d => d.지점명 === h.name && d.월 === String(t.m)));
              const hTotals = hBills.map(b => b ? totalBill(b) : 0);
              const hMax = Math.max(...hTotals, 1);
              return (
                <div key={h.name} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{h.name}</div>
                  {trendMonths.map((t, i) => {
                    const val = hTotals[i];
                    const ratio = (val / hMax) * 100;
                    const active = t.m === month;
                    const prev = i > 0 ? hTotals[i - 1] : 0;
                    const diff = prev > 0 ? val - prev : 0;
                    return (
                      <div key={t.m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ width: 28, fontSize: 12, color: active ? BLUE : GRAY, fontWeight: active ? 700 : 400 }}>{t.m}월</span>
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

        {/* Tab 3: 청구 */}
        {tab === 3 && (
          overHouses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>이번달은 추가 청구할</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>지점이 없어요</div>
            </div>
          ) : (
            <>
              <div style={{ background: '#FFF0F0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: RED, margin: 0, fontWeight: 600 }}>기준(1인당 {fmt(BASE_AMOUNT)}) 초과 지점</p>
              </div>
              {overHouses.map(h => {
                const bill = h.bill!;
                const pp = perPerson(bill, h.tenants);
                const oa = overAmt(bill, h.tenants);
                const chargeTotal = oa * h.tenants;
                return (
                  <div key={h.name} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 10, border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{h.name}</span>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#fff0f1', color: RED }}>⚠ 초과</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {[
                        { l: '1인당 공과금', v: fmt(pp), c: RED },
                        { l: '기준 초과분', v: `+${fmt(oa)}`, c: RED },
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
          )
        )}
      </div>

      {/* Detail Modal */}
      {detailName && (() => {
        const h = houses.find(x => x.name === detailName);
        const bill = data.find(d => d.지점명 === detailName);
        if (!bill || !h) { setDetailName(null); return null; }
        const total = totalBill(bill);
        const pp = perPerson(bill, h.tenants);
        const over = isOver(bill, h.tenants);
        const oa = overAmt(bill, h.tenants);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={() => setDetailName(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{detailName} · {month}월</span>
                <button onClick={() => setDetailName(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { l: '지점 총액', v: fmt(total) },
                  { l: '입주자 수', v: `${h.tenants}명` },
                  { l: '1인당', v: fmt(pp), c: over ? RED : GREEN },
                  { l: '기준 대비', v: over ? `+${fmt(oa)}` : '기준 이내', c: over ? RED : GREEN },
                ].map(row => (
                  <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: (row as { c?: string }).c || '#191919' }}>{row.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: '#F0F0F0', margin: '8px 0' }} />
              {[
                { icon: '⚡', label: '전기', value: Number(bill.전기) },
                { icon: '💧', label: '수도', value: Number(bill.수도) },
                { icon: '🔥', label: '가스', value: Number(bill.가스) },
                { icon: '🌐', label: '인터넷', value: Number(bill.인터넷) },
                { icon: '🚿', label: '정수기', value: Number(bill.정수기) },
              ].filter(item => item.value > 0).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 14 }}>{item.icon} {item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{fmt(item.value)}</span>
                </div>
              ))}
              <button onClick={() => setDetailName(null)}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #E8E8E8', background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16 }}>
                닫기
              </button>
            </div>
          </div>
        );
      })()}

      {/* Input Modal */}
      {inputName && (() => {
        const house = houses.find(h => h.name === inputName);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={() => setInputName(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>고지서 입력</span>
                <button onClick={() => setInputName(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
              </div>
              <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>{inputName} · {month}월</div>
              {[
                { icon: '⚡', label: '전기요금', val: inputElec, set: setInputElec },
                { icon: '💧', label: '수도요금', val: inputWater, set: setInputWater },
                { icon: '🔥', label: '가스요금', val: inputGas, set: setInputGas },
                { icon: '🌐', label: '인터넷', val: inputInternet, set: setInputInternet },
                { icon: '🚿', label: '정수기', val: inputPurifier, set: setInputPurifier },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
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
