'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Plus, Copy, Check, ExternalLink, X } from 'lucide-react'

interface InvestorItem {
  id: string; name: string; houseName: string; ratio: number;
  token: string; phone: string; memo: string; portalUrl: string;
}

interface HouseItem { id: string; name: string; district: string }

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<InvestorItem[]>([])
  const [houses, setHouses] = useState<HouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch('/api/investors').then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
    ]).then(([inv, h]) => {
      if (Array.isArray(inv)) setInvestors(inv)
      if (Array.isArray(h)) setHouses(h)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="투자자 관리"
        right={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 text-[14px] font-semibold text-[var(--blue)]">
            <Plus size={16} /> 추가
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <p className="text-[13px] text-[var(--sub)] mt-2 mb-3">전체 {investors.length}명</p>

        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : investors.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">등록된 투자자가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {investors.map(inv => (
              <Card key={inv.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{inv.name}</span>
                    <Chip label={inv.houseName} variant="blue" />
                  </div>
                  <span className="text-[13px] font-bold text-[var(--blue)]">{inv.ratio}%</span>
                </div>
                {inv.phone && <p className="text-[12px] text-[var(--sub)] mb-2">{inv.phone}</p>}
                <div className="flex gap-2">
                  <button onClick={() => copyUrl(inv.portalUrl, inv.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold bg-[var(--blue-light)] text-[var(--blue)]">
                    {copied === inv.id ? <Check size={12} /> : <Copy size={12} />}
                    {copied === inv.id ? '복사됨!' : '링크 복사'}
                  </button>
                  <a href={inv.portalUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--sub)]">
                    <ExternalLink size={12} /> 열기
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateSheet
          houses={houses}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchData() }}
        />
      )}
    </div>
  )
}

function CreateSheet({ houses, onClose, onCreated }: {
  houses: HouseItem[]; onClose: () => void; onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [houseName, setHouseName] = useState('')
  const [ratio, setRatio] = useState('70')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !houseName) return
    setSubmitting(true)
    await fetch('/api/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), houseName, ratio: Number(ratio) || 0, phone, memo }),
    })
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-[var(--bg)] rounded-t-2xl max-h-[85vh] overflow-y-auto pb-8">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-[17px] font-bold">투자자 추가</h2>
          <button onClick={onClose}><X size={20} color="var(--sub)" /></button>
        </div>
        <div className="px-5 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">투자자명 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="이름"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">담당 지점 *</label>
            <select value={houseName} onChange={e => setHouseName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none">
              <option value="">선택</option>
              {houses.map(h => <option key={h.id} value={h.name}>{h.name} ({h.district})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">투자비율 (%)</label>
            <input type="number" value={ratio} onChange={e => setRatio(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">연락처</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold mb-1.5 block">메모</label>
            <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />
          </div>
          <button onClick={handleSubmit} disabled={!name.trim() || !houseName || submitting}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
              name.trim() && houseName ? 'bg-[var(--blue)] text-white' : 'bg-[var(--border)] text-[var(--sub)]'
            }`}>
            {submitting ? '등록 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
