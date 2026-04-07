'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScheduleEvent {
  date: string
  type: 'work' | 'issue' | 'move' | 'clean'
  house: string
  sub: string
}

const TYPE_LABEL: Record<string, string> = { work: '용역', issue: '이슈', move: '입퇴실', clean: '청소' }
const DOT_COLOR: Record<string, string> = { work: '#378ADD', issue: '#E24B4A', move: '#639922', clean: '#BA7517' }
const BAR_COLOR: Record<string, string> = { work: '#378ADD', issue: '#E24B4A', move: '#639922', clean: '#BA7517' }
const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  work:  { bg: '#E6F1FB', color: '#0C447C' },
  issue: { bg: '#FCEBEB', color: '#791F1F' },
  move:  { bg: '#EAF3DE', color: '#27500A' },
  clean: { bg: '#FAEEDA', color: '#633806' },
}
const FILTER_ACTIVE: Record<string, { bg: string; color: string; border: string }> = {
  all:   { bg: '#2C2C2A', color: '#F1EFE8', border: '#2C2C2A' },
  work:  { bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
  issue: { bg: '#FCEBEB', color: '#791F1F', border: '#F09595' },
  move:  { bg: '#EAF3DE', color: '#27500A', border: '#97C459' },
  clean: { bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
}

export default function ScheduleCalendar() {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [filter, setFilter] = useState<'all' | 'work' | 'issue' | 'move' | 'clean'>('all')
  const [selDate, setSelDate] = useState<string | null>(null)
  const [events, setEvents] = useState<ScheduleEvent[]>([])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    const y = cur.year
    const m = cur.month + 1
    Promise.all([
      fetch('/api/workers').then(r => r.json()).catch(() => []),
      fetch('/api/issues').then(r => r.json()).catch(() => ({ issues: [] })),
    ]).then(([workers, issueData]) => {
      const evts: ScheduleEvent[] = []
      if (Array.isArray(workers)) {
        workers.forEach((w: { scheduledDate: string; taskType: string; name: string; houseName: string }) => {
          if (!w.scheduledDate) return
          const [wy, wm] = w.scheduledDate.split('-').map(Number)
          if (wy === y && wm === m) {
            const type = ['청소','정기청소','퇴실청소','입주청소'].includes(w.taskType) ? 'clean' : 'work'
            evts.push({ date: w.scheduledDate, type, house: w.houseName || '', sub: `${w.name} · ${w.taskType}` })
          }
        })
      }
      const issues = issueData?.issues || (Array.isArray(issueData) ? issueData : [])
      issues.forEach((i: { createdAt: string; houseName: string; title: string }) => {
        if (!i.createdAt) return
        const [iy, im] = i.createdAt.split('-').map(Number)
        if (iy === y && im === m)
          evts.push({ date: i.createdAt.split('T')[0], type: 'issue', house: i.houseName || '', sub: i.title || '' })
      })
      setEvents(evts)
    })
  }, [cur])

  const filtered = useMemo(() => filter === 'all' ? events : events.filter(e => e.type === filter), [events, filter])
  const byDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {}
    filtered.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e) })
    return map
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

  return (
    <div className="mt-6 mb-4">
      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => setCur(p => ({ ...p, month: p.month - 1 < 0 ? 11 : p.month - 1, year: p.month - 1 < 0 ? p.year - 1 : p.year }))}>
            <ChevronLeft size={18} className="text-[var(--sub)]" />
          </button>
          <span className="text-[15px] font-bold">{cur.year}년 {cur.month + 1}월</span>
          <button onClick={() => setCur(p => ({ ...p, month: p.month + 1 > 11 ? 0 : p.month + 1, year: p.month + 1 > 11 ? p.year + 1 : p.year }))}>
            <ChevronRight size={18} className="text-[var(--sub)]" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {(['all', 'work', 'issue', 'move', 'clean'] as const).map(f => {
            const active = filter === f
            const s = FILTER_ACTIVE[f]
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
                style={active ? { background: s.bg, color: s.color, border: `1px solid ${s.border}` } : { background: 'var(--bg)', color: 'var(--sub)', border: '1px solid var(--border)' }}>
                {f === 'all' ? '전체' : TYPE_LABEL[f]}
              </button>
            )
          })}
        </div>

        {/* Calendar Grid */}
        <div className="px-3 pb-2">
          <div className="grid grid-cols-7 text-center text-[10px] text-[var(--sub)] mb-1">
            {['일','월','화','수','목','금','토'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {calDays.map((day, i) => {
              if (day === null) return <div key={i} className="h-10" />
              const dateStr = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = byDate[dateStr] || []
              const isToday = dateStr === todayStr
              const isSel = dateStr === selDate
              const types = [...new Set(dayEvents.map(e => e.type))]
              return (
                <button key={i} onClick={() => setSelDate(isSel ? null : dateStr)}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                    isSel ? 'bg-[var(--blue-light)]' : isToday ? 'bg-[var(--border)]' : ''
                  }`}>
                  <span className={`text-[12px] ${isToday ? 'font-bold text-[var(--blue)]' : 'text-[var(--foreground)]'}`}>{day}</span>
                  {types.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {types.slice(0, 3).map(t => (
                        <div key={t} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DOT_COLOR[t] }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        {selDate && (
          <div className="border-t border-[var(--border)] px-4 py-3">
            <p className="text-[12px] font-bold text-[var(--sub)] mb-2">{selDate}</p>
            {selEvents.length === 0 ? (
              <p className="text-[11px] text-[var(--sub)]">일정 없음</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {selEvents.map((e, i) => {
                  const bs = BADGE_STYLE[e.type]
                  return (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ borderLeft: `3px solid ${BAR_COLOR[e.type]}` }}>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: bs.bg, color: bs.color }}>
                        {TYPE_LABEL[e.type]}
                      </span>
                      <span className="text-[12px] font-semibold">{e.house}</span>
                      <span className="text-[10px] text-[var(--sub)] truncate">{e.sub}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
