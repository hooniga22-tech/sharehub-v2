'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { X, Plus, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import WorkerCalendar from '@/components/ui/WorkerCalendar'
import Link from 'next/link'

const WORKERS = [
  { name: '이인실', token: 'b775a18c876534ee', role: '청소' },
  { name: '이미경', token: '4b594c769b0aa6ab', role: '청소' },
  { name: '이한나', token: 'e8f27ed8eab30c68', role: '청소' },
  { name: '진진수', token: '2d79c5c07cfb8e4c', role: '수리' },
  { name: '김기진', token: '9a495582ad427525', role: '수리' },
]

interface WorkerItem {
  _rowIndex: number; id: string; name: string; houseName: string;
  taskType: string; scheduledDate: string; isDone: string;
  payment: number; issueId: string; memo: string; token: string; createdAt: string;
}

const DONE_FILTERS = ['전체', '미완료', '완료']
const TASK_TYPES = ['전체', '퇴실청소', '정기청소', '수리', '기타']
const CREATE_TASK_TYPES = ['퇴실청소', '정기청소', '수리', '기타']

const taskVariant: Record<string, 'blue' | 'green' | 'red' | 'gray'> = {
  '퇴실청소': 'blue', '정기청소': 'green', '수리': 'red', '기타': 'gray',
}

function toMan(n: number) {
  const m = Math.round(n / 10000)
  return m > 0 ? `${m.toLocaleString()}만` : n.toLocaleString()
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([])
  const [houseNames, setHouseNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [doneFilter, setDoneFilter] = useState('전체')
  const [taskFilter, setTaskFilter] = useState('전체')
  const [showCreate, setShowCreate] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<WorkerItem | null>(null)

  function fetchWorkers() {
    setLoading(true)
    fetch('/api/workers')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWorkers(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWorkers()
    fetch('/api/workers/by-token/list-all').catch(() => {})
    fetch('/api/sheets?sheet=지점')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setHouseNames(d.map((r: string[]) => r[1]?.trim()).filter(Boolean))
      })
      .catch(() => {})
  }, [])

  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1

  const thisMonthWorkers = useMemo(() =>
    workers.filter(w => {
      if (!w.scheduledDate) return false
      const [y, m] = w.scheduledDate.split('-').map(Number)
      return y === curYear && m === curMonth
    }), [workers, curYear, curMonth])

  const thisMonthPending = thisMonthWorkers.filter(w => w.isDone !== 'Y').length
  const thisMonthPayment = thisMonthWorkers.reduce((s, w) => s + w.payment, 0)

  const sorted = useMemo(() =>
    [...workers].sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')),
    [workers])

  const filtered = useMemo(() =>
    sorted.filter(w => {
      if (doneFilter === '미완료' && w.isDone === 'Y') return false
      if (doneFilter === '완료' && w.isDone !== 'Y') return false
      if (taskFilter !== '전체' && w.taskType !== taskFilter) return false
      return true
    }), [sorted, doneFilter, taskFilter])

  const counts = useMemo(() => ({
    '전체': workers.length,
    '미완료': workers.filter(w => w.isDone !== 'Y').length,
    '완료': workers.filter(w => w.isDone === 'Y').length,
  }), [workers])

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="용역 관리"
        right={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-[14px] font-semibold text-[var(--blue)]">
            <Plus size={16} /> 일정 등록
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-4 px-5 mt-3">
        {WORKERS.map(w => (
          <Link key={w.token} href={`/worker/${w.token}`}
            className="bg-[var(--card)] rounded-2xl px-4 py-3 flex items-center gap-3 border border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[#EBF3FE] flex items-center justify-center text-[15px] font-bold text-[#0C447C]">
              {w.name[0]}
            </div>
            <div>
              <p className="text-[14px] font-bold">{w.name}</p>
              <p className="text-[12px] text-[var(--sub)]">{w.role}</p>
            </div>
          </Link>
        ))}
      </div>

      <WorkerCalendar />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Summary Cards */}
        <div className="flex gap-3 mt-3">
          <div className="flex-1 rounded-2xl bg-[var(--amber-light)] p-4">
            <p className="text-[11px] text-[var(--amber)] font-medium">이번달 미완료</p>
            <p className="text-[22px] font-bold text-[var(--amber)] mt-0.5">{thisMonthPending}건</p>
          </div>
          <div className="flex-1 rounded-2xl bg-[var(--blue-light)] p-4">
            <p className="text-[11px] text-[var(--blue)] font-medium">이번달 정산합계</p>
            <p className="text-[22px] font-bold text-[var(--blue)] mt-0.5">{toMan(thisMonthPayment)}원</p>
          </div>
        </div>

        {/* Done Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
          {DONE_FILTERS.map(f => (
            <button key={f} onClick={() => setDoneFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                doneFilter === f ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
              }`}>
              {f}
              <span className={`text-[11px] ${doneFilter === f ? 'text-white/70' : 'text-[var(--sub)]'}`}>
                {counts[f as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Task Type Filter */}
        <div className="flex gap-2 mt-2 pb-2 overflow-x-auto no-scrollbar">
          {TASK_TYPES.map(t => (
            <button key={t} onClick={() => setTaskFilter(t)}
              className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                taskFilter === t ? 'bg-[var(--foreground)] text-[var(--bg)]' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
              }`}>{t}</button>
          ))}
        </div>

        {/* Worker List */}
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">용역 일정이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2.5 mt-1">
            {filtered.map(w => (
              <Card key={w.id} className={`px-4 py-3.5 ${w.isDone === 'Y' ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Chip label={w.taskType || '기타'} variant={taskVariant[w.taskType] || 'gray'} />
                  </div>
                  <Chip
                    label={w.isDone === 'Y' ? '완료' : '대기중'}
                    variant={w.isDone === 'Y' ? 'green' : 'amber'}
                  />
                </div>
                <p className="text-[15px] font-bold">{w.name}</p>
                <p className="text-[12px] text-[var(--sub)] mt-0.5">{w.houseName}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--sub)]">
                  {w.scheduledDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {w.scheduledDate}
                    </span>
                  )}
                  {w.payment > 0 && <span>{w.payment.toLocaleString()}원</span>}
                  {w.issueId && <span>이슈: {w.issueId}</span>}
                </div>
                {w.isDone !== 'Y' && (
                  <button onClick={() => setCompleteTarget(w)}
                    className="mt-2.5 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-[11px] font-bold">
                    <CheckCircle size={12} /> 완료 처리
                  </button>
                )}
                <MemoField workerId={w.id} memo={w.memo} onSaved={(memo) => setWorkers(prev => prev.map(x => x.id === w.id ? { ...x, memo } : x))} />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Bottom Sheet */}
      {showCreate && (
        <CreateSheet
          houseNames={houseNames}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchWorkers() }}
        />
      )}

      {/* Complete Confirmation Modal */}
      {completeTarget && (
        <CompleteModal
          worker={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onDone={() => { setCompleteTarget(null); fetchWorkers() }}
        />
      )}
    </div>
  )
}

/* ── Create Bottom Sheet ── */
function CreateSheet({ houseNames, onClose, onCreated }: {
  houseNames: string[]; onClose: () => void; onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [houseName, setHouseName] = useState('')
  const [taskType, setTaskType] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [payment, setPayment] = useState('')
  const [issueId, setIssueId] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !taskType) return
    setSubmitting(true)
    await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), houseName, taskType, scheduledDate,
        payment: Number(payment) || 0, issueId, memo,
      }),
    })
    onCreated()
  }

  const canSubmit = name.trim() && taskType

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-[var(--bg)] rounded-t-2xl max-h-[85vh] overflow-y-auto pb-8">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-[17px] font-bold">일정 등록</h2>
          <button onClick={onClose}><X size={20} color="var(--sub)" /></button>
        </div>
        <div className="px-5 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">담당자명 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="담당자 이름"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">지점명</label>
            <select value={houseName} onChange={e => setHouseName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none">
              <option value="">선택</option>
              {houseNames.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">작업종류 *</label>
            <div className="flex flex-wrap gap-2">
              {CREATE_TASK_TYPES.map(t => (
                <button key={t} onClick={() => setTaskType(t)}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
                    taskType === t
                      ? 'border-[var(--blue)] bg-[var(--blue-light)] text-[var(--blue)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--sub)]'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">예정일</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">정산금액 (원)</label>
            <input type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">연결 이슈ID (선택)</label>
            <input value={issueId} onChange={e => setIssueId(e.target.value)} placeholder="예: I..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">메모 (선택)</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모" rows={2}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none resize-none placeholder:text-[var(--sub)]" />
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
              canSubmit ? 'bg-[var(--blue)] text-white' : 'bg-[var(--border)] text-[var(--sub)]'
            }`}>
            {submitting ? '등록 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Complete Confirmation Modal ── */
function CompleteModal({ worker, onClose, onDone }: {
  worker: WorkerItem; onClose: () => void; onDone: () => void
}) {
  const [payment, setPayment] = useState(String(worker.payment || ''))
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    await fetch(`/api/workers/${worker.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: 'Y', payment: Number(payment) || 0 }),
    })
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[90%] max-w-[360px] bg-[var(--bg)] rounded-2xl p-6">
        <h3 className="text-[16px] font-bold mb-1">완료 처리</h3>
        <p className="text-[13px] text-[var(--sub)] mb-4">{worker.name} · {worker.houseName} · {worker.taskType}</p>
        <label className="text-[13px] font-semibold mb-1.5 block">정산금액 (원)</label>
        <input type="number" value={payment} onChange={e => setPayment(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--sub)]">
            취소
          </button>
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-[var(--green)] text-white flex items-center justify-center gap-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Memo Field ── */
function MemoField({ workerId, memo, onSaved }: { workerId: string; memo: string; onSaved: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(memo || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/workers/schedule/${workerId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo: val }),
    }).catch(() => {})
    setSaving(false)
    setEditing(false)
    onSaved(val)
  }

  if (editing) {
    return (
      <div className="mt-2">
        <textarea value={val} onChange={e => setVal(e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[12px] outline-none resize-none placeholder:text-[var(--sub)]"
          placeholder="전달사항 입력" />
        <div className="flex gap-1.5 mt-1">
          <button onClick={save} disabled={saving} className="px-3 py-1 rounded-lg bg-[var(--blue)] text-white text-[10px] font-bold">
            {saving ? '...' : '저장'}
          </button>
          <button onClick={() => { setEditing(false); setVal(memo || '') }} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold">취소</button>
        </div>
      </div>
    )
  }

  if (memo) {
    return (
      <button onClick={() => setEditing(true)}
        className="mt-2 w-full text-left px-3 py-2 rounded-lg text-[11px]"
        style={{ background: '#FEF3E2', color: '#633806' }}>
        📝 {memo}
      </button>
    )
  }

  return (
    <button onClick={() => setEditing(true)}
      className="mt-2 text-[10px] text-[var(--sub)] underline">
      전달사항 추가
    </button>
  )
}
