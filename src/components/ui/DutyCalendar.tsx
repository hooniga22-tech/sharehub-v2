'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DutyItem { id: string; houseName: string; tenantName: string; weekStart: string; weekEnd: string; isDone: boolean; note: string }

const BADGE = { bg: '#F0EFFE', color: '#4830b8' }
const FILTERS = ['전체', '미완료', '완료', '지점별']

export default function DutyCalendar({ houseName }: { houseName?: string }) {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [filter, setFilter] = useState('전체')
  const [selDate, setSelDate] = useState<string | null>(null)
  const [duties, setDuties] = useState<DutyItem[]>([])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    const url = houseName ? `/api/duty?houseName=${encodeURIComponent(houseName)}` : '/api/duty'
    fetch(url).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDuties(d) })
      .catch(() => {})
  }, [houseName])

  // Map duties to daily entries (weekStart ~ weekEnd range)
  const dailyDuties = useMemo(() => {
    const m: Record<string, DutyItem[]> = {}
    const prefix = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}`
    duties.forEach(d => {
      if (!d.weekStart) return
      // Add to each day in the week that falls in current month
      const start = new Date(d.weekStart)
      const end = d.weekEnd ? new Date(d.weekEnd) : new Date(start.getTime() + 6 * 86400000)
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        const ds = dt.toISOString().split('T')[0]
        if (ds.startsWith(prefix)) {
          if (!m[ds]) m[ds] = []
          if (!m[ds].find(x => x.id === d.id)) m[ds].push(d)
        }
      }
    })
    return m
  }, [duties, cur])

  const monthDuties = useMemo(() => {
    const prefix = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}`
    return duties.filter(d => d.weekStart?.startsWith(prefix))
  }, [duties, cur])

  const filtered = useMemo(() => {
    if (filter === '전체') return monthDuties
    if (filter === '미완료') return monthDuties.filter(d => !d.isDone && d.note !== '청소용역')
    if (filter === '완료') return monthDuties.filter(d => d.isDone)
    return monthDuties
  }, [monthDuties, filter])

  const filteredDaily = useMemo(() => {
    if (filter === '전체') return dailyDuties
    const ids = new Set(filtered.map(d => d.id))
    const m: Record<string, DutyItem[]> = {}
    Object.entries(dailyDuties).forEach(([date, items]) => {
      const f = items.filter(i => ids.has(i.id))
      if (f.length > 0) m[date] = f
    })
    return m
  }, [dailyDuties, filtered, filter])

  const thisWeekPending = monthDuties.filter(d => {
    if (d.isDone || d.note === '청소용역') return false
    const ws = new Date(d.weekStart)
    const we = d.weekEnd ? new Date(d.weekEnd) : new Date(ws.getTime() + 6 * 86400000)
    return today >= ws && today <= we
  }).length

  const calDays = useMemo(() => {
    const first = new Date(cur.year, cur.month, 1)
    const last = new Date(cur.year, cur.month + 1, 0)
    const days: (number | null)[] = Array(first.getDay()).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [cur])

  const selEvents = selDate ? (filteredDaily[selDate] || []) : []
  const daysLabel = ['일', '월', '화', '수', '목', '금', '토']
  const selDow = selDate ? daysLabel[new Date(selDate).getDay()] : ''

  return (
    <div className="mx-5 mt-3 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 pt-4 pb-3" style={{ background: '#6C5CE7' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[18px] font-bold text-white">{cur.month + 1}월 당번</p>
            <p className="text-[12px] text-white/70">이번주 미완료 {thisWeekPending}건</p>
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
              style={filter === f ? { background: '#fff', color: '#6C5CE7' } : { background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2 pb-2">
        <div className="grid grid-cols-7 text-center text-[10px] mb-1">
          {daysLabel.map((d, i) => <span key={d} style={{ color: i === 0 ? '#E24B4A' : i === 6 ? '#6C5CE7' : 'var(--sub)' }}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {calDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-11" />
            const ds = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const evts = filteredDaily[ds] || []
            const isToday = ds === todayStr
            const isSel = ds === selDate
            return (
              <button key={i} onClick={() => setSelDate(isSel ? null : ds)}
                className="h-11 rounded-lg flex flex-col items-center justify-center"
                style={{ background: isToday ? '#6C5CE7' : isSel ? '#F0EFFE' : undefined }}>
                <span className="text-[12px]" style={{ color: isToday ? '#fff' : i % 7 === 0 ? '#E24B4A' : i % 7 === 6 ? '#6C5CE7' : 'var(--foreground)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                {evts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {evts.slice(0, 3).map((_, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : '#6C5CE7' }} />)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selDate && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] font-bold mb-2">{Number(selDate.split('-')[1])}월 {Number(selDate.split('-')[2])}일 {selDow}요일</p>
          {selEvents.length === 0 ? <p className="text-[11px] text-[var(--sub)]">당번 없음</p> : (
            <div className="flex flex-col gap-1.5">
              {selEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-xl border border-[var(--border)]" style={{ borderLeft: '3px solid #6C5CE7' }}>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold">{e.houseName || '-'}</p>
                    <p className="text-[11px] text-[var(--sub)]">{e.note === '청소용역' ? '청소용역 (건너뜀)' : `청소 당번 · ${e.tenantName}`}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={e.isDone ? { background: '#E4F9F0', color: '#0a7a47' } : e.note === '청소용역' ? { background: '#f2f2f2', color: '#888' } : { background: BADGE.bg, color: BADGE.color }}>
                    {e.isDone ? '완료' : e.note === '청소용역' ? '건너뜀' : '미완료'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
