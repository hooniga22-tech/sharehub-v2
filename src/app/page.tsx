'use client'

import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { BottomTab } from '@/components/ui/BottomTab'
import { TrendingUp, Users, DoorOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const issues = [
  { id: '1', title: '302호 보일러 고장', house: '역삼하우스', status: '접수' as const, date: '2024-04-05' },
  { id: '2', title: '공용 화장실 수도 누수', house: '강남하우스', status: '진행중' as const, date: '2024-04-04' },
  { id: '3', title: '201호 도어락 배터리', house: '서초하우스', status: '접수' as const, date: '2024-04-03' },
]

const moveOuts = [
  { name: '김민수', house: '역삼하우스', room: '302호', date: '2024-04-15' },
  { name: '이지현', house: '강남하우스', room: '105호', date: '2024-04-22' },
]

const statusChip: Record<string, 'red' | 'amber' | 'blue' | 'green'> = {
  '접수': 'red',
  '진행중': 'amber',
  '완료': 'green',
}

function getToday() {
  const d = new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[d.getDay()]
  return `${month}월 ${day}일 ${weekday}요일`
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="px-5 pt-14 pb-2">
          <p className="text-[13px] text-[var(--sub)]">{getToday()}</p>
          <h1 className="text-[22px] font-bold mt-1">쉐어하우스 관리</h1>
        </div>

        {/* Main Revenue Card */}
        <div className="px-5 mt-4">
          <div className="rounded-2xl bg-[#3182F6] p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} color="#fff" />
              <span className="text-[13px] text-white/80">이번달 순이익</span>
            </div>
            <p className="text-[28px] font-bold text-white">&#8361;32,400,000</p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <Users size={14} color="#fff" />
                <span className="text-[12px] text-white/80">입주자 <span className="font-semibold text-white">198명</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <DoorOpen size={14} color="#fff" />
                <span className="text-[12px] text-white/80">공실 <span className="font-semibold text-white">28개</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} color="#fff" />
                <span className="text-[12px] text-white/80">미처리 <span className="font-semibold text-white">7건</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Section */}
        <div className="px-5 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold">지금 확인이 필요해요</h2>
            <Link href="/issues" className="text-[13px] text-[var(--blue)] flex items-center gap-0.5">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {issues.map((issue) => (
              <Card key={issue.id} className="px-4 py-3.5 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[14px] font-semibold">{issue.title}</p>
                  <p className="text-[12px] text-[var(--sub)] mt-0.5">{issue.house} · {issue.date}</p>
                </div>
                <Chip label={issue.status} variant={statusChip[issue.status]} />
              </Card>
            ))}
          </div>
        </div>

        {/* Move-out Section */}
        <div className="px-5 mt-8 mb-6">
          <h2 className="text-[16px] font-bold mb-3">이번달 퇴실</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {moveOuts.map((t, i) => (
              <Card key={i} className="p-4">
                <div className="w-9 h-9 rounded-full bg-[var(--blue-light)] flex items-center justify-center mb-2.5">
                  <span className="text-[13px] font-bold text-[var(--blue)]">{t.name[0]}</span>
                </div>
                <p className="text-[14px] font-semibold">{t.name}</p>
                <p className="text-[12px] text-[var(--sub)] mt-0.5">{t.house} {t.room}</p>
                <p className="text-[12px] text-[var(--red)] font-medium mt-1.5">{t.date} 퇴실</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tab */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
