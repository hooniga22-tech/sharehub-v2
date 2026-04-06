'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { CheckCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const statuses = ['전체', '접수', '진행중', '완료', '보류']

type IssueStatus = '접수' | '진행중' | '완료' | '보류'
type Urgency = '긴급' | '보통' | '낮음'

interface IssueItem {
  id: string; title: string; desc: string; house: string; room: string;
  category: string; urgency: Urgency; status: IssueStatus;
  date: string; assignee: string; cost: number;
}

const initialIssues: IssueItem[] = [
  { id: '1', title: '302호 보일러 고장', desc: '온수가 나오지 않음. 입주자 긴급 요청', house: '역삼하우스', room: '302호', category: '수리', urgency: '긴급', status: '접수', date: '2024-04-05', assignee: '김기사', cost: 150000 },
  { id: '2', title: '공용 화장실 수도 누수', desc: '2층 공용화장실 세면대 아래 누수 발생', house: '강남하우스', room: '공용', category: '수리', urgency: '보통', status: '진행중', date: '2024-04-04', assignee: '박배관', cost: 80000 },
  { id: '3', title: '201호 도어락 배터리', desc: '배터리 소진. 교체 필요', house: '서초하우스', room: '201호', category: '교체', urgency: '보통', status: '접수', date: '2024-04-03', assignee: '', cost: 15000 },
  { id: '4', title: '3층 복도 청소 요청', desc: '이사 후 복도 오염', house: '역삼하우스', room: '공용', category: '청소', urgency: '낮음', status: '완료', date: '2024-04-01', assignee: '이청소', cost: 50000 },
  { id: '5', title: '105호 소음 민원', desc: '야간 소음 반복 발생. 입주자간 갈등', house: '강남하우스', room: '105호', category: '민원', urgency: '긴급', status: '보류', date: '2024-03-30', assignee: '', cost: 0 },
]

const statusVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  '접수': 'red', '진행중': 'amber', '완료': 'green', '보류': 'gray',
}
const categoryVariant: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  '수리': 'blue', '청소': 'green', '민원': 'amber', '교체': 'blue', '기타': 'gray',
}
const urgencyVariant: Record<string, 'red' | 'amber' | 'gray'> = {
  '긴급': 'red', '보통': 'amber', '낮음': 'gray',
}

export default function IssuesPage() {
  const [filter, setFilter] = useState('전체')
  const [issues, setIssues] = useState(initialIssues)

  const filtered = filter === '전체' ? issues : issues.filter(i => i.status === filter)
  const openCount = issues.filter(i => i.status !== '완료').length

  function quickResolve(id: string) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: '완료' as const } : i))
  }
  function reopen(id: string) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: '접수' as const } : i))
  }

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

      {/* Open count banner */}
      {openCount > 0 && (
        <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-[var(--red-light)] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--red)]">미해결 이슈 {openCount}건</span>
        </div>
      )}

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
        <div className="flex flex-col gap-2.5 mt-1">
          {filtered.map(issue => (
            <Card key={issue.id} className="px-4 py-3.5">
              {/* Chips row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <Chip label={issue.urgency} variant={urgencyVariant[issue.urgency]} />
                <Chip label={issue.status} variant={statusVariant[issue.status]} />
                <Chip label={issue.category} variant={categoryVariant[issue.category]} />
              </div>

              {/* Title + Description */}
              <p className="text-[14px] font-semibold mt-1">{issue.title}</p>
              {issue.desc && <p className="text-[12px] text-[var(--sub)] mt-0.5 line-clamp-2">{issue.desc}</p>}

              {/* Meta */}
              <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--sub)] flex-wrap">
                <span>{issue.house} {issue.room}</span>
                {issue.assignee && <span>· {issue.assignee}</span>}
                {issue.cost > 0 && <span>· {issue.cost.toLocaleString()}원</span>}
                <span>· {issue.date}</span>
              </div>

              {/* Quick Actions — v1 스타일 빠른 해결/재오픈 */}
              <div className="flex gap-2 mt-2.5">
                {issue.status !== '완료' ? (
                  <button
                    onClick={() => quickResolve(issue.id)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[var(--green-light)] text-[var(--green)] flex items-center gap-1"
                  >
                    <CheckCircle size={12} /> 해결완료
                  </button>
                ) : (
                  <button
                    onClick={() => reopen(issue.id)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#F2F2F2] text-[var(--sub)] flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> 재오픈
                  </button>
                )}
              </div>
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
