'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { X, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import IssueCalendar from '@/components/ui/IssueCalendar'

interface IssueItem {
  rowIndex: number; id: string; houseName: string; roomCode: string;
  title: string; content: string; category: string; status: string;
  assignee: string; createdAt: string; completedAt: string; cost: number; memo: string;
}
interface HouseInfo { name: string; district: string }

const STATUSES = ['전체', '접수', '진행중', '완료', '보류']
const CATEGORIES = ['전체', '수리', '청소', '민원', '교체', '기타']
const CREATE_CATEGORIES = [
  { value: '수리', desc: '시설물 고장, 파손' },
  { value: '청소', desc: '공용공간, 개인공간' },
  { value: '민원', desc: '소음, 분쟁 등' },
  { value: '교체', desc: '소모품, 가구 교체' },
  { value: '기타', desc: '기타 요청사항' },
]

const statusVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  '접수': 'red', '진행중': 'amber', '완료': 'green', '보류': 'gray',
}
const categoryVariant: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  '수리': 'blue', '청소': 'green', '민원': 'amber', '교체': 'blue', '기타': 'gray',
}

function groupByDistrict(houses: HouseInfo[]) {
  const map: Record<string, string[]> = {}
  houses.forEach(h => {
    const d = h.district || '기타'
    if (!map[d]) map[d] = []
    map[d].push(h.name)
  })
  return map
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueItem[]>([])
  const [houses, setHouses] = useState<HouseInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('전체')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [houseFilter, setHouseFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  function fetchIssues() {
    setLoading(true)
    Promise.all([
      fetch('/api/issues').then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
    ]).then(([d, h]) => {
      setIssues(d.issues || [])
      if (Array.isArray(h)) setHouses(h.map((x: { name: string; district: string }) => ({ name: x.name, district: x.district })))
    }).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchIssues() }, [])

  const byDistrict = useMemo(() => groupByDistrict(houses), [houses])

  const filtered = useMemo(() => {
    return issues.filter(r => {
      if (statusFilter !== '전체' && r.status !== statusFilter) return false
      if (categoryFilter !== '전체' && r.category !== categoryFilter) return false
      if (houseFilter && r.houseName !== houseFilter) return false
      return true
    })
  }, [issues, statusFilter, categoryFilter, houseFilter])

  const openCount = issues.filter(r => r.status !== '완료').length

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="이슈"
        right={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-[14px] font-semibold text-[var(--blue)]">
            <Plus size={16} /> 등록
          </button>
        }
      />

      <IssueCalendar />

      {openCount > 0 && (
        <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-[var(--red-light)] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--red)]">미해결 이슈 {openCount}건</span>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              statusFilter === s ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}>{s}</button>
        ))}
      </div>

      {/* Category + House Filter */}
      <div className="flex gap-2 px-5 pb-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
              categoryFilter === c ? 'bg-[var(--foreground)] text-[var(--bg)]' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}>{c}</button>
        ))}
      </div>

      {/* House Filter (grouped by district) */}
      <div className="px-5 pb-2">
        <select value={houseFilter} onChange={e => setHouseFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[13px] outline-none">
          <option value="">전체 지점</option>
          {Object.entries(byDistrict).sort().map(([district, names]) => (
            <optgroup key={district} label={district}>
              {names.map(n => <option key={n} value={n}>{n}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">이슈가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2.5 mt-1">
            {filtered.map(r => (
              <Link key={r.id} href={`/issues/${r.id}`}>
                <Card className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {r.category && <Chip label={r.category} variant={categoryVariant[r.category] || 'gray'} />}
                    <Chip label={r.status || '접수'} variant={statusVariant[r.status] || 'gray'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold mt-1 flex-1">{r.title}</p>
                    <ChevronRight size={16} color="var(--sub)" />
                  </div>
                  {r.content && <p className="text-[12px] text-[var(--sub)] mt-0.5 line-clamp-2">{r.content}</p>}
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--sub)] flex-wrap">
                    <span>{r.houseName}</span>
                    {r.assignee && <span>· {r.assignee}</span>}
                    {r.cost > 0 && <span>· {r.cost.toLocaleString()}원</span>}
                    {r.createdAt && <span>· {r.createdAt}</span>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>

      {showCreate && (
        <CreateSheet
          houses={houses}
          byDistrict={byDistrict}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchIssues() }}
        />
      )}
    </div>
  )
}

function CreateSheet({ houses, byDistrict, onClose, onCreated }: {
  houses: HouseInfo[]; byDistrict: Record<string, string[]>;
  onClose: () => void; onCreated: () => void;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [houseName, setHouseName] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [assignee, setAssignee] = useState('')
  const [workers, setWorkers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/workers/list').then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWorkers(d) })
      .catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!houseName || !title.trim() || !category) return
    setSubmitting(true)
    await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ houseName, category, title: title.trim(), content, assignee }),
    })
    onCreated()
  }

  const canSubmit = houseName && title.trim() && category

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-[var(--bg)] rounded-t-2xl max-h-[85vh] overflow-y-auto pb-8">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-[17px] font-bold">이슈 등록</h2>
          <button onClick={onClose}><X size={20} color="var(--sub)" /></button>
        </div>

        <div className="px-5 flex flex-col gap-4">
          {/* District Select */}
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">구 선택</label>
            <select value={selectedDistrict} onChange={e => { setSelectedDistrict(e.target.value); setHouseName('') }}
              className="w-full px-4 py-3 rounded-[10px] bg-[var(--card)] border border-[#F2F2F2] text-[14px] outline-none">
              <option value="">구 선택</option>
              {Object.keys(byDistrict).sort().map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* House Select */}
          {selectedDistrict && (
            <div>
              <label className="text-[13px] font-semibold mb-1.5 block">지점</label>
              <select value={houseName} onChange={e => setHouseName(e.target.value)}
                className="w-full px-4 py-3 rounded-[10px] bg-[var(--card)] border border-[#F2F2F2] text-[14px] outline-none">
                <option value="">지점 선택</option>
                {byDistrict[selectedDistrict]?.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CREATE_CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
                    category === c.value
                      ? 'border-[var(--blue)] bg-[var(--blue-light)] text-[var(--blue)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--sub)]'
                  }`}>{c.value}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="이슈 제목"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>

          {/* Content */}
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">내용 (선택)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="상세 내용"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none resize-none placeholder:text-[var(--sub)]" />
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">담당자 (선택)</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] bg-[var(--card)] border border-[#F2F2F2] text-[14px] outline-none">
              <option value="">담당자 선택</option>
              <option value="미배정">미배정</option>
              {workers.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
              canSubmit ? 'bg-[var(--blue)] text-white' : 'bg-[var(--border)] text-[var(--sub)]'
            }`}>
            {submitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
