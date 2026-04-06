'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import Link from 'next/link'

const statuses = ['전체', '접수', '진행중', '완료', '보류']

const issues = [
  { id: '1', title: '302호 보일러 고장', house: '역삼하우스', room: '302호', category: '수리', status: '접수' as const, date: '2024-04-05', assignee: '김기사' },
  { id: '2', title: '공용 화장실 수도 누수', house: '강남하우스', room: '공용', category: '수리', status: '진행중' as const, date: '2024-04-04', assignee: '박배관' },
  { id: '3', title: '201호 도어락 배터리', house: '서초하우스', room: '201호', category: '수리', status: '접수' as const, date: '2024-04-03', assignee: '' },
  { id: '4', title: '3층 복도 청소 요청', house: '역삼하우스', room: '공용', category: '청소', status: '완료' as const, date: '2024-04-01', assignee: '이청소' },
  { id: '5', title: '105호 소음 민원', house: '강남하우스', room: '105호', category: '민원', status: '보류' as const, date: '2024-03-30', assignee: '' },
]

const statusVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  '접수': 'red',
  '진행중': 'amber',
  '완료': 'green',
  '보류': 'gray',
}

const categoryVariant: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  '수리': 'blue',
  '청소': 'green',
  '민원': 'amber',
  '기타': 'gray',
}

export default function IssuesPage() {
  const [filter, setFilter] = useState('전체')

  const filtered = filter === '전체' ? issues : issues.filter(i => i.status === filter)

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="이슈"
        right={
          <Link href="/issues/new" className="text-[14px] font-semibold text-[var(--blue)]">
            등록
          </Link>
        }
      />

      {/* Filter Chips */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              filter === s
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Issue List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <div className="flex flex-col gap-2.5 mt-2">
          {filtered.map(issue => (
            <Card key={issue.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip label={issue.category} variant={categoryVariant[issue.category]} />
                    <Chip label={issue.status} variant={statusVariant[issue.status]} />
                  </div>
                  <p className="text-[14px] font-semibold mt-2">{issue.title}</p>
                  <p className="text-[12px] text-[var(--sub)] mt-1">
                    {issue.house} {issue.room} · {issue.date}
                  </p>
                </div>
              </div>
              {issue.assignee && (
                <div className="mt-2.5 pt-2.5 border-t border-[var(--border)]">
                  <p className="text-[12px] text-[var(--sub)]">담당: <span className="text-[var(--text)] font-medium">{issue.assignee}</span></p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
