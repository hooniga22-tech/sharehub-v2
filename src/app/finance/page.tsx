'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

const houseData = [
  { name: '역삼하우스', income: 18500000, expense: 6200000 },
  { name: '강남하우스', income: 22000000, expense: 7800000 },
  { name: '서초하우스', income: 15800000, expense: 5400000 },
  { name: '신촌하우스', income: 12600000, expense: 4500000 },
  { name: '홍대하우스', income: 9800000, expense: 3700000 },
]

const totalIncome = houseData.reduce((s, h) => s + h.income, 0)
const totalExpense = houseData.reduce((s, h) => s + h.expense, 0)

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export default function FinancePage() {
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  now.setMonth(now.getMonth() + monthOffset)
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="정산" />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
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

        {/* Income / Expense Summary */}
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

        {/* Net Profit Banner */}
        <div className="rounded-2xl bg-[#3182F6] p-4 mt-4 flex items-center justify-between">
          <span className="text-[14px] text-white/80">순이익</span>
          <span className="text-[20px] font-bold text-white">{fmt(totalIncome - totalExpense)}원</span>
        </div>

        {/* Per-House Breakdown */}
        <div className="mt-6">
          <h2 className="text-[16px] font-bold mb-3">지점별 정산</h2>
          <div className="flex flex-col gap-2.5">
            {houseData.map((h) => {
              const profit = h.income - h.expense
              return (
                <Card key={h.name} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-semibold">{h.name}</span>
                    <span className="text-[16px] font-bold text-[var(--blue)]">+{fmt(profit)}원</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[12px] text-[var(--sub)]">수입 <span className="text-[var(--text)] font-medium">{fmt(h.income)}원</span></span>
                    <span className="text-[12px] text-[var(--sub)]">지출 <span className="text-[var(--text)] font-medium">{fmt(h.expense)}원</span></span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
