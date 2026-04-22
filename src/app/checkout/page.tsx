'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Link from 'next/link';

const BLUE = '#3182F6', GREEN = '#3B6D11', GRAY = '#8b95a1';

type Tenant = {
  입주자ID: string; 구: string; 지점명: string; 방코드: string; 방타입: string;
  이름: string; 입주일: string; 퇴실일: string; status: string;
  보증금: string; 월세: string; 관리비: string; 메모: string;
};

type CheckoutApp = {
  id: string; name: string; houseName: string; roomCode: string;
  checkoutDate: string; status: string; 정산확정여부: string; createdAt: string;
};

type ViewTab = 'applications' | 'history';
type SortKey = 'checkout' | 'movein' | 'duration';

function monthsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const da = new Date(a), db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function stripHouse(name: string) {
  return name.replace(/하우스$/, '');
}

export default function CheckoutPage() {
  const { data: rawTenants, isLoading: tLoading } = useSWR<Tenant[]>('/api/tenants', fetcher);
  const { data: rawApps, isLoading: aLoading } = useSWR<CheckoutApp[]>('/api/apply/checkout', fetcher);

  const allTenants = useMemo(() => (Array.isArray(rawTenants) ? rawTenants : []).filter(t => t.status === 'moved_out'), [rawTenants]);
  const apps = useMemo(() => Array.isArray(rawApps) ? rawApps : [], [rawApps]);

  const [viewTab, setViewTab] = useState<ViewTab>('applications');
  const [house, setHouse] = useState('전체');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('checkout');
  const [expanded, setExpanded] = useState<string | null>(null);

  // 퇴실신청 필터
  const filteredApps = useMemo(() => {
    let list = apps;
    if (house !== '전체') list = list.filter(a => a.houseName === house);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => a.name?.toLowerCase().includes(q) || a.houseName?.toLowerCase().includes(q) || a.roomCode?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => (b.checkoutDate || '').localeCompare(a.checkoutDate || ''));
  }, [apps, house, search]);

  // 퇴실완료 필터
  const houseList = useMemo(() => {
    const sources = viewTab === 'applications'
      ? apps.map(a => a.houseName)
      : allTenants.map(t => t.지점명);
    return [...new Set(sources.filter(Boolean))].sort();
  }, [viewTab, apps, allTenants]);

  const filteredTenants = useMemo(() => {
    let list = house === '전체' ? allTenants : allTenants.filter(t => t.지점명 === house);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => t.이름?.toLowerCase().includes(q) || t.지점명?.toLowerCase().includes(q) || t.방코드?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === 'checkout') return (b.퇴실일 || '').localeCompare(a.퇴실일 || '');
      if (sort === 'movein') return (b.입주일 || '').localeCompare(a.입주일 || '');
      return monthsBetween(b.입주일, b.퇴실일) - monthsBetween(a.입주일, a.퇴실일);
    });
  }, [allTenants, house, search, sort]);

  const loading = tLoading || aLoading;
  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>;

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', paddingBottom: 32, background: '#f7f8fa', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 500, color: '#111', margin: 0 }}>퇴실자 관리</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>퇴실신청 {apps.length}건 · 퇴실완료 {allTenants.length}명</p>
        </div>
      </div>

      {/* 뷰 탭 */}
      <div style={{ display: 'flex', padding: '0 16px', marginBottom: 12 }}>
        {([['applications', `퇴실신청 (${apps.length})`], ['history', `퇴실이력 (${allTenants.length})`]] as [ViewTab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => { setViewTab(key); setHouse('전체'); setSearch(''); setExpanded(null); }} style={{
            flex: 1, paddingBottom: 10, textAlign: 'center', fontSize: 13,
            fontWeight: viewTab === key ? 700 : 400, color: viewTab === key ? '#191919' : '#888',
            background: 'none', border: 'none', borderBottom: viewTab === key ? `2px solid ${BLUE}` : '2px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* 지점 필터 pill */}
      {houseList.length > 0 && (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '0 16px 12px', scrollbarWidth: 'none' }}>
          {['전체', ...houseList].map(h => (
            <button key={h} onClick={() => setHouse(h)} style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: house === h ? 600 : 400,
              background: house === h ? BLUE : '#fff', color: house === h ? '#fff' : '#555',
              border: house === h ? 'none' : '0.5px solid rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
            }}>{stripHouse(h)}</button>
          ))}
        </div>
      )}

      {/* 검색창 */}
      <div style={{ padding: '0 16px 10px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 지점, 방코드 검색"
          style={{ width: '100%', padding: '10px 14px', fontSize: 14, background: '#f0f0f5', borderRadius: 8, border: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#111' }} />
      </div>

      {/* ===== 퇴실신청 탭 ===== */}
      {viewTab === 'applications' && (
        filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: 13 }}>퇴실신청 내역이 없습니다</div>
        ) : (
          <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredApps.map(a => {
              const isSettled = a.정산확정여부 === 'Y';
              return (
                <Link key={a.id} href={`/checkout/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{a.name}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600,
                          background: isSettled ? '#EAF3DE' : a.status === '신청접수' ? '#FAEEDA' : '#EEF3FF',
                          color: isSettled ? GREEN : a.status === '신청접수' ? '#854F0B' : BLUE,
                        }}>{isSettled ? '정산완료' : a.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{stripHouse(a.houseName)} · {a.roomCode}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: '#555' }}>{a.checkoutDate}</div>
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>신청 {a.createdAt}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8, flexShrink: 0 }}>
                      <path d="M9 18L15 12L9 6" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* ===== 퇴실이력 탭 ===== */}
      {viewTab === 'history' && (
        <>
          {/* 정렬 탭 */}
          <div style={{ display: 'flex', padding: '0 16px', gap: 16, marginBottom: 12 }}>
            {([['checkout', '퇴실일순'], ['movein', '입주일순'], ['duration', '거주기간순']] as [SortKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setSort(key)} style={{
                background: 'none', border: 'none', borderBottom: sort === key ? `1.5px solid ${BLUE}` : '1.5px solid transparent',
                paddingBottom: 6, fontSize: 13, fontWeight: sort === key ? 600 : 400,
                color: sort === key ? BLUE : '#aaa', cursor: 'pointer', fontFamily: 'inherit',
              }}>{label}</button>
            ))}
          </div>

          {filteredTenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#bbb', fontSize: 13 }}>검색 결과가 없습니다</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, margin: '0 10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 46px 42px', padding: '10px 14px 6px', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 10, color: '#aaa' }}>이름·지점·방</span>
                <span style={{ fontSize: 10, color: '#aaa', textAlign: 'center' }}>퇴실일</span>
                <span style={{ fontSize: 10, color: '#aaa', textAlign: 'right' }}>월세</span>
                <span style={{ fontSize: 10, color: '#aaa', textAlign: 'right' }}>기간</span>
              </div>
              {filteredTenants.map((t, i) => {
                const dur = monthsBetween(t.입주일, t.퇴실일);
                const rentMan = Math.round((Number(t.월세) || 0) / 10000);
                const isExp = expanded === t.입주자ID;
                const isLast = i === filteredTenants.length - 1;
                return (
                  <div key={t.입주자ID}>
                    <div onClick={() => setExpanded(isExp ? null : t.입주자ID)} style={{
                      display: 'grid', gridTemplateColumns: '1fr 50px 46px 42px', alignItems: 'center',
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: !isLast && !isExp ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
                      background: isExp ? '#f7f9ff' : 'transparent',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{t.이름}</div>
                        <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{stripHouse(t.지점명)} · {t.방코드}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>{t.퇴실일?.slice(5) || '-'}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#111', textAlign: 'right' }}>{rentMan}만</div>
                      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>{dur}개월</div>
                    </div>
                    {isExp && (
                      <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, margin: '0 10px 6px', padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
                          {[{ label: '입주일', value: t.입주일 || '-' }, { label: '퇴실일', value: t.퇴실일 || '-' }, { label: '거주기간', value: `${dur}개월` }, { label: '월세', value: `${rentMan}만원` }].map(item => (
                            <div key={item.label}>
                              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{item.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>{t.지점명} · {t.방코드}</div>
                        {t.메모 && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{t.메모}</div>}
                      </div>
                    )}
                    {isExp && !isLast && <div style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)', margin: '0 14px' }} />}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
