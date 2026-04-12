'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { X, Plus, Check } from 'lucide-react';
import { mockHouses, getExp, sumExp, calcRev, calcProfit, calcInvShare, calcOwnShare, fmt, type Expense } from '@/../data/mockRevenue';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452';

type SheetData = {
  title: string; type: string;
  items: { label: string; amt: number; sub?: string; status?: string }[];
  total: number;
}

export default function RevenueDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const houseId = Number(params.houseId);
  const house = mockHouses.find(h => h.id === houseId);

  const [year, setYear] = useState(Number(searchParams.get('year')) || 2025);
  const [month, setMonth] = useState(Number(searchParams.get('month')) || 6);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const [extraMap, setExtraMap] = useState<Record<string, { label: string; amt: number }[]>>({});
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  if (!house) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#BBB' }}>존재하지 않는 지점입니다</p>
      </div>
    );
  }

  const yk = `${year}-${month}`;
  const exp = getExp(houseId, yk);
  const addedExtras = extraMap[yk] || [];
  const allExtras = [...exp.extra, ...addedExtras];
  const totalExp = sumExp(exp) + addedExtras.reduce((s, x) => s + x.amt, 0);
  const revenue = calcRev(house);
  const profit = revenue - totalExp;
  const invShare = house.investor ? Math.round(profit * house.investor.ratio) : 0;
  const ownShare = profit - invShare;

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  useEffect(() => { if (sheet) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; }, [sheet]);

  const openSheet = (title: string, type: string) => {
    let items: SheetData['items'] = [];
    let total = 0;

    if (type === 'rent') {
      total = house.rent * house.tenants;
      const paid = house.tenants - 1;
      items = Array.from({ length: house.tenants }, (_, i) => ({
        label: `${100 + i + 1}호`, amt: house.rent,
        sub: i < paid ? '납부' : '미납',
        status: i < paid ? 'paid' : 'unpaid',
      }));
    } else if (type === 'mgmt') {
      total = house.mgmt * house.tenants;
      items = Array.from({ length: house.tenants }, (_, i) => ({
        label: `${100 + i + 1}호`, amt: house.mgmt, sub: '납부', status: 'paid',
      }));
    } else if (type === 'utility') {
      total = exp.utility;
      items = [
        { label: '⚡ 전기', amt: Math.round(exp.utility * 0.56), sub: '고지서 기준' },
        { label: '💧 수도', amt: Math.round(exp.utility * 0.27), sub: '고지서 기준' },
        { label: '🔥 가스', amt: Math.round(exp.utility * 0.17), sub: '고지서 기준' },
      ];
    } else if (type === 'worker') {
      total = exp.worker;
      items = [
        { label: '청소 용역', amt: Math.round(exp.worker * 0.6), sub: '월 4회' },
        { label: '수리 용역', amt: Math.round(exp.worker * 0.4), sub: '필요 시 호출' },
      ];
    } else if (type === 'ops') {
      total = exp.ops;
      items = [
        { label: '소모품', amt: Math.round(exp.ops * 0.35), sub: '청소용품' },
        { label: '인터넷', amt: Math.round(exp.ops * 0.45), sub: '통신비' },
        { label: '기타 잡비', amt: Math.round(exp.ops * 0.2), sub: '행정/우편' },
      ];
    } else if (type === 'extra') {
      const item = allExtras.find(e => e.label === title);
      total = item?.amt || 0;
      items = [{ label: title, amt: total, sub: '기타 지출' }];
    }

    setSheet({ title: type === 'rent' ? '월세 세부내역' : type === 'mgmt' ? '관리비 세부내역' : `${title} 세부내역`, type, items, total });
  };

  const addExtra = () => {
    const amt = Number(newAmt);
    if (!newLabel || !amt) return;
    setExtraMap(prev => ({
      ...prev,
      [yk]: [...(prev[yk] || []), { label: newLabel, amt }],
    }));
    setNewLabel(''); setNewAmt(''); setAddMode(false);
    showToast('항목이 추가됐어요');
  };

  // Trend data
  const trendMonths = [4, 5, 6].map(m => {
    const k = `${year}-${m}`;
    const p = calcRev(house) - sumExp(getExp(houseId, k));
    return { m, profit: p };
  });
  const maxProfit = Math.max(...trendMonths.map(t => Math.abs(t.profit)), 1);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{house.name}</span>
          </div>
          {house.investor && (
            <span style={{ fontSize: 12, color: GRAY }}>{house.investor.name} {Math.round(house.investor.ratio * 10)}:{Math.round((1 - house.investor.ratio) * 10)}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 15, cursor: 'pointer', color: '#191f28' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{year}년 {month}월</div>
          <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 15, cursor: 'pointer', color: '#191f28' }}>›</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Profit Summary */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>순이익</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#191f28', marginBottom: 12 }}>{fmt(profit)}</div>
          <div style={{ height: 1, background: '#F2F4F6', marginBottom: 12 }} />
          <div style={{ display: 'flex' }}>
            {[
              { l: '매출', v: fmt(revenue), c: BLUE },
              { l: '지출', v: fmt(totalExp), c: RED },
              { l: house.investor ? '내 몫' : '순이익', v: fmt(house.investor ? ownShare : profit), c: '#191f28' },
            ].map(col => (
              <div key={col.l} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 2 }}>{col.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: col.c }}>{col.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Card */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>매출</div>
          {[
            { label: '월세', sub: `${house.tenants}명 × ${fmt(house.rent)}`, amt: house.rent * house.tenants, type: 'rent' },
            { label: '관리비', sub: `${house.tenants}명 × ${fmt(house.mgmt)}`, amt: house.mgmt * house.tenants, type: 'mgmt' },
          ].map((row, i) => (
            <div key={row.label}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0' }} />}
              <button onClick={() => openSheet(row.label, row.type)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: GRAY }}>{row.sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(row.amt)}</span>
                  <span style={{ color: '#CCC' }}>›</span>
                </div>
              </button>
            </div>
          ))}
          <div style={{ height: 1, background: '#E8E8E8', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>합계</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{fmt(revenue)}</span>
          </div>
        </div>

        {/* Expense Card */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>지출</div>
          {[
            { label: '공과금', amt: exp.utility, type: 'utility' },
            { label: '용역비', amt: exp.worker, type: 'worker' },
            { label: '운영비', amt: exp.ops, type: 'ops' },
            ...allExtras.map(e => ({ label: e.label, amt: e.amt, type: 'extra' })),
          ].map((row, i) => (
            <div key={`${row.label}-${i}`}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
              <button onClick={() => openSheet(row.label, row.type)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{row.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(row.amt)}</span>
                  <span style={{ color: '#CCC' }}>›</span>
                </div>
              </button>
            </div>
          ))}

          <div style={{ height: 1, background: '#F5F5F5' }} />
          {addMode ? (
            <div style={{ padding: '10px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="항목명"
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <input value={newAmt} onChange={e => setNewAmt(e.target.value)} type="number" placeholder="금액"
                style={{ width: 90, padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={addExtra} style={{ background: BLUE, border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Check size={14} color="#fff" /></button>
              <button onClick={() => setAddMode(false)} style={{ background: '#F0F0F0', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><X size={14} color="#999" /></button>
            </div>
          ) : (
            <button onClick={() => setAddMode(true)}
              style={{ width: '100%', padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: BLUE, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Plus size={14} /> 항목 추가
            </button>
          )}

          <div style={{ height: 1, background: '#E8E8E8', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>합계</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: RED }}>{fmt(totalExp)}</span>
          </div>
        </div>

        {/* Investor Split */}
        {house.investor && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>순이익 배분</div>
            <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${house.investor.ratio * 100}%`, background: '#c4b5fd' }} />
              <div style={{ flex: 1, background: BLUE }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#7c3aed' }}>{house.investor.name} {Math.round(house.investor.ratio * 100)}%</span>
              <span style={{ fontSize: 11, color: BLUE }}>운영자 {Math.round((1 - house.investor.ratio) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{house.investor.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>{fmt(invShare)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#666' }}>운영자 (내 몫)</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{fmt(ownShare)}</span>
              </div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/investor/${house.investor!.token}`); showToast('링크가 복사됐어요!'); }}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#f2f4f6', color: '#191f28', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>
              🔗 투자자 링크 공유
            </button>
          </div>
        )}

        {/* Trend */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>최근 3개월</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 80 }}>
            {trendMonths.map(t => {
              const ratio = (Math.abs(t.profit) / maxProfit) * 100;
              const active = t.m === month;
              return (
                <div key={t.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? BLUE : GRAY }}>{Math.round(t.profit / 10000).toLocaleString()}만</span>
                  <div style={{ width: '100%', maxWidth: 48, height: `${Math.max(ratio, 10)}%`, borderRadius: 6, background: active ? BLUE : '#e5e8eb' }} />
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? BLUE : GRAY }}>{t.m}월</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      {sheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '78vh', background: '#fff', borderRadius: '20px 20px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 12px' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{sheet.title}</div>
                <div style={{ fontSize: 12, color: GRAY }}>{month}월 기준</div>
              </div>
              <button onClick={() => setSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>

            <div style={{ background: '#f8f9fa', margin: '0 20px', borderRadius: 10, padding: '10px 14px', marginBottom: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: GRAY }}>합계 </span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{fmt(sheet.total)}</span>
            </div>

            {(sheet.type === 'rent' || sheet.type === 'mgmt') && (
              <div style={{ display: 'flex', gap: 8, padding: '0 20px', marginBottom: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e8faf2', color: '#0e6245' }}>납부 {sheet.items.filter(i => i.status === 'paid').length}명</span>
                {sheet.items.some(i => i.status === 'unpaid') && (
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff0f1', color: '#c0392b' }}>미납 {sheet.items.filter(i => i.status === 'unpaid').length}명</span>
                )}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              {sheet.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < sheet.items.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                    {item.sub && <span style={{ fontSize: 11, color: GRAY, marginLeft: 8 }}>{item.sub === '납부' || item.sub === '미납' ? '' : item.sub}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(item.amt)}</span>
                    {item.status && (
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: item.status === 'paid' ? '#e8faf2' : '#fff0f1', color: item.status === 'paid' ? GREEN : RED }}>
                        {item.status === 'paid' ? '납부' : '미납'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
