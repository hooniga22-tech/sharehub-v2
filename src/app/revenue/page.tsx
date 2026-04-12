'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { mockHouses, mockExpenses, calcRev, calcProfit, calcOwnShare, sumExp, getExp, fmt } from '@/../data/mockRevenue';

const BLUE = '#3182f6', GRAY = '#8b95a1';
const GUS = ['전체', '마포구', '강남구', '송파구', '강동구'];

export default function RevenuePage() {
  const router = useRouter();
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6);
  const [guFilter, setGuFilter] = useState('전체');

  const yk = `${year}-${month}`;
  const hasData = !!mockExpenses[yk];

  const houses = useMemo(() => {
    let list = mockHouses;
    if (guFilter !== '전체') list = list.filter(h => h.gu === guFilter);
    return list;
  }, [guFilter]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>매출·순이익</span>
        </div>

        {/* Month Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 12px' }}>
          <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 15, cursor: 'pointer', color: '#191f28' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#191f28' }}>{year}년 {month}월</div>
          <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 15, cursor: 'pointer', color: '#191f28' }}>›</button>
        </div>

        {/* Gu Filter */}
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {GUS.map(g => (
            <button key={g} onClick={() => setGuFilter(g)}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', background: guFilter === g ? '#191f28' : '#F2F4F6', color: guFilter === g ? '#fff' : '#666', fontSize: 12, fontWeight: guFilter === g ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* House Cards */}
      <div style={{ padding: 16 }}>
        {houses.map(h => {
          if (!hasData) {
            return (
              <div key={h.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, opacity: 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{h.gu} · {h.tenants}명</div>
                  </div>
                  <span style={{ fontSize: 12, color: GRAY }}>데이터 없음</span>
                </div>
              </div>
            );
          }

          const revenue = calcRev(h);
          const expense = sumExp(getExp(h.id, yk));
          const profit = calcProfit(h, yk);
          const own = calcOwnShare(h, yk);

          return (
            <button key={h.id} onClick={() => router.push(`/revenue/${h.id}?year=${year}&month=${month}`)}
              style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</span>
                  {h.investor && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, background: '#f2f4f6', color: GRAY }}>투자</span>}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#191f28' }}>{fmt(profit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: GRAY }}>{h.gu} · {h.tenants}명</span>
                <span style={{ fontSize: 11, color: GRAY }}>
                  {h.investor ? `내몫 ${fmt(own)}` : '직영'}
                </span>
              </div>
              <div style={{ height: 1, background: '#F2F4F6', marginBottom: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: GRAY }}>매출 {fmt(revenue)}</span>
                <span style={{ fontSize: 12, color: GRAY }}>지출 {fmt(expense)}</span>
                <ChevronRight size={14} color="#CCC" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
