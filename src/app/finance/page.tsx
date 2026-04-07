'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { useSheets } from '@/hooks/useSheets'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import Link from 'next/link'

function fmt(n: number) { return n.toLocaleString('ko-KR') }

// 입주자 row: [0]ID [1]방ID [2]지점명 [3]방코드 [4]이름 [5]연락처 [6]월세 [7]관리비 [8]보증금 [9]입주일 [10]퇴실일 [11]상태
// 공과금 row: [0]ID [1]지점ID [2]지점명 [3]연도 [4]월 [5]전기 [6]가스 [7]수도 [8]인터넷 [9]정수기 [10]관리비 [11]청소 [12]수리기타 [13]메모

export default function FinancePage() {
  const { data: tenants, loading: tLoading } = useSheets('입주자')
  const { data: costs, loading: cLoading } = useSheets('공과금')
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  now.setMonth(now.getMonth() + monthOffset)
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const activeTenants = tenants.filter(r => r[11] === '입주중')

  // Group income by house
  const incomeByHouse = useMemo(() => {
    const map: Record<string, number> = {}
    activeTenants.forEach(r => {
      const house = r[2] || '미지정'
      map[house] = (map[house] || 0) + (Number(r[6]) || 0)
    })
    return map
  }, [activeTenants])

  // Group costs by house for selected month
  const costByHouse = useMemo(() => {
    const map: Record<string, number> = {}
    costs.filter(r => Number(r[3]) === year && Number(r[4]) === month).forEach(r => {
      const house = r[2] || '미지정'
      const total = [5,6,7,8,9,10,11,12].reduce((s, i) => s + (Number(r[i]) || 0), 0)
      map[house] = (map[house] || 0) + total
    })
    return map
  }, [costs, year, month])

  const allHouses = [...new Set([...Object.keys(incomeByHouse), ...Object.keys(costByHouse)])].sort()
  const totalIncome = Object.values(incomeByHouse).reduce((s, v) => s + v, 0)
  const totalExpense = Object.values(costByHouse).reduce((s, v) => s + v, 0)

  const loading = tLoading || cLoading

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="정산" />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Utility Button */}
        <Link href="/utility" className="flex items-center gap-3 px-4 py-3 mt-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--amber-light)] flex items-center justify-center">
            <Receipt size={18} color="var(--amber)" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">공과금 관리</p>
            <p className="text-[11px] text-[var(--sub)]">지점별 월별 공과금 입력 및 조회</p>
          </div>
          <ChevronRight size={16} color="var(--sub)" />
        </Link>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-5 py-5">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronLeft size={18} color="var(--text)" />
          </button>
          <span className="text-[16px] font-bold">{year}년 {month}월</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronRight size={18} color="var(--text)" />
          </button>
        </div>

        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : (
          <>
            {/* Income / Expense */}
            <div className="grid grid-cols-2 gap-2.5">
              <Card className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={16} color="var(--blue)" />
                  <span className="text-[12px] text-[var(--sub)]">총 수입</span>
                </div>
                <p className="text-[18px] font-bold text-[var(--blue)]">{fmt(totalIncome)}원</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown size={16} color="var(--red)" />
                  <span className="text-[12px] text-[var(--sub)]">총 지출</span>
                </div>
                <p className="text-[18px] font-bold text-[var(--red)]">{fmt(totalExpense)}원</p>
              </Card>
            </div>

            {/* Net Profit */}
            <div className="rounded-2xl bg-[#3182F6] p-4 mt-4 flex items-center justify-between">
              <span className="text-[14px] text-white/80">순이익</span>
              <span className="text-[20px] font-bold text-white">{fmt(totalIncome - totalExpense)}원</span>
            </div>

            {/* Per-House */}
            <div className="mt-6">
              <h2 className="text-[16px] font-bold mb-3">지점별 정산</h2>
              {allHouses.length === 0 ? (
                <p className="text-[13px] text-[var(--sub)] py-4 text-center">데이터가 없습니다</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {allHouses.map(house => {
                    const income = incomeByHouse[house] || 0
                    const expense = costByHouse[house] || 0
                    return (
                      <Card key={house} className="px-4 py-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] font-semibold">{house}</span>
                          <span className="text-[16px] font-bold text-[var(--blue)]">+{fmt(income - expense)}원</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-[12px] text-[var(--sub)]">수입 <span className="text-[var(--text)] font-medium">{fmt(income)}원</span></span>
                          <span className="text-[12px] text-[var(--sub)]">지출 <span className="text-[var(--text)] font-medium">{fmt(expense)}원</span></span>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
