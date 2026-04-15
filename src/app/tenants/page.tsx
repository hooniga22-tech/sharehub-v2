'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TenantTimeline from '@/components/TenantTimeline';
import { buildTimelines } from '@/lib/timeline';

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
  const tenants = (Array.isArray(rawTenants) ? rawTenants : []).filter(t => t['상태'] !== '퇴실완료');
  const error = swrError ? '데이터를 불러오지 못했어요' : '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('list');
  const [filter, setFilter] = useState<FilterTab>('occupied');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [gu, setGu] = useState('전체');

  const allTenants = Array.isArray(rawTenants) ? rawTenants : [];
  const timelines = useMemo(() => buildTimelines(allTenants), [allTenants]);

  const guList = useMemo(() => [...new Set(tenants.map(t => t['구']).filter(Boolean))].sort(), [tenants]);
  const guFiltered = useMemo(() => gu === '전체' ? tenants : tenants.filter(t => t['구'] === gu), [tenants, gu]);

  const occupied = guFiltered.filter(t => t['상태'] === '입주중' || t['상태'] === '계약중' || t['상태'] === '공실예정');
  const checkout = guFiltered.filter(t => t['상태'] === '공실예정');

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
    return guFiltered.filter(t =>
      t['이름']?.toLowerCase().includes(q) ||
      t['지점명']?.toLowerCase().includes(q) ||
      t['방코드']?.toLowerCase().includes(q)
    );
  }, [search, isSearching, guFiltered]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'occupied', label: '현재 입주중', count: occupied.length },
    { key: 'checkout', label: '공실예정', count: checkout.length },
    { key: 'vacant', label: '전체', count: guFiltered.length },
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

        {/* 검색창 — 항상 표시 */}
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

        {/* 구 필터 칩 — 항상 표시 */}
        {!isSearching && guList.length > 0 && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '0 16px 12px', scrollbarWidth: 'none' }}>
            {['전체', ...guList].map(g => (
              <button key={g} onClick={() => setGu(g)} style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{g}</button>
            ))}
          </div>
        )}

        {/* 목록/타임라인 탭 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {([['list', '목록'], ['timeline', '타임라인']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ padding: '6px 16px', borderRadius: 100, border: activeTab === key ? '1px solid #191f28' : '1px solid #e5e8eb', background: activeTab === key ? '#191f28' : '#fff', color: activeTab === key ? '#fff' : '#4e5968', fontSize: 13, fontWeight: activeTab === key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>

        {/* 필터 탭 — 목록 탭만 */}
        {activeTab === 'list' && !isSearching && (
          <div style={{ display: 'flex' }}>
            {tabs.map(tab => (
              <button key={tab.key}
                style={{ flex: 1, paddingBottom: 10, textAlign: 'center', fontSize: 13, fontWeight: filter === tab.key ? 700 : 400, color: filter === tab.key ? '#191919' : '#888888', background: 'none', borderWidth: 0, borderBottomWidth: 2.5, borderBottomStyle: 'solid', borderBottomColor: filter === tab.key ? '#3182F6' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setFilter(tab.key)}>
                {tab.label}
                <span style={{ marginLeft: 4, color: filter === tab.key ? '#3182F6' : '#BBBBBB', fontSize: 12 }}>{tab.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 목록 탭 콘텐츠 */}
      {activeTab === 'list' && (
        isSearching ? (
          <div style={{ padding: '16px 16px' }}>
            {searchResults.length > 0 ? (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#888888', marginBottom: 8 }}>검색 결과 {searchResults.length}건</p>
                {searchResults.map(t => {
                  const isSoon = t['상태'] === '공실예정';
                  return (
                    <Link key={t['입주자ID']} href={`/tenants/${t['입주자ID']}`}
                      style={{ display: 'flex', alignItems: 'center', background: isSoon ? '#fffbf0' : '#fff', marginBottom: 8, padding: 16, borderRadius: 16, textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#191919' }}>{t['이름']}</span>
                          {isSoon && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>퇴실예정</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#8b95a1', marginTop: 2 }}>{t['방코드']} {t['방타입']}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 12, color: isSoon ? '#F59E0B' : '#8b95a1', fontWeight: isSoon ? 500 : 400 }}>{t['퇴실일'] || '-'}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#191919', marginTop: 2 }}>{fmtWon(Number(t['월세']) || 0)}</p>
                      </div>
                    </Link>
                  );
                })}
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
                    <div style={{ padding: '0 2px 6px' }}>
                      {hTenants.map((t, i) => {
                        const isSoon = t['상태'] === '공실예정';
                        const isLast = i === hTenants.length - 1;
                        return (
                          <Link key={t['입주자ID']} href={`/tenants/${t['입주자ID']}`}
                            style={{ display: 'flex', flexDirection: 'column', padding: '11px 14px', borderBottom: isLast ? 'none' : '0.5px solid rgba(0,0,0,0.05)', textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: '#111', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t['이름']}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flexShrink: 0 }}>{fmtWon(Number(t['월세']) || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: '#888' }}>{t['방코드']}</span>
                                {isSoon && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: '#FFF0E0', color: '#C06A00', fontWeight: 500 }}>퇴실예정</span>}
                              </div>
                              <span style={{ fontSize: 12, color: isSoon ? '#E07000' : '#888', flexShrink: 0 }}>~{t['퇴실일'] || '-'}</span>
                            </div>
                          </Link>
                        );
                      })}
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
                      style={{ background: '#fffbf0', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#191919' }}>{t['이름']}</span>
                          <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>퇴실예정</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#8b95a1', marginTop: 2 }}>{t['지점명']} {t['방코드']} {t['방타입']}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 500 }}>{t['퇴실일']}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#191919', marginTop: 2 }}>{fmtWon(Number(t['월세']) || 0)}</p>
                      </div>
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
                {guFiltered.map(t => {
                  const isSoon = t['상태'] === '공실예정';
                  return (
                    <Link key={t['입주자ID']} href={`/tenants/${t['입주자ID']}`}
                      style={{ background: isSoon ? '#fffbf0' : '#fff', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#191919' }}>{t['이름'] || '공실'}</span>
                          {isSoon && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>퇴실예정</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#8b95a1', marginTop: 2 }}>{t['지점명']} {t['방코드']} {t['방타입']}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 12, color: isSoon ? '#F59E0B' : '#8b95a1', fontWeight: isSoon ? 500 : 400 }}>{t['퇴실일'] || '-'}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#191919', marginTop: 2 }}>{fmtWon(Number(t['월세']) || 0)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 데이터 없음 */}
            {filter === 'occupied' && byHouse.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#BBBBBB' }}>입주자가 없어요</div>
            )}
          </div>
        )
      )}

      {/* 타임라인 탭 콘텐츠 */}
      {activeTab === 'timeline' && (
        <TenantTimeline
          houses={timelines}
          searchQuery={search}
          selectedGu={gu}
          onTenantClick={(tenantId) => router.push(`/tenants/${tenantId}`)}
        />
      )}
    </div>
  );
}
