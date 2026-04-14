'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#E24B4A';
const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString() + '원';

type Tenant = { name: string; roomCode: string; roomType: string; rent: number; endDate: string };
type House = {
  investId: string; houseName: string; investorRatio: number; jaehoonRatio: number;
  isJoint: boolean; revenue: number; houseRent: number; profit: number;
  investorShare: number; jaehoonShare: number; tenants: Tenant[];
};
type Data = {
  investor: { id: string; name: string; phone: string; account: string };
  houses: House[]; totalShare: number; totalRevenue: number; houseCount: number;
};

export default function InvestorPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const copyAccount = () => {
    navigator.clipboard?.writeText('카카오뱅크 유재훈 3333-30-2727013');
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

  const { investor, houses = [], totalShare = 0, totalRevenue = 0, houseCount = 0 } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '32px 20px 24px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#191f28', marginBottom: 4 }}>{investor.name}</div>
        <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>투자자 · {houseCount}개 지점</div>

        {/* KPI: 이달 정산액 | 이달 총 매출 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 0', borderTop: '1px solid #f2f4f6', borderBottom: '1px solid #f2f4f6' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>이달 정산액</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>{fmt(totalShare)}</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#f0f0f0' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>이달 총 매출</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#191f28' }}>{fmt(totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 20px', background: '#F7F8FA' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#191f28' }}>{year}년 {month}월</span>
        <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 18, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: '0 8px' }}>▶</button>
      </div>

      {/* House Accordion Cards */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {houses.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 0', textAlign: 'center', color: GRAY, fontSize: 13 }}>등록된 지점이 없어요</div>
        ) : houses.map(h => {
          const isOpen = !!expanded[h.investId];
          return (
            <div key={h.investId} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
              {/* Accordion Header */}
              <button onClick={() => toggle(h.investId)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#191f28' }}>{h.houseName}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#EFF6FF', color: '#1E40AF' }}>{h.investorRatio || 0}%</span>
                  {h.isJoint && <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>공동</span>}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: BLUE, marginRight: 8 }}>{fmt(h.investorShare)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M9 18L15 12L9 6" stroke="#c4c9d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div>
                  {/* 섹션1: 수익 구조 */}
                  <div style={{ background: '#fafafa', padding: '16px 18px', borderTop: '1px solid #f2f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#555' }}>월세+관리비 합계</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{fmt(h.revenue)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#555' }}>집 월세</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: RED }}>-{fmt(h.houseRent)}</span>
                    </div>
                    <div style={{ height: 1, background: '#e8e8e8', marginBottom: 12 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>순이익</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{fmt(h.profit)}</span>
                    </div>

                    {/* 배분 바 */}
                    <div style={{ height: 8, borderRadius: 6, background: '#f0f0f0', overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ width: `${Math.min(h.investorRatio || 0, 100)}%`, height: '100%', background: BLUE, borderRadius: 6 }} />
                    </div>

                    {/* 배분 내역 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: BLUE, fontWeight: 600 }}>{investor.name} {h.investorRatio || 0}% → {fmt(h.investorShare)}</span>
                      <span style={{ color: GRAY }}>운영자 {h.jaehoonRatio || 0}% → {fmt(h.jaehoonShare)}</span>
                    </div>
                  </div>

                  {/* 섹션2: 입주자 현황 */}
                  <div style={{ padding: '8px 18px 6px', background: '#fafafa', borderTop: '1px solid #f2f4f6' }}>
                    <span style={{ fontSize: 12, color: GRAY }}>입주자 현황 · {h.tenants.length}명</span>
                  </div>
                  <div>
                    {h.tenants.length === 0 ? (
                      <div style={{ padding: '16px 18px', fontSize: 12, color: '#ccc', textAlign: 'center' }}>입주자가 없어요</div>
                    ) : h.tenants.map((t, i) => (
                      <div key={`${t.roomCode}-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: i === 0 ? '1px solid #f2f4f6' : '1px solid #f8f8f8' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{t.roomCode}{t.roomType ? ' · ' + t.roomType : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {t.endDate && <div style={{ fontSize: 11, color: GRAY }}>{t.endDate}</div>}
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{fmt(t.rent)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total + 계좌 복사 */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f2f3f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>이달 총 정산액</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>{fmt(totalShare)}</span>
          </div>
          <button onClick={copyAccount}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: copied ? '#f0f7ff' : '#fff', color: copied ? BLUE : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
            {copied ? '복사됨' : '운영 계좌 복사 (카카오뱅크 유재훈)'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px 0 32px', fontSize: 11, color: '#ccc' }}>ShareHub</div>
    </div>
  );
}
