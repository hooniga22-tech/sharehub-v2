'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WorkItem { id: string; name: string; houseName: string; taskType: string; scheduledDate: string; isDone: string; payment: number }

const DOT: Record<string, string> = { '청소': '#F5A623', '정기청소': '#F5A623', '퇴실청소': '#F5A623', '입주청소': '#F5A623', '수리': '#E24B4A' }
const BADGE: Record<string, { bg: string; color: string }> = {
  '용역': { bg: '#E6F1FB', color: '#0C447C' },
  '청소': { bg: '#FAEEDA', color: '#633806' },
  '수리': { bg: '#FCEBEB', color: '#791F1F' },
}
const FILTERS = ['전체', '청소', '수리', '미완료', '완료']

export default function WorkerCalendar() {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [filter, setFilter] = useState('전체')
  const [selDate, setSelDate] = useState<string | null>(null)
  const [items, setItems] = useState<WorkItem[]>([])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    fetch('/api/workers').then(r => r.json())
      .then(d => { if (Array.isArray(d)) setItems(d) })
      .catch(() => {})
  }, [])

  const monthItems = useMemo(() => {
    const prefix = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}`
    return items.filter(w => w.scheduledDate?.startsWith(prefix))
  }, [items, cur])

  const filtered = useMemo(() => {
    if (filter === '전체') return monthItems
    if (filter === '미완료') return monthItems.filter(w => w.isDone !== 'Y')
    if (filter === '완료') return monthItems.filter(w => w.isDone === 'Y')
    if (filter === '청소') return monthItems.filter(w => ['청소', '정기청소', '퇴실청소', '입주청소'].includes(w.taskType))
    if (filter === '수리') return monthItems.filter(w => w.taskType === '수리')
    return monthItems
  }, [monthItems, filter])

  const pendingCount = monthItems.filter(w => w.isDone !== 'Y').length
  const totalPayment = monthItems.reduce((s, w) => s + (w.payment || 0), 0)

  const byDate = useMemo(() => {
    const m: Record<string, WorkItem[]> = {}
    filtered.forEach(w => { const d = w.scheduledDate || ''; if (!m[d]) m[d] = []; m[d].push(w) })
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
  const daysLabel = ['일', '월', '화', '수', '목', '금', '토']
  const selDow = selDate ? daysLabel[new Date(selDate).getDay()] : ''

  function getType(t: string) { return ['청소', '정기청소', '퇴실청소', '입주청소'].includes(t) ? '청소' : t === '수리' ? '수리' : '용역' }

  return (
    <div className="mx-5 mt-3 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 pt-4 pb-3" style={{ background: '#3182F6' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[18px] font-bold text-white">{cur.month + 1}월 용역</p>
            <p className="text-[12px] text-white/70">미완료 {pendingCount}건 · 정산합계 {Math.round(totalPayment / 10000)}만원</p>
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
              style={filter === f ? { background: '#fff', color: '#3182F6' } : { background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2 pb-2">
        <div className="grid grid-cols-7 text-center text-[10px] mb-1">
          {daysLabel.map((d, i) => <span key={d} style={{ color: i === 0 ? '#E24B4A' : i === 6 ? '#3182F6' : 'var(--sub)' }}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {calDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-11" />
            const ds = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const evts = byDate[ds] || []
            const isToday = ds === todayStr
            const isSel = ds === selDate
            return (
              <button key={i} onClick={() => setSelDate(isSel ? null : ds)}
                className="h-11 rounded-lg flex flex-col items-center justify-center"
                style={{ background: isToday ? '#3182F6' : isSel ? '#EBF3FE' : undefined }}>
                <span className="text-[12px]" style={{ color: isToday ? '#fff' : i % 7 === 0 ? '#E24B4A' : i % 7 === 6 ? '#3182F6' : 'var(--foreground)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                {evts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {[...new Set(evts.map(e => DOT[e.taskType] || '#3182F6'))].slice(0, 3).map((c, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : c, opacity: evts.every(e => e.isDone === 'Y') ? 0.4 : 1 }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selDate && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] font-bold mb-2">{Number(selDate.split('-')[1])}월 {Number(selDate.split('-')[2])}일 {selDow}요일{selEvents.length > 0 ? ` · ${selEvents.length}건` : ''}</p>
          {selEvents.length === 0 ? <p className="text-[11px] text-[var(--sub)]">일정 없음</p> : (
            <div className="flex flex-col gap-1.5">
              {selEvents.map((e, i) => {
                const tp = getType(e.taskType)
                const b = BADGE[tp] || BADGE['용역']
                return (
                  <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-xl border border-[var(--border)]" style={{ borderLeft: `3px solid ${DOT[e.taskType] || '#3182F6'}` }}>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold">{e.houseName}</p>
                      <p className="text-[11px] text-[var(--sub)]">{e.name} · {e.taskType}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: b.bg, color: b.color }}>{tp}</span>
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
