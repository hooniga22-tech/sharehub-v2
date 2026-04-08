'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, Check, RotateCcw, Pencil } from 'lucide-react'

interface Schedule {
  id: string; workerName: string; houseName: string; type: string;
  date: string; isDone: boolean; amount: number; memo: string;
}
interface WorkerInfo {
  id: string; name: string; phone: string; account: string;
  field: string; type: string; token: string; defaultAmount: number;
}

function fmt(n: number) { return n.toLocaleString() }

export default function WorkerPortalPage() {
  const params = useParams()
  const token = params.token as string
  const [worker, setWorker] = useState<WorkerInfo | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [editingAmount, setEditingAmount] = useState<string | null>(null)
  const [amountVal, setAmountVal] = useState('')

  function fetchData() {
    fetch(`/api/workers/by-token/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); return }
        setWorker(d.worker)
        setSchedules(d.schedules)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [token])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const threeDaysLater = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0]

  const monthSchedules = useMemo(() => {
    const prefix = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}`
    return schedules.filter(s => s.date?.startsWith(prefix))
  }, [schedules, calMonth])

  const overdue = useMemo(() => monthSchedules.filter(s => !s.isDone && s.date < todayStr), [monthSchedules, todayStr])
  const current = useMemo(() => monthSchedules.filter(s => !s.isDone && s.date >= todayStr && s.date <= threeDaysLater), [monthSchedules, todayStr, threeDaysLater])
  const future = useMemo(() => monthSchedules.filter(s => !s.isDone && s.date > threeDaysLater).sort((a, b) => a.date.localeCompare(b.date)), [monthSchedules, threeDaysLater])
  const done = useMemo(() => monthSchedules.filter(s => s.isDone).sort((a, b) => b.date.localeCompare(a.date)), [monthSchedules])

  const pending = [...overdue, ...current].sort((a, b) => a.date.localeCompare(b.date))

  const thisMonthDone = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth()
    return schedules.filter(s => s.isDone && new Date(s.date).getFullYear() === y && new Date(s.date).getMonth() === m)
  }, [schedules])
  const monthTotal = thisMonthDone.reduce((s, x) => s + x.amount, 0)

  async function toggleDone(id: string, isDone: boolean) {
    if (!isDone && !confirm('완료를 취소할까요? 운영지출에서도 제거됩니다.')) return
    await fetch(`/api/workers/schedule/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone }),
    })
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isDone } : s))
  }

  async function saveAmount(id: string) {
    const val = Number(amountVal) || 0
    await fetch(`/api/workers/schedule/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: val }),
    })
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, amount: val } : s))
    setEditingAmount(null)
  }

  // Calendar
  const calDays = useMemo(() => {
    const { year, month } = calMonth
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startDay = first.getDay()
    const days: (number | null)[] = Array(startDay).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [calMonth])

  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {}
    schedules.forEach(s => {
      if (!s.date) return
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [schedules])

  if (loading) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
  if (notFound || !worker) return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col items-center justify-center px-8 text-center">
      <p className="text-[18px] font-bold text-gray-600">유효하지 않은 링크입니다</p>
      <p className="text-[14px] text-gray-400 mt-1">운영자에게 문의해주세요</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <div className="max-w-[480px] mx-auto px-4 py-5">
        {/* Header */}
        <div className="rounded-2xl bg-[#3182F6] p-5 mb-4">
          <p className="text-[22px] font-bold text-white">{worker.name}님 👋</p>
          <div className="flex gap-4 mt-3 text-[13px] text-white/80">
            <span>완료 <span className="font-bold text-white">{done.length}건</span></span>
            <span>미완료 <span className="font-bold text-white">{pending.length}건</span></span>
            <span>이번달 <span className="font-bold text-white">{fmt(monthTotal)}원</span></span>
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl bg-white p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(p => ({ ...p, month: p.month - 1 < 0 ? 11 : p.month - 1, year: p.month - 1 < 0 ? p.year - 1 : p.year }))}><ChevronLeft size={18} className="text-gray-500" /></button>
            <span className="text-[15px] font-bold">{calMonth.year}년 {calMonth.month + 1}월</span>
            <button onClick={() => setCalMonth(p => ({ ...p, month: p.month + 1 > 11 ? 0 : p.month + 1, year: p.month + 1 > 11 ? p.year + 1 : p.year }))}><ChevronRight size={18} className="text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((day, i) => {
              if (day === null) return <div key={i} className="h-10" />
              const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const daySchedules = schedulesByDate[dateStr] || []
              const hasDone = daySchedules.some(s => s.isDone)
              const hasUndone = daySchedules.some(s => !s.isDone && dateStr <= todayStr)
              const hasFuture = daySchedules.some(s => !s.isDone && dateStr > todayStr)
              let bg = ''
              if (hasUndone) bg = 'bg-red-100'
              else if (hasDone) bg = 'bg-green-100'
              else if (hasFuture) bg = 'bg-blue-50'
              const names = daySchedules.map(s => s.houseName).join('·')
              const firstEvtId = daySchedules[0]?.id
              return (
                <button key={i} onClick={() => {
                  if (firstEvtId) document.getElementById(`card-${firstEvtId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }} className={`h-10 rounded-lg flex flex-col items-center justify-center ${bg}`}>
                  <span className="text-[11px] text-gray-700">{day}</span>
                  {names && <span className="text-[7px] text-gray-500 truncate max-w-full px-0.5">{names}</span>}
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 mt-2 text-[9px] text-gray-400">
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-300 mr-0.5" />완료</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-300 mr-0.5" />미완료</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-200 mr-0.5" />예정</span>
          </div>
        </div>

        {/* Section 1: Pending */}
        {pending.length > 0 && (
          <div className="mb-4">
            <p className="text-[15px] font-bold text-[#F04452] mb-2">❗ 지금 처리하세요</p>
            {pending.map(s => (
              <div key={s.id} id={`card-${s.id}`} className="rounded-2xl bg-white border-l-4 border-l-[#F04452] p-5 mb-3">
                {s.memo && <MemoBubble text={s.memo} />}
                <p className="text-[13px] font-bold text-[#F04452]">{s.date}</p>
                <p className="text-[26px] font-bold mt-1">{s.houseName}</p>
                <p className="text-[16px] text-gray-500">{s.type}</p>
                <div className="flex items-center gap-2 mt-2">
                  {editingAmount === s.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="number" value={amountVal} onChange={e => setAmountVal(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-[18px] font-bold outline-none" />
                      <button onClick={() => saveAmount(s.id)} className="px-3 py-2 rounded-xl bg-[#3182F6] text-white text-[14px] font-bold">저장</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[22px] font-bold">{fmt(s.amount)}원</span>
                      <button onClick={() => { setEditingAmount(s.id); setAmountVal(String(s.amount)) }}
                        className="flex items-center gap-1 text-[12px] text-[#3182F6] font-medium">
                        <Pencil size={11} /> 금액수정
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => toggleDone(s.id, true)}
                  className="w-full mt-3 py-4 rounded-xl bg-[#F04452] text-white text-[20px] font-bold flex items-center justify-center gap-2">
                  <Check size={22} /> 완료 처리
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Section 2: Future */}
        {future.length > 0 && (
          <div className="mb-4">
            <p className="text-[15px] font-bold text-[#3182F6] mb-2">📅 앞으로 예정</p>
            {future.map(s => (
              <div key={s.id} id={`card-${s.id}`} className="rounded-2xl bg-blue-50 p-4 mb-2">
                {s.memo && <MemoBubble text={s.memo} />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-[#3182F6] font-medium">{s.date}</p>
                    <p className="text-[20px] font-bold mt-0.5">{s.houseName}</p>
                    <p className="text-[14px] text-gray-500">{s.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-bold">{fmt(s.amount)}원</p>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">예정</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section 3: Done */}
        {done.length > 0 && (
          <div className="mb-4">
            <p className="text-[15px] font-bold text-gray-500 mb-2">✅ 완료한 일정</p>
            {done.map(s => (
              <div key={s.id} id={`card-${s.id}`} className="rounded-2xl bg-white p-3.5 mb-2 opacity-65">
                {s.memo && <div className="mb-1.5 px-2 py-1 rounded bg-gray-50 text-[10px] text-gray-400">{s.memo}</div>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-gray-400">{s.date}</p>
                    <p className="text-[17px] font-bold">{s.houseName}</p>
                    <p className="text-[12px] text-gray-400">{s.type} · {fmt(s.amount)}원</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold">완료 ✓</span>
                    <button onClick={() => toggleDone(s.id, false)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-[10px] font-bold">
                      <RotateCcw size={10} /> 되돌리기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4">
          <p className="text-[12px] text-green-700">🔗 완료 처리 시 운영지출에 자동 반영됩니다</p>
        </div>

        <footer className="text-center py-4">
          <p className="text-[11px] text-gray-400">© 2026 ShareHub</p>
        </footer>
      </div>
    </div>
  )
}

function MemoBubble({ text }: { text: string }) {
  return (
    <div className="mb-3 relative">
      <div className="absolute top-0 left-0" style={{ width: 0, height: 0, borderRight: '8px solid #F7F8FA', borderBottom: '8px solid transparent' }} />
      <div className="ml-2 px-3.5 py-3" style={{ background: '#F7F8FA', borderRadius: '0 14px 14px 14px', border: '0.5px solid var(--border, #e5e5e5)' }}>
        <p className="text-[12px] text-gray-400 mb-1">운영자</p>
        <p className="text-[16px] leading-[1.65]">{text}</p>
      </div>
    </div>
  )
}
