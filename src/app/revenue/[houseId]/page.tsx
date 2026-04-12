'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { X, Plus, Check } from 'lucide-react';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#f04452', GREEN = '#00c471';
const fmt = (n: number) => n.toLocaleString() + '원';

type SheetData = { title: string; items: { label: string; amt: number; sub?: string; status?: string }[]; total: number };

export default function RevenueDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const houseName = decodeURIComponent(params.houseId as string);

  const [year, setYear] = useState(Number(searchParams.get('year')) || new Date().getFullYear());
  const [month, setMonth] = useState(Number(searchParams.get('month')) || new Date().getMonth() + 1);
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/revenue?year=${year}&month=${month}&house=${encodeURIComponent(houseName)}`)
      .then(r => r.json())
      .then(res => { setHouse(res.houses?.[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month, houseName]);

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheet]);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const openSheet = (type: string) => {
    if (!house) return;
    let items: SheetData['items'] = [];
    let title = '', total = 0;

    if (type === '월세') {
      title = '월세 세부내역'; total = house.rentTotal;
      items = (house.tenants || []).map((t: any) => ({ label: `${t.방코드} ${t.이름}`, amt: Number(t.월세) || 0, status: 'paid' }));
    } else if (type === '관리비') {
      title = '관리비 세부내역'; total = house.mgmtTotal;
      items = (house.tenants || []).map((t: any) => ({ label: `${t.방코드} ${t.이름}`, amt: Number(t.관리비) || 0, status: 'paid' }));
    } else if (type === '공과금') {
      title = '공과금 세부내역'; total = house.utilTotal;
      const u = house.utilDetail;
      if (u) items = [
        { label: '⚡ 전기', amt: Number(u.전기) || 0, sub: '고지서 기준' },
        { label: '💧 수도', amt: Number(u.수도) || 0, sub: '고지서 기준' },
        { label: '🔥 가스', amt: Number(u.가스) || 0, sub: '고지서 기준' },
        { label: '🌐 인터넷', amt: Number(u.인터넷) || 0 },
        { label: '🚿 정수기', amt: Number(u.정수기) || 0 },
      ].filter(i => i.amt > 0);
    } else if (type === '용역비') {
      title = '용역비 세부내역'; total = house.workerTotal;
      items = (house.workerDetail || []).map((w: any) => ({ label: w.담당자명, amt: Number(w.정산금액) || 0, sub: `${w.작업종류} · ${w.예정일}` }));
    } else if (type === '운영비') {
      title = '운영비 세부내역'; total = house.opexTotal;
      items = (house.opexDetail || []).map((o: any) => ({ label: o.내용 || o.카테고리, amt: Number(o.금액) || 0, sub: `${o.카테고리} · ${o.날짜}` }));
    }
    setSheet({ title, items, total });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{houseName}</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>계산 중...</div></div>
      </div>
    );
  }

  if (!house) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{houseName}</span>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}>데이터가 없어요</div>
      </div>
    );
  }

  const { revenue, expense, profit, ownShare, investor, rentTotal, mgmtTotal, utilTotal, workerTotal, opexTotal } = house;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{houseName}</span>
          </div>
          {investor && <span style={{ fontSize: 12, color: GRAY }}>{investor.name} {Math.round(investor.ratio * 100)}:{Math.round((1 - investor.ratio) * 100)}</span>}
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
              { l: '지출', v: fmt(expense), c: RED },
              { l: investor ? '내 몫' : '순이익', v: fmt(investor ? ownShare : profit), c: '#191f28' },
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
          {[{ label: '월세', amt: rentTotal, type: '월세' }, { label: '관리비', amt: mgmtTotal, type: '관리비' }].map((row, i) => (
            <div key={row.label}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
              <button onClick={() => openSheet(row.type)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{row.label}</span>
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
            { label: '공과금', amt: utilTotal, type: '공과금' },
            { label: '용역비', amt: workerTotal, type: '용역비' },
            { label: '운영비', amt: opexTotal, type: '운영비' },
          ].filter(r => r.amt > 0).map((row, i) => (
            <div key={row.label}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
              <button onClick={() => openSheet(row.type)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{row.label}</span>
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
            <span style={{ fontSize: 14, fontWeight: 700, color: RED }}>{fmt(expense)}</span>
          </div>
        </div>

        {/* Investor Split */}
        {investor && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>순이익 배분</div>
            <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${investor.ratio * 100}%`, background: '#c4b5fd' }} />
              <div style={{ flex: 1, background: BLUE }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#7c3aed' }}>{investor.name} {Math.round(investor.ratio * 100)}%</span>
              <span style={{ fontSize: 11, color: BLUE }}>운영자 {Math.round((1 - investor.ratio) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{investor.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>{fmt(investor.share)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#666' }}>운영자 (내 몫)</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{fmt(ownShare)}</span>
              </div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/investor/${investor.token}`); showToast('링크가 복사됐어요!'); }}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#f2f4f6', color: '#191f28', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>
              🔗 투자자 링크 공유
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {sheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, maxHeight: '78vh', background: '#fff', borderRadius: '20px 20px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} /></div>
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              {sheet.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < sheet.items.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                    {item.sub && <span style={{ fontSize: 11, color: GRAY, marginLeft: 8 }}>{item.sub}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(item.amt)}</span>
                    {item.status && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#e8faf2', color: GREEN }}>납부</span>}
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
