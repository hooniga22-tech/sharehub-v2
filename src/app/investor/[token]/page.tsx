'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { mockHouses, mockInvestors, calcProfit, calcInvShare, fmt } from '@/../data/mockRevenue';

const BLUE = '#3182f6', GRAY = '#8b95a1';

export default function InvestorTokenPage() {
  const { token } = useParams<{ token: string }>();
  const investor = mockInvestors.find(i => i.token === token);

  const [month, setMonth] = useState(6);
  const [year] = useState(2025);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  if (!investor) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#BBB', fontSize: 15 }}>존재하지 않는 페이지입니다</p>
      </div>
    );
  }

  const myHouses = mockHouses.filter(h => h.investor?.token === token);
  const yk = `${year}-${month}`;

  const monthData = myHouses.map(h => ({
    house: h,
    profit: calcProfit(h, yk),
    myShare: calcInvShare(h, yk),
  }));
  const totalShare = monthData.reduce((s, d) => s + d.myShare, 0);
  const totalProfit = monthData.reduce((s, d) => s + d.profit, 0);

  const prevMonths = useMemo(() => {
    return [5, 4, 3].map(m => {
      const k = `${year}-${m}`;
      const data = myHouses.map(h => ({
        house: h,
        profit: calcProfit(h, k),
        myShare: calcInvShare(h, k),
      }));
      return { m, total: data.reduce((s, d) => s + d.myShare, 0), data };
    }).filter(x => x.total > 0);
  }, [year, myHouses]);

  const togMonth = (key: string) => setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));

  const prevMonth = () => setMonth(m => m > 1 ? m - 1 : m);
  const nextMonth = () => setMonth(m => m < 12 ? m + 1 : m);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Blue Header */}
      <div style={{ background: BLUE, padding: '24px 20px 0', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{investor.name} 님</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>투자 지점 {myHouses.length}곳</div>

        {/* Month Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', fontSize: 15, cursor: 'pointer', color: '#fff' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>{year}년 {month}월</div>
          <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', fontSize: 15, cursor: 'pointer', color: '#fff' }}>›</button>
        </div>

        {/* Total Share Card */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 20, marginBottom: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>이달 내 배분금</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{fmt(totalShare)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>전체 순이익 {fmt(totalProfit)} 중 내 몫</div>
        </div>

        {/* Transition to white */}
        <div style={{ height: 20, background: '#F7F8FA', borderRadius: '16px 16px 0 0', marginTop: 16 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 16px' }}>
        {/* This Month Houses */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>이달 지점별 내역</div>
          {monthData.map((d, i) => (
            <div key={d.house.id}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '12px 0' }} />}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.house.name}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{d.house.gu} · {Math.round(d.house.investor!.ratio * 100)}% 배분</div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{fmt(d.myShare)}</span>
                </div>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>순이익 {fmt(d.profit)}</div>
                <div style={{ height: 4, borderRadius: 2, background: '#F2F4F6', overflow: 'hidden' }}>
                  <div style={{ width: `${d.house.investor!.ratio * 100}%`, height: '100%', borderRadius: 2, background: BLUE }} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: '#E8E8E8', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>합계</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{fmt(totalShare)}</span>
          </div>
        </div>

        {/* Previous Months */}
        {prevMonths.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 8, textAlign: 'center' }}>── 이전 달 기록 ──</div>
            {prevMonths.map(pm => {
              const key = `prev-${pm.m}`;
              const isOpen = openMonths[key] ?? false;
              return (
                <div key={key} style={{ background: '#fff', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                  <button onClick={() => togMonth(key)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{pm.m}월</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{pm.data.length}개 지점 · {fmt(pm.total)}</span>
                      {isOpen ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
                    </div>
                  </button>
                  {isOpen && pm.data.map(d => (
                    <div key={d.house.id} style={{ padding: '8px 16px', borderTop: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                      <span style={{ fontSize: 12 }}>{d.house.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: BLUE }}>{fmt(d.myShare)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
