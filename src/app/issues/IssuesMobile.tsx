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

type StaffInfo = { 담당자ID: string; 이름: string; 링크토큰: string };
type StaffStat = {
  담당자ID: string; 이름: string; count: number; amount: number; 링크토큰: string;
};

type MainTab = 'schedule' | 'workers' | 'settle' | 'inventory';
type Category = '전체' | '청소' | '수리' | '기타';

type InventoryTask = {
  id: string;
  title: string;
  houseName: string;
  roomCode: string;
  assignedTo: string;
  tags: string[];
  memo: string;
  isUrgent: boolean;
  registeredAt: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
};

const BLUE = '#3182F6', GREEN = '#00B493', RED = '#E24B4A', GRAY = '#888888';

const menuItemStyle = (color: string): React.CSSProperties => ({
  display: 'block', width: '100%', padding: '12px 14px',
  background: 'transparent', border: 'none', textAlign: 'left',
  fontSize: 13, fontWeight: 500, color,
  cursor: 'pointer', fontFamily: 'inherit',
});
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CATEGORIES: Category[] = ['전체', '청소', '수리', '기타'];

const monthPrefix = (y: number, m1Indexed: number) =>
  `${y}-${String(m1Indexed).padStart(2, '0')}`;

export default function IssuesMobile({ initialTab }: { initialTab?: MainTab } = {}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [staffInfoList, setStaffInfoList] = useState<StaffInfo[]>([]);
  const [loading, setLoading] = useState(true);
  // 할일 시트 = 인벤토리 응답을 그대로 사용 (status != '완료'인 모든 행)
  const [tasks, setTasks] = useState<InventoryTask[]>([]);

  const [mainTab, setMainTab] = useState<MainTab>(initialTab ?? 'schedule');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selCat, setSelCat] = useState<Category>('전체');
  const [settleYear, setSettleYear] = useState(new Date().getFullYear());
  const [settleMonth, setSettleMonth] = useState(new Date().getMonth());
  const [filterStaff, setFilterStaff] = useState<string | null>(null);

  // 인벤토리
  const [inventory, setInventory] = useState<InventoryTask[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<InventoryTask | null>(null);
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd] = useState('');
  const [schedAmount, setSchedAmount] = useState('');
  const [schedSaving, setSchedSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<InventoryTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHouse, setEditHouse] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editConfirmDel, setEditConfirmDel] = useState(false);
  const [editDeleting, setEditDeleting] = useState(false);

  const loadInventory = () => {
    setInventoryLoading(true);
    // 인벤토리 탭(strict)과 일정/홈에서 쓰는 active 데이터(예정+인벤토리)를 병렬 로드.
    Promise.all([
      fetch('/api/tasks/inventory', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      fetch('/api/tasks/active', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    ])
      .then(([invRes, actRes]) => {
        if (invRes?.success && Array.isArray(invRes.data)) setInventory(invRes.data);
        else setInventory([]);
        if (actRes?.success && Array.isArray(actRes.data)) setTasks(actRes.data);
        else setTasks([]);
      })
      .finally(() => setInventoryLoading(false));
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/issues').then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
      fetch('/api/workers/staff').then(r => r.json()).catch(() => []),
    ]).then(([issueData, workData, staffData]) => {
      setIssues(issueData.issues || []);
      setWorks(Array.isArray(workData) ? workData : []);
      const sArr = Array.isArray(staffData) ? staffData : [];
      setStaffInfoList(sArr.map((s: any) => ({
        담당자ID: (s.담당자ID || '').trim(),
        이름: (s.이름 || '').trim(),
        링크토큰: (s.링크토큰 || '').trim(),
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
    loadInventory();
  }, []);

  const openScheduleModal = (t: InventoryTask) => {
    const today = new Date().toISOString().slice(0, 10);
    setScheduleTarget(t);
    setSchedStart(today);
    setSchedEnd('');
    setSchedAmount('');
  };
  const closeScheduleModal = () => {
    if (schedSaving) return;
    setScheduleTarget(null);
  };
  const openEditModal = (t: InventoryTask) => {
    setOpenMenuId(null);
    setEditTarget(t);
    setEditTitle(t.title || '');
    setEditHouse(t.houseName || '');
    setEditRoom(t.roomCode || '');
    setEditAssignee(t.assignedTo || '');
    setEditTags((t.tags || []).join(', '));
    setEditMemo(t.memo || '');
    setEditStart((t.startDate || '').slice(0, 10));
    setEditEnd((t.endDate || '').slice(0, 10));
    setEditAmount(t.amount ? String(t.amount) : '');
  };
  const closeEditModal = () => {
    if (editSaving || editDeleting) return;
    setEditConfirmDel(false);
    setEditTarget(null);
  };
  const confirmDeleteEdit = async () => {
    if (!editTarget || editDeleting) return;
    setEditDeleting(true);
    try {
      const res = await fetch('/api/tasks/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: editTarget.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d?.success) { alert(d?.error || '삭제 실패'); return; }
      setEditConfirmDel(false);
      setEditTarget(null);
      loadInventory();
    } finally {
      setEditDeleting(false);
    }
  };
  const saveEdit = async () => {
    if (!editTarget || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: editTarget.id,
          title: editTitle,
          houseName: editHouse,
          roomCode: editRoom,
          assignedTo: editAssignee,
          tags: editTags.split(',').map(s => s.trim()).filter(Boolean),
          memo: editMemo,
          startDate: editStart,
          endDate: editEnd,
          amount: editAmount === '' ? '' : Number(editAmount),
        }),
      });
      const d = await res.json();
      if (!d?.success) { alert(d?.error || '저장 실패'); return; }
      setEditTarget(null);
      loadInventory();
    } finally {
      setEditSaving(false);
    }
  };
  const deleteTask = async (t: InventoryTask) => {
    setOpenMenuId(null);
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch('/api/tasks/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: t.id }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d?.success) {
      alert(d?.error || '삭제 실패');
      return;
    }
    loadInventory();
  };

  const saveSchedule = async () => {
    if (!scheduleTarget || !schedStart || !schedEnd) return;
    setSchedSaving(true);
    try {
      const res = await fetch('/api/tasks/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: scheduleTarget.id,
          startDate: schedStart,
          endDate: schedEnd,
          amount: schedAmount ? Number(schedAmount) : undefined,
        }),
      });
      const d = await res.json();
      if (!d?.success) { alert(d?.error || '저장 실패'); return; }
      setScheduleTarget(null);
      loadInventory();
      setMainTab('schedule');
    } finally {
      setSchedSaving(false);
    }
  };

  const elapsed = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.max(0, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
  };

  // 월 필터된 파생 배열
  const worksInMonth = useMemo(() => {
    const prefix = monthPrefix(calYear, calMonth + 1);
    return works.filter(w => (w.예정일 || '').startsWith(prefix));
  }, [works, calYear, calMonth]);

  const issuesInMonth = useMemo(() => {
    const prefix = monthPrefix(calYear, calMonth + 1);
    return issues.filter(i => (i.createdAt || '').startsWith(prefix));
  }, [issues, calYear, calMonth]);

  // 할일 카테고리 판정 (첫 매칭 태그 우선)
  const taskCategory = (t: InventoryTask): 'clean' | 'repair' | 'etc' => {
    const tags = t.tags || [];
    if (tags.some(g => g.includes('청소'))) return 'clean';
    if (tags.some(g => g.includes('수리'))) return 'repair';
    return 'etc';
  };
  const dateRangeArr = (start: string, end: string): string[] => {
    if (!start) return [];
    const s = start.slice(0, 10);
    const e = (end && end.slice(0, 10)) || s;
    if (e < s) return [s];
    const out: string[] = [];
    const d = new Date(s + 'T00:00:00');
    const stop = new Date(e + 'T00:00:00');
    while (d <= stop) {
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      d.setDate(d.getDate() + 1);
    }
    return out;
  };

  // 할일 시트에서 일정 탭에 표시할 행: 상태='예정' (마감일 채워짐) + 현재 월과 겹침.
  // 인벤토리(마감일 없음) 행은 제외하여 두 탭 상호 배타 유지.
  const tasksInMonth = useMemo(() => {
    const prefix = monthPrefix(calYear, calMonth + 1);
    return tasks.filter(t => {
      if (t.status !== '예정') return false;
      const s = (t.startDate || '').slice(0, 10);
      if (!s) return false;
      const e = (t.endDate || '').slice(0, 10) || s;
      return s.slice(0, 7) <= prefix && e.slice(0, 7) >= prefix;
    });
  }, [tasks, calYear, calMonth]);

  // 통계 (월 기준) — 용역/이슈 + 할일 시트 머지
  const cleanCount = useMemo(() =>
    worksInMonth.filter(w => w.작업종류.includes('청소')).length
    + tasksInMonth.filter(t => taskCategory(t) === 'clean').length
  , [worksInMonth, tasksInMonth]);
  const repairCount = useMemo(() =>
    issuesInMonth.filter(i => i.status !== '완료').length
    + tasksInMonth.filter(t => taskCategory(t) === 'repair').length
  , [issuesInMonth, tasksInMonth]);
  const etcCount = useMemo(() =>
    worksInMonth.filter(w => !w.작업종류.includes('청소') && !w.작업종류.includes('수리')).length
    + tasksInMonth.filter(t => taskCategory(t) === 'etc').length
  , [worksInMonth, tasksInMonth]);

  // 캘린더 점 표시용 (월 기준) — 할일은 시작일~마감일 범위 모두 표시
  const cleanDateSet = useMemo(() => {
    const s = new Set<string>();
    const prefix = monthPrefix(calYear, calMonth + 1);
    worksInMonth.forEach(w => { if (w.예정일 && w.작업종류.includes('청소')) s.add(w.예정일.substring(0, 10)); });
    tasksInMonth.filter(t => taskCategory(t) === 'clean').forEach(t => {
      dateRangeArr(t.startDate, t.endDate).forEach(d => { if (d.startsWith(prefix)) s.add(d); });
    });
    return s;
  }, [worksInMonth, tasksInMonth, calYear, calMonth]);

  const issueDateSet = useMemo(() => {
    const s = new Set<string>();
    const prefix = monthPrefix(calYear, calMonth + 1);
    issuesInMonth.forEach(i => { if (i.createdAt) s.add(i.createdAt.substring(0, 10)); });
    tasksInMonth.filter(t => taskCategory(t) === 'repair').forEach(t => {
      dateRangeArr(t.startDate, t.endDate).forEach(d => { if (d.startsWith(prefix)) s.add(d); });
    });
    return s;
  }, [issuesInMonth, tasksInMonth, calYear, calMonth]);

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
    setSelectedDate(null);
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const handleNext = () => {
    setSelectedDate(null);
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
  type ListItem =
    | { type: 'clean' | 'repair' | 'etc'; date: string; data: Work | Issue }
    | { type: 'task'; date: string; data: InventoryTask; cat: 'clean' | 'repair' | 'etc' };

  const filteredList = useMemo(() => {
    const items: ListItem[] = [];

    if (selCat === '전체' || selCat === '청소') {
      worksInMonth.filter(w => w.작업종류.includes('청소')).forEach(w =>
        items.push({ type: 'clean', date: w.예정일, data: w }));
    }
    if (selCat === '전체' || selCat === '수리') {
      issuesInMonth.filter(i => i.status !== '완료').forEach(i =>
        items.push({ type: 'repair', date: i.createdAt, data: i }));
    }
    if (selCat === '전체' || selCat === '기타') {
      worksInMonth.filter(w => !w.작업종류.includes('청소') && !w.작업종류.includes('수리')).forEach(w =>
        items.push({ type: 'etc', date: w.예정일, data: w }));
    }
    // 할일 시트 머지: 카테고리 필터 일치 시 추가
    tasksInMonth.forEach(t => {
      const cat = taskCategory(t);
      if (selCat !== '전체') {
        if (selCat === '청소' && cat !== 'clean') return;
        if (selCat === '수리' && cat !== 'repair') return;
        if (selCat === '기타' && cat !== 'etc') return;
      }
      items.push({ type: 'task', date: t.startDate, data: t, cat });
    });

    let list = items;
    if (selectedDate) {
      list = list.filter(it => {
        // 할일은 시작일~마감일 범위 내에 선택일 포함되면 통과 (다일 일정)
        if (it.type === 'task') {
          const t = it.data as InventoryTask;
          const s = (t.startDate || '').slice(0, 10);
          const e = (t.endDate || '').slice(0, 10) || s;
          if (!s) return false;
          return s <= selectedDate && selectedDate <= e;
        }
        return it.date && it.date.substring(0, 10) === selectedDate;
      });
    }
    if (filterStaff) {
      list = list.filter(it => {
        if (it.type === 'repair') return false;
        if (it.type === 'task') {
          return ((it.data as InventoryTask).assignedTo || '').trim() === filterStaff.trim();
        }
        return ((it.data as Work).담당자명 || '').trim() === filterStaff.trim();
      });
    }
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }, [worksInMonth, issuesInMonth, tasksInMonth, selCat, selectedDate, filterStaff]);

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
      const 담당자ID = matched?.담당자ID || '';
      return { 담당자ID, 이름: name, count, amount, 링크토큰 };
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
    { key: 'inventory', label: '인벤토리' },
  ];

  return (
    <div style={{ paddingBottom: 70, maxWidth: 430, margin: '0 auto', position: 'relative' }}>
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
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: BLUE, padding: '12px 16px', borderRadius: 12, margin: '0 0 14px 0',
            }}>
              <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 500 }}>
                {filterStaff} 일정만 보는 중
              </span>
              <button
                onClick={() => setFilterStaff(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: 'none',
                  padding: '5px 11px', borderRadius: 999,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                전체
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
              if (item.type === 'task') {
                const t = item.data as InventoryTask;
                const cat = item.cat;
                const dotColor = cat === 'clean' ? GREEN : cat === 'repair' ? RED : GRAY;
                const badgeLabel = cat === 'clean' ? '청소' : cat === 'repair' ? '수리' : '기타';
                const badgeBg = cat === 'clean' ? '#E6F7F2' : cat === 'repair' ? '#FEF0F0' : '#F5F5F5';
                const badgeColor = cat === 'clean' ? GREEN : cat === 'repair' ? RED : GRAY;
                const amount = t.amount || 0;
                const range = t.endDate && t.endDate !== t.startDate
                  ? `${(t.startDate||'').slice(5)} ~ ${(t.endDate||'').slice(5)}`
                  : (t.startDate || '').slice(5);
                return (
                  <button key={`t-${t.id}-${idx}`}
                    onClick={() => openEditModal(t)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: '#fff', padding: 12, borderRadius: 12, marginBottom: 8,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: badgeBg, color: badgeColor }}>{badgeLabel}</span>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 4 }}>
                      {t.title || `${badgeLabel} · ${t.houseName || ''}`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: GRAY }}>
                        {(t.assignedTo || '미배정')} · {range || '-'}
                      </span>
                      {amount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#191919' }}>{amount.toLocaleString()}원</span>}
                    </div>
                  </button>
                );
              }
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
                  <Link key={`w-${w.용역ID}-${idx}`} href={`/issues/work/${w.용역ID}`}
                    style={{ display: 'block', background: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: badgeBg, color: badgeColor }}>{badgeLabel}</span>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 4 }}>{w.지점명} · {w.작업종류}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: GRAY }}>{w.담당자명} · {w.예정일}</span>
                      {amount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#191919' }}>{amount.toLocaleString()}원</span>}
                    </div>
                  </Link>
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
                    {s.담당자ID ? (
                      <Link
                        href={`/management/workers/${s.담당자ID}`}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 2 }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>{s.이름}</p>
                      </Link>
                    ) : (
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 2 }}>{s.이름}</p>
                    )}
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

      {/* ========== 인벤토리 탭 ========== */}
      {mainTab === 'inventory' && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: GRAY }}>
              마감일 미정 · 총 {inventory.length}건
            </span>
            <button
              onClick={loadInventory}
              style={{
                background: 'none', border: 'none', color: BLUE,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              새로고침
            </button>
          </div>

          {inventoryLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
          ) : inventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>
              인벤토리에 할일이 없어요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inventory.map(t => (
                <div
                  key={t.id}
                  style={{
                    background: '#fff', borderRadius: 12, padding: '12px 14px',
                    border: `1px solid ${t.isUrgent ? BLUE : '#EAECEF'}`,
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: 600, color: '#191919',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {t.title || '제목 없음'}
                        {t.houseName && (
                          <span style={{ fontSize: 12, color: GRAY, fontWeight: 400, marginLeft: 6 }}>
                            ({t.houseName}{t.roomCode ? ` ${t.roomCode}` : ''})
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
                      {t.tags.slice(0, 1).map(tag => (
                        <span key={tag} style={{
                          fontSize: 10, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 999,
                          background: '#F2F4F6', color: '#4E5968',
                        }}>
                          #{tag}
                        </span>
                      ))}
                      <button
                        aria-label="메뉴"
                        onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          padding: 0, border: 'none', background: 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B95A1" aria-hidden>
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </button>
                      {openMenuId === t.id && (
                        <>
                          <div
                            onClick={() => setOpenMenuId(null)}
                            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                          />
                          <div style={{
                            position: 'absolute', top: 32, right: 0, zIndex: 41,
                            minWidth: 140, background: '#fff', borderRadius: 10,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                          }}>
                            <button
                              onClick={() => openEditModal(t)}
                              style={menuItemStyle('#191919')}
                            >
                              수정하기
                            </button>
                            <div style={{ height: 1, background: '#F2F4F6' }} />
                            <button
                              onClick={() => deleteTask(t)}
                              style={menuItemStyle(RED)}
                            >
                              삭제하기
                            </button>
                            <div style={{ height: 1, background: '#F2F4F6' }} />
                            <button
                              onClick={() => setOpenMenuId(null)}
                              style={menuItemStyle('#8B95A1')}
                            >
                              취소
                            </button>
                          </div>
                        </>
                      )}
                      <button
                        onClick={() => openScheduleModal(t)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: 'none',
                          background: BLUE, color: '#fff',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        설정
                      </button>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, color: GRAY,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.assignedTo || '담당자 미정'}
                    {t.memo ? ` · ${t.memo}` : ''}
                    {t.isUrgent && (
                      <span style={{ color: BLUE, fontWeight: 600, marginLeft: 6 }}>
                        · 긴급
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 스케줄 설정 모달 */}
      {scheduleTarget && (
        <div
          onClick={closeScheduleModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 430, background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '18px 18px 22px', boxShadow: '0 -10px 30px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{
              width: 36, height: 4, background: '#E5E8EC',
              borderRadius: 2, margin: '0 auto 14px',
            }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 4 }}>스케줄 설정</p>
            <p style={{ fontSize: 12, color: GRAY, marginBottom: 18 }}>
              {scheduleTarget.title || '제목 없음'}
              {scheduleTarget.houseName ? ` · ${scheduleTarget.houseName}` : ''}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>시작일 *</div>
                <input
                  type="date"
                  value={schedStart}
                  onChange={e => setSchedStart(e.target.value)}
                  style={{
                    width: '100%', height: 44, boxSizing: 'border-box',
                    borderRadius: 10, padding: '0 12px',
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>마감일 *</div>
                <input
                  type="date"
                  value={schedEnd}
                  onChange={e => setSchedEnd(e.target.value)}
                  style={{
                    width: '100%', height: 44, boxSizing: 'border-box',
                    borderRadius: 10, padding: '0 12px',
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>금액</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={schedAmount}
                  onChange={e => setSchedAmount(e.target.value)}
                  placeholder="미입력 시 기존 값 유지"
                  style={{
                    width: '100%', height: 44, boxSizing: 'border-box',
                    borderRadius: 10, padding: '0 12px',
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={closeScheduleModal}
                disabled={schedSaving}
                style={{
                  flex: 1, height: 46, borderRadius: 10, border: '1px solid #E5E8EB',
                  background: '#fff', color: '#4E5968',
                  fontSize: 14, fontWeight: 600, cursor: schedSaving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                취소
              </button>
              <button
                onClick={saveSchedule}
                disabled={!schedStart || !schedEnd || schedSaving}
                style={{
                  flex: 1, height: 46, borderRadius: 10, border: 'none',
                  background: (!schedStart || !schedEnd || schedSaving) ? '#D1D6DB' : BLUE,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: (!schedStart || !schedEnd || schedSaving) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {schedSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <div
          onClick={closeEditModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 430, background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '18px 18px 22px', boxShadow: '0 -10px 30px rgba(0,0,0,0.12)',
              maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{
              width: 36, height: 4, background: '#E5E8EC',
              borderRadius: 2, margin: '0 auto 14px',
            }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 4 }}>할일 수정</p>
            <p style={{ fontSize: 11, color: GRAY, marginBottom: 18 }}>ID: {editTarget.id}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '제목', value: editTitle, onChange: setEditTitle },
                { label: '하우스', value: editHouse, onChange: setEditHouse },
                { label: '방코드', value: editRoom, onChange: setEditRoom },
                { label: '담당자', value: editAssignee, onChange: setEditAssignee },
                { label: '태그 (쉼표로 구분)', value: editTags, onChange: setEditTags },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>{f.label}</div>
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    style={{
                      width: '100%', height: 44, boxSizing: 'border-box',
                      borderRadius: 10, padding: '0 12px',
                      border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                      fontSize: 14, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>시작일</div>
                <input
                  type="date"
                  value={editStart}
                  onChange={e => setEditStart(e.target.value)}
                  style={{
                    width: '100%', height: 44, boxSizing: 'border-box',
                    borderRadius: 10, padding: '0 12px',
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>마감일</div>
                <input
                  type="date"
                  value={editEnd}
                  onChange={e => setEditEnd(e.target.value)}
                  style={{
                    width: '100%', height: 44, boxSizing: 'border-box',
                    borderRadius: 10, padding: '0 12px',
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>금액 (원)</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%', height: 44, boxSizing: 'border-box',
                    borderRadius: 10, padding: '0 12px',
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#4E5968', fontWeight: 600, marginBottom: 6 }}>담당자 메모</div>
                <textarea
                  value={editMemo}
                  onChange={e => setEditMemo(e.target.value)}
                  placeholder="담당자에게 전달할 내용"
                  style={{
                    width: '100%', minHeight: 80, boxSizing: 'border-box',
                    borderRadius: 10, padding: 10,
                    border: '1px solid #E5E8EB', background: '#fff', color: '#191919',
                    fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit',
                    outline: 'none', resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setEditConfirmDel(true)}
                disabled={editSaving || editDeleting}
                style={{
                  background: 'transparent', border: 'none',
                  color: RED, fontSize: 14, fontWeight: 600,
                  padding: '0 4px', cursor: (editSaving || editDeleting) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                삭제
              </button>
              <div style={{ flex: 1 }} />
              <button
                onClick={closeEditModal}
                disabled={editSaving || editDeleting}
                style={{
                  height: 46, padding: '0 22px', borderRadius: 10, border: '1px solid #E5E8EB',
                  background: '#fff', color: '#4E5968',
                  fontSize: 14, fontWeight: 600, cursor: (editSaving || editDeleting) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving || editDeleting}
                style={{
                  height: 46, padding: '0 26px', borderRadius: 10, border: 'none',
                  background: (editSaving || editDeleting) ? '#D1D6DB' : BLUE,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: (editSaving || editDeleting) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {editSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 - 삭제 확인 다이얼로그 */}
      {editConfirmDel && editTarget && (
        <div
          onClick={() => { if (!editDeleting) setEditConfirmDel(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 80,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 320, background: '#fff',
              borderRadius: 14, padding: '20px 18px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 8 }}>
              정말 삭제할까요?
            </p>
            <p style={{ fontSize: 13, color: '#4E5968', marginBottom: 18, lineHeight: 1.5 }}>
              {editTarget.title || '제목 없음'}을 삭제합니다. 복구할 수 없어요.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setEditConfirmDel(false)}
                disabled={editDeleting}
                style={{
                  flex: 1, height: 44, borderRadius: 10, border: '1px solid #E5E8EB',
                  background: '#fff', color: '#4E5968',
                  fontSize: 14, fontWeight: 600,
                  cursor: editDeleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}
              >
                취소
              </button>
              <button
                onClick={confirmDeleteEdit}
                disabled={editDeleting}
                style={{
                  flex: 1, height: 44, borderRadius: 10, border: 'none',
                  background: editDeleting ? '#D1D6DB' : RED,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: editDeleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {editDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 등록 버튼 */}
      <Link
        href="/issues/register"
        aria-label="할일 등록"
        style={{
          position: 'fixed', right: 20, bottom: 76, zIndex: 30,
          width: 56, height: 56, borderRadius: 28,
          background: BLUE, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(49,130,246,0.32)',
          textDecoration: 'none',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
          <line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
