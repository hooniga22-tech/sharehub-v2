'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { issues } from '@/lib/mockData';
import Chip from '@/components/ui/Chip';

type StatusFilter = 'all' | 'urgent' | 'inprogress' | 'done';
type TypeFilter = '전체 유형' | '수리' | '청소' | '민원' | '교체' | '기타';

const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
  { key: 'all', label: '전체', count: issues.filter((i) => i.status !== 'done').length },
  { key: 'urgent', label: '긴급', count: issues.filter((i) => i.urgent && i.status !== 'done').length },
  { key: 'inprogress', label: '처리중', count: issues.filter((i) => i.status === 'inprogress').length },
  { key: 'done', label: '이번달 완료', count: issues.filter((i) => i.status === 'done').length },
];

const typeFilters: TypeFilter[] = ['전체 유형', '수리', '청소', '민원', '교체', '기타'];

export default function IssuesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('전체 유형');

  const filtered = useMemo(() => {
    let list = [...issues];
    if (statusFilter === 'urgent') list = list.filter((i) => i.urgent && i.status !== 'done');
    else if (statusFilter === 'inprogress') list = list.filter((i) => i.status === 'inprogress');
    else if (statusFilter === 'done') list = list.filter((i) => i.status === 'done');
    else list = list.filter((i) => i.status !== 'done');
    if (typeFilter !== '전체 유형') list = list.filter((i) => i.type === typeFilter);
    return list;
  }, [statusFilter, typeFilter]);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 상단 고정 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', padding: '20px 16px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>이슈 · 수리</h1>
          <Link href="/issues/new" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 99, background: '#3182F6', fontSize: 13, fontWeight: 600, color: '#fff' }}>
            <Plus size={14} /> 이슈 등록
          </Link>
        </div>

        {/* 상태 필터 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {statusFilters.map((sf) => (
            <button
              key={sf.key}
              style={{
                padding: 10, borderRadius: 12, textAlign: 'center', background: '#F7F8FA',
                border: statusFilter === sf.key ? (sf.key === 'urgent' ? '2px solid #F04452' : '2px solid #191919') : '2px solid transparent',
              }}
              onClick={() => setStatusFilter(sf.key)}
            >
              <p style={{ fontSize: 18, fontWeight: 700, color: sf.key === 'urgent' ? '#F04452' : '#191919' }}>{sf.count}</p>
              <p style={{ fontSize: 11, color: '#888888' }}>{sf.label}</p>
            </button>
          ))}
        </div>

        {/* 유형 필터 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {typeFilters.map((tf) => (
            <button
              key={tf}
              style={{
                padding: '6px 12px', borderRadius: 99, flexShrink: 0,
                fontSize: 12, fontWeight: typeFilter === tf ? 600 : 400,
                background: typeFilter === tf ? '#191919' : '#F5F5F5',
                color: typeFilter === tf ? '#fff' : '#888888',
              }}
              onClick={() => setTypeFilter(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 이슈 목록 */}
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((issue) => (
          <Link
            key={issue.id}
            href={`/issues/${issue.id}`}
            style={{
              display: 'block', background: '#fff', padding: 16, borderRadius: 16,
              borderLeft: issue.urgent ? '3px solid #F04452' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{issue.title}</p>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                {issue.urgent && <Chip type="urgent" />}
                <Chip type={issue.status} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Chip type={issue.type} />
              <span style={{ fontSize: 12, color: '#888888' }}>{issue.place}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#BBBBBB' }}>{issue.date} 접수</span>
              {issue.elapsed > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: issue.elapsed >= 3 ? '#F04452' : issue.elapsed >= 1 ? '#D97706' : '#888888' }}>
                  {issue.elapsed}일 경과
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
