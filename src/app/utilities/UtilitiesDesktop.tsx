'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type HouseData = {
  houseName: string; hasData: boolean;
  전기?: number; 가스?: number; 수도?: number;
  인터넷?: number; 정수기?: number; 기타?: number;
  total?: number;
};
type District = { name: string; houses: HouseData[]; totalAmount: number; completedCount: number; missingCount: number };
type Summary = { totalAmount: number; completedCount: number; missingCount: number };

const FIELDS = ['전기', '가스', '수도', '인터넷', '정수기', '기타'] as const;
type Field = typeof FIELDS[number];

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};
const fmt = (n: number) => n.toLocaleString() + '원';

/* ─── SVG Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconChevronLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>;
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconGrid, active: true },
];

/* ─── Main ─── */
export default function UtilitiesDesktop() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  const [districts, setDistricts] = useState<District[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalAmount: 0, completedCount: 0, missingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [onlyMissing, setOnlyMissing] = useState(false);

  // Editable data: houseName → field values
  const [edits, setEdits] = useState<Record<string, Record<Field, number>>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [focusedCell, setFocusedCell] = useState<string | null>(null); // "houseName__field"

  // Previous month data for copy
  const [prevData, setPrevData] = useState<Record<string, Record<Field, number>>>({});

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (isFuture) return; if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/utilities?year=${year}&month=${month}`).then(r => r.json()).then(d => {
      setDistricts(d.districts || []);
      setSummary(d.summary || { totalAmount: 0, completedCount: 0, missingCount: 0 });
      // Build edits map
      const map: Record<string, Record<Field, number>> = {};
      (d.districts || []).forEach((dist: District) => {
        dist.houses.forEach(h => {
          map[h.houseName] = { 전기: h.전기 || 0, 가스: h.가스 || 0, 수도: h.수도 || 0, 인터넷: h.인터넷 || 0, 정수기: h.정수기 || 0, 기타: h.기타 || 0 };
        });
      });
      setEdits(map);
      setSaveStatus({});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch previous month data
  useEffect(() => {
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    fetch(`/api/utilities?year=${py}&month=${pm}`).then(r => r.json()).then(d => {
      const map: Record<string, Record<Field, number>> = {};
      (d.districts || []).forEach((dist: District) => {
        dist.houses.forEach(h => {
          if (h.hasData) map[h.houseName] = { 전기: h.전기 || 0, 가스: h.가스 || 0, 수도: h.수도 || 0, 인터넷: h.인터넷 || 0, 정수기: h.정수기 || 0, 기타: h.기타 || 0 };
        });
      });
      setPrevData(map);
    }).catch(() => {});
  }, [year, month]);

  const getSum = (name: string) => {
    const e = edits[name];
    if (!e) return 0;
    return FIELDS.reduce((s, f) => s + (e[f] || 0), 0);
  };

  const schedSave = (houseName: string) => {
    if (saveTimers.current[houseName]) clearTimeout(saveTimers.current[houseName]);
    saveTimers.current[houseName] = setTimeout(() => doSave(houseName), 600);
  };

  const doSave = async (houseName: string) => {
    const vals = edits[houseName];
    if (!vals) return;
    setSaveStatus(p => ({ ...p, [houseName]: 'saving' }));
    try {
      const res = await fetch('/api/utilities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseName, year, month, ...vals }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus(p => ({ ...p, [houseName]: 'saved' }));
      setTimeout(() => setSaveStatus(p => { const n = { ...p }; if (n[houseName] === 'saved') delete n[houseName]; return n; }), 1500);
    } catch {
      setSaveStatus(p => ({ ...p, [houseName]: 'error' }));
    }
  };

  const updateField = (houseName: string, field: Field, value: number) => {
    setEdits(p => ({ ...p, [houseName]: { ...(p[houseName] || { 전기: 0, 가스: 0, 수도: 0, 인터넷: 0, 정수기: 0, 기타: 0 }), [field]: value } }));
  };

  const saveOnBlur = (houseName: string) => {
    if (saveTimers.current[houseName]) clearTimeout(saveTimers.current[houseName]);
    saveTimers.current[houseName] = setTimeout(() => doSave(houseName), 100);
  };

  const copyPrev = (houseName: string) => {
    const prev = prevData[houseName];
    if (!prev) return;
    const hasValues = getSum(houseName) > 0;
    if (hasValues && !window.confirm(`${houseName}에 이미 값이 있습니다. 전월 데이터로 덮어쓸까요?`)) return;
    setEdits(p => ({ ...p, [houseName]: { ...prev } }));
    saveOnBlur(houseName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, houseName: string, fieldIdx: number, allHouses: string[]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const houseIdx = allHouses.indexOf(houseName);
      const nextHouse = allHouses[houseIdx + 1];
      if (nextHouse) {
        const nextInput = document.querySelector(`[data-house="${nextHouse}"][data-field="${fieldIdx}"]`) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  // Flatten houses for keyboard nav
  const allHouseNames = districts.flatMap(d => d.houses.map(h => h.houseName));

  const COL = '60px 1fr repeat(6, 90px) 90px 70px 80px';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 18px' }}><div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div><div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div></div>
        <div style={{ padding: '0 16px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}><IconSearch /><span style={{ fontSize: 12, color: T.textMute }}>검색</span></div></div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {MENU.map(m => (<Link key={m.label} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: m.active ? T.blueLight : 'transparent', color: m.active ? T.blueDark : T.textSub, fontWeight: m.active ? 600 : 400, fontSize: 13, textDecoration: 'none' }}><m.icon />{m.label}</Link>))}
        </nav>
        <SidebarLogout />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>공과금 관리</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><IconChevronLeft /></button>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text, minWidth: 100, textAlign: 'center' }}>{year}년 {month}월</span>
                <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: isFuture ? 'default' : 'pointer', padding: 4, display: 'flex', opacity: isFuture ? 0.3 : 1 }}><IconChevronRight /></button>
                <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: T.textSub, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 4 }}>이번달</button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: T.textSub, fontWeight: 500 }}>
              <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} style={{ accentColor: T.blue }} />
              미입력만 보기
            </label>
          </div>

          {/* KPI */}
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[
              { label: '이달 합계', value: fmt(summary.totalAmount), color: T.blue },
              { label: '완료', value: `${summary.completedCount}개`, color: T.green },
              { label: '미입력', value: `${summary.missingCount}개`, color: summary.missingCount > 0 ? T.red : T.text },
            ].map(k => (
              <div key={k.label} style={{ background: T.bg, borderRadius: 10, padding: '10px 16px', minWidth: 120 }}>
                <div style={{ fontSize: 11, color: T.textMute, marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
          ) : (
            <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: COL, borderBottom: `1px solid ${T.line}`, background: '#FAFBFC', position: 'sticky', top: 0, zIndex: 2 }}>
                {['구', '지점', '전기', '가스', '수도', '인터넷', '정수기', '기타', '합계', '상태', ''].map(h => (
                  <div key={h} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textMute, textAlign: h === '지점' || h === '구' ? 'left' : 'right' }}>{h}</div>
                ))}
              </div>

              {/* Rows by district */}
              {districts.map(dist => {
                const visibleHouses = onlyMissing ? dist.houses.filter(h => !h.hasData) : dist.houses;
                if (visibleHouses.length === 0) return null;
                return (
                  <div key={dist.name}>
                    {/* Group header */}
                    <div style={{ padding: '8px 14px', background: '#F9FAFB', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{dist.name}</span>
                      <span style={{ fontSize: 11, color: T.textMute }}>{dist.houses.length}개 지점</span>
                      {dist.missingCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: T.red }}>{dist.missingCount}개 미입력</span>}
                    </div>

                    {visibleHouses.map(h => {
                      const name = h.houseName;
                      const vals = edits[name] || { 전기: 0, 가스: 0, 수도: 0, 인터넷: 0, 정수기: 0, 기타: 0 };
                      const sum = FIELDS.reduce((s, f) => s + (vals[f] || 0), 0);
                      const status = saveStatus[name];
                      const hasPrev = !!prevData[name];
                      const isComplete = sum > 0;

                      return (
                        <div key={name} style={{
                          display: 'grid', gridTemplateColumns: COL, borderBottom: `1px solid ${T.divider}`,
                          background: !isComplete ? '#FFFBFB' : T.card,
                          borderLeft: !isComplete ? `3px solid ${T.red}` : '3px solid transparent',
                        }}>
                          <div style={{ padding: '0 10px', fontSize: 11, color: T.textMute, display: 'flex', alignItems: 'center' }}>{dist.name}</div>
                          <div style={{ padding: '0 10px', fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center' }}>{name}</div>
                          {FIELDS.map((f, fi) => {
                            const cellKey = `${name}__${f}`;
                            const isFocused = focusedCell === cellKey;
                            const raw = vals[f] || 0;
                            const displayVal = isFocused ? (raw > 0 ? String(raw) : '') : (raw > 0 ? raw.toLocaleString('ko-KR') : '');
                            return (
                              <div key={f} style={{ padding: '4px 4px' }}>
                                <input
                                  data-house={name}
                                  data-field={fi}
                                  type="text"
                                  inputMode="numeric"
                                  value={displayVal}
                                  onChange={e => {
                                    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                                    updateField(name, f, onlyNums ? Number(onlyNums) : 0);
                                  }}
                                  onKeyDown={e => handleKeyDown(e, name, fi, allHouseNames)}
                                  placeholder=""
                                  style={{
                                    width: '100%', height: 36, boxSizing: 'border-box',
                                    padding: '0 8px', border: 'none', borderBottom: `1px solid ${isFocused ? T.blue : T.divider}`,
                                    background: isFocused ? T.blueLight : 'transparent', fontSize: 13, fontWeight: 500,
                                    color: T.text, textAlign: 'right', fontFamily: 'inherit', outline: 'none',
                                  }}
                                  onFocus={() => setFocusedCell(cellKey)}
                                  onBlur={() => { setFocusedCell(null); saveOnBlur(name); }}
                                />
                              </div>
                            );
                          })}
                          <div style={{ padding: '0 10px', fontSize: 13, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {sum > 0 ? sum.toLocaleString('ko-KR') : '\u2014'}
                          </div>
                          <div style={{ padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {status === 'saving' ? (
                              <span style={{ fontSize: 10, color: T.textMute }}>...</span>
                            ) : status === 'saved' ? (
                              <IconCheck />
                            ) : status === 'error' ? (
                              <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>!</span>
                            ) : isComplete ? (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: T.greenLight, color: T.greenDark }}>완료</span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: T.redLight, color: T.redDark }}>미입력</span>
                            )}
                          </div>
                          <div style={{ padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button onClick={() => copyPrev(name)} disabled={!hasPrev} style={{
                              background: 'none', border: `1px solid ${hasPrev ? T.line : 'transparent'}`,
                              borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600,
                              color: hasPrev ? T.textSub : T.textMute, cursor: hasPrev ? 'pointer' : 'default',
                              fontFamily: 'inherit', opacity: hasPrev ? 1 : 0.3,
                            }}>전월</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
