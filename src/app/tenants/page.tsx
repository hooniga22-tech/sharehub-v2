'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';
import { districts, vacantRooms, upcomingCheckouts, upcomingCheckins, getBranchIdByName, formatWon } from '@/lib/mockData';
import Avatar from '@/components/ui/Avatar';

type FilterTab = 'occupied' | 'vacant' | 'checkout' | 'checkin';

const totalTenants = districts.reduce((s, d) => s + d.branches.reduce((bs, b) => bs + b.tenants, 0), 0);
const totalVacant = districts.reduce((s, d) => s + d.branches.reduce((bs, b) => bs + b.vacant, 0), 0);

const tabs: { key: FilterTab; label: string; count: number }[] = [
  { key: 'occupied', label: '입주중', count: totalTenants },
  { key: 'vacant', label: '공실', count: totalVacant },
  { key: 'checkout', label: '퇴실예정', count: upcomingCheckouts.length },
  { key: 'checkin', label: '입실예정', count: upcomingCheckins.length },
];

export default function TenantsPage() {
  const [filter, setFilter] = useState<FilterTab>('occupied');
  const [expanded, setExpanded] = useState<string | null>(districts[0].name);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const isSearching = search.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return { branches: [] as { name: string; district: string; districtColor: string; rooms: number; vacant: number }[] };
    const q = search.trim().toLowerCase();
    const branches = districts.flatMap((d) =>
      d.branches.filter((b) => b.name.toLowerCase().includes(q)).map((b) => ({ name: b.name, district: d.name, districtColor: d.color, rooms: b.rooms, vacant: b.vacant }))
    );
    return { branches };
  }, [search, isSearching]);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 상단 고정 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', padding: '20px 16px 0', borderBottom: '1px solid #F0F0F0' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12 }}>입주자</h1>

        {/* 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
              height: 40, borderRadius: 12,
              background: searchFocused ? '#fff' : '#F5F5F5',
              border: searchFocused ? '1.5px solid #3182F6' : '1.5px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <Search size={16} color="#BBBBBB" />
            <input
              style={{ flex: 1, background: 'transparent', fontSize: 14, color: '#191919' }}
              placeholder="지점명 또는 입주자명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => !search && setSearchFocused(false)}
            />
            {search && (
              <button onClick={() => { setSearch(''); setSearchFocused(false); }}>
                <X size={16} color="#BBBBBB" />
              </button>
            )}
          </div>
          {searchFocused && (
            <button
              onClick={() => { setSearch(''); setSearchFocused(false); }}
              style={{ fontSize: 14, color: '#3182F6', fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              취소
            </button>
          )}
        </div>

        {/* 필터 탭 */}
        {!isSearching && (
          <div style={{ display: 'flex' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={{
                  flex: 1, paddingBottom: 10, textAlign: 'center',
                  fontSize: 13,
                  fontWeight: filter === tab.key ? 700 : 400,
                  color: filter === tab.key ? '#191919' : '#888888',
                  borderBottom: filter === tab.key ? '2.5px solid #3182F6' : '2.5px solid transparent',
                }}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
                <span style={{ marginLeft: 4, color: filter === tab.key ? '#3182F6' : '#BBBBBB', fontSize: 12 }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {isSearching ? (
        <div style={{ padding: '16px 16px' }}>
          {searchResults.branches.length > 0 ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#888888', marginBottom: 8 }}>
                지점 {searchResults.branches.length}건
              </p>
              {searchResults.branches.map((b) => (
                <Link key={b.name} href={`/houses/${getBranchIdByName(b.name) || 'gongdeok'}`}
                  style={{ display: 'block', background: '#fff', marginBottom: 8, padding: 16, borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: b.districtColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</p>
                      <p style={{ fontSize: 12, color: '#888888' }}>{b.district} · {b.rooms}실 · 공실 {b.vacant}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: 14, color: '#BBBBBB' }}>검색 결과가 없어요</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px 16px' }}>
          {/* 입주중 */}
          {filter === 'occupied' && districts.map((district) => {
            const isOpen = expanded === district.name;
            const districtRooms = district.branches.reduce((s, b) => s + b.rooms, 0);
            const districtVacant = district.branches.reduce((s, b) => s + b.vacant, 0);
            return (
              <div key={district.name} style={{ background: '#fff', marginBottom: 8, borderRadius: 16 }}>
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}
                  onClick={() => setExpanded(isOpen ? null : district.name)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: district.bg, color: district.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {district.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{district.name}</span>
                      <span style={{ fontSize: 12, color: '#888888' }}>{district.branches.length}지점 · {districtRooms}실</span>
                    </div>
                  </div>
                  {districtVacant > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#FFF8E8', color: '#D97706' }}>
                      공실 {districtVacant}
                    </span>
                  )}
                  {isOpen ? <ChevronUp size={18} color="#BBBBBB" /> : <ChevronDown size={18} color="#BBBBBB" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 12px' }}>
                    {district.branches.map((branch, bi) => {
                      const isFull = branch.vacant === 0;
                      return (
                        <div key={branch.name}>
                          {bi > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                          <Link href={`/houses/${getBranchIdByName(branch.name) || 'gongdeok'}`}
                            style={{ display: 'flex', alignItems: 'center', padding: '12px 0', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isFull ? '#00B493' : '#D97706', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{branch.name}</span>
                            <span style={{ fontSize: 12, color: '#888888' }}>{branch.rooms}실/{branch.tenants}명</span>
                            <span style={{ fontSize: 12, color: '#888888', minWidth: 70, textAlign: 'right' }}>{formatWon(branch.monthlyRent)}</span>
                            {branch.vacant > 0 && (
                              <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FFF8E8', color: '#D97706' }}>
                                공실{branch.vacant}
                              </span>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 공실 */}
          {filter === 'vacant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vacantRooms.map((room, i) => (
                <div key={i} style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{room.house} {room.room}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{room.district}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{formatWon(room.rent)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 퇴실예정 */}
          {filter === 'checkout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingCheckouts.map((t) => (
                <Link key={t.tenantId} href={`/tenants/${t.tenantId}`}
                  style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={t.name} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{t.house} {t.room}</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#FFF8E8', color: '#D97706' }}>
                    {t.date} 퇴실
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* 입실예정 */}
          {filter === 'checkin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingCheckins.map((t) => (
                <div key={t.tenantId} style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={t.name} size={40} color="#7C3AED" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{t.house} {t.room}</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#F3EEFF', color: '#7C3AED' }}>
                    {t.date} 입실
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
