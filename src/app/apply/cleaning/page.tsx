'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import LangToggle from '@/components/ui/LangToggle'
import { Check, Copy, Loader2 } from 'lucide-react'

export default function CleaningApplyPage() {
  const { lang, toggle, t } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [houseName, setHouseName] = useState('')
  const [roomType, setRoomType] = useState('')
  const [cleanDate, setCleanDate] = useState('')
  const [request, setRequest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !houseName.trim()) return
    setSubmitting(true)
    await fetch('/api/apply/cleaning', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), houseName, roomType, cleanDate, request }),
    })
    setSubmitting(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4"><Check size={32} className="text-green-600" /></div>
      <h2 className="text-[20px] font-bold">{t('방청소 신청이 완료됐어요!', 'Room cleaning request submitted!')}</h2>
      <p className="text-[13px] text-gray-500 mt-2">{t('입금 확인 후 청소 일정이 확정됩니다.', 'Schedule confirmed after payment verification.')}</p>
    </div>
  )

  const ROOM_TYPES = [
    { ko: '1인실', en: 'Single' },
    { ko: '2인실(1명)', en: 'Double(1p)' },
    { ko: '2인실(2명)', en: 'Double(2p)' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6 pb-32">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[13px] text-gray-400 font-medium">ShareHub</p>
            <h1 className="text-[22px] font-bold mt-1">{t('방 청소 신청', 'Room Cleaning Request')}</h1>
          </div>
          <LangToggle lang={lang} toggle={toggle} />
        </div>

        {/* Price Box */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-3">
          <p className="text-[13px] font-bold text-blue-800 mb-2">{t('요금 안내', 'Price')} / {t('Price', '요금 안내')}</p>
          <div className="text-[12px] text-blue-700 space-y-1">
            <p>{t('1인실', 'Single Room')}: 20,000{t('원', ' KRW')}</p>
            <p>{t('2인실 1명', 'Double Room (1 person)')}: 15,000{t('원', ' KRW')}</p>
            <p>{t('2인실 2명', 'Double Room (2 people)')}: 30,000{t('원', ' KRW')}</p>
            <p className="text-blue-500">{t('소요시간 약 1시간', 'Approx. 1 hour')}</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-3">
          <p className="text-[13px] font-bold text-red-800 mb-2">{t('중요 안내', 'Important Notice')}</p>
          <div className="text-[11px] text-red-700 space-y-1.5">
            <p>{t('쓰레기는 한쪽에 모아두기만 합니다. 최종 폐기는 직접 해주세요.', 'Trash will be gathered in one corner. Final disposal is your responsibility.')}</p>
            <p>{t('귀중품(현금/카드/귀금속)은 미리 보관해주세요. 분실 시 책임지지 않습니다.', 'Keep valuables safe. We are not responsible for any loss.')}</p>
            <p>{t('방이 과도하게 지저분한 경우 추가 비용 1~2만원이 발생할 수 있어요.', 'An extra fee of 10,000-20,000 KRW may apply for excessively messy rooms.')}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl bg-[#FFF3E4] border border-[#FAC775] p-4 mb-5">
          <p className="text-[13px] font-bold text-[#633806] mb-2">{t('결제 안내', 'Payment')}</p>
          <p className="text-[11px] text-[#8B5E0F]">{t('청소 3일 전까지 입금', 'Pay 3 days before cleaning')} / {t('하루 전까지 취소 가능', 'Cancellable until 1 day before')}</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mt-2">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">{t('케이뱅크 유재훈', 'K-Bank Yoo Jaehoon')}</p>
              <p className="text-[13px] font-bold">100-166-670094</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText('100-166-670094'); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${copied ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              {copied ? <><Check size={10} className="inline mr-0.5" />{t('복사됨', 'Copied')}</> : <><Copy size={10} className="inline mr-0.5" />{t('복사', 'Copy')}</>}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl bg-white border border-[#F2F2F2] p-5 space-y-4">
          <F label={t('이름', 'Name')} required value={name} onChange={setName} placeholder={t('홍길동', 'Hong Gildong')} />
          <F label={t('연락처', 'Phone')} required value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
          <F label={t('지점명', 'House Name')} required value={houseName} onChange={setHouseName} placeholder={t('예: 워너비', 'e.g. Wannabe')} />
          <div>
            <label className="text-[12px] font-semibold block mb-1.5">{t('방 타입', 'Room Type')}</label>
            <div className="flex gap-2">
              {ROOM_TYPES.map(r => (
                <button key={r.ko} onClick={() => setRoomType(r.ko)}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                    roomType === r.ko ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                  }`}>{t(r.ko, r.en)}</button>
              ))}
            </div>
          </div>
          <F label={t('청소 희망 날짜', 'Preferred Date')} value={cleanDate} onChange={setCleanDate} type="date" />
          <div>
            <label className="text-[12px] font-semibold block mb-1.5">{t('추가 요청사항', 'Additional Requests')}</label>
            <textarea value={request} onChange={e => setRequest(e.target.value)} rows={2} placeholder={t('선택사항', 'Optional')}
              className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none resize-none placeholder:text-gray-300" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-3 bg-[#F9FAFB]">
        <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !houseName.trim() || submitting}
          className={`w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 ${
            name.trim() && phone.trim() && houseName.trim() ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
          }`}>
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {t('신청하기 (입금 후 확정)', 'Submit (Confirmed after payment)')}
        </button>
      </div>
    </div>
  )
}

function F({ label, value, onChange, placeholder = '', type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold mb-1.5 block">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none placeholder:text-gray-300" />
    </div>
  )
}
