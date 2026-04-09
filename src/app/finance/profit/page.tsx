'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SummaryData {
  year: number; month: number;
  totals: {
    totalIncome: number; totalRent: number; totalMgmt: number;
    buildingRent: number; utilityExpense: number; opexExpense: number;
    totalExpense: number; profit: number; tenantCount: number;
  }
}

const toMan = (n: number) => Math.round(n / 10000).toLocaleString() + '만'

export default function ProfitPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = target.getFullYear()
  const month = target.getMonth() + 1

  useEffect(() => {
    setLoading(true)
    fetch(`/api/finance/summary?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [year, month])

  const t = data?.totals

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="매출 · 순이익" />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Month Selector */}
        <div className="flex items-center justify-center gap-5 py-4">
          <button onClick={() => setMonthOffset(monthOffset - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[16px] font-bold">{year}년 {month}월</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[13px] text-[var(--sub)]">불러오는 중...</div>
        ) : !t ? (
          <div className="py-8 text-center text-[13px] text-[var(--sub)]">데이터를 불러올 수 없습니다</div>
        ) : (
          <>
            {/* Profit Card */}
            <div className="rounded-2xl bg-[#3182F6] p-5 mb-4">
              <p className="text-[13px] text-white/70">순이익</p>
              <p className="text-[30px] font-bold text-white mt-1">{toMan(t.profit)}원</p>
              <p className="text-[12px] text-white/60 mt-2">입주자 {t.tenantCount}명</p>
            </div>

            {/* Income */}
            <div className="rounded-2xl bg-[var(--card)] p-4 mb-3">
              <p className="text-[13px] font-bold mb-3">수입</p>
              <div className="flex justify-between text-[14px] py-1.5"><span className="text-[var(--sub)]">월세</span><span className="font-bold text-[var(--blue)]">+{toMan(t.totalRent)}원</span></div>
              <div className="flex justify-between text-[14px] py-1.5"><span className="text-[var(--sub)]">관리비</span><span className="font-bold text-[var(--blue)]">+{toMan(t.totalMgmt)}원</span></div>
              <div className="border-t border-[var(--border)] mt-2 pt-2 flex justify-between text-[15px]">
                <span className="font-bold">총 수입</span>
                <span className="font-bold text-[var(--blue)]">+{toMan(t.totalIncome)}원</span>
              </div>
            </div>

            {/* Expense */}
            <div className="rounded-2xl bg-[var(--card)] p-4 mb-3">
              <p className="text-[13px] font-bold mb-3">지출</p>
              <div className="flex justify-between text-[14px] py-1.5"><span className="text-[var(--sub)]">집월세</span><span className="font-bold text-[var(--red)]">-{toMan(t.buildingRent)}원</span></div>
              <div className="flex justify-between text-[14px] py-1.5"><span className="text-[var(--sub)]">공과금</span><span className="font-bold text-[var(--red)]">-{toMan(t.utilityExpense)}원</span></div>
              <div className="flex justify-between text-[14px] py-1.5"><span className="text-[var(--sub)]">기타지출</span><span className="font-bold text-[var(--red)]">-{toMan(t.opexExpense || 0)}원</span></div>
              <div className="border-t border-[var(--border)] mt-2 pt-2 flex justify-between text-[15px]">
                <span className="font-bold">총 지출</span>
                <span className="font-bold text-[var(--red)]">-{toMan(t.totalExpense)}원</span>
              </div>
            </div>

            {/* Summary */}
            <div className={`rounded-2xl p-4 ${t.profit >= 0 ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'}`}>
              <div className="flex justify-between text-[16px]">
                <span className="font-bold">순이익</span>
                <span className={`font-bold ${t.profit >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                  {t.profit >= 0 ? '+' : ''}{toMan(t.profit)}원
                </span>
              </div>
            </div>

            {/* Monthly Trend placeholder */}
            <div className="mt-6">
              <p className="text-[14px] font-bold mb-3">월별 현황</p>
              <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
                <p className="text-[13px] text-[var(--sub)]">준비중입니다</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
