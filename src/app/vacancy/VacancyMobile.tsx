'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';

const BLUE = '#3182F6', RED = '#E24B4A', AMBER = '#F59E0B', GRAY = '#8b95a1';

type Tenant = Record<string, string>;

function sortByRoomCode(a: Tenant, b: Tenant) {
  return (a['방코드'] || '').localeCompare(b['방코드'] || '', 'ko');
}

function groupByHouse(list: Tenant[]) {
  const map = new Map<string, Tenant[]>();
  for (const t of list) {
    const name = t['지점명'] || '-';
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(t);
  }
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko'));
  for (const [, rooms] of entries) rooms.sort(sortByRoomCode);
  return entries;
}

// 방코드에서 알파벳 부분만 추출 (예: "A-1) 입구" → "A-1")
function roomCodeShort(code: string) {
  const m = code.match(/^[A-Za-z]-?\d*/);
  return m ? m[0] : code.slice(0, 4);
}

// 방코드에서 설명 부분 추출 (예: "A-1) 입구" → "입구")
function roomDesc(code: string) {
  const m = code.match(/\)\s*(.+)/);
  return m ? m[1].trim() : code.replace(/^[A-Za-z]-?\d*\s*/, '').trim();
}

const colHeader: React.CSSProperties = { fontSize: 11, color: GRAY, fontWeight: 400 };

function ColumnHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px', background: '#fafafa', borderBottom: '0.5px solid #f0f0f0' }}>
      <span style={{ ...colHeader, width: 44, flexShrink: 0 }}>방코드</span>
      <span style={{ ...colHeader, width: 110, flexShrink: 0 }}>방타입</span>
      <span style={{ ...colHeader, flex: 1 }}>이름</span>
      <span style={{ ...colHeader, textAlign: 'right' }}>퇴실일</span>
    </div>
  );
}

function RoomRow({ t }: { t: Tenant }) {
  const st = t['상태'];
  const isVacant = st === '공실';
  const isSoon = st === '공실예정';
  const bg = isVacant ? '#fafafa' : isSoon ? '#fffbf0' : '#fff';
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #f2f3f5', background: bg }}>
      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: GRAY, width: 44, flexShrink: 0 }}>{roomCodeShort(t['방코드'])}</span>
      <span style={{ fontSize: 13, color: '#4e5968', width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t['방타입'] || roomDesc(t['방코드']) || '-'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isVacant ? (
          <span style={{ fontSize: 14, fontWeight: 500, color: RED }}>공실</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#191f28' }}>{t['이름'] || '-'}</span>
            {isSoon && (
              <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#fff8e1', color: AMBER }}>퇴실예정</span>
            )}
          </div>
        )}
      </div>
      <span style={{ fontSize: 12, color: isVacant ? GRAY : isSoon ? AMBER : GRAY, flexShrink: 0, textAlign: 'right' }}>
        {isVacant ? '\u2014' : isSoon ? (t['퇴실일'] || '-') : (t['퇴실일'] || '')}
      </span>
    </div>
  );
}

export default function VacancyMobile() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [gu, setGu] = useState('전체');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then(d => {
      setTenants(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const guList = useMemo(() =>
    [...new Set(tenants.map(t => t['구']).filter(Boolean))].sort()
  , [tenants]);

  const filtered = useMemo(() =>
    gu === '전체' ? tenants : tenants.filter(t => t['구'] === gu)
  , [tenants, gu]);

  const vacantCount = useMemo(() => filtered.filter(t => t['상태'] === '공실').length, [filtered]);
  const soonCount = useMemo(() => filtered.filter(t => t['상태'] === '공실예정').length, [filtered]);

  const toggle = (name: string) => setExpanded(p => ({ ...p, [name]: !p[name] }));

  const tabLabels = ['전체현황', '입주가능', '즉시공실'];

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
      <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
        <ChevronLeft size={22} color="#191919" />
      </button>
      <span style={{ fontSize: 16, fontWeight: 700 }}>공실 관리</span>
    </div>
  );

  const Tabs = (
    <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
      {tabLabels.map((label, i) => (
        <button key={i} onClick={() => setTab(i)}
          style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
          {label}
        </button>
      ))}
    </div>
  );

  const GuFilter = guList.length > 0 ? (
    <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '12px 16px', scrollbarWidth: 'none', background: '#F7F8FA' }}>
      {['전체', ...guList].map(g => (
        <button key={g} onClick={() => setGu(g)}
          style={{ padding: '6px 14px', borderRadius: 100, border: gu === g ? '1px solid #191f28' : '1px solid #e5e8eb', background: gu === g ? '#191f28' : '#fff', color: gu === g ? '#fff' : '#4e5968', fontSize: 13, fontWeight: gu === g ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
          {g}
        </button>
      ))}
    </div>
  ) : null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        {Header}
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      </div>
    );
  }

  // === TAB 1: 전체현황 ===
  const renderTab1 = () => {
    const groups = groupByHouse(filtered);
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>데이터가 없어요</div>
        ) : groups.map(([houseName, rooms]) => {
          const houseVacant = rooms.filter(r => r['상태'] === '공실').length;
          const houseSoon = rooms.filter(r => r['상태'] === '공실예정').length;
          const isOpen = !!expanded[houseName];
          return (
            <div key={houseName} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
              <button onClick={() => toggle(houseName)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', flex: 1 }}>{houseName}</span>
                <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                  {houseVacant > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fee2e2', color: RED }}>공실 {houseVacant}</span>
                  )}
                  {houseSoon > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff8e1', color: '#b7791f' }}>퇴실예정 {houseSoon}</span>
                  )}
                </div>
                {isOpen ? <ChevronDown size={16} color={GRAY} /> : <ChevronRight size={16} color={GRAY} />}
              </button>
              {isOpen && (
                <>
                  <ColumnHeader />
                  {rooms.map(t => <RoomRow key={t['입주자ID'] || t['방코드']} t={t} />)}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // === TAB 2: 입주가능 ===
  const renderTab2 = () => {
    const available = filtered.filter(t => t['상태'] === '공실' || t['상태'] === '공실예정');
    const groups = groupByHouse(available);
    const totalAvail = vacantCount + soonCount;
    return (
      <div>
        <div style={{ margin: '16px 16px 0', padding: '14px 16px', borderRadius: 12, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: BLUE, fontWeight: 600 }}>
            즉시 공실 {vacantCount}실 + 퇴실예정 {soonCount}실 = 총 {totalAvail}실 입주 가능
          </span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>입주 가능한 방이 없어요</div>
          ) : groups.map(([houseName, rooms]) => (
            <div key={houseName} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', flex: 1 }}>{houseName}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#EEF3FF', color: BLUE }}>{rooms.length}자리 가능</span>
              </div>
              <ColumnHeader />
              {rooms.map(t => <RoomRow key={t['입주자ID'] || t['방코드']} t={t} />)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === TAB 3: 즉시공실 ===
  const renderTab3 = () => {
    const vacant = filtered.filter(t => t['상태'] === '공실');
    const groups = groupByHouse(vacant);
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>즉시 공실이 없어요</div>
        ) : groups.map(([houseName, rooms]) => (
          <div key={houseName} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', flex: 1 }}>{houseName}</span>
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fee2e2', color: RED }}>{rooms.length}실</span>
            </div>
            <ColumnHeader />
            {rooms.map(t => <RoomRow key={t['입주자ID'] || t['방코드']} t={t} />)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {Header}
      {Tabs}
      {GuFilter}
      {tab === 0 && renderTab1()}
      {tab === 1 && renderTab2()}
      {tab === 2 && renderTab3()}
    </div>
  );
}
