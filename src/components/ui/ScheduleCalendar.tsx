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
const DOT_COLOR: Record<string, string> = { work: '#3182F6', issue: '#E24B4A', move: '#00C471', clean: '#F5A623' }
const BAR_COLOR: Record<string, string> = { work: '#3182F6', issue: '#E24B4A', move: '#00C471', clean: '#F5A623' }
const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  work:  { bg: '#E6F1FB', color: '#0C447C' },
  issue: { bg: '#FCEBEB', color: '#791F1F' },
  move:  { bg: '#EAF3DE', color: '#27500A' },
  clean: { bg: '#FAEEDA', color: '#633806' },
}

const FILTERS = ['all', 'work', 'issue', 'move', 'clean'] as const

function toArr(d: unknown): unknown[] {
  if (Array.isArray(d)) return d
  if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown[] }).data)) return (d as { data: unknown[] }).data
  if (d && typeof d === 'object' && 'issues' in d && Array.isArray((d as { issues: unknown[] }).issues)) return (d as { issues: unknown[] }).issues
  return []
}

export default function ScheduleCalendar() {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')
  const [selDate, setSelDate] = useState<string | null>(null)
  const [events, setEvents] = useState<ScheduleEvent[]>([])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    const y = cur.year, m = cur.month + 1
    Promise.all([
      fetch('/api/workers').then(r => r.json()).catch(() => []),
      fetch('/api/issues').then(r => r.json()).catch(() => []),
    ]).then(([workerRes, issueRes]) => {
      const evts: ScheduleEvent[] = []
      const workers = toArr(workerRes) as { scheduledDate?: string; taskType?: string; name?: string; houseName?: string }[]
      const issues = toArr(issueRes) as { createdAt?: string; houseName?: string; title?: string }[]

      workers.forEach(w => {
        if (!w.scheduledDate) return
        const [wy, wm] = w.scheduledDate.split('-').map(Number)
        if (wy !== y || wm !== m) return
        const taskType = w.taskType || ''
        const type = taskType.includes('청소') ? 'clean' : 'work'
        evts.push({ date: w.scheduledDate, type, house: w.houseName || '', sub: `${w.name || ''} · ${taskType}` })
      })

      issues.forEach(i => {
        const date = (i.createdAt || '').split('T')[0]
        if (!date) return
        const [iy, im] = date.split('-').map(Number)
        if (iy !== y || im !== m) return
        evts.push({ date, type: 'issue', house: i.houseName || '', sub: i.title || '' })
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
  const daysLabel = ['일', '월', '화', '수', '목', '금', '토']
  const selDow = selDate ? daysLabel[new Date(selDate).getDay()] : ''

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
      {/* Blue Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#3182F6' }}>
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-bold text-white">{cur.year}년 {cur.month + 1}월</p>
          <div className="flex gap-2">
            <button onClick={() => setCur(p => ({ year: p.month === 0 ? p.year - 1 : p.year, month: p.month === 0 ? 11 : p.month - 1 }))}>
              <ChevronLeft size={18} className="text-white/80" />
            </button>
            <button onClick={() => setCur(p => ({ year: p.month === 11 ? p.year + 1 : p.year, month: p.month === 11 ? 0 : p.month + 1 }))}>
              <ChevronRight size={18} className="text-white/80" />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
              style={filter === f ? { background: '#fff', color: '#3182F6' } : { background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {f === 'all' ? '전체' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-3 pt-2 pb-2 bg-[var(--bg)]">
        <div className="grid grid-cols-7 text-center text-[10px] mb-1">
          {daysLabel.map((d, i) => (
            <span key={d} style={{ color: i === 0 ? '#E24B4A' : i === 6 ? '#3182F6' : 'var(--sub)' }}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {calDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-11" />
            const dateStr = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = byDate[dateStr] || []
            const isToday = dateStr === todayStr
            const isSel = dateStr === selDate
            const types = [...new Set(dayEvents.map(e => e.type))]
            return (
              <button key={i} onClick={() => setSelDate(isSel ? null : dateStr)}
                className="h-11 rounded-lg flex flex-col items-center justify-center"
                style={{ background: isToday ? '#3182F6' : isSel ? '#EBF3FE' : undefined }}>
                <span className="text-[12px]" style={{
                  color: isToday ? '#fff' : i % 7 === 0 ? '#E24B4A' : i % 7 === 6 ? '#3182F6' : 'var(--foreground)',
                  fontWeight: isToday ? 700 : 400,
                }}>{day}</span>
                {types.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {types.slice(0, 3).map(t => (
                      <div key={t} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : DOT_COLOR[t] }} />
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
        <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--bg)]">
          <p className="text-[13px] font-bold mb-2">
            {Number(selDate.split('-')[1])}월 {Number(selDate.split('-')[2])}일 {selDow}요일
            {selEvents.length > 0 && ` · ${selEvents.length}건`}
          </p>
          {selEvents.length === 0 ? (
            <p className="text-[11px] text-[var(--sub)]">일정 없음</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {selEvents.map((e, i) => {
                const bs = BADGE_STYLE[e.type]
                return (
                  <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-xl border border-[var(--border)]"
                    style={{ borderLeft: `3px solid ${BAR_COLOR[e.type]}` }}>
                    <div className="flex-1">
                      <span className="text-[13px] font-bold">{e.house}</span>
                      <p className="text-[11px] text-[var(--sub)]">{e.sub}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: bs.bg, color: bs.color }}>
                      {TYPE_LABEL[e.type]}
                    </span>
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
