'use client'

import { useState, useEffect } from 'react'
import ScheduleCalendar from '@/components/ui/ScheduleCalendar'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { BottomTab } from '@/components/ui/BottomTab'
import { Users, Home, Clock, AlertCircle, ChevronRight, RefreshCw, Wrench, ClipboardList } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  summary: {
    totalRooms: number; activeTenants: number; exitSoon: number;
    vacantRooms: number; pendingIssues: number; pendingWorkers: number;
  }
  finance: {
    totalIncome: number; totalRent: number; totalMgmt: number;
    totalExpense: number; totalProfit: number; year: number; month: number;
  }
  expiringTenants: { name: string; houseName: string; roomCode: string; endDate: string; dDay: number; tenantId: string }[]
  pendingIssues: { id: string; houseName: string; title: string; category: string; status: string; createdAt: string }[]
  profitRanking: { houseName: string; totalIncome: number; expense: number; profit: number }[]
  workerSummary: { total: number; pending: number; completed: number; paymentTotal: number }
}

const toMan = (n: number) => Math.round(n / 10000).toLocaleString() + '만'

const statusVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  '접수': 'red', '진행중': 'amber', '완료': 'green', '보류': 'gray',
}
const categoryVariant: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  '수리': 'blue', '청소': 'green', '민원': 'amber', '교체': 'blue', '기타': 'gray',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day === 1) return '어제'
  return `${day}일 전`
}

function getToday() {
  const d = new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일 ${weekdays[d.getDay()]}요일`
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingApps, setPendingApps] = useState<{ type: string; name: string; houseName: string; summary: string; createdAt: string }[]>([])

  function fetchData() {
    setLoading(prev => !data ? true : prev)
    setRefreshing(true)
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false) })

    // Fetch pending applications
    Promise.all([
      fetch('/api/apply/tour').then(r => r.json()).catch(() => []),
      fetch('/api/apply/cleaning').then(r => r.json()).catch(() => []),
      fetch('/api/apply/aircon').then(r => r.json()).catch(() => []),
      fetch('/api/apply/checkout').then(r => r.json()).catch(() => []),
      fetch('/api/apply/supplies').then(r => r.json()).catch(() => []),
    ]).then(([tours, cleanings, aircons, checkouts, supplies]) => {
      const pending: typeof pendingApps = []
      const isPending = (s: string) => s === '신청접수' || s === '처리중'
      if (Array.isArray(tours)) tours.filter((a: { status: string }) => isPending(a.status)).forEach((a: { name: string; region: string; tourDate: string; createdAt: string }) =>
        pending.push({ type: '투어', name: a.name, houseName: a.region, summary: a.tourDate, createdAt: a.createdAt }))
      if (Array.isArray(cleanings)) cleanings.filter((a: { status: string }) => isPending(a.status)).forEach((a: { name: string; houseName: string; cleanDate: string; createdAt: string }) =>
        pending.push({ type: '청소', name: a.name, houseName: a.houseName, summary: a.cleanDate, createdAt: a.createdAt }))
      if (Array.isArray(aircons)) aircons.filter((a: { status: string }) => isPending(a.status)).forEach((a: { name: string; houseName: string; roomType: string; createdAt: string }) =>
        pending.push({ type: '에어컨', name: a.name, houseName: a.houseName, summary: a.roomType, createdAt: a.createdAt }))
      if (Array.isArray(checkouts)) checkouts.filter((a: { status: string }) => isPending(a.status)).forEach((a: { name: string; houseName: string; checkoutDate: string; createdAt: string }) =>
        pending.push({ type: '퇴실', name: a.name, houseName: a.houseName, summary: a.checkoutDate, createdAt: a.createdAt }))
      if (Array.isArray(supplies)) supplies.filter((a: { status: string }) => isPending(a.status)).forEach((a: { tenantName: string; houseName: string; items: string; createdAt: string }) =>
        pending.push({ type: '물품', name: a.tenantName, houseName: a.houseName, summary: a.items, createdAt: a.createdAt }))
      pending.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setPendingApps(pending)
    })
  }

  useEffect(() => { fetchData() }, [])

  const s = data?.summary
  const f = data?.finance

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-2">
          <div>
            <h1 className="text-[20px] font-bold">안녕하세요 👋</h1>
            <p className="text-[13px] text-[var(--sub)] mt-0.5">{getToday()}</p>
          </div>
          <button onClick={fetchData} disabled={refreshing}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <RefreshCw size={16} color="var(--sub)" className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="px-5 mt-4 flex flex-col gap-4">
            <div className="h-[140px] rounded-2xl bg-[var(--border)] animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-[80px] rounded-xl bg-[var(--border)] animate-pulse" />)}
            </div>
            <div className="h-[200px] rounded-xl bg-[var(--border)] animate-pulse" />
          </div>
        ) : !data ? (
          <p className="text-[13px] text-[var(--sub)] py-16 text-center">데이터를 불러올 수 없어요</p>
        ) : (
          <div className="px-5 flex flex-col gap-6 mt-4">
            {/* ① Today's Schedule */}
            <TodaySchedule />

            <ScheduleCalendar />

            {/* ② Status Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/tenants">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--green-light)] flex items-center justify-center">
                      <Users size={14} color="var(--green)" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--sub)]">입주중</p>
                  <p className="text-[20px] font-bold text-[var(--green)]">{s!.activeTenants}명</p>
                </Card>
              </Link>
              <Link href="/vacancy">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                      <Home size={14} color="var(--red)" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--sub)]">공실</p>
                  <p className="text-[20px] font-bold text-[var(--red)]">{s!.vacantRooms}개</p>
                </Card>
              </Link>
              <Link href="/tenants">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--amber-light)] flex items-center justify-center">
                      <Clock size={14} color="var(--amber)" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--sub)]">만료임박</p>
                  <p className="text-[20px] font-bold text-[var(--amber)]">{s!.exitSoon}명</p>
                </Card>
              </Link>
              <Link href="/issues">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                      <AlertCircle size={14} color="var(--red)" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--sub)]">미처리이슈</p>
                  <p className="text-[20px] font-bold text-[var(--red)]">{s!.pendingIssues}건</p>
                </Card>
              </Link>
            </div>

            {/* ②-b Pending Applications */}
            {pendingApps.length > 0 && (
              <div className="rounded-xl border border-[#F2F2F2] overflow-hidden">
                <div className="bg-[#FEF0F0] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={14} color="#F04452" />
                    <span className="text-[14px] font-bold text-[#F04452]">미처리 신청 {pendingApps.length}건</span>
                  </div>
                  <Link href="/applications" className="text-[12px] text-[#F04452] flex items-center gap-0.5">
                    전체보기 <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="bg-white px-4 py-2">
                  {pendingApps.slice(0, 5).map((a, i) => {
                    const typeColors: Record<string, { bg: string; text: string }> = {
                      '투어': { bg: '#FFF3E4', text: '#633806' },
                      '청소': { bg: '#E8F8EE', text: '#27500A' },
                      '에어컨': { bg: '#F1EFE8', text: '#5F5E5A' },
                      '퇴실': { bg: '#FEF0F0', text: '#791F1F' },
                      '물품': { bg: '#EBF3FE', text: '#185FA5' },
                    }
                    const tc = typeColors[a.type] || typeColors['물품']
                    return (
                      <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#F9F9F9] last:border-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: tc.bg, color: tc.text }}>{a.type}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-semibold">{a.name}</span>
                          <p className="text-[11px] text-[var(--sub)] truncate">{a.houseName} {a.summary}</p>
                        </div>
                        <span className="text-[10px] text-[var(--sub)] shrink-0">{timeAgo(a.createdAt)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ③ Expiring Tenants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold">계약 만료 임박</h2>
                <Link href="/tenants" className="text-[13px] text-[var(--blue)] flex items-center gap-0.5">
                  전체보기 <ChevronRight size={14} />
                </Link>
              </div>
              {data.expiringTenants.length === 0 ? (
                <p className="text-[13px] text-[var(--sub)] py-4 text-center">만료 임박 입주자 없음</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.expiringTenants.slice(0, 5).map(t => (
                    <Card key={t.tenantId} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">{t.name}</span>
                          <span className="text-[11px] text-[var(--sub)]">{t.houseName} · {t.roomCode}</span>
                        </div>
                        <p className="text-[11px] text-[var(--sub)] mt-0.5">{t.endDate} 만료</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.dDay <= 7 ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'
                      }`}>
                        D-{t.dDay}
                      </span>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* ④ Pending Issues */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold">미처리 이슈</h2>
                <Link href="/issues" className="text-[13px] text-[var(--blue)] flex items-center gap-0.5">
                  전체보기 <ChevronRight size={14} />
                </Link>
              </div>
              {data.pendingIssues.length === 0 ? (
                <p className="text-[13px] text-[var(--green)] py-4 text-center">미처리 이슈 없음 ✓</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.pendingIssues.map(issue => (
                    <Link key={issue.id} href={`/issues/${issue.id}`}>
                      <Card className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Chip label={issue.category} variant={categoryVariant[issue.category] || 'gray'} />
                          <Chip label={issue.status} variant={statusVariant[issue.status] || 'gray'} />
                        </div>
                        <p className="text-[13px] font-semibold">{issue.title}</p>
                        <p className="text-[11px] text-[var(--sub)] mt-0.5">{issue.houseName} · {issue.createdAt}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ⑤ Profit TOP 5 */}
            <div>
              <h2 className="text-[16px] font-bold mb-3">이번달 순이익 TOP 5</h2>
              {data.profitRanking.length === 0 ? (
                <p className="text-[13px] text-[var(--sub)] py-4 text-center">데이터 없음</p>
              ) : (
                <Card className="px-4 py-3">
                  <div className="flex flex-col gap-3">
                    {data.profitRanking.map((r, i) => {
                      const ratio = r.totalIncome > 0 ? Math.max(0, Math.min(100, (r.profit / r.totalIncome) * 100)) : 0
                      return (
                        <div key={r.houseName} className="flex items-center gap-3">
                          <span className="text-[14px] font-bold text-[var(--blue)] w-5 text-center">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] font-semibold">{r.houseName}</span>
                              <span className="text-[13px] font-bold text-[var(--blue)]">+{toMan(r.profit)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--border)]">
                              <div className="h-full rounded-full bg-[var(--blue)]" style={{ width: `${ratio}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* ⑥ Worker Summary */}
            <Link href="/workers">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--blue-light)] flex items-center justify-center">
                    <Wrench size={16} color="var(--blue)" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold">이번달 용역 현황</p>
                  </div>
                  <ChevronRight size={16} color="var(--sub)" />
                </div>
                <div className="flex gap-4 text-[12px]">
                  <div>
                    <span className="text-[var(--sub)]">전체 </span>
                    <span className="font-bold">{data.workerSummary.total}건</span>
                  </div>
                  <div>
                    <span className="text-[var(--sub)]">완료 </span>
                    <span className="font-bold text-[var(--green)]">{data.workerSummary.completed}건</span>
                  </div>
                  <div>
                    <span className="text-[var(--sub)]">미완료 </span>
                    <span className="font-bold text-[var(--amber)]">{data.workerSummary.pending}건</span>
                  </div>
                </div>
                {data.workerSummary.paymentTotal > 0 && (
                  <p className="text-[12px] text-[var(--sub)] mt-1.5">
                    정산합계 <span className="font-bold text-[var(--foreground)]">{toMan(data.workerSummary.paymentTotal)}원</span>
                  </p>
                )}
              </Card>
            </Link>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}

function TodaySchedule() {
  const [items, setItems] = useState<{ type: string; label: string; sub: string; color: string; href: string }[]>([])
  const todayStr = new Date().toISOString().split('T')[0]
  const d = new Date()
  const todayLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`

  useEffect(() => {
    Promise.all([
      fetch('/api/workers').then(r => r.json()).catch(() => []),
      fetch('/api/issues').then(r => r.json()).catch(() => ({ issues: [] })),
    ]).then(([wRes, iRes]) => {
      const all: typeof items = []
      const workers = Array.isArray(wRes) ? wRes : []
      const issues = (iRes?.issues || (Array.isArray(iRes) ? iRes : [])) as { id: string; houseName: string; title: string; status: string }[]

      workers.forEach((w: { scheduledDate?: string; houseName?: string; name?: string; taskType?: string }) => {
        if ((w.scheduledDate || '').startsWith(todayStr))
          all.push({ type: 'work', label: `${w.houseName} · ${w.name}`, sub: `${w.taskType} · 용역`, color: '#3182F6', href: '/workers' })
      })
      issues.forEach(i => {
        if (i.status === '접수' || i.status === '진행중')
          all.push({ type: 'issue', label: `${i.houseName} · ${i.title}`, sub: `${i.status} · 미처리`, color: '#E24B4A', href: `/issues/${i.id}` })
      })
      setItems(all)
    })
  }, [])

  return (
    <div className="rounded-2xl bg-[var(--card)] overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-[var(--border)]">
        <span className="text-[14px] font-bold">오늘의 일정</span>
        <span className="text-[12px] text-[var(--sub)]">{todayLabel}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-[13px] text-[var(--sub)]">오늘 예정된 일정이 없어요</p>
        </div>
      ) : (
        <div className="px-4 py-2">
          {items.map((item, i) => (
            <Link key={i} href={item.href}
              className={`flex items-center gap-3 py-3 ${i < items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] truncate">{item.label}</p>
                <p className="text-[11px] text-[var(--sub)] mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight size={16} color="var(--sub)" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
