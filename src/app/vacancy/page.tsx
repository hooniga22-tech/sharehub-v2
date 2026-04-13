'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#f04452', ORANGE = '#d97706';

export default function VacancyPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gu, setGu] = useState('전체');
  const [guMap, setGuMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/houses').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([houseData, tenantData]) => {
      setTenants(Array.isArray(tenantData) ? tenantData : []);
      const map: Record<string, string> = {};
      (Array.isArray(houseData) ? houseData : []).forEach((h: any) => { if (h['지점명'] && h['구']) map[h['지점명']] = h['구']; });
      setGuMap(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const guList = useMemo(() => [...new Set(Object.values(guMap).filter(Boolean))].sort(), [guMap]);
  const guFilteredTenants = useMemo(() => gu === '전체' ? tenants : tenants.filter(t => guMap[t['지점명']] === gu), [tenants, gu, guMap]);

  const vacantNowTenants = useMemo(() => guFilteredTenants.filter(t => t['상태'] === '공실'), [guFilteredTenants]);
  const vacantSoonTenants = useMemo(() => guFilteredTenants.filter(t => t['상태'] === '공실예정'), [guFilteredTenants]);
  const allVacantTenants = useMemo(() => guFilteredTenants.filter(t => t['상태'] === '공실' || t['상태'] === '공실예정'), [guFilteredTenants]);

  const tabLabels = [`공실현황 ${vacantNowTenants.length}`, `공실예정 ${vacantSoonTenants.length}`, `전체공실 ${allVacantTenants.length}`];
  const fmt = (n: number) => n.toLocaleString() + '원';

  const TenantCard = ({ t }: { t: any }) => {
    const isNow = t['상태'] === '공실';
    const rentMgmt = (Number(t['월세']) || 0) + (Number(t['관리비']) || 0);
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${isNow ? '#fcc' : '#fde68a'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{t['지점명']} · {t['방코드']}</div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{t['방타입'] || '-'}{!isNow && t['퇴실일'] ? ` · 퇴실 ${t['퇴실일']}` : ''}</div>
            <div style={{ fontSize: 13, color: '#4e5968', marginTop: 4 }}>{fmt(rentMgmt)}</div>
          </div>
          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: isNow ? '#fee2e2' : '#fff8e1', color: isNow ? RED : '#b7791f' }}>{isNow ? '공실' : '공실예정'}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>공실 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>공실 관리</span>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {tabLabels.map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {guList.length > 0 && (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '12px 16px', scrollbarWidth: 'none', background: '#F7F8FA' }}>
          {['전체', ...guList].map(g => (
            <button key={g} onClick={() => setGu(g)} style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{g}</button>
          ))}
        </div>
      )}

      <div style={{ padding: 16 }}>
        {tab === 0 && (
          vacantNowTenants.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 10 }}>현재 공실 {vacantNowTenants.length}실</div>
              {vacantNowTenants.map(t => <TenantCard key={t['입주자ID']} t={t} />)}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>현재 공실이 없어요</div>
              <div style={{ fontSize: 13, color: GRAY }}>모든 방이 입주 중이에요</div>
            </div>
          )
        )}

        {tab === 1 && (
          vacantSoonTenants.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE, marginBottom: 10 }}>공실 예정 {vacantSoonTenants.length}실</div>
              {vacantSoonTenants.map(t => <TenantCard key={t['입주자ID']} t={t} />)}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>공실 예정이 없어요</div>
            </div>
          )
        )}

        {tab === 2 && (
          allVacantTenants.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 10 }}>전체 공실 {allVacantTenants.length}실</div>
              {allVacantTenants.map(t => <TenantCard key={t['입주자ID']} t={t} />)}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>공실이 없어요</div>
              <div style={{ fontSize: 13, color: GRAY }}>모든 방이 입주 중이에요</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
