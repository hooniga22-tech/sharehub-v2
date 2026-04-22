'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const GRAY = '#8b95a1', GREEN = '#00B493', RED = '#E24B4A', AMBER = '#F59E0B';

export default function HousesMobile() {
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
    const ht = tenants.filter((t: any) => t['지점명'] === name);
    const active = ht.filter((t: any) => t.status === 'active').length;
    const total = Number(houses.find((h: any) => h['지점명'] === name)?.['총방수']) || ht.length || 1;
    const vacancy = ht.filter((t: any) => t.status === 'moved_out').length;
    const soon = ht.filter((t: any) => {
      if (t.status !== 'active' || !t['퇴실일']) return false;
      const dd = Math.ceil((new Date(t['퇴실일']).getTime() - Date.now()) / 86400000);
      return dd >= 0 && dd <= 90;
    }).length;
    return { active, total, vacancy, soon };
  };

  const totalActive = filtered.reduce((a, h) => a + getStats(h['지점명']).active, 0);
  const totalRooms = filtered.reduce((a, h) => a + getStats(h['지점명']).total, 0);
  const totalVacancy = filtered.reduce((a, h) => a + getStats(h['지점명']).vacancy, 0);
  const occupancy = totalRooms > 0 ? Math.round(totalActive / totalRooms * 100) : 0;

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>;

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 16px 10px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#191f28' }}>지점 관리</span>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
          {['전체', ...guList].map(g => (
            <button key={g} onClick={() => setGu(g)} style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 40px' }}>
        {/* KPI Card */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #f0f0f0', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: 16, borderRight: '0.5px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>전체 입주율</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: GREEN }}>{occupancy}%</div>
              <div style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>{totalActive}/{totalRooms}명</div>
            </div>
            <div style={{ flex: 1, padding: 16 }}>
              <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>공실</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: totalVacancy > 0 ? RED : '#191f28' }}>{totalVacancy}개</div>
              <div style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>총 {filtered.length}개 지점</div>
            </div>
          </div>
        </div>

        {/* Table List */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #f0f0f0', overflow: 'hidden' }}>
          {/* Column Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#fafafa', borderBottom: '0.5px solid #f0f0f0' }}>
            <span style={{ flex: 1, fontSize: 11, color: GRAY }}>지점명</span>
            <span style={{ width: 50, textAlign: 'center', fontSize: 11, color: GRAY }}>입주</span>
            <span style={{ width: 50, textAlign: 'right', fontSize: 11, color: GRAY }}>상태</span>
            <span style={{ width: 20 }} />
          </div>

          {/* Rows */}
          {filtered.map((h, i, arr) => {
            const stats = getStats(h['지점명']);
            let statusText = '만실';
            let statusColor = GREEN;
            if (stats.vacancy > 0) {
              statusText = `공실 ${stats.vacancy}`;
              statusColor = RED;
            } else if (stats.soon > 0) {
              statusText = `예정 ${stats.soon}`;
              statusColor = AMBER;
            }
            return (
              <div key={h['지점ID']} onClick={() => router.push(`/houses/${h['지점ID']}`)}
                style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '0.5px solid #f5f5f5' : 'none', cursor: 'pointer' }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#191f28' }}>{h['지점명']}</span>
                <span style={{ width: 50, textAlign: 'center', fontSize: 13, color: GRAY }}>{stats.active}/{stats.total}</span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 500, color: statusColor }}>{statusText}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4c9d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8, flexShrink: 0 }}><path d="m9 18 6-6-6-6"/></svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
