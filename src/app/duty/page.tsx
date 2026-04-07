'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Check, AlertTriangle, Plus, X, Loader2, Calendar } from 'lucide-react'
import DutyCalendar from '@/components/ui/DutyCalendar'

interface DutyItem {
  id: string; houseName: string; tenantId: string; tenantName: string; roomCode: string;
  weekStart: string; weekEnd: string; isDone: boolean; doneAt: string; hasFine: boolean; note: string;
}
interface HouseItem { id: string; name: string; district: string }

function formatWeek(ws: string, we: string) {
  const s = new Date(ws), e = new Date(we)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${s.getMonth() + 1}/${s.getDate()}(${days[s.getDay()]}) ~ ${e.getMonth() + 1}/${e.getDate()}(${days[e.getDay()]})`
}

function getMonday(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export default function DutyPage() {
  const [houses, setHouses] = useState<HouseItem[]>([])
  const [selectedHouse, setSelectedHouse] = useState('')
  const [duties, setDuties] = useState<DutyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  useEffect(() => {
    fetch('/api/houses').then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHouses(d) })
      .catch(() => {})
  }, [])

  function fetchDuties(hn: string) {
    if (!hn) return
    setLoading(true)
    fetch(`/api/duty?houseName=${encodeURIComponent(hn)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDuties(d.sort((a: DutyItem, b: DutyItem) => a.weekStart.localeCompare(b.weekStart))) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (selectedHouse) fetchDuties(selectedHouse) }, [selectedHouse])

  const today = new Date().toISOString().split('T')[0]
  const thisMonday = getMonday(new Date()).toISOString().split('T')[0]

  const thisWeekDuty = duties.find(d => d.weekStart === thisMonday)
  const fineCount = duties.filter(d => d.hasFine).length
  const activeTenantCount = new Set(duties.filter(d => d.tenantId).map(d => d.tenantId)).size

  async function toggleDone(d: DutyItem) {
    await fetch(`/api/duty/${d.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: !d.isDone }),
    })
    setDuties(prev => prev.map(x => x.id === d.id ? { ...x, isDone: !d.isDone, doneAt: !d.isDone ? today : '' } : x))
  }

  async function toggleFine(d: DutyItem) {
    await fetch(`/api/duty/${d.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasFine: !d.hasFine }),
    })
    setDuties(prev => prev.map(x => x.id === d.id ? { ...x, hasFine: !d.hasFine } : x))
  }

  function getDutyStatus(d: DutyItem) {
    if (d.note === '청소용역') return { label: '용역', variant: 'gray' as const }
    if (d.isDone) return { label: '완료', variant: 'green' as const }
    if (d.weekStart === thisMonday) return { label: '이번주', variant: 'blue' as const }
    if (d.weekStart > thisMonday && d.weekStart <= new Date(new Date(thisMonday).getTime() + 7 * 86400000).toISOString().split('T')[0])
      return { label: '다음주', variant: 'amber' as const }
    if (d.weekStart < thisMonday) return { label: '미완료', variant: 'red' as const }
    return { label: '예정', variant: 'gray' as const }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="청소 당번" />

      <DutyCalendar houseName={selectedHouse || undefined} />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* House Select */}
        <select value={selectedHouse} onChange={e => setSelectedHouse(e.target.value)}
          className="w-full px-4 py-3 mt-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none">
          <option value="">지점 선택</option>
          {houses.map(h => <option key={h.id} value={h.name}>{h.name} ({h.district})</option>)}
        </select>

        {selectedHouse && !loading && (
          <>
            {/* Summary */}
            <div className="flex gap-2.5 mt-4">
              <div className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 text-center">
                <p className="text-[10px] text-[var(--sub)]">이번주</p>
                <p className={`text-[16px] font-bold ${thisWeekDuty?.isDone ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
                  {thisWeekDuty ? (thisWeekDuty.isDone ? '완료' : '미완료') : '-'}
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 text-center">
                <p className="text-[10px] text-[var(--sub)]">벌금</p>
                <p className="text-[16px] font-bold text-[var(--red)]">{fineCount}건</p>
              </div>
              <div className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 text-center">
                <p className="text-[10px] text-[var(--sub)]">입주자</p>
                <p className="text-[16px] font-bold">{activeTenantCount}명</p>
              </div>
            </div>

            {/* This Week Highlight */}
            {thisWeekDuty && thisWeekDuty.tenantId && (
              <div className={`rounded-2xl p-5 mt-4 ${thisWeekDuty.isDone ? 'bg-[var(--green)]' : 'bg-[#3182F6]'}`}>
                <p className="text-[12px] text-white/70">이번주 당번</p>
                <p className="text-[22px] font-bold text-white mt-1">{thisWeekDuty.tenantName}</p>
                <p className="text-[12px] text-white/60 mt-0.5">{thisWeekDuty.roomCode}</p>
                <p className="text-[12px] text-white/70 mt-2">
                  <Calendar size={11} className="inline mr-1" />
                  {formatWeek(thisWeekDuty.weekStart, thisWeekDuty.weekEnd)}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => toggleDone(thisWeekDuty)}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 ${
                      thisWeekDuty.isDone ? 'bg-white/30 text-white' : 'bg-white text-[#3182F6]'
                    }`}>
                    <Check size={14} /> {thisWeekDuty.isDone ? '완료 취소' : '완료 처리'}
                  </button>
                  <button onClick={() => toggleFine(thisWeekDuty)}
                    className={`px-4 py-2.5 rounded-xl text-[12px] font-bold ${
                      thisWeekDuty.hasFine ? 'bg-[var(--red)] text-white' : 'bg-white/20 text-white'
                    }`}>
                    <AlertTriangle size={14} className="inline mr-1" />
                    {thisWeekDuty.hasFine ? '벌금 취소' : '벌금 3만'}
                  </button>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowGenerate(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--blue)] text-white text-[12px] font-semibold">
                <Plus size={14} /> 당번 자동 생성
              </button>
            </div>

            {/* Duty List */}
            <div className="mt-3 flex flex-col gap-2">
              {duties.map(d => {
                const st = getDutyStatus(d)
                const isSkip = d.note === '청소용역'
                return (
                  <Card key={d.id} className={`px-4 py-3 flex items-center gap-3 ${isSkip ? 'opacity-50' : ''} ${d.isDone ? 'opacity-70' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-[var(--blue)]">
                        {isSkip ? '⏭' : (d.tenantName?.[0] || '?')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold truncate">{isSkip ? '청소용역 (건너뜀)' : d.tenantName}</span>
                        <Chip label={st.label} variant={st.variant} />
                      </div>
                      <p className="text-[11px] text-[var(--sub)] mt-0.5">
                        {d.roomCode ? `${d.roomCode} · ` : ''}{formatWeek(d.weekStart, d.weekEnd)}
                      </p>
                    </div>
                    {!isSkip && !d.isDone && (
                      <button onClick={() => toggleDone(d)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-[10px] font-bold">
                        <Check size={10} className="inline" /> 완료
                      </button>
                    )}
                    {d.hasFine && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--red-light)] text-[var(--red)] text-[10px] font-bold">벌금</span>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Fine List */}
            {fineCount > 0 && (
              <div className="mt-5">
                <h3 className="text-[14px] font-bold mb-2">벌금 내역</h3>
                <Card className="px-4 py-3">
                  {duties.filter(d => d.hasFine).map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <div>
                        <span className="text-[13px] font-semibold">{d.tenantName}</span>
                        <span className="text-[11px] text-[var(--sub)] ml-2">{formatWeek(d.weekStart, d.weekEnd)}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[var(--red)]">30,000원</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </>
        )}

        {loading && <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>}
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateModal houseName={selectedHouse}
          onClose={() => setShowGenerate(false)}
          onDone={() => { setShowGenerate(false); fetchDuties(selectedHouse) }}
        />
      )}
    </div>
  )
}

function GenerateModal({ houseName, onClose, onDone }: {
  houseName: string; onClose: () => void; onDone: () => void
}) {
  const [weeks, setWeeks] = useState('12')
  const [workerWeeks, setWorkerWeeks] = useState<string[]>([])
  const [workerInput, setWorkerInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function addWorkerWeek() {
    if (workerInput && !workerWeeks.includes(workerInput)) {
      setWorkerWeeks([...workerWeeks, workerInput])
      setWorkerInput('')
    }
  }

  async function handleGenerate() {
    setSubmitting(true)
    await fetch('/api/duty/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ houseName, weeksAhead: Number(weeks) || 12, workerWeeks }),
    })
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[90%] max-w-[380px] bg-[var(--bg)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold">당번 자동 생성</h3>
          <button onClick={onClose}><X size={18} className="text-[var(--sub)]" /></button>
        </div>
        <p className="text-[13px] text-[var(--sub)] mb-3">{houseName} 지점</p>

        <label className="text-[12px] font-semibold block mb-1">주차 수</label>
        <input type="number" value={weeks} onChange={e => setWeeks(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none mb-3" />

        <label className="text-[12px] font-semibold block mb-1">청소 용역 주 (월요일 날짜)</label>
        <div className="flex gap-2 mb-2">
          <input type="date" value={workerInput} onChange={e => setWorkerInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[13px] outline-none" />
          <button onClick={addWorkerWeek} className="px-3 py-2 rounded-xl bg-[var(--blue)] text-white text-[12px] font-bold">추가</button>
        </div>
        {workerWeeks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {workerWeeks.map(w => (
              <span key={w} className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] flex items-center gap-1">
                {w}
                <button onClick={() => setWorkerWeeks(prev => prev.filter(x => x !== w))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <button onClick={handleGenerate} disabled={submitting}
          className="w-full mt-2 py-3 rounded-xl text-[14px] font-semibold bg-[var(--blue)] text-white flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {submitting ? '생성 중...' : '생성하기'}
        </button>
      </div>
    </div>
  )
}
