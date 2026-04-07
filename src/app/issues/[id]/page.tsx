'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, Play, Pause, RotateCcw, Loader2 } from 'lucide-react'

interface IssueDetail {
  rowIndex: number; id: string; houseName: string; roomCode: string;
  title: string; content: string; category: string; status: string;
  assignee: string; createdAt: string; completedAt: string; cost: number; memo: string;
}

const statusVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  '접수': 'red', '진행중': 'amber', '완료': 'green', '보류': 'gray',
}
const categoryVariant: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  '수리': 'blue', '청소': 'green', '민원': 'amber', '교체': 'blue', '기타': 'gray',
}

const WORKFLOW: Record<string, { label: string; next: string; icon: typeof CheckCircle; color: string; bg: string }[]> = {
  '접수': [
    { label: '진행 시작', next: '진행중', icon: Play, color: 'var(--blue)', bg: 'var(--blue-light)' },
    { label: '보류', next: '보류', icon: Pause, color: 'var(--sub)', bg: '#F2F2F2' },
    { label: '바로 해결', next: '완료', icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
  ],
  '진행중': [
    { label: '해결 완료', next: '완료', icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
    { label: '보류', next: '보류', icon: Pause, color: 'var(--sub)', bg: '#F2F2F2' },
  ],
  '보류': [
    { label: '재개', next: '진행중', icon: Play, color: 'var(--blue)', bg: 'var(--blue-light)' },
    { label: '해결 완료', next: '완료', icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
  ],
  '완료': [
    { label: '재오픈', next: '접수', icon: RotateCcw, color: 'var(--red)', bg: 'var(--red-light)' },
  ],
}

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [issue, setIssue] = useState<IssueDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editMemo, setEditMemo] = useState(false)
  const [memo, setMemo] = useState('')
  const [editCost, setEditCost] = useState(false)
  const [costVal, setCostVal] = useState('')

  useEffect(() => {
    fetch(`/api/issues/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setIssue(null); return }
        setIssue(d)
        setMemo(d.memo || '')
        setCostVal(String(d.cost || ''))
      })
      .catch(() => setIssue(null))
      .finally(() => setLoading(false))
  }, [id])

  async function changeStatus(next: string) {
    if (!issue || updating) return
    setUpdating(true)
    await fetch(`/api/issues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setIssue({ ...issue, status: next, completedAt: next === '완료' ? new Date().toISOString().slice(0, 10) : issue.completedAt })
    setUpdating(false)
  }

  async function saveMemo() {
    if (!issue) return
    await fetch(`/api/issues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo }),
    })
    setIssue({ ...issue, memo })
    setEditMemo(false)
  }

  async function saveCost() {
    if (!issue) return
    const val = Number(costVal) || 0
    await fetch(`/api/issues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost: val }),
    })
    setIssue({ ...issue, cost: val })
    setEditCost(false)
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="이슈 상세" />
      <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
    </div>
  )

  if (!issue) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="이슈 상세" />
      <p className="text-[13px] text-[var(--sub)] py-8 text-center">이슈를 찾을 수 없습니다</p>
    </div>
  )

  const actions = WORKFLOW[issue.status] || []

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="이슈 상세" />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Status + Category */}
        <div className="flex items-center gap-2 mt-4">
          <Chip label={issue.status} variant={statusVariant[issue.status] || 'gray'} />
          <Chip label={issue.category} variant={categoryVariant[issue.category] || 'gray'} />
        </div>

        {/* Title */}
        <h1 className="text-[20px] font-bold mt-3">{issue.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2 text-[12px] text-[var(--sub)]">
          <span>{issue.houseName} {issue.roomCode}</span>
          {issue.assignee && <span>· 담당: {issue.assignee}</span>}
          <span>· {issue.createdAt}</span>
        </div>

        {/* Content */}
        {issue.content && (
          <Card className="mt-4 px-4 py-3.5">
            <p className="text-[13px] font-semibold text-[var(--sub)] mb-1">내용</p>
            <p className="text-[14px] whitespace-pre-wrap">{issue.content}</p>
          </Card>
        )}

        {/* Cost */}
        <Card className="mt-3 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[var(--sub)]">처리 비용</p>
            {!editCost ? (
              <button onClick={() => setEditCost(true)} className="text-[12px] text-[var(--blue)] font-semibold">수정</button>
            ) : (
              <button onClick={saveCost} className="text-[12px] text-[var(--blue)] font-semibold">저장</button>
            )}
          </div>
          {editCost ? (
            <input type="number" value={costVal} onChange={e => setCostVal(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[14px] outline-none" />
          ) : (
            <p className="text-[16px] font-bold mt-0.5">{(issue.cost || 0).toLocaleString()}원</p>
          )}
        </Card>

        {/* Memo */}
        <Card className="mt-3 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[var(--sub)]">메모</p>
            {!editMemo ? (
              <button onClick={() => setEditMemo(true)} className="text-[12px] text-[var(--blue)] font-semibold">수정</button>
            ) : (
              <button onClick={saveMemo} className="text-[12px] text-[var(--blue)] font-semibold">저장</button>
            )}
          </div>
          {editMemo ? (
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[14px] outline-none resize-none" />
          ) : (
            <p className="text-[14px] mt-0.5">{issue.memo || '-'}</p>
          )}
        </Card>

        {/* Completion info */}
        {issue.completedAt && (
          <p className="text-[12px] text-[var(--sub)] mt-3 text-center">완료일: {issue.completedAt}</p>
        )}

        {/* Workflow Actions */}
        <div className="flex flex-col gap-2 mt-5">
          {actions.map(a => {
            const Icon = a.icon
            return (
              <button key={a.next} onClick={() => changeStatus(a.next)} disabled={updating}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-[14px] transition-colors"
                style={{ backgroundColor: a.bg, color: a.color }}>
                {updating ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                {a.label}
              </button>
            )
          })}
        </div>

        <button onClick={() => router.push('/issues')}
          className="w-full mt-3 py-3 rounded-xl text-[13px] font-medium text-[var(--sub)] bg-[var(--card)] border border-[var(--border)]">
          목록으로
        </button>
      </div>
    </div>
  )
}
