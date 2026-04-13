'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452';
const COLORS = ['#3182f6', '#00c471', '#f59f00', '#7c3aed', '#f04452', '#0891b2', '#be185d'];

export default function HousesPage() {
  const router = useRouter();
  const [houses, setHouses] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gu, setGu] = useState('전체');
  const [guList, setGuList] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/houses').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([houseData, tenantData]) => {
      const hs = Array.isArray(houseData) ? houseData : [];
      const ts = Array.isArray(tenantData) ? tenantData : [];
      setHouses(hs);
      setTenants(ts);
      setGuList([...new Set(hs.map((h: any) => h['구']).filter(Boolean))] as string[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = gu === '전체' ? houses : houses.filter(h => h['구'] === gu);

  const getStats = (name: string) => {
    const ht = tenants.filter(t => t['지점명'] === name);
    const active = ht.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중').length;
    const total = Number(houses.find(h => h['지점명'] === name)?.['총방수']) || ht.length || 1;
    const vacancy = Math.max(0, total - active);
    return { active, total, vacancy };
  };

  const totalActive = filtered.reduce((a, h) => a + getStats(h['지점명']).active, 0);
  const totalRooms = filtered.reduce((a, h) => a + getStats(h['지점명']).total, 0);
  const totalVacancy = filtered.reduce((a, h) => a + getStats(h['지점명']).vacancy, 0);
  const occupancy = totalRooms > 0 ? Math.round(totalActive / totalRooms * 100) : 0;

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>;

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '14px 16px 10px', borderBottom: '1px solid #f2f4f6', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#191f28', marginBottom: 10 }}>지점 관리</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
          {['전체', ...guList].map(g => (
            <button key={g} onClick={() => setGu(g)} style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 40px' }}>
        {/* Summary */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f2f4f6', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f2f4f6' }}>
            <div style={{ padding: '16px 18px', borderRight: '1px solid #f2f4f6' }}>
              <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>입주율</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: GREEN, marginBottom: 6 }}>{occupancy}%</div>
              <div style={{ height: 4, background: '#f2f4f6', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${occupancy}%`, background: GREEN, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>{totalActive}/{totalRooms}명</div>
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>공실</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: totalVacancy > 0 ? RED : '#191f28', marginBottom: 6 }}>{totalVacancy}개</div>
              <div style={{ fontSize: 11, color: GRAY }}>총 {filtered.length}개 지점</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 8, paddingLeft: 2 }}>전체 지점 {filtered.length}개</div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f2f4f6', overflow: 'hidden' }}>
          {filtered.map((h, i, arr) => {
            const stats = getStats(h['지점명']);
            const rate = stats.total > 0 ? stats.active / stats.total : 0;
            const color = COLORS[i % COLORS.length];
            return (
              <div key={h['지점ID']} onClick={() => router.push(`/houses/${h['지점ID']}`)} style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f2f4f6' : 'none', cursor: 'pointer', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color, flexShrink: 0 }}>{h['지점명']?.[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{h['지점명']}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: stats.vacancy > 0 ? RED : GREEN, flexShrink: 0 }}>{stats.vacancy > 0 ? `공실 ${stats.vacancy}` : '만실'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: '#f2f4f6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${rate * 100}%`, background: rate >= 0.9 ? GREEN : BLUE, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: GRAY, flexShrink: 0 }}>{stats.active}/{stats.total}</span>
                  </div>
                </div>
                <span style={{ color: '#c4c9d1', fontSize: 18, marginLeft: 4 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
