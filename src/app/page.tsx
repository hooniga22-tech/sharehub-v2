'use client'

import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { BottomTab } from '@/components/ui/BottomTab'
import { useSheets } from '@/hooks/useSheets'
import { TrendingUp, Users, DoorOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const statusChip: Record<string, 'red' | 'amber' | 'blue' | 'green'> = {
  '접수': 'red', '진행중': 'amber', '완료': 'green',
}

function getToday() {
  const d = new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일 ${weekdays[d.getDay()]}요일`
}

export default function DashboardPage() {
  const { data: tenants, loading: tLoading } = useSheets('입주자')
  const { data: issues, loading: iLoading } = useSheets('이슈')

  // 입주자: [0]ID [1]방ID [2]지점명 [3]방코드 [4]이름 [5]연락처 [6]월세 [7]관리비 [8]보증금 [9]입주일 [10]퇴실일 [11]상태
  const activeTenants = tenants.filter(r => r[11] === '입주중')
  const totalRent = activeTenants.reduce((s, r) => s + (Number(r[6]) || 0), 0)
  const moveOuts = tenants.filter(r => r[11] === '퇴실예정')

  // 이슈: [0]ID [1]지점명 [2]방코드 [3]제목 [4]내용 [5]카테고리 [6]상태 [7]담당자 [8]등록일 [9]완료일 [10]비용 [11]메모
  const openIssues = issues.filter(r => r[6] !== '완료')

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-5 pt-14 pb-2">
          <p className="text-[13px] text-[var(--sub)]">{getToday()}</p>
          <h1 className="text-[22px] font-bold mt-1">쉐어하우스 관리</h1>
        </div>

        {/* Main Card */}
        <div className="px-5 mt-4">
          <div className="rounded-2xl bg-[#3182F6] p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} color="#fff" />
              <span className="text-[13px] text-white/80">이번달 총 월세</span>
            </div>
            <p className="text-[28px] font-bold text-white">
              {tLoading ? '...' : `₩${totalRent.toLocaleString()}`}
            </p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <Users size={14} color="#fff" />
                <span className="text-[12px] text-white/80">입주자 <span className="font-semibold text-white">{activeTenants.length}명</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <DoorOpen size={14} color="#fff" />
                <span className="text-[12px] text-white/80">퇴실예정 <span className="font-semibold text-white">{moveOuts.length}명</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} color="#fff" />
                <span className="text-[12px] text-white/80">미처리 <span className="font-semibold text-white">{openIssues.length}건</span></span>
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
          {iLoading ? (
            <p className="text-[13px] text-[var(--sub)] py-4 text-center">불러오는 중...</p>
          ) : openIssues.length === 0 ? (
            <p className="text-[13px] text-[var(--sub)] py-4 text-center">미처리 이슈가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {openIssues.slice(0, 5).map((r, i) => (
                <Card key={i} className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold">{r[3]}</p>
                    <p className="text-[12px] text-[var(--sub)] mt-0.5">{r[1]} {r[2]} · {r[8]}</p>
                  </div>
                  <Chip label={r[6]} variant={statusChip[r[6]] || 'gray'} />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Move-out Section */}
        {moveOuts.length > 0 && (
          <div className="px-5 mt-8 mb-6">
            <h2 className="text-[16px] font-bold mb-3">퇴실 예정</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {moveOuts.map((r, i) => (
                <Card key={i} className="p-4">
                  <div className="w-9 h-9 rounded-full bg-[var(--blue-light)] flex items-center justify-center mb-2.5">
                    <span className="text-[13px] font-bold text-[var(--blue)]">{r[4]?.[0]}</span>
                  </div>
                  <p className="text-[14px] font-semibold">{r[4]}</p>
                  <p className="text-[12px] text-[var(--sub)] mt-0.5">{r[2]} {r[3]}</p>
                  <p className="text-[12px] text-[var(--red)] font-medium mt-1.5">{r[10]} 퇴실</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
