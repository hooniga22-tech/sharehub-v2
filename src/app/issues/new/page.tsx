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
  { value: '기타', desc: '기타 요청사항' },
]

export default function NewIssuePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [house, setHouse] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')

  function handleSubmit() {
    // TODO: API call
    router.push('/issues')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="이슈 등록" />

      {/* Step Dots */}
      <div className="flex items-center justify-center gap-2 py-5">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              s === step ? 'bg-[var(--blue)] w-5' : s < step ? 'bg-[var(--blue)]' : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-5">
        {/* Step 1: House Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">지점을 선택해주세요</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">이슈가 발생한 지점을 선택합니다</p>
            <div className="flex flex-col gap-2.5">
              {houses.map(h => (
                <button
                  key={h}
                  onClick={() => { setHouse(h); setStep(2) }}
                  className={`text-left px-4 py-4 rounded-2xl border transition-colors ${
                    house === h
                      ? 'border-[var(--blue)] bg-[var(--blue-light)]'
                      : 'border-[var(--border)] bg-[var(--card)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold">{h}</span>
                    {house === h && <Check size={18} color="var(--blue)" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">카테고리를 선택해주세요</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">이슈 유형을 선택합니다</p>
            <div className="flex flex-col gap-2.5">
              {categories.map(c => (
                <button
                  key={c.value}
                  onClick={() => { setCategory(c.value); setStep(3) }}
                  className={`text-left px-4 py-4 rounded-2xl border transition-colors ${
                    category === c.value
                      ? 'border-[var(--blue)] bg-[var(--blue-light)]'
                      : 'border-[var(--border)] bg-[var(--card)]'
                  }`}
                >
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

        {/* Step 3: Content Input */}
        {step === 3 && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">내용을 입력해주세요</h2>
            <p className="text-[13px] text-[var(--sub)] mb-5">{house} · {category}</p>
            <Card className="p-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="이슈 내용을 상세히 입력해주세요"
                className="w-full h-40 text-[14px] resize-none outline-none bg-transparent placeholder:text-[var(--sub)]"
              />
            </Card>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={`w-full mt-6 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
                content.trim()
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-[var(--border)] text-[var(--sub)]'
              }`}
            >
              등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
