'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1';
const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString() + '원';

type House = {
  investId: string; houseName: string; investorRatio: number; jaehoonRatio: number;
  isJoint: boolean; revenue: number; share: number;
};
type Data = {
  investor: { id: string; name: string; phone: string; account: string };
  houses: House[]; totalShare: number; totalRevenue: number; houseCount: number;
  year: number; month: number;
};

export default function InvestorPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const isFuture = year > nowYear || (year === nowYear && month >= nowMonth);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isFuture) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/investor-portal/${token}?year=${year}&month=${month}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => { if (d) { setData(d); setNotFound(false); } setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token, year, month]);

  const estimatedAnnual = useMemo(() => {
    if (!data) return 0;
    return data.totalShare * 12;
  }, [data]);

  const copyAccount = () => {
    const text = '카카오뱅크 유재훈 3333-30-2727013';
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: GRAY, fontSize: 13 }}>불러오는 중...</span>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#bbb', fontSize: 15 }}>존재하지 않는 페이지입니다</span>
      </div>
    );
  }

  const { investor, houses = [], totalShare = 0, houseCount = 0 } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '32px 20px 24px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#191f28', marginBottom: 4 }}>{investor.name}</div>
        <div style={{ fontSize: 14, color: GRAY }}>투자자 · {houseCount}개 지점</div>

        {/* KPI */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, padding: '20px 0', borderTop: '1px solid #f2f4f6', borderBottom: '1px solid #f2f4f6' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>이달 정산액</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>{fmt(totalShare)}</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#f0f0f0' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>지점수</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#191f28' }}>{houseCount}</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#f0f0f0' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>누적 정산</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#191f28' }}>{fmt(estimatedAnnual)}</div>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px 20px', background: '#F7F8FA' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#191f28' }}>{year}년 {month}월</span>
        <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 18, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: '0 8px' }}>▶</button>
      </div>

      {/* House List */}
      <div style={{ padding: '0 16px 16px' }}>
        {houses.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 0', textAlign: 'center', color: GRAY, fontSize: 13 }}>등록된 지점이 없어요</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {houses.map(h => (
              <div key={h.investId} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f2f3f5' }}>
                {/* House name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: '#191f28' }}>{h.houseName}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#EFF6FF', color: '#1E40AF' }}>{h.investorRatio || 0}%</span>
                  {h.isJoint && <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>공동</span>}
                </div>

                {/* Revenue */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: GRAY }}>이달 월세+관리비</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#191f28' }}>{fmt(h.revenue)}</span>
                </div>

                {/* Share */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: GRAY }}>정산액</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: BLUE }}>{fmt(h.share)}</span>
                </div>

                {/* Calculation hint */}
                <div style={{ fontSize: 12, color: '#adb5bd' }}>월세합계 {fmt(h.revenue)} x {h.investorRatio || 0}%</div>

                {/* Ratio bar */}
                <div style={{ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden', marginTop: 8 }}>
                  <div style={{ width: `${Math.min(h.investorRatio || 0, 100)}%`, height: '100%', background: BLUE, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Card */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f2f3f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>이달 총 정산액</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>{fmt(totalShare)}</span>
          </div>

          {/* Account copy */}
          <button onClick={copyAccount}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: copied ? '#f0f7ff' : '#fff', color: copied ? BLUE : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
            {copied ? '복사됨' : '운영 계좌 복사 (카카오뱅크 유재훈)'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 0 32px', fontSize: 11, color: '#ccc' }}>ShareHub</div>
    </div>
  );
}
