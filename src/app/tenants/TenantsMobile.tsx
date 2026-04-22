'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TenantTimeline from '@/components/TenantTimeline';
import { buildTimelines } from '@/lib/timeline';

type Tenant = {
  입주자ID: string; 구: string; 지점명: string; 방코드: string; 방타입: string;
  이름: string; 입주일: string; 퇴실일: string; status: string;
  보증금: string; 월세: string; 관리비: string;
  메모: string; 연락처: string;
}

export default function TenantsMobile() {
  const { data: rawTenants, isLoading: loading, error: swrError } = useSWR<Tenant[]>('/api/tenants', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const { data: rawRooms } = useSWR('/api/rooms', fetcher);
  const tenants = (Array.isArray(rawTenants) ? rawTenants : []).filter(t => t.status !== 'moved_out');
  const error = swrError ? '데이터를 불러오지 못했어요' : '';
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [gu, setGu] = useState('전체');

  const allTenants = Array.isArray(rawTenants) ? rawTenants : [];
  const allRooms = Array.isArray(rawRooms) ? rawRooms : [];
  const timelines = useMemo(() => buildTimelines(allTenants, allRooms), [allTenants, allRooms]);

  const guList = useMemo(() => [...new Set(tenants.map(t => t['구']).filter(Boolean))].sort(), [tenants]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#8b95a1' }}>
        <div style={{ fontSize: 13 }}>불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#f04452' }}>
        <div style={{ fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16, maxWidth: 430, margin: '0 auto' }}>
      {/* 상단 고정 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', padding: '20px 16px 0', borderBottom: '1px solid #F0F0F0' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12 }}>입주자</h1>

        {/* 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderRadius: 12, background: searchFocused ? '#fff' : '#F5F5F5', border: searchFocused ? '1.5px solid #3182F6' : '1.5px solid transparent', transition: 'all 0.2s' }}>
            <Search size={16} color="#BBBBBB" />
            <input style={{ flex: 1, background: 'transparent', fontSize: 14, color: '#191919', border: 'none', outline: 'none', fontFamily: 'inherit' }}
              placeholder="이름 또는 지점명 검색" value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => !search && setSearchFocused(false)} />
            {search && <button onClick={() => { setSearch(''); setSearchFocused(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#BBBBBB" /></button>}
          </div>
          {searchFocused && (
            <button onClick={() => { setSearch(''); setSearchFocused(false); }} style={{ fontSize: 14, color: '#3182F6', fontWeight: 500, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
          )}
        </div>

        {/* 구 필터 칩 */}
        {guList.length > 0 && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '0 0 12px', scrollbarWidth: 'none' }}>
            {['전체', ...guList].map(g => (
              <button key={g} onClick={() => setGu(g)} style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{g}</button>
            ))}
          </div>
        )}
      </div>

      {/* 타임라인 */}
      <TenantTimeline
        houses={timelines}
        searchQuery={search}
        selectedGu={gu}
        onTenantClick={(tenantId) => router.push(`/tenants/${tenantId}`)}
      />
    </div>
  );
}
