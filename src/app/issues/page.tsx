'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Chip from '@/components/ui/Chip';

type Issue = {
  id: string; houseName: string; roomCode: string; title: string; content: string;
  category: string; status: string; assignee: string; createdAt: string;
  completedAt: string; cost: number; memo: string;
};

type StatusFilter = 'all' | 'urgent' | 'inprogress' | 'done';
type TypeFilter = '전체 유형' | '수리' | '청소' | '민원' | '교체' | '기타';
const typeFilters: TypeFilter[] = ['전체 유형', '수리', '청소', '민원', '교체', '기타'];

const GRAY = '#888888', RED = '#E24B4A';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('전체 유형');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetch('/api/issues').then(r => r.json()).then(data => {
      setIssues(data.issues || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const elapsed = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.max(0, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
  };

  const notDone = useMemo(() => issues.filter(i => i.status !== '완료'), [issues]);
  const urgentCount = useMemo(() => notDone.filter(i => elapsed(i.createdAt) >= 3).length, [notDone]);
  const inprogressCount = useMemo(() => issues.filter(i => i.status === '처리중').length, [issues]);
  const doneCount = useMemo(() => issues.filter(i => i.status === '완료').length, [issues]);

  const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: notDone.length },
    { key: 'urgent', label: '긴급', count: urgentCount },
    { key: 'inprogress', label: '처리중', count: inprogressCount },
    { key: 'done', label: '완료', count: doneCount },
  ];

  // 이슈 등록일 기준 날짜 Set (캘린더 점 표시용)
  const issueDateSet = useMemo(() => {
    const s = new Set<string>();
    issues.forEach(i => {
      if (i.createdAt) {
        const d = i.createdAt.substring(0, 10);
        s.add(d);
      }
    });
    return s;
  }, [issues]);

  // 캘린더 날짜 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calendarYear, calendarMonth]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const formatDateStr = (day: number) => {
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const ds = formatDateStr(day);
    setSelectedDate(prev => prev === ds ? null : ds);
  };

  const filtered = useMemo(() => {
    let list = [...issues];
    if (statusFilter === 'urgent') list = list.filter(i => i.status !== '완료' && elapsed(i.createdAt) >= 3);
    else if (statusFilter === 'inprogress') list = list.filter(i => i.status === '처리중');
    else if (statusFilter === 'done') list = list.filter(i => i.status === '완료');
    else list = list.filter(i => i.status !== '완료');
    if (typeFilter !== '전체 유형') list = list.filter(i => i.category === typeFilter);
    if (selectedDate) list = list.filter(i => i.createdAt && i.createdAt.substring(0, 10) === selectedDate);
    return list;
  }, [issues, statusFilter, typeFilter, selectedDate]);

  const getStatusDotColor = (issue: Issue) => {
    const days = elapsed(issue.createdAt);
    const isUrgent = days >= 3 && issue.status !== '완료';
    if (issue.status === '완료') return '#00B493';
    if (issue.status === '처리중') return '#F59E0B';
    if (isUrgent) return '#E24B4A';
    return '#C0C0C0';
  };

  const getBadgeLabel = (issue: Issue) => {
    const days = elapsed(issue.createdAt);
    const isUrgent = days >= 3 && issue.status !== '완료';
    if (isUrgent) return '긴급';
    return '일반';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
    );
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', padding: '20px 16px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>이슈 · 수리</h1>
          <Link href="/issues/new" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 99, background: '#3182F6', fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
            <Plus size={14} /> 이슈 등록
          </Link>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {statusFilters.map((sf) => (
            <button
              key={sf.key}
              style={{
                padding: 10, borderRadius: 12, textAlign: 'center', background: '#F7F8FA',
                border: statusFilter === sf.key ? (sf.key === 'urgent' ? `2px solid ${RED}` : '2px solid #191919') : '2px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => setStatusFilter(sf.key)}
            >
              <p style={{ fontSize: 18, fontWeight: 700, color: sf.key === 'urgent' ? RED : '#191919' }}>{sf.count}</p>
              <p style={{ fontSize: 11, color: GRAY }}>{sf.label}</p>
            </button>
          ))}
        </div>

        {/* 캘린더 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#333', padding: '4px 8px', fontFamily: 'inherit' }}>{'<'}</button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{calendarYear}년 {calendarMonth + 1}월</span>
            <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#333', padding: '4px 8px', fontFamily: 'inherit' }}>{'>'}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ fontSize: 10, color: GRAY, paddingBottom: 4 }}>{w}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} style={{ padding: '6px 0' }} />;
              const ds = formatDateStr(day);
              const isToday = ds === todayStr;
              const hasIssue = issueDateSet.has(ds);
              const isSelected = ds === selectedDate;
              return (
                <div
                  key={ds}
                  onClick={() => handleDateClick(day)}
                  style={{
                    padding: '4px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: isToday || isSelected ? 600 : 400,
                    background: isToday ? '#3182F6' : isSelected ? '#E8F1FD' : 'transparent',
                    color: isToday ? '#fff' : isSelected ? '#3182F6' : '#333',
                  }}>
                    {day}
                  </div>
                  <div style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: hasIssue ? '#E24B4A' : 'transparent',
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* 유형 필터 칩 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {typeFilters.map((tf) => (
            <button
              key={tf}
              style={{
                padding: '6px 12px', borderRadius: 99, flexShrink: 0,
                fontSize: 12, fontWeight: typeFilter === tf ? 600 : 400,
                background: typeFilter === tf ? '#191919' : '#F5F5F5',
                color: typeFilter === tf ? '#fff' : GRAY,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => setTypeFilter(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* 날짜 선택 시 섹션 타이틀 */}
        {selectedDate && (
          <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 10 }}>
            {parseInt(selectedDate.split('-')[1])}월 {parseInt(selectedDate.split('-')[2])}일 이슈 {filtered.length}건
          </p>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>이슈가 없어요</div>
        ) : (
          filtered.map((issue) => {
            const days = elapsed(issue.createdAt);
            const isUrgent = days >= 3 && issue.status !== '완료';
            const dotColor = getStatusDotColor(issue);
            const badgeLabel = getBadgeLabel(issue);
            const badgeBg = isUrgent ? '#FEF0F0' : '#F5F5F5';
            const badgeColor = isUrgent ? '#E24B4A' : '#888';
            const statusLabel = issue.status === '완료' ? '완료' : issue.status === '처리중' ? '처리중' : '미처리';

            return (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                style={{
                  display: 'block',
                  background: '#fff',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                {/* 상단: 배지 + 상태 도트 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: badgeBg,
                      color: badgeColor,
                    }}>
                      {badgeLabel}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: '#F7F8FA',
                      color: '#666',
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: dotColor,
                    flexShrink: 0,
                  }} />
                </div>

                {/* 중단: 제목 */}
                <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 6 }}>{issue.title}</p>

                {/* 하단: 유형 · 지점명 + 경과일수 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: GRAY }}>{issue.category} · {issue.houseName}</span>
                  {days >= 3 && issue.status !== '완료' && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#E24B4A' }}>{days}일 경과</span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
