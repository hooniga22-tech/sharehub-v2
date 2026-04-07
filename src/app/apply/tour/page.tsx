'use client'

import { useState } from 'react'
import { Check, Copy, ChevronRight, Loader2 } from 'lucide-react'

const DISTRICTS = ['강남구', '관악구', '구로구', '동대문구', '마포구', '서대문구', '성동구', '성북구', '영등포구', '용산구', '중구']
const ROOM_TYPES = ['1인실', '2인실', '상관없음']
const CONTRACT_PERIODS = ['3개월', '6개월', '1년 이상', '미정']
const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
]

export default function TourApplyPage() {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')

  // Step 2
  const [regions, setRegions] = useState<string[]>([])
  const [houseName, setHouseName] = useState('')
  const [roomType, setRoomType] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [contractPeriod, setContractPeriod] = useState('')

  // Step 3
  const [tourDate, setTourDate] = useState('')
  const [tourTime, setTourTime] = useState('')
  const [inquiry, setInquiry] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  function toggleRegion(r: string) {
    setRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  function validate1() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = '이름을 입력해주세요'
    if (!phone.trim()) e.phone = '연락처를 입력해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validate2() {
    const e: Record<string, string> = {}
    if (regions.length === 0) e.region = '희망 지역을 선택해주세요'
    if (!roomType) e.roomType = '방 타입을 선택해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validate3() {
    const e: Record<string, string> = {}
    if (!tourDate) e.tourDate = '투어 날짜를 선택해주세요'
    if (!tourTime) e.tourTime = '투어 시간을 선택해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (step === 1 && validate1()) setStep(2)
    else if (step === 2 && validate2()) setStep(3)
    else if (step === 3 && validate3()) setStep(4)
  }

  async function handleSubmit() {
    setSubmitting(true)
    await fetch('/api/apply/tour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), phone: phone.trim(), gender,
        region: regions.join(', '), houseName, roomType,
        moveInDate, contractPeriod, tourDate, tourTime, inquiry,
      }),
    })
    setSubmitting(false)
    setDone(true)
  }

  function copyAccount() {
    navigator.clipboard.writeText('3333-01-0839-846')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const today = new Date().toISOString().split('T')[0]

  if (done) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-[20px] font-bold">투어 신청이 완료됐어요!</h2>
        <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
          투어비(10,000원) 입금 후<br />카카오톡으로 성함과 연락처를 남겨주시면 확정됩니다.
        </p>
        <a href="http://pf.kakao.com/_xnxnNxj" target="_blank" rel="noopener noreferrer"
          className="mt-5 px-6 py-3 rounded-2xl bg-[#FEE500] text-[#3C1E1E] text-[15px] font-bold">
          카카오톡 문의하기
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6 pb-32">
        {/* Header */}
        <p className="text-[13px] text-gray-400 font-medium">ShareHub 쉐어하우스</p>
        <h1 className="text-[24px] font-bold mt-1">투어 신청</h1>
        <p className="text-[14px] text-gray-500 mt-1">원하는 하우스를 직접 방문해보세요</p>

        {/* Tour Confirmation Notice */}
        <div className="mt-5 rounded-xl bg-[#FFF3E4] border border-[#FAC775] p-4">
          <p className="text-[13px] font-bold text-[#633806] mb-1">투어 예약 확정 안내</p>
          <p className="text-[12px] text-[#8B5E0F] leading-relaxed">
            아래 2가지를 완료하면 투어 예약이 확정됩니다.<br />
            1) 투어비 입금<br />
            2) 신청서 작성 완료
          </p>
        </div>

        {/* Tour Fee Card */}
        <div className="mt-4 rounded-xl bg-white border-2 border-[#3182F6] p-5">
          <p className="text-[14px] font-bold mb-3">1) 투어비 입금</p>
          <p className="text-[22px] font-medium text-[#3182F6] mb-3">투어비: 10,000원</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 mb-3">
            <div className="flex-1">
              <p className="text-[11px] text-gray-400">카카오뱅크 유재훈</p>
              <p className="text-[14px] font-bold">3333-01-0839-846</p>
            </div>
            <button onClick={copyAccount}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                copied ? 'bg-green-50 text-green-600' : 'bg-[#3182F6] text-white'
              }`}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
          <div className="text-[11px] text-gray-400 space-y-1">
            <p>• 투어비는 환불되지 않습니다.</p>
            <p>• 계약 시 첫달 할인 적용:</p>
            <p className="pl-3">- 6개월 미만 계약: 첫달 20,000원 할인</p>
            <p className="pl-3">- 6개월 이상 계약: 첫달 30,000원 할인</p>
          </div>
        </div>

        {/* Caution Box */}
        <div className="mt-3 rounded-xl bg-[#FFF3E4] border border-[#FAC775] p-4">
          <div className="text-[11px] text-[#8B5E0F] space-y-1">
            <p>• 당일 투어는 되도록 피해주세요.</p>
            <p>• 투어 2시간 전까지 연락이 없으면 자동 취소되며, 투어비는 환불되지 않습니다.</p>
            <p>• 당일 취소도 환불되지 않습니다.</p>
          </div>
        </div>

        {/* Room Reservation Info */}
        <div className="mt-3 rounded-xl bg-gray-100 p-4">
          <div className="text-[11px] text-gray-500 space-y-1">
            <p>• 투어 예정인 방은 다른 분이 먼저 계약할 수 있습니다. 이 경우 사전 안내드립니다.</p>
            <p>• 방을 확실히 잡고 싶다면 계약금을 미리 입금해야 합니다. (환불 불가)</p>
          </div>
        </div>

        {/* Step 2 Card: Application Form */}
        <div className="mt-5 rounded-xl bg-white border border-[#F2F2F2] p-5">
          <p className="text-[14px] font-bold mb-4">2) 신청서 작성</p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step > s ? 'bg-[#3182F6] text-white' : step === s ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
                }`}>{step > s ? <Check size={12} /> : s}</div>
                {s < 4 && <div className={`w-5 h-0.5 ${step > s ? 'bg-[#3182F6]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[13px] font-semibold">기본 정보</p>
              <Field label="이름" required value={name} onChange={setName} error={errors.name} placeholder="홍길동" />
              <Field label="연락처" required value={phone} onChange={setPhone} error={errors.phone} placeholder="010-0000-0000" type="tel" />
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">성별</label>
                <div className="flex gap-2">
                  {['여성', '남성'].map(g => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                        gender === g ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[13px] font-semibold">희망 조건</p>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">희망 지역 (복수 선택) {errors.region && <span className="text-red-500 text-[10px]">{errors.region}</span>}</label>
                <div className="flex flex-wrap gap-2">
                  {DISTRICTS.map(d => (
                    <button key={d} onClick={() => toggleRegion(d)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-colors ${
                        regions.includes(d) ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
              {regions.length > 0 && (
                <Field label="희망 하우스명 (선택)" value={houseName} onChange={setHouseName} placeholder="예: 워너비, 광흥 (선택사항)" />
              )}
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">방 타입 {errors.roomType && <span className="text-red-500 text-[10px]">{errors.roomType}</span>}</label>
                <div className="flex gap-2">
                  {ROOM_TYPES.map(r => (
                    <button key={r} onClick={() => setRoomType(r)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                        roomType === r ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
              <Field label="희망 입주일" value={moveInDate} onChange={setMoveInDate} type="date" />
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">계약 기간</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTRACT_PERIODS.map(p => (
                    <button key={p} onClick={() => setContractPeriod(p)}
                      className={`py-2.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                        contractPeriod === p ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tour Schedule */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[13px] font-semibold">투어 일정</p>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">투어 희망 날짜 {errors.tourDate && <span className="text-red-500 text-[10px]">{errors.tourDate}</span>}</label>
                <input type="date" value={tourDate} onChange={e => setTourDate(e.target.value)} min={today}
                  className={`w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border text-[14px] outline-none ${errors.tourDate ? 'border-red-400' : 'border-[#F2F2F2]'}`} />
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">희망 시간대 {errors.tourTime && <span className="text-red-500 text-[10px]">{errors.tourTime}</span>}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setTourTime(t)}
                      className={`py-2 rounded-lg text-[12px] font-medium border transition-colors ${
                        tourTime === t ? 'border-[#3182F6] bg-[#3182F6] text-white' : 'border-[#F2F2F2] text-gray-500'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold block mb-1.5">추가 문의 (선택)</label>
                <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} rows={3} placeholder="궁금한 점이 있으면 남겨주세요"
                  className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none resize-none placeholder:text-gray-300" />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-[13px] font-semibold">확인 및 제출</p>
              <div className="rounded-xl bg-[#F9FAFB] p-4">
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  <span className="text-gray-400">이름</span><span className="text-right font-medium">{name}</span>
                  <span className="text-gray-400">연락처</span><span className="text-right font-medium">{phone}</span>
                  {gender && <><span className="text-gray-400">성별</span><span className="text-right font-medium">{gender}</span></>}
                  <span className="text-gray-400">희망 지역</span><span className="text-right font-medium">{regions.join(', ')}</span>
                  {houseName && <><span className="text-gray-400">희망 하우스</span><span className="text-right font-medium">{houseName}</span></>}
                  <span className="text-gray-400">방 타입</span><span className="text-right font-medium">{roomType}</span>
                  {moveInDate && <><span className="text-gray-400">입주일</span><span className="text-right font-medium">{moveInDate}</span></>}
                  {contractPeriod && <><span className="text-gray-400">계약 기간</span><span className="text-right font-medium">{contractPeriod}</span></>}
                  <span className="text-gray-400">투어 날짜</span><span className="text-right font-medium">{tourDate}</span>
                  <span className="text-gray-400">투어 시간</span><span className="text-right font-medium">{tourTime}</span>
                </div>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-[12px] text-green-700 leading-relaxed">
                  작성 및 입금 완료 후, 카카오톡 채널에 성함과 연락처를 남겨주세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-3 bg-[#F9FAFB]">
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={() => { setStep(step - 1); setErrors({}) }}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-white border border-[#F2F2F2] text-gray-500">이전</button>
          )}
          {step < 4 ? (
            <button onClick={goNext}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-[#3182F6] text-white flex items-center justify-center gap-1">
              다음 <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-[#3182F6] text-white flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {submitting ? '제출 중...' : '신청 완료하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder = '', type = 'text', required, error }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
        {error && <span className="text-red-500 text-[10px] ml-1">{error}</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border text-[14px] outline-none placeholder:text-gray-300 ${
          error ? 'border-red-400' : 'border-[#F2F2F2]'
        }`} />
    </div>
  )
}
