'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChevronLeft, ChevronRight, Plus, Check, X, Loader2 } from 'lucide-react'

interface OpexItem {
  id: string; houseName: string; category: string; content: string;
  amount: number; assignee: string; date: string; memo: string;
}
interface UtilityItem {
  houseName: string; electricity: number; gas: number; water: number;
  internet: number; waterPurifier: number; cleaning: number; others: number; total: number;
}
interface HouseItem { id: string; name: string; district: string }

const CATEGORIES = ['청소', '수리', '소모품', '쓰레기수거', '쿠팡구매', '기타']
const catColor: Record<string, { bg: string; text: string }> = {
  '청소': { bg: '#EBF3FE', text: '#0C447C' },
  '수리': { bg: '#FEF0F0', text: '#791F1F' },
  '소모품': { bg: '#E8F8EE', text: '#27500A' },
  '쓰레기수거': { bg: '#F2F2F2', text: '#666' },
  '쿠팡구매': { bg: '#FFF3E4', text: '#633806' },
  '기타': { bg: '#F2F2F2', text: '#666' },
}

function fmt(n: number) { return n.toLocaleString() }
function toMan(n: number) { return Math.round(n / 10000).toLocaleString() + '만' }

export default function OpexPage() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [opexItems, setOpexItems] = useState<OpexItem[]>([])
  const [utilityItems, setUtilityItems] = useState<UtilityItem[]>([])
  const [houses, setHouses] = useState<HouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = target.getFullYear()
  const month = target.getMonth() + 1

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch(`/api/opex?year=${year}&month=${month}`).then(r => r.json()),
      fetch(`/api/sheets?sheet=공과금`).then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
    ]).then(([opex, utilRows, h]) => {
      if (Array.isArray(opex)) setOpexItems(opex)
      if (Array.isArray(h)) setHouses(h)
      // Parse utility rows for this month
      if (Array.isArray(utilRows)) {
        const parsed = utilRows
          .filter((r: string[]) => Number(r[3]) === year && Number(r[4]) === month)
          .map((r: string[]) => ({
            houseName: r[2]?.trim() || '',
            electricity: Number(r[5]) || 0,
            gas: Number(r[6]) || 0,
            water: Number(r[7]) || 0,
            internet: Number(r[8]) || 0,
            waterPurifier: Number(r[9]) || 0,
            cleaning: Number(r[10]) || 0,
            others: Number(r[11]) || 0,
            total: [5, 6, 7, 8, 9, 10, 11].reduce((s, i) => s + (Number(r[i]) || 0), 0),
          }))
        setUtilityItems(parsed)
      }
    }).catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [year, month])

  const utilityTotal = useMemo(() => utilityItems.reduce((s, u) => s + u.total, 0), [utilityItems])
  const opexTotal = useMemo(() => opexItems.reduce((s, o) => s + o.amount, 0), [opexItems])

  async function deleteOpex(id: string) {
    await fetch(`/api/opex/${id}`, { method: 'DELETE' })
    setOpexItems(prev => prev.filter(o => o.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      <PageHeader
        title="지출 관리"
        right={
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--blue)] text-white text-[12px] font-semibold">
            <Plus size={14} /> 기타지출
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Step Form */}
        {showForm && (
          <StepForm houses={houses}
            onClose={() => setShowForm(false)}
            onCreated={() => { setShowForm(false); fetchData() }}
          />
        )}

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-5 py-4">
          <button onClick={() => setMonthOffset(monthOffset - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#F2F2F2]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[16px] font-bold">{year}년 {month}월</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#F2F2F2]">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <p className="text-[13px] text-gray-400 py-8 text-center">불러오는 중...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="flex gap-3 mb-2">
              <div className="flex-1 rounded-xl bg-white border border-[#F2F2F2] p-4 text-center">
                <p className="text-[11px] text-gray-400">공과금</p>
                <p className="text-[18px] font-bold text-[#3182F6]">{toMan(utilityTotal)}원</p>
              </div>
              <div className="flex-1 rounded-xl bg-white border border-[#F2F2F2] p-4 text-center">
                <p className="text-[11px] text-gray-400">기타지출</p>
                <p className="text-[18px] font-bold text-[#F04452]">{toMan(opexTotal)}원</p>
              </div>
            </div>
            <div className="rounded-xl bg-white border border-[#F2F2F2] p-4 text-center mb-5">
              <p className="text-[11px] text-gray-400">총 지출 합계</p>
              <p className="text-[22px] font-bold text-[#F04452]">{toMan(utilityTotal + opexTotal)}원</p>
            </div>

            {/* Utility Section */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-bold">공과금</h3>
                <span className="text-[13px] font-bold text-[#3182F6]">{toMan(utilityTotal)}원</span>
              </div>
              {utilityItems.length === 0 ? (
                <Card className="p-4 text-center">
                  <p className="text-[13px] text-gray-400">이번달 공과금 데이터가 없습니다</p>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {utilityItems.map((u, i) => (
                    <div key={i} className="rounded-xl bg-white border border-[#F2F2F2] px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold">{u.houseName}</span>
                        <span className="text-[13px] font-bold">{fmt(u.total)}원</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-400">
                        {u.electricity > 0 && <span>전기 {fmt(u.electricity)}</span>}
                        {u.gas > 0 && <span>가스 {fmt(u.gas)}</span>}
                        {u.water > 0 && <span>수도 {fmt(u.water)}</span>}
                        {u.internet > 0 && <span>인터넷 {fmt(u.internet)}</span>}
                        {u.waterPurifier > 0 && <span>정수기 {fmt(u.waterPurifier)}</span>}
                        {u.cleaning > 0 && <span>청소 {fmt(u.cleaning)}</span>}
                        {u.others > 0 && <span>기타 {fmt(u.others)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opex Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-bold">기타지출</h3>
                <span className="text-[13px] font-bold text-[#F04452]">{toMan(opexTotal)}원</span>
              </div>
              {opexItems.length === 0 ? (
                <Card className="p-4 text-center">
                  <p className="text-[13px] text-gray-400">이번달 기타지출이 없습니다</p>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {opexItems.sort((a, b) => b.date.localeCompare(a.date)).map(o => (
                    <div key={o.id} className="rounded-xl bg-white border border-[#F2F2F2] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <CatBadge category={o.category} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold truncate">{o.content || o.category}</p>
                            <p className="text-[11px] text-gray-400">{o.houseName}{o.assignee ? ` · ${o.assignee}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="text-right">
                            <p className="text-[13px] font-bold text-[#F04452]">{fmt(o.amount)}원</p>
                            <p className="text-[10px] text-gray-400">{o.date}</p>
                          </div>
                          <button onClick={() => deleteOpex(o.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
                            <X size={12} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CatBadge({ category }: { category: string }) {
  const c = catColor[category] || catColor['기타']
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
      style={{ backgroundColor: c.bg, color: c.text }}>
      {category}
    </span>
  )
}

/* ── 4-Step Form ── */
function StepForm({ houses, onClose, onCreated }: {
  houses: HouseItem[]; onClose: () => void; onCreated: () => void
}) {
  const [step, setStep] = useState(1)
  const [houseName, setHouseName] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [assignee, setAssignee] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    await fetch('/api/opex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ houseName, category, amount: Number(amount) || 0, date, content, assignee }),
    })
    onCreated()
  }

  return (
    <div className="rounded-2xl bg-white border border-[#F2F2F2] p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold">기타지출 추가</h3>
        <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step > s ? 'bg-[#3182F6] text-white' :
              step === s ? 'bg-[#3182F6] text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {step > s ? <Check size={12} /> : s}
            </div>
            {s < 4 && <div className={`w-6 h-0.5 ${step > s ? 'bg-[#3182F6]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: House */}
      {step === 1 && (
        <div>
          <p className="text-[14px] font-semibold mb-3">어떤 지점인가요?</p>
          <select value={houseName} onChange={e => setHouseName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none">
            <option value="">지점 선택</option>
            {houses.map(h => <option key={h.id} value={h.name}>{h.name} ({h.district})</option>)}
          </select>
          <button onClick={() => houseName && setStep(2)} disabled={!houseName}
            className={`w-full mt-4 py-3 rounded-xl text-[14px] font-semibold ${
              houseName ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
            }`}>다음 →</button>
        </div>
      )}

      {/* Step 2: Category */}
      {step === 2 && (
        <div>
          <p className="text-[14px] font-semibold mb-3">어떤 종류인가요?</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCategory(c); setStep(3) }}
                className={`p-3 rounded-xl border text-[13px] font-semibold text-left transition-colors ${
                  category === c ? 'border-[#3182F6] bg-[#EBF3FE]' : 'border-[#F2F2F2] bg-white'
                }`}>
                <CatBadge category={c} />
                <p className="mt-1.5">{c}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="w-full mt-3 py-2 text-[13px] text-gray-400">← 이전</button>
        </div>
      )}

      {/* Step 3: Amount */}
      {step === 3 && (
        <div>
          <p className="text-[14px] font-semibold mb-3">금액이 얼마인가요?</p>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">금액 (원)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0" className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none" />
              {Number(amount) > 0 && (
                <p className="text-[12px] text-[#3182F6] mt-1 font-medium">{fmt(Number(amount))}원</p>
              )}
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">날짜</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none" />
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">내용</label>
              <input value={content} onChange={e => setContent(e.target.value)}
                placeholder="예: 퇴실청소, 보일러 수리"
                className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none placeholder:text-gray-300" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-500">← 이전</button>
            <button onClick={() => Number(amount) > 0 && setStep(4)} disabled={!Number(amount)}
              className={`flex-1 py-3 rounded-xl text-[13px] font-semibold ${
                Number(amount) > 0 ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
              }`}>다음 →</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div>
          <p className="text-[14px] font-semibold mb-3">등록 내용 확인</p>
          <div className="rounded-xl bg-[#F9FAFB] p-4 mb-3">
            <div className="grid grid-cols-2 gap-1.5 text-[12px]">
              <span className="text-gray-400">지점</span><span className="text-right font-medium">{houseName}</span>
              <span className="text-gray-400">카테고리</span><span className="text-right"><CatBadge category={category} /></span>
              <span className="text-gray-400">금액</span><span className="text-right font-bold text-[#F04452]">{fmt(Number(amount))}원</span>
              <span className="text-gray-400">날짜</span><span className="text-right font-medium">{date}</span>
              {content && <><span className="text-gray-400">내용</span><span className="text-right font-medium">{content}</span></>}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[12px] text-gray-400 mb-1 block">담당자 (선택)</label>
            <input value={assignee} onChange={e => setAssignee(e.target.value)}
              placeholder="예: 박청소, 재훈"
              className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none placeholder:text-gray-300" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-500">수정</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 rounded-xl text-[13px] font-semibold bg-[#3182F6] text-white flex items-center justify-center gap-1">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {submitting ? '등록 중...' : '등록 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
