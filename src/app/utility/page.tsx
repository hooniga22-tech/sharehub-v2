'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { useSheets } from '@/hooks/useSheets'
import { ChevronLeft, ChevronRight, X, Zap, Flame, Droplets, Wifi, GlassWater, SprayCan, MoreHorizontal } from 'lucide-react'

interface UtilityRow {
  _rowIndex: number; id: string; houseId: string; houseName: string;
  year: number; month: number;
  electricity: number; gas: number; water: number; internet: number;
  waterPurifier: number; cleaning: number; others: number;
  memo: string; createdAt: string;
}

const fields = [
  { key: 'electricity', label: '전기', icon: Zap, color: 'var(--amber)' },
  { key: 'gas', label: '가스', icon: Flame, color: 'var(--red)' },
  { key: 'water', label: '수도', icon: Droplets, color: 'var(--blue)' },
  { key: 'internet', label: '인터넷', icon: Wifi, color: 'var(--green)' },
  { key: 'waterPurifier', label: '정수기', icon: GlassWater, color: '#8B5CF6' },
  { key: 'cleaning', label: '청소', icon: SprayCan, color: '#EC4899' },
  { key: 'others', label: '기타', icon: MoreHorizontal, color: 'var(--sub)' },
] as const

function fmt(n: number) { return n.toLocaleString('ko-KR') }

export default function UtilityPage() {
  const { data: houses } = useSheets('지점')
  const [costs, setCosts] = useState<UtilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)
  const [modal, setModal] = useState<{ houseName: string; houseId: string; existing?: UtilityRow } | null>(null)
  const [form, setForm] = useState({ electricity: 0, gas: 0, water: 0, internet: 0, waterPurifier: 0, cleaning: 0, others: 0, memo: '' })
  const [saving, setSaving] = useState(false)

  const now = new Date()
  now.setMonth(now.getMonth() + monthOffset)
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  function fetchCosts() {
    setLoading(true)
    fetch('/api/utility').then(r => r.json()).then(d => setCosts(Array.isArray(d) ? d : [])).catch(() => setCosts([])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchCosts() }, [])

  // 지점 목록: [0]ID [1]지점명
  const houseList = useMemo(() => {
    const seen = new Set<string>()
    return houses.filter(r => { const n = r[1]; if (!n || seen.has(n)) return false; seen.add(n); return true }).map(r => ({ id: r[0], name: r[1] }))
  }, [houses])

  const monthCosts = useMemo(() => costs.filter(c => c.year === year && c.month === month), [costs, year, month])
  const costMap = useMemo(() => {
    const m: Record<string, UtilityRow> = {}
    monthCosts.forEach(c => { m[c.houseName] = c })
    return m
  }, [monthCosts])

  const totalSum = monthCosts.reduce((s, c) => s + c.electricity + c.gas + c.water + c.internet + c.waterPurifier + c.cleaning + c.others, 0)

  function openModal(houseName: string, houseId: string) {
    const existing = costMap[houseName]
    if (existing) {
      setForm({ electricity: existing.electricity, gas: existing.gas, water: existing.water, internet: existing.internet, waterPurifier: existing.waterPurifier, cleaning: existing.cleaning, others: existing.others, memo: existing.memo })
    } else {
      setForm({ electricity: 0, gas: 0, water: 0, internet: 0, waterPurifier: 0, cleaning: 0, others: 0, memo: '' })
    }
    setModal({ houseName, houseId, existing })
  }

  async function handleSave() {
    if (!modal) return
    setSaving(true)
    const payload = { houseName: modal.houseName, houseId: modal.houseId, year, month, ...form }
    if (modal.existing) {
      await fetch(`/api/utility/${modal.existing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/utility', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false)
    setModal(null)
    fetchCosts()
  }

  const formTotal = form.electricity + form.gas + form.water + form.internet + form.waterPurifier + form.cleaning + form.others

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="공과금 관리" />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Month Selector */}
        <div className="flex items-center justify-center gap-5 py-4">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[16px] font-bold">{year}년 {month}월</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl bg-[#3182F6] p-5 mb-4">
          <p className="text-[13px] text-white/80">이번달 공과금 합계</p>
          <p className="text-[26px] font-bold text-white mt-1">{loading ? '...' : `${fmt(totalSum)}원`}</p>
          <p className="text-[12px] text-white/60 mt-1">{monthCosts.length}개 지점 입력 완료 / {houseList.length}개 지점</p>
        </div>

        {/* House List */}
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {houseList.map(h => {
              const c = costMap[h.name]
              const rowTotal = c ? c.electricity + c.gas + c.water + c.internet + c.waterPurifier + c.cleaning + c.others : 0
              return (
                <Card key={h.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-semibold">{h.name}</span>
                    {c ? (
                      <span className="text-[15px] font-bold text-[var(--blue)]">{fmt(rowTotal)}원</span>
                    ) : (
                      <span className="text-[12px] text-[var(--sub)]">미입력</span>
                    )}
                  </div>
                  {c ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--sub)]">
                      {c.electricity > 0 && <span>전기 {fmt(c.electricity)}</span>}
                      {c.gas > 0 && <span>가스 {fmt(c.gas)}</span>}
                      {c.water > 0 && <span>수도 {fmt(c.water)}</span>}
                      {c.internet > 0 && <span>인터넷 {fmt(c.internet)}</span>}
                      {c.waterPurifier > 0 && <span>정수기 {fmt(c.waterPurifier)}</span>}
                      {c.cleaning > 0 && <span>청소 {fmt(c.cleaning)}</span>}
                      {c.others > 0 && <span>기타 {fmt(c.others)}</span>}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--sub)]">이번달 공과금을 입력해주세요</p>
                  )}
                  <button
                    onClick={() => openModal(h.name, h.id)}
                    className={`mt-2.5 w-full py-2 rounded-lg text-[12px] font-semibold ${
                      c ? 'bg-[var(--border)] text-[var(--sub)]' : 'bg-[var(--blue-light)] text-[var(--blue)]'
                    }`}
                  >
                    {c ? '수정' : '입력하기'}
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Tab */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>

      {/* Input Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-[430px] bg-[var(--card)] rounded-t-3xl max-h-[85vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
            </div>
            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[17px] font-bold">{modal.houseName}</h3>
                  <p className="text-[13px] text-[var(--sub)]">{year}년 {month}월 공과금</p>
                </div>
                <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)]">
                  <X size={16} />
                </button>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-3">
                {fields.map(f => {
                  const Icon = f.icon
                  return (
                    <div key={f.key} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: f.color + '18' }}>
                        <Icon size={18} color={f.color} />
                      </div>
                      <span className="text-[13px] font-medium w-12">{f.label}</span>
                      <input
                        type="number"
                        value={form[f.key] || ''}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))}
                        placeholder="0"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[14px] text-right outline-none"
                      />
                      <span className="text-[12px] text-[var(--sub)] w-6">원</span>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="mt-4 p-3 rounded-xl bg-[var(--blue-light)] flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[var(--blue)]">합계</span>
                <span className="text-[17px] font-bold text-[var(--blue)]">{fmt(formTotal)}원</span>
              </div>

              {/* Memo */}
              <div className="mt-3">
                <input
                  value={form.memo}
                  onChange={e => setForm(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="메모 (선택)"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none placeholder:text-[var(--sub)]"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-5 py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white disabled:opacity-50"
              >
                {saving ? '저장 중...' : modal.existing ? '수정하기' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
