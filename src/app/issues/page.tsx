'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type Issue = {
  id: string; houseName: string; roomCode: string; title: string; content: string;
  category: string; status: string; assignee: string; createdAt: string;
  completedAt: string; cost: number; memo: string;
};

type Work = {
  용역ID: string; 예정일: string; 지점명: string; 담당자명: string;
  작업종류: string; 정산금액: string; 메모: string; 완료여부: string;
};

type StaffInfo = { 이름: string; 링크토큰: string };
type StaffStat = {
  이름: string; count: number; amount: number; 링크토큰: string;
};

type MainTab = 'schedule' | 'workers' | 'settle';
type Category = '전체' | '청소' | '수리' | '기타';

const BLUE = '#3182F6', GREEN = '#00B493', RED = '#E24B4A', GRAY = '#888888';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CATEGORIES: Category[] = ['전체', '청소', '수리', '기타'];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [staffInfoList, setStaffInfoList] = useState<StaffInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState<MainTab>('schedule');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selCat, setSelCat] = useState<Category>('전체');
  const [settleYear, setSettleYear] = useState(new Date().getFullYear());
  const [settleMonth, setSettleMonth] = useState(new Date().getMonth());
  const [filterStaff, setFilterStaff] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/issues').then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
      fetch('/api/workers/staff').then(r => r.json()).catch(() => []),
    ]).then(([issueData, workData, staffData]) => {
      setIssues(issueData.issues || []);
      setWorks(Array.isArray(workData) ? workData : []);
      const sArr = Array.isArray(staffData) ? staffData : [];
      setStaffInfoList(sArr.map((s: any) => ({ 이름: (s.이름 || '').trim(), 링크토큰: (s.링크토큰 || '').trim() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const elapsed = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.max(0, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
  };

  // 통계
  const cleanCount = useMemo(() => works.filter(w => w.작업종류.includes('청소')).length, [works]);
  const repairCount = useMemo(() => issues.filter(i => i.status !== '완료').length, [issues]);
  const etcCount = useMemo(() => works.filter(w => !w.작업종류.includes('청소') && !w.작업종류.includes('수리')).length, [works]);

  // 캘린더 점 표시용
  const cleanDateSet = useMemo(() => {
    const s = new Set<string>();
    works.forEach(w => { if (w.예정일 && w.작업종류.includes('청소')) s.add(w.예정일.substring(0, 10)); });
    return s;
  }, [works]);

  const issueDateSet = useMemo(() => {
    const s = new Set<string>();
    issues.forEach(i => { if (i.createdAt) s.add(i.createdAt.substring(0, 10)); });
    return s;
  }, [issues]);

  // 캘린더 날짜 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const fmtDate = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handlePrev = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const handleNext = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
  };
  const handleDateClick = (day: number) => {
    const ds = fmtDate(day);
    setSelectedDate(prev => prev === ds ? null : ds);
  };

  // 정산 월 네비게이션
  const handleSettlePrev = () => {
    if (settleMonth === 0) { setSettleYear(settleYear - 1); setSettleMonth(11); }
    else setSettleMonth(settleMonth - 1);
  };
  const handleSettleNext = () => {
    if (settleMonth === 11) { setSettleYear(settleYear + 1); setSettleMonth(0); }
    else setSettleMonth(settleMonth + 1);
  };

  // 일정 탭 필터링
  type ListItem = { type: 'clean' | 'repair' | 'etc'; date: string; data: Work | Issue };

  const filteredList = useMemo(() => {
    const items: ListItem[] = [];

    if (selCat === '전체' || selCat === '청소') {
      works.filter(w => w.작업종류.includes('청소')).forEach(w =>
        items.push({ type: 'clean', date: w.예정일, data: w }));
    }
    if (selCat === '전체' || selCat === '수리') {
      issues.filter(i => i.status !== '완료').forEach(i =>
        items.push({ type: 'repair', date: i.createdAt, data: i }));
    }
    if (selCat === '전체' || selCat === '기타') {
      works.filter(w => !w.작업종류.includes('청소') && !w.작업종류.includes('수리')).forEach(w =>
        items.push({ type: 'etc', date: w.예정일, data: w }));
    }

    let list = items;
    if (selectedDate) {
      list = list.filter(it => it.date && it.date.substring(0, 10) === selectedDate);
    }
    if (filterStaff) {
      list = list.filter(it => {
        if (it.type === 'repair') return false;
        return ((it.data as Work).담당자명 || '').trim() === filterStaff.trim();
      });
    }
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }, [works, issues, selCat, selectedDate, filterStaff]);

  // 정산 탭 데이터
  const settlePrefix = `${settleYear}-${String(settleMonth + 1).padStart(2, '0')}`;
  const settleWorks = useMemo(() =>
    works.filter(w => w.예정일.startsWith(settlePrefix)), [works, settlePrefix]);
  const totalSettle = useMemo(() =>
    settleWorks.reduce((s, w) => s + (parseInt(w.정산금액) || 0), 0), [settleWorks]);
  const settleByStaff = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    settleWorks.forEach(w => {
      const name = w.담당자명 || '미배정';
      if (!map[name]) map[name] = { count: 0, amount: 0 };
      map[name].count++;
      map[name].amount += parseInt(w.정산금액) || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [settleWorks]);

  // 담당자 탭 데이터 — 용역 시트 담당자명에서 unique 추출
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const staffStats = useMemo<StaffStat[]>(() => {
    const names = Array.from(new Set(works.map(w => (w.담당자명 || '').trim()).filter(n => n !== '')));
    return names.map(name => {
      const myWorks = works.filter(w => (w.담당자명 || '').trim() === name && w.예정일.startsWith(thisMonthPrefix));
      const count = myWorks.length;
      const amount = myWorks.reduce((sum, w) => sum + (parseInt(w.정산금액) || 0), 0);
      const matched = staffInfoList.find(si => si.이름 === name);
      const 링크토큰 = matched?.링크토큰 || '';
      return { 이름: name, count, amount, 링크토큰 };
    }).sort((a, b) => b.amount - a.amount);
  }, [works, thisMonthPrefix, staffInfoList]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
    );
  }

  const tabs: { key: MainTab; label: string }[] = [
    { key: 'schedule', label: '일정' },
    { key: 'workers', label: '담당자' },
    { key: 'settle', label: '정산' },
  ];

  return (
    <div style={{ paddingBottom: 70, maxWidth: 430, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
        <div style={{ padding: '20px 16px 0' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, margin: '0 0 16px' }}>청소 · 수리</h1>
        </div>
        {/* 상단 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setMainTab(t.key); setFilterStaff(null); }}
              style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                borderBottom: mainTab === t.key ? `2px solid ${BLUE}` : '2px solid transparent',
                fontSize: 14, fontWeight: mainTab === t.key ? 700 : 400,
                color: mainTab === t.key ? BLUE : GRAY,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========== 일정 탭 ========== */}
      {mainTab === 'schedule' && (
        <div style={{ padding: '16px 16px 0' }}>
          {/* 담당자 필터 표시 */}
          {filterStaff && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '10px 14px', background: '#E8F1FD', borderRadius: 10, border: `1px solid ${BLUE}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: BLUE }}>{filterStaff}</span>
                <span style={{ fontSize: 12, color: BLUE }}>일정 보는 중</span>
              </div>
              <button
                onClick={() => setFilterStaff(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6,
                  background: '#fff', border: `1px solid ${BLUE}`, color: BLUE,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                전체 보기
              </button>
            </div>
          )}

          {/* 통계 카드 3개 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: '청소', count: cleanCount, color: GREEN },
              { label: '수리', count: repairCount, color: RED },
              { label: '기타', count: etcCount, color: GRAY },
            ].map(s => (
              <div key={s.label} style={{ padding: 12, borderRadius: 12, textAlign: 'center', background: '#F7F8FA' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</p>
                <p style={{ fontSize: 11, color: GRAY }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* 캘린더 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid #F0F0F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button onClick={handlePrev} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#333', padding: '4px 8px', fontFamily: 'inherit' }}>{'<'}</button>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{calYear}년 {calMonth + 1}월</span>
              <button onClick={handleNext} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#333', padding: '4px 8px', fontFamily: 'inherit' }}>{'>'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
              {WEEKDAYS.map(w => (
                <div key={w} style={{ fontSize: 10, color: GRAY, paddingBottom: 4 }}>{w}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} style={{ padding: '6px 0' }} />;
                const ds = fmtDate(day);
                const isToday = ds === todayStr;
                const hasClean = cleanDateSet.has(ds);
                const hasIssue = issueDateSet.has(ds);
                const isSelected = ds === selectedDate;
                return (
                  <div key={ds} onClick={() => handleDateClick(day)}
                    style={{ padding: '4px 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: isToday || isSelected ? 600 : 400,
                      background: isToday ? BLUE : isSelected ? '#E8F1FD' : 'transparent',
                      color: isToday ? '#fff' : isSelected ? BLUE : '#333',
                    }}>{day}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {hasClean && <div style={{ width: 4, height: 4, borderRadius: '50%', background: GREEN }} />}
                      {hasIssue && <div style={{ width: 4, height: 4, borderRadius: '50%', background: RED }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 카테고리 칩 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setSelCat(c)}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12,
                  fontWeight: selCat === c ? 600 : 400,
                  background: selCat === c ? '#191919' : '#F5F5F5',
                  color: selCat === c ? '#fff' : GRAY,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {c}
              </button>
            ))}
          </div>

          {/* 날짜 선택 시 타이틀 */}
          {selectedDate && (
            <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 8 }}>
              {parseInt(selectedDate.split('-')[1])}월 {parseInt(selectedDate.split('-')[2])}일 {filteredList.length}건
            </p>
          )}

          {/* 일정 리스트 */}
          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>일정이 없어요</div>
          ) : (
            filteredList.map((item, idx) => {
              if (item.type === 'repair') {
                const issue = item.data as Issue;
                const days = elapsed(issue.createdAt);
                const dotColor = issue.status === '완료' ? GREEN : issue.status === '처리중' ? '#F59E0B' : days >= 3 ? RED : '#C0C0C0';
                return (
                  <Link key={`r-${issue.id}`} href={`/issues/${issue.id}`}
                    style={{ display: 'block', background: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#FEF0F0', color: RED }}>수리</span>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 6 }}>{issue.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: GRAY }}>{issue.category} · {issue.houseName}</span>
                      {days >= 3 && issue.status !== '완료' && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: RED }}>{days}일 경과</span>
                      )}
                    </div>
                  </Link>
                );
              } else {
                const w = item.data as Work;
                const dotColor = item.type === 'clean' ? GREEN : GRAY;
                const badgeLabel = item.type === 'clean' ? '청소' : '기타';
                const badgeBg = item.type === 'clean' ? '#E6F7F2' : '#F5F5F5';
                const badgeColor = item.type === 'clean' ? GREEN : GRAY;
                const amount = parseInt(w.정산금액) || 0;
                return (
                  <div key={`w-${w.용역ID}-${idx}`}
                    style={{ background: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: badgeBg, color: badgeColor }}>{badgeLabel}</span>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 4 }}>{w.지점명} · {w.작업종류}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: GRAY }}>{w.담당자명} · {w.예정일}</span>
                      {amount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#191919' }}>{amount.toLocaleString()}원</span>}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      )}

      {/* ========== 담당자 탭 ========== */}
      {mainTab === 'workers' && (
        <div style={{ padding: '16px 16px 0' }}>
          {staffStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>등록된 담당자가 없어요</div>
          ) : (
            staffStats.map(s => (
              <div key={s.이름} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 2 }}>{s.이름}</p>
                    <p style={{ fontSize: 11, color: GRAY }}>
                      이달 {s.count}건 · {s.amount > 0 ? `${s.amount.toLocaleString()}원` : '0원'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {s.링크토큰 ? (
                      <Link href={`/worker/${s.링크토큰}`}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          border: `1px solid ${BLUE}`, color: BLUE,
                          fontSize: 11, fontWeight: 600, textDecoration: 'none',
                        }}>
                        개인 페이지
                      </Link>
                    ) : (
                      <span style={{
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid #DDD', color: '#999',
                        fontSize: 11, fontWeight: 600, opacity: 0.4, cursor: 'not-allowed',
                      }}>
                        개인 페이지
                      </span>
                    )}
                    <button
                      onClick={() => { setMainTab('schedule'); setFilterStaff(s.이름); }}
                      style={{
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid #DDD', background: 'none', color: '#555',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      일정 보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== 정산 탭 ========== */}
      {mainTab === 'settle' && (
        <div style={{ padding: '16px 16px 0' }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <button onClick={handleSettlePrev} style={{ background: 'none', border: 'none', fontSize: 16, color: '#333', cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}>{'<'}</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{settleYear}년 {settleMonth + 1}월</span>
            <button onClick={handleSettleNext} style={{ background: 'none', border: 'none', fontSize: 16, color: '#333', cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}>{'>'}</button>
          </div>

          {/* 총 정산 금액 */}
          <div style={{ background: '#F7F8FA', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>총 정산 금액</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#191919' }}>{totalSettle.toLocaleString()}원</p>
          </div>

          {/* 담당자별 정산 */}
          {settleByStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY, fontSize: 13 }}>해당 월 정산 내역이 없어요</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              {settleByStaff.map(([name, info], i) => (
                <div key={name}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 14px' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{name}</p>
                      <p style={{ fontSize: 11, color: GRAY }}>{info.count}건 완료</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{info.amount.toLocaleString()}원</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
