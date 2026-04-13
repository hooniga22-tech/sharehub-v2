'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

type Tenant = {
  입주자ID: string; 구: string; 지점명: string; 방코드: string; 방타입: string;
  이름: string; 입주일: string; 퇴실일: string; 상태: string;
  보증금: string; 월세: string; 관리비: string;
  메모: string; 연락처: string;
}

type FilterTab = 'occupied' | 'vacant' | 'checkout';

const fmtWon = (n: number) => n.toLocaleString() + '원';

export default function TenantsPage() {
  const { data: rawTenants, isLoading: loading, error: swrError } = useSWR<Tenant[]>('/api/tenants', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const tenants = Array.isArray(rawTenants) ? rawTenants : [];
  const error = swrError ? '데이터를 불러오지 못했어요' : '';
  const [filter, setFilter] = useState<FilterTab>('occupied');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const occupied = tenants.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중');
  const checkout = tenants.filter(t => t['상태'] === '공실예정');

  // Group by 지점명
  const byHouse = useMemo(() => {
    const map: Record<string, Tenant[]> = {};
    for (const t of occupied) {
      const h = t['지점명'] || '미지정';
      if (!map[h]) map[h] = [];
      map[h].push(t);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [occupied]);

  // Search
  const isSearching = search.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return tenants.filter(t =>
      t['이름']?.toLowerCase().includes(q) ||
      t['지점명']?.toLowerCase().includes(q) ||
      t['방코드']?.toLowerCase().includes(q)
    );
  }, [search, isSearching, tenants]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'occupied', label: '입주중', count: occupied.length },
    { key: 'checkout', label: '공실예정', count: checkout.length },
    { key: 'vacant', label: '전체', count: tenants.length },
  ];

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
    <div style={{ paddingBottom: 16 }}>
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

        {/* 필터 탭 */}
        {!isSearching && (
          <div style={{ display: 'flex' }}>
            {tabs.map(tab => (
              <button key={tab.key}
                style={{ flex: 1, paddingBottom: 10, textAlign: 'center', fontSize: 13, fontWeight: filter === tab.key ? 700 : 400, color: filter === tab.key ? '#191919' : '#888888', borderBottom: filter === tab.key ? '2.5px solid #3182F6' : '2.5px solid transparent', background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setFilter(tab.key)}>
                {tab.label}
                <span style={{ marginLeft: 4, color: filter === tab.key ? '#3182F6' : '#BBBBBB', fontSize: 12 }}>{tab.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {isSearching ? (
        <div style={{ padding: '16px 16px' }}>
          {searchResults.length > 0 ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#888888', marginBottom: 8 }}>검색 결과 {searchResults.length}건</p>
              {searchResults.map(t => (
                <Link key={t['입주자ID']} href={`/tenants/${t['입주자ID']}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', marginBottom: 8, padding: 16, borderRadius: 16, textDecoration: 'none', color: 'inherit' }}>
                  <Avatar name={t['이름']} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{t['이름']}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{t['지점명']} {t['방코드']}</p>
                  </div>
                  <span style={{ fontSize: 12, color: '#888888' }}>{t['상태']}</span>
                </Link>
              ))}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: 14, color: '#BBBBBB' }}>검색 결과가 없어요</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px 16px' }}>
          {/* 입주중 — 지점별 그룹 */}
          {filter === 'occupied' && byHouse.map(([house, hTenants]) => {
            const isOpen = expanded === house;
            const totalRent = hTenants.reduce((s, t) => s + (Number(t['월세']) || 0), 0);
            return (
              <div key={house} style={{ background: '#fff', marginBottom: 8, borderRadius: 16 }}>
                <button onClick={() => setExpanded(isOpen ? null : house)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF3FF', color: '#3182F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {house.charAt(0)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{house}</span>
                      <span style={{ fontSize: 12, color: '#888888' }}>{hTenants.length}명</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#888888', marginRight: 4 }}>{fmtWon(totalRent)}</span>
                  {isOpen ? <ChevronUp size={18} color="#BBBBBB" /> : <ChevronDown size={18} color="#BBBBBB" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 12px' }}>
                    {hTenants.map((t, i) => (
                      <div key={t['입주자ID']}>
                        {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                        <Link href={`/tenants/${t['입주자ID']}`}
                          style={{ display: 'flex', alignItems: 'center', padding: '12px 0', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                          <Avatar name={t['이름']} size={32} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{t['이름']}</span>
                            <span style={{ fontSize: 12, color: '#888888', marginLeft: 6 }}>{t['방코드']}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtWon(Number(t['월세']) || 0)}</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 공실예정 */}
          {filter === 'checkout' && (
            checkout.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checkout.map(t => (
                  <Link key={t['입주자ID']} href={`/tenants/${t['입주자ID']}`}
                    style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                    <Avatar name={t['이름']} size={40} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{t['이름']}</p>
                      <p style={{ fontSize: 12, color: '#888888' }}>{t['지점명']} {t['방코드']}</p>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#FFF8E8', color: '#D97706' }}>
                      {t['퇴실일']} 퇴실
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#BBBBBB' }}>퇴실 예정자가 없어요</div>
            )
          )}

          {/* 전체 */}
          {filter === 'vacant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tenants.map(t => (
                <Link key={t['입주자ID']} href={`/tenants/${t['입주자ID']}`}
                  style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                  <Avatar name={t['이름']} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{t['이름']}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{t['지점명']} {t['방코드']}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{fmtWon(Number(t['월세']) || 0)}</p>
                    <span style={{ fontSize: 11, color: t['상태'] === '입주중' ? '#00B493' : '#D97706' }}>{t['상태']}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 데이터 없음 */}
          {filter === 'occupied' && byHouse.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#BBBBBB' }}>입주자가 없어요</div>
          )}
        </div>
      )}
    </div>
  );
}
