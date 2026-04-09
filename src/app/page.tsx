'use client'

import { useState, useEffect } from 'react'
import ScheduleCalendar from '@/components/ui/ScheduleCalendar'
import { BottomTab } from '@/components/ui/BottomTab'
import { ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface IssueItem { id: string; houseName: string; title: string; category: string; status: string; createdAt: string }
interface TenantItem { id: string; houseName: string; roomCode: string; name: string; status: string; startDate: string; endDate: string }

export default function DashboardPage() {
  const [issues, setIssues] = useState<IssueItem[]>([])
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingTab, setPendingTab] = useState<'request' | 'issue'>('request')

  function fetchAll() {
    setLoading(true)
    Promise.all([
      fetch('/api/issues').then(r => r.json()).catch(() => ({ issues: [] })),
      fetch('/api/tenants').then(r => r.json()).catch(() => []),
    ]).then(([iRes, tRes]) => {
      setIssues(iRes?.issues || (Array.isArray(iRes) ? iRes : []))
      setTenants(Array.isArray(tRes) ? tRes : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const activeTenants = tenants.filter(t => t.status === '입주중').length
  const vacantCount = tenants.filter(t => t.status === '퇴실' || t.status === '공실' || t.status === '미입주').length

  const pendingRequests = issues.filter(i =>
    ['투어', '물품', '청소', '에어컨청소', '방청소', '기타신청', '에어컨', '퇴실'].includes(i.category || '') &&
    i.status === '접수'
  )
  const pendingIssues = issues.filter(i =>
    ['수리', '민원', '교체', '기타'].includes(i.category || '') &&
    (i.status === '접수' || i.status === '진행중')
  )

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-5 pt-14 pb-2">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="text-[22px] font-bold">안녕하세요 👋</h1>
              <p className="text-[13px] text-[var(--sub)] mt-1">
                {`${new Date().getMonth() + 1}월 ${new Date().getDate()}일 ${'일월화수목금토'[new Date().getDay()]}요일`}
              </p>
            </div>
            <button onClick={() => window.location.reload()}
              className="w-9 h-9 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
              <RefreshCw size={16} color="var(--sub)" />
            </button>
          </div>

          {/* ScheduleCalendar */}
          <ScheduleCalendar />

          {/* Today's Schedule */}
          <div className="mt-4">
            <TodaySchedule />
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 mb-3">
            <Link href="/tenants" className="rounded-2xl bg-[var(--card)] p-4">
              <p className="text-[12px] text-[var(--sub)] mb-2">입주중</p>
              <p className="text-[28px] font-bold" style={{ color: '#27500A' }}>{loading ? '-' : activeTenants}명</p>
            </Link>
            <Link href="/vacancy" className="rounded-2xl bg-[var(--card)] p-4">
              <p className="text-[12px] text-[var(--sub)] mb-2">공실</p>
              <p className="text-[28px] font-bold" style={{ color: '#A32D2D' }}>{loading ? '-' : vacantCount}개</p>
            </Link>
          </div>

          {/* Pending Tab Card */}
          <div className="rounded-2xl bg-[var(--card)] overflow-hidden mb-3">
            <div className="flex justify-between items-center px-4 pt-4 pb-0">
              <p className="text-[14px] font-bold">미처리 건</p>
              <Link href="/issues" className="text-[12px] text-[#3182F6]">전체보기 ›</Link>
            </div>

            <div className="flex mx-4 mt-3 border-b border-[var(--border)]">
              <button onClick={() => setPendingTab('request')}
                className={`flex-1 pb-2.5 text-[14px] font-medium text-center ${pendingTab === 'request' ? 'text-[#3182F6] border-b-2 border-[#3182F6]' : 'text-[var(--sub)]'}`}>
                신청
                {pendingRequests.length > 0 && (
                  <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-[#FCEBEB] text-[#791F1F]">{pendingRequests.length}</span>
                )}
              </button>
              <button onClick={() => setPendingTab('issue')}
                className={`flex-1 pb-2.5 text-[14px] font-medium text-center ${pendingTab === 'issue' ? 'text-[#3182F6] border-b-2 border-[#3182F6]' : 'text-[var(--sub)]'}`}>
                이슈
                {pendingIssues.length > 0 && (
                  <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-[#FCEBEB] text-[#791F1F]">{pendingIssues.length}</span>
                )}
              </button>
            </div>

            <div className="py-1">
              {pendingTab === 'request' ? (
                pendingRequests.length === 0 ? (
                  <div className="px-4 py-6 text-center"><p className="text-[13px] text-[var(--sub)]">미처리 신청이 없어요</p></div>
                ) : (
                  pendingRequests.slice(0, 5).map((item, i) => (
                    <Link key={item.id} href={`/issues/${item.id}`}
                      className={`flex items-center justify-between px-4 py-3 ${i < Math.min(pendingRequests.length, 5) - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] truncate">{item.title}</p>
                        <p className="text-[11px] text-[var(--sub)] mt-0.5">{item.houseName} · {item.createdAt?.split('T')[0]}</p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-[5px] bg-[#FEF3E2] text-[#633806] ml-2 shrink-0">{item.category || '신청'}</span>
                    </Link>
                  ))
                )
              ) : (
                pendingIssues.length === 0 ? (
                  <div className="px-4 py-6 text-center"><p className="text-[13px] text-[var(--sub)]">미처리 이슈가 없어요</p></div>
                ) : (
                  pendingIssues.slice(0, 5).map((item, i) => (
                    <Link key={item.id} href={`/issues/${item.id}`}
                      className={`flex items-center justify-between px-4 py-3 ${i < Math.min(pendingIssues.length, 5) - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] truncate">{item.title}</p>
                        <p className="text-[11px] text-[var(--sub)] mt-0.5">{item.houseName} · {item.createdAt?.split('T')[0]}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-[5px] ml-2 shrink-0 ${
                        item.status === '진행중' ? 'bg-[#FEF3E2] text-[#633806]' : 'bg-[#FCEBEB] text-[#791F1F]'
                      }`}>{item.status}</span>
                    </Link>
                  ))
                )
              )}
            </div>
          </div>

        </div>
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
