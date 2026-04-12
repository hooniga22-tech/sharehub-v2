'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BLUE = '#3182f6', GRAY = '#8b95a1';
const fmt = (n: number) => n.toLocaleString() + '원';

type HouseResult = { houseName: string; ratio: number; profit: number; myShare: number };

export default function InvestorTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{ investor: any; houses: HouseResult[]; totalShare: number; totalProfit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/investors?token=${token}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, month, year]);

  const togMonth = (key: string) => setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: GRAY, fontSize: 13 }}>계산 중...</p>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#BBB', fontSize: 15 }}>존재하지 않는 페이지입니다</p>
    </div>
  );

  const { investor, houses, totalShare, totalProfit } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ background: BLUE, padding: '24px 20px 0', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{investor.투자자명} 님</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>투자 지점 {houses.length}곳</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setMonth(m => m > 1 ? m - 1 : m)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', fontSize: 15, cursor: 'pointer', color: '#fff' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>{year}년 {month}월</div>
          <button onClick={() => setMonth(m => m < 12 ? m + 1 : m)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', fontSize: 15, cursor: 'pointer', color: '#fff' }}>›</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>이달 내 배분금</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{fmt(totalShare)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>전체 순이익 {fmt(totalProfit)} 중 내 몫</div>
        </div>
        <div style={{ height: 20, background: '#F7F8FA', borderRadius: '16px 16px 0 0', marginTop: 16 }} />
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>이달 지점별 내역</div>
          {houses.map((h, i) => (
            <div key={h.houseName}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '12px 0' }} />}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{h.houseName}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{Math.round(h.ratio * 100)}% 배분</div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{fmt(h.myShare)}</span>
                </div>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>순이익 {fmt(h.profit)}</div>
                <div style={{ height: 4, borderRadius: 2, background: '#F2F4F6', overflow: 'hidden' }}>
                  <div style={{ width: `${h.ratio * 100}%`, height: '100%', borderRadius: 2, background: BLUE }} />
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
      </div>
    </div>
  );
}
