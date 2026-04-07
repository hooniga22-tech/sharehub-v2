'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, AlertTriangle, Users, Loader2 } from 'lucide-react'

interface MonthData {
  year: number; month: number; income: number; buildingRent: number;
  utility: number; totalExpense: number; profit: number; investorProfit: number; hasUtility: boolean;
}
interface PageData {
  investor: { name: string; houseName: string; ratio: number; phone: string }
  house: { name: string; district: string; buildingRent: number; isConsignment: boolean }
  currentMonth: MonthData
  monthlyData: MonthData[]
  tenantSummary: { activeTenants: number; exitSoon: number }
  year: number; month: number
}

const toMan = (n: number) => Math.round(n / 10000).toLocaleString() + '만'
function fmtProfit(n: number) {
  if (n >= 0) return `+${toMan(n)}`
  return `(${toMan(Math.abs(n))})`
}

export default function InvestorPortalPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth() + 1

  useEffect(() => {
    setLoading(true)
    fetch(`/api/investor-portal/${token}?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); return }
        setData(d)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token, year, month])

  if (loading && !data) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  )

  if (notFound || !data) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-8 text-center">
      <p className="text-[16px] font-bold text-gray-600">유효하지 않은 링크입니다.</p>
      <p className="text-[13px] text-gray-400 mt-1">운영자에게 문의해주세요.</p>
    </div>
  )

  const { investor, house, currentMonth: cm, monthlyData, tenantSummary } = data

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[13px] text-gray-400 font-medium">ShareHub 투자 현황</p>
          <h1 className="text-[22px] font-bold mt-1">{investor.name}님</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[12px] font-medium">{investor.houseName}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[12px] font-medium">투자비율 {investor.ratio}%</span>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-5 py-3 mb-4">
          <button onClick={() => setMonthOffset(monthOffset - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-[16px] font-bold">{year}년 {month}월</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200">
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Section 1: Profit Summary */}
        <section className="rounded-2xl bg-[#3182F6] p-5 mb-4">
          <p className="text-[13px] text-white/70">이번달 투자 수익</p>
          <p className="text-[30px] font-bold text-white mt-1">{toMan(cm.investorProfit)}원</p>
          <p className="text-[12px] text-white/60 mt-1">
            순이익 {toMan(cm.profit)} × 투자비율 {investor.ratio}%
          </p>
          {!cm.hasUtility && (
            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-white/15">
              <AlertTriangle size={12} className="text-amber-300" />
              <span className="text-[11px] text-amber-200">공과금 미입력 (참고용)</span>
            </div>
          )}
        </section>

        {/* Section 2: Detail Breakdown */}
        <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold mb-4">이번달 수입/지출 내역</h2>
          <div className="flex flex-col gap-2.5">
            <Row label="총 수입 (월세+관리비)" value={`+${toMan(cm.income)}`} color="text-blue-600" />
            <Row label="집월세"
              value={house.isConsignment ? '위탁운영 (해당없음)' : `-${toMan(cm.buildingRent)}`}
              color={house.isConsignment ? 'text-gray-400' : 'text-red-500'} />
            <Row label="공과금"
              value={cm.hasUtility ? `-${toMan(cm.utility)}` : '-'}
              color={cm.hasUtility ? 'text-red-500' : 'text-gray-400'} />
            <div className="border-t border-gray-100 pt-2.5">
              <Row label="순이익" value={`${toMan(cm.profit)}원`} color="text-gray-900" bold />
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-[13px] font-semibold text-blue-600">투자자 수익 ({investor.ratio}%)</span>
              <span className="text-[17px] font-bold text-blue-600">{toMan(cm.investorProfit)}원</span>
            </div>
          </div>
        </section>

        {/* Section 3: Tenant Summary */}
        <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold mb-3">입주 현황</h2>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-1.5">
                <Users size={18} className="text-green-600" />
              </div>
              <p className="text-[11px] text-gray-400">입주중</p>
              <p className="text-[20px] font-bold text-green-600">{tenantSummary.activeTenants}명</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-1.5">
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <p className="text-[11px] text-gray-400">만료 임박</p>
              <p className="text-[20px] font-bold text-amber-500">{tenantSummary.exitSoon}명</p>
            </div>
          </div>
        </section>

        {/* Section 4: Monthly Trend */}
        <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold mb-3">월별 투자 수익 추이</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">월</th>
                  <th className="text-right py-2 font-medium">수입</th>
                  <th className="text-right py-2 font-medium">지출</th>
                  <th className="text-right py-2 font-medium">순이익</th>
                  <th className="text-right py-2 font-medium">투자수익</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m, i) => {
                  const isCurrent = m.year === year && m.month === month
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${isCurrent ? 'bg-blue-50' : ''}`}>
                      <td className={`py-2.5 ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                        {m.month}월
                      </td>
                      <td className="text-right py-2.5 text-gray-700">{toMan(m.income)}</td>
                      <td className="text-right py-2.5 text-gray-700">
                        {m.hasUtility ? toMan(m.totalExpense) : <span className="text-gray-400">미입력</span>}
                      </td>
                      <td className="text-right py-2.5 font-medium">
                        {m.hasUtility ? (
                          <span className={m.profit >= 0 ? 'text-blue-600' : 'text-red-500'}>{toMan(m.profit)}</span>
                        ) : <span className="text-gray-400">미입력</span>}
                      </td>
                      <td className="text-right py-2.5 font-bold">
                        {m.hasUtility ? (
                          <span className={m.investorProfit >= 0 ? 'text-blue-600' : 'text-red-500'}>{toMan(m.investorProfit)}</span>
                        ) : <span className="text-gray-400">미입력</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Notice */}
        <section className="bg-gray-100 rounded-2xl p-5 mb-6">
          <div className="flex flex-col gap-1.5 text-[12px] text-gray-500">
            <p>• 본 자료는 매월 운영 현황을 기준으로 자동 집계됩니다.</p>
            <p>• 공과금 입력 전에는 순이익이 과대 계상될 수 있습니다.</p>
            <p>• 문의사항은 운영자에게 연락해 주세요.</p>
          </div>
        </section>

        <footer className="text-center py-4">
          <p className="text-[11px] text-gray-400">© 2026 ShareHub</p>
        </footer>
      </div>
    </div>
  )
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className={`text-[14px] ${bold ? 'font-bold' : 'font-medium'} ${color}`}>{value}</span>
    </div>
  )
}
