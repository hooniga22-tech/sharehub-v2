'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Issue { id: string; houseName: string; title: string; status: string; createdAt: string }

const DOT: Record<string, string> = { '접수': '#E24B4A', '진행중': '#F5A623', '완료': '#00C471' }
const BADGE: Record<string, { bg: string; color: string }> = {
  '접수': { bg: '#FCEBEB', color: '#791F1F' },
  '진행중': { bg: '#FEF3E2', color: '#8a5a00' },
  '완료': { bg: '#E4F9F0', color: '#0a7a47' },
}
const FILTERS = ['전체', '미처리', '진행중', '완료']

export default function IssueCalendar() {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [filter, setFilter] = useState('전체')
  const [selDate, setSelDate] = useState<string | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    fetch('/api/issues').then(r => r.json())
      .then(d => { if (d.issues) setIssues(d.issues) })
      .catch(() => {})
  }, [])

  const monthIssues = useMemo(() => {
    const prefix = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}`
    return issues.filter(i => i.createdAt?.startsWith(prefix))
  }, [issues, cur])

  const filtered = useMemo(() => {
    if (filter === '전체') return monthIssues
    if (filter === '미처리') return monthIssues.filter(i => i.status === '접수' || i.status === '진행중')
    return monthIssues.filter(i => i.status === filter)
  }, [monthIssues, filter])

  const pendingCount = monthIssues.filter(i => i.status === '접수' || i.status === '진행중').length

  const byDate = useMemo(() => {
    const m: Record<string, Issue[]> = {}
    filtered.forEach(i => { const d = i.createdAt?.split('T')[0] || ''; if (!m[d]) m[d] = []; m[d].push(i) })
    return m
  }, [filtered])

  const calDays = useMemo(() => {
    const first = new Date(cur.year, cur.month, 1)
    const last = new Date(cur.year, cur.month + 1, 0)
    const days: (number | null)[] = Array(first.getDay()).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [cur])

  const selEvents = selDate ? (byDate[selDate] || []) : []
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const selDow = selDate ? days[new Date(selDate).getDay()] : ''

  return (
    <div className="mx-5 mt-3 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#E24B4A' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[18px] font-bold text-white">{cur.month + 1}월 이슈</p>
            <p className="text-[12px] text-white/70">미처리 {pendingCount}건</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCur(p => ({ year: p.month === 0 ? p.year - 1 : p.year, month: p.month === 0 ? 11 : p.month - 1 }))}><ChevronLeft size={18} className="text-white/80" /></button>
            <button onClick={() => setCur(p => ({ year: p.month === 11 ? p.year + 1 : p.year, month: p.month === 11 ? 0 : p.month + 1 }))}><ChevronRight size={18} className="text-white/80" /></button>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
              style={filter === f ? { background: '#fff', color: '#E24B4A' } : { background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="px-3 pt-2 pb-2">
        <div className="grid grid-cols-7 text-center text-[10px] mb-1">
          {days.map((d, i) => <span key={d} style={{ color: i === 0 ? '#E24B4A' : i === 6 ? '#3182F6' : 'var(--sub)' }}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {calDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-11" />
            const ds = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const evts = byDate[ds] || []
            const isToday = ds === todayStr
            const isSel = ds === selDate
            const dotColors = [...new Set(evts.map(e => DOT[e.status] || '#ccc'))]
            return (
              <button key={i} onClick={() => setSelDate(isSel ? null : ds)}
                className="h-11 rounded-lg flex flex-col items-center justify-center relative"
                style={{ background: isToday ? '#E24B4A' : isSel ? '#FCEBEB' : undefined }}>
                <span className="text-[12px]" style={{ color: isToday ? '#fff' : i % 7 === 0 ? '#E24B4A' : i % 7 === 6 ? '#3182F6' : 'var(--foreground)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                {dotColors.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dotColors.slice(0, 3).map((c, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : c }} />)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected */}
      {selDate && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] font-bold mb-2">{Number(selDate.split('-')[1])}월 {Number(selDate.split('-')[2])}일 {selDow}요일{selEvents.length > 0 ? ` · ${selEvents.length}건` : ''}</p>
          {selEvents.length === 0 ? <p className="text-[11px] text-[var(--sub)]">이슈 없음</p> : (
            <div className="flex flex-col gap-1.5">
              {selEvents.map((e, i) => {
                const b = BADGE[e.status] || BADGE['접수']
                return (
                  <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-xl border border-[var(--border)]" style={{ borderLeft: `3px solid ${DOT[e.status] || '#ccc'}` }}>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold">{e.houseName}</p>
                      <p className="text-[11px] text-[var(--sub)]">{e.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: b.bg, color: b.color }}>{e.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
