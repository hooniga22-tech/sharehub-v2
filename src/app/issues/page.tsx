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

const GRAY = '#888888', RED = '#F04452';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('전체 유형');

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

  const filtered = useMemo(() => {
    let list = [...issues];
    if (statusFilter === 'urgent') list = list.filter(i => i.status !== '완료' && elapsed(i.createdAt) >= 3);
    else if (statusFilter === 'inprogress') list = list.filter(i => i.status === '처리중');
    else if (statusFilter === 'done') list = list.filter(i => i.status === '완료');
    else list = list.filter(i => i.status !== '완료');
    if (typeFilter !== '전체 유형') list = list.filter(i => i.category === typeFilter);
    return list;
  }, [issues, statusFilter, typeFilter]);

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

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>이슈가 없어요</div>
        ) : (
          filtered.map((issue) => {
            const days = elapsed(issue.createdAt);
            const isUrgent = days >= 3 && issue.status !== '완료';
            return (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                style={{
                  display: 'block', background: '#fff', padding: 16, borderRadius: 16, textDecoration: 'none', color: 'inherit',
                  borderLeft: isUrgent ? `3px solid ${RED}` : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{issue.title}</p>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    {isUrgent && <Chip type="urgent" />}
                    <Chip type={issue.status} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Chip type={issue.category} />
                  <span style={{ fontSize: 12, color: GRAY }}>{issue.houseName} {issue.roomCode}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#BBBBBB' }}>{issue.createdAt} 접수</span>
                  {days > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: days >= 3 ? RED : days >= 1 ? '#D97706' : GRAY }}>
                      {days}일 경과
                    </span>
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
