'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { BottomTab } from '@/components/ui/BottomTab'
import { ChevronLeft, ChevronRight, ChevronDown, Receipt, AlertTriangle, Wrench, TrendingUp, Wallet, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface HouseResult {
  houseId: string; houseName: string; district: string;
  isConsignment: boolean; tenantCount: number;
  rent: number; managementFee: number; totalIncome: number;
  buildingRent: number; utilityExpense: number; totalExpense: number;
  profit: number; hasUtility: boolean;
}
interface Totals {
  tenantCount: number; totalIncome: number; totalRent: number; totalMgmt: number;
  buildingRent: number; utilityExpense: number; totalExpense: number; profit: number;
}
interface SummaryData { year: number; month: number; results: HouseResult[]; totals: Totals }

function toMan(n: number) {
  const m = Math.round(n / 10000)
  return `${m.toLocaleString()}만`
}
function fmt(n: number) { return n.toLocaleString('ko-KR') }

export default function FinancePage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)
  const [tab, setTab] = useState<'house' | 'district'>('house')
  const [openDistrict, setOpenDistrict] = useState<string | null>(null)
  const [pendingWorkers, setPendingWorkers] = useState(0)

  const now = new Date()
  now.setMonth(now.getMonth() + monthOffset)
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => {
    setLoading(true)
    fetch(`/api/finance/summary?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [year, month])

  useEffect(() => {
    fetch('/api/workers')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return
        const now = new Date()
        const y = now.getFullYear(), m = now.getMonth() + 1
        const pending = d.filter((w: { scheduledDate: string; isDone: string }) => {
          if (w.isDone === 'Y') return false
          if (!w.scheduledDate) return true
          const [wy, wm] = w.scheduledDate.split('-').map(Number)
          return wy === y && wm === m
        }).length
        setPendingWorkers(pending)
      })
      .catch(() => {})
  }, [])

  const missingUtility = data?.results.filter(r => !r.hasUtility && r.tenantCount > 0) || []

  const byDistrict = useMemo(() => {
    if (!data) return {}
    const map: Record<string, HouseResult[]> = {}
    data.results.forEach(r => {
      const d = r.district || '기타'
      if (!map[d]) map[d] = []
      map[d].push(r)
    })
    return map
  }, [data])

  const t = data?.totals

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="정산" />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Utility Link */}
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

        {/* Worker Link */}
        <Link href="/workers" className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--blue-light)] flex items-center justify-center">
            <Wrench size={18} color="var(--blue)" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">용역 관리</p>
            <p className="text-[11px] text-[var(--sub)]">청소/수리 일정 등록 및 정산</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingWorkers > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--amber-light)] text-[var(--amber)] text-[11px] font-bold">
                {pendingWorkers}건
              </span>
            )}
            <ChevronRight size={16} color="var(--sub)" />
          </div>
        </Link>

        {/* Opex Link */}
        <Link href="/opex" className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--red-light)] flex items-center justify-center">
            <Wallet size={18} color="var(--red)" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">지출 관리</p>
            <p className="text-[11px] text-[var(--sub)]">공과금 + 기타지출 통합 관리</p>
          </div>
          <ChevronRight size={16} color="var(--sub)" />
        </Link>

        {/* Duty Link */}
        <Link href="/duty" className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[#F3EAFF] flex items-center justify-center">
            <Sparkles size={18} color="#7C3AED" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">당번 관리</p>
            <p className="text-[11px] text-[var(--sub)]">지점별 청소 당번 배정 및 벌금</p>
          </div>
          <ChevronRight size={16} color="var(--sub)" />
        </Link>

        {/* Investor Link */}
        <Link href="/investors" className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--green-light)] flex items-center justify-center">
            <TrendingUp size={18} color="var(--green)" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">투자자 관리</p>
            <p className="text-[11px] text-[var(--sub)]">투자자별 수익 현황 링크 관리</p>
          </div>
          <ChevronRight size={16} color="var(--sub)" />
        </Link>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-5 py-4">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[16px] font-bold">{year}년 {month}월</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : !t ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">데이터를 불러올 수 없습니다</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="flex flex-col gap-2.5">
              {/* Income */}
              <div className="rounded-2xl bg-[#3182F6] p-4">
                <p className="text-[12px] text-white/70">이번달 수입</p>
                <p className="text-[24px] font-bold text-white mt-0.5">{toMan(t.totalIncome)}원</p>
                <p className="text-[11px] text-white/60 mt-1">월세 {toMan(t.totalRent)} + 관리비 {toMan(t.totalMgmt)}</p>
              </div>

              {/* Expense */}
              <div className="rounded-2xl bg-[var(--red)] p-4">
                <p className="text-[12px] text-white/70">이번달 지출</p>
                <p className="text-[24px] font-bold text-white mt-0.5">{toMan(t.totalExpense)}원</p>
                <p className="text-[11px] text-white/60 mt-1">집월세 {toMan(t.buildingRent)} + 공과금 {toMan(t.utilityExpense)}</p>
              </div>

              {/* Profit */}
              <div className={`rounded-2xl p-4 ${t.profit >= 0 ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`}>
                <p className="text-[12px] text-white/70">이번달 순이익</p>
                <p className="text-[24px] font-bold text-white mt-0.5">{toMan(t.profit)}원</p>
                <p className="text-[11px] text-white/60 mt-1">입주자 {t.tenantCount}명</p>
              </div>
            </div>

            {/* Missing Utility Banner */}
            {missingUtility.length > 0 && (
              <Link href="/utility" className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-[var(--amber-light)]">
                <AlertTriangle size={14} color="var(--amber)" />
                <span className="text-[12px] font-semibold text-[var(--amber)]">공과금 미입력 {missingUtility.length}개 지점</span>
              </Link>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mt-5 mb-3">
              {[{ key: 'house' as const, label: '지점별' }, { key: 'district' as const, label: '구별' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                    tab === t.key ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
                  }`}>{t.label}</button>
              ))}
            </div>

            {/* House Tab */}
            {tab === 'house' && (
              <div className="flex flex-col gap-2">
                {data.results.map(r => (
                  <Card key={r.houseId} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold">{r.houseName}</span>
                        {r.isConsignment && <Chip label="위탁" variant="gray" />}
                      </div>
                      <span className={`text-[14px] font-bold ${r.profit >= 0 ? 'text-[var(--blue)]' : 'text-[var(--red)]'}`}>
                        {r.profit >= 0 ? `+${toMan(r.profit)}` : `(${toMan(Math.abs(r.profit))})`}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-[var(--sub)]">
                      <span>수입 {fmt(r.totalIncome)}</span>
                      <span>집월세 {r.isConsignment ? '-' : fmt(r.buildingRent)}</span>
                      <span>공과금 {r.hasUtility ? fmt(r.utilityExpense) : <span className="text-[var(--sub)]">-</span>}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* District Tab */}
            {tab === 'district' && (
              <div className="flex flex-col gap-2">
                {Object.entries(byDistrict).map(([district, houses]) => {
                  const dProfit = houses.reduce((s, h) => s + h.profit, 0)
                  const dIncome = houses.reduce((s, h) => s + h.totalIncome, 0)
                  const isOpen = openDistrict === district
                  return (
                    <div key={district}>
                      <button onClick={() => setOpenDistrict(isOpen ? null : district)}
                        className="w-full">
                        <Card className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ChevronDown size={14} className={`text-[var(--sub)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            <span className="text-[13px] font-semibold">{district}</span>
                            <span className="text-[11px] text-[var(--sub)]">{houses.length}개</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[13px] font-bold ${dProfit >= 0 ? 'text-[var(--blue)]' : 'text-[var(--red)]'}`}>
                              {dProfit >= 0 ? `+${toMan(dProfit)}` : `(${toMan(Math.abs(dProfit))})`}
                            </span>
                            <p className="text-[10px] text-[var(--sub)]">수입 {toMan(dIncome)}</p>
                          </div>
                        </Card>
                      </button>
                      {isOpen && (
                        <div className="ml-4 mt-1 flex flex-col gap-1.5">
                          {houses.map(r => (
                            <Card key={r.houseId} className="px-3 py-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12px] font-medium">{r.houseName}</span>
                                  {r.isConsignment && <Chip label="위탁" variant="gray" />}
                                </div>
                                <span className={`text-[12px] font-bold ${r.profit >= 0 ? 'text-[var(--blue)]' : 'text-[var(--red)]'}`}>
                                  {r.profit >= 0 ? `+${toMan(r.profit)}` : `(${toMan(Math.abs(r.profit))})`}
                                </span>
                              </div>
                              <div className="flex gap-2 text-[10px] text-[var(--sub)] mt-0.5">
                                <span>수입 {fmt(r.totalIncome)}</span>
                                <span>지출 {fmt(r.totalExpense)}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
