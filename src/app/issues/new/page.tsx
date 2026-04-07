'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

const houses = ['역삼하우스', '강남하우스', '서초하우스']
const categories = [
  { value: '수리', desc: '시설물 고장, 파손 등' },
  { value: '청소', desc: '공용공간, 개인공간 청소' },
  { value: '민원', desc: '소음, 분쟁 등 민원사항' },
  { value: '교체', desc: '소모품, 가구 교체' },
  { value: '기타', desc: '기타 요청사항' },
]
const urgencies = [
  { value: '긴급', color: 'border-[var(--red)] bg-[var(--red-light)] text-[var(--red)]' },
  { value: '보통', color: 'border-[var(--amber)] bg-[var(--amber-light)] text-[var(--amber)]' },
  { value: '낮음', color: 'border-[var(--border)] bg-[#F2F2F2] text-[var(--sub)]' },
]
const rooms: Record<string, string[]> = {
  '역삼하우스': ['101호', '102호', '201호', '202호', '301호', '302호', '공용'],
  '강남하우스': ['101호', '102호', '103호', '104호', '105호', '201호', '202호', '203호', '공용'],
  '서초하우스': ['101호', '201호', '301호', '302호', '303호', '304호', '공용'],
}

export default function NewIssuePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [house, setHouse] = useState('')
  const [room, setRoom] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('보통')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalSteps = 4

  async function handleSubmit() {
    setSubmitting(true)
    const issueId = `I${Date.now().toString(36).toUpperCase()}`
    const today = new Date().toISOString().slice(0, 10)
    // row: [0]ID [1]지점명 [2]방코드 [3]제목 [4]내용 [5]카테고리 [6]상태 [7]담당자 [8]등록일 [9]완료일 [10]비용 [11]메모
    const row = [issueId, house, room, title, description, category, '접수', '', today, '', cost || '0', `긴급도:${urgency}`]

    await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet: '이슈', row }),
    })
    router.push('/issues')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="이슈 등록" />

      <div className="flex items-center justify-center gap-1.5 py-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} className={`h-1.5 rounded-full transition-all ${
            s === step ? 'w-6 bg-[var(--blue)]' : s < step ? 'w-1.5 bg-[var(--blue)]' : 'w-1.5 bg-[var(--border)]'
          }`} />
        ))}
      </div>

      <div className="flex-1 px-5">
        {/* Step 1: House + Room */}
        {step === 1 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">지점과 호실을 선택해주세요</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">이슈가 발생한 위치를 선택합니다</p>
            <div className="flex flex-col gap-2.5">
              {houses.map(h => (
                <button key={h} onClick={() => { setHouse(h); setRoom('') }}
                  className={`text-left px-4 py-4 rounded-2xl border transition-colors ${
                    house === h ? 'border-[var(--blue)] bg-[var(--blue-light)]' : 'border-[var(--border)] bg-[var(--card)]'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold">{h}</span>
                    {house === h && <Check size={18} color="var(--blue)" />}
                  </div>
                </button>
              ))}
            </div>
            {house && (
              <div className="mt-4">
                <p className="text-[13px] text-[var(--sub)] font-medium mb-2">호실 선택</p>
                <div className="flex flex-wrap gap-2">
                  {rooms[house]?.map(r => (
                    <button key={r} onClick={() => setRoom(r)}
                      className={`px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
                        room === r ? 'border-[var(--blue)] bg-[var(--blue-light)] text-[var(--blue)]' : 'border-[var(--border)] bg-[var(--card)] text-[var(--sub)]'
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
            )}
            {house && room && (
              <button onClick={() => setStep(2)} className="w-full mt-6 py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white">다음</button>
            )}
          </div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">카테고리를 선택해주세요</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">{house} · {room}</p>
            <div className="flex flex-col gap-2.5">
              {categories.map(c => (
                <button key={c.value} onClick={() => { setCategory(c.value); setStep(3) }}
                  className={`text-left px-4 py-4 rounded-2xl border transition-colors ${
                    category === c.value ? 'border-[var(--blue)] bg-[var(--blue-light)]' : 'border-[var(--border)] bg-[var(--card)]'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold">{c.value}</p>
                      <p className="text-[12px] text-[var(--sub)] mt-0.5">{c.desc}</p>
                    </div>
                    {category === c.value && <Check size={18} color="var(--blue)" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Urgency + Title + Description */}
        {step === 3 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">상세 내용을 입력해주세요</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">{house} · {room} · {category}</p>

            <p className="text-[13px] font-semibold mb-2">긴급도</p>
            <div className="flex gap-2 mb-5">
              {urgencies.map(u => (
                <button key={u.value} onClick={() => setUrgency(u.value)}
                  className={`flex-1 py-3 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    urgency === u.value ? u.color : 'border-[var(--border)] text-[var(--sub)]'
                  }`}>{u.value}</button>
              ))}
            </div>

            <p className="text-[13px] font-semibold mb-2">제목</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="이슈 제목을 입력해주세요"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)]" />

            <p className="text-[13px] font-semibold mb-2 mt-4">상세 내용</p>
            <Card className="p-4">
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="이슈 내용을 상세히 입력해주세요"
                className="w-full h-32 text-[14px] resize-none outline-none bg-transparent placeholder:text-[var(--sub)]" />
            </Card>

            <button onClick={() => title.trim() && setStep(4)}
              disabled={!title.trim()}
              className={`w-full mt-6 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
                title.trim() ? 'bg-[var(--blue)] text-white' : 'bg-[var(--border)] text-[var(--sub)]'
              }`}>다음</button>
          </div>
        )}

        {/* Step 4: Summary + Submit */}
        {step === 4 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">등록 확인</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">내용을 확인하고 등록해주세요</p>

            <p className="text-[13px] font-semibold mb-2">예상 비용 (선택)</p>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[14px] outline-none placeholder:text-[var(--sub)] mb-5" />

            <Card className="p-4 bg-[var(--blue-light)]">
              <p className="text-[12px] font-bold text-[var(--blue)] mb-2">등록 요약</p>
              <div className="grid grid-cols-2 gap-1 text-[12px]">
                <span className="text-[var(--sub)]">지점/호실</span><span className="font-medium text-right">{house} {room}</span>
                <span className="text-[var(--sub)]">카테고리</span><span className="font-medium text-right">{category}</span>
                <span className="text-[var(--sub)]">긴급도</span><span className="font-medium text-right">{urgency}</span>
                <span className="text-[var(--sub)]">제목</span><span className="font-medium text-right truncate">{title}</span>
                {cost && <><span className="text-[var(--sub)]">예상비용</span><span className="font-medium text-right">{Number(cost).toLocaleString()}원</span></>}
              </div>
            </Card>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full mt-6 py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white disabled:opacity-50">
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
