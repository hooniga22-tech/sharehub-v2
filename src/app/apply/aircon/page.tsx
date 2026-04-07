'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import LangToggle from '@/components/ui/LangToggle'
import { Check, Copy, Loader2 } from 'lucide-react'

export default function AirconApplyPage() {
  const { lang, toggle, t } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [houseName, setHouseName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomType, setRoomType] = useState('')
  const [acLocation, setAcLocation] = useState('')
  const [request, setRequest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !houseName.trim()) return
    setSubmitting(true)
    await fetch('/api/apply/aircon', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), houseName, roomCode, roomType, acLocation, request }),
    })
    setSubmitting(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4"><Check size={32} className="text-green-600" /></div>
      <h2 className="text-[20px] font-bold">{t('에어컨 청소 신청 완료!', 'AC cleaning request submitted!')}</h2>
      <p className="text-[13px] text-gray-500 mt-2">{t('입금 확인 후 일정을 안내드립니다.', 'Schedule shared after payment verification.')}</p>
    </div>
  )

  const ROOM_TYPES = [
    { ko: '1인실', en: 'Single' },
    { ko: '2인실(혼자)', en: 'Double(solo)' },
    { ko: '2인실(2명)', en: 'Double(both)' },
  ]
  const AC_LOC = [
    { ko: '방 안', en: 'In Room' },
    { ko: '거실(공용)', en: 'Living Room' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6 pb-32">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[13px] text-gray-400 font-medium">ShareHub</p>
            <h1 className="text-[22px] font-bold mt-1">{t('에어컨 청소 신청', 'AC Cleaning Request')}</h1>
          </div>
          <LangToggle lang={lang} toggle={toggle} />
        </div>

        {/* Discount Box */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-3">
          <p className="text-[13px] font-bold text-blue-800 mb-2">{t('얼리 신청 할인', 'Early Sign-up Discount')}</p>
          <div className="text-[12px] text-blue-700 space-y-1">
            <p>{t('1인실', 'Single')}: 40,000{t('원', ' KRW')}</p>
            <p>{t('2인실 혼자', 'Double (solo)')}: 30,000{t('원', ' KRW')}</p>
            <p>{t('2인실 2명 함께', 'Double (both)')}: {t('각 20,000원', 'KRW 20,000 each')}</p>
            <p className="text-blue-500 mt-1">{t('일반 업체 비용 8~10만원 대비 대폭 할인!', 'Much cheaper than regular services (KRW 80,000-100,000)!')}</p>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-xl bg-gray-100 p-4 mb-3 text-[11px] text-gray-500 space-y-1">
          <p>{t('방에 에어컨이 없는 경우 신청하지 않아도 됩니다.', 'If your room has no AC, you do not need to apply.')}</p>
          <p>{t('관리비에는 에어컨 청소 비용이 포함되어 있지 않습니다.', 'AC cleaning is not included in the maintenance fee.')}</p>
          <p>{t('청소 일정은 신청 후 운영진이 연락드립니다.', 'The cleaning schedule will be arranged by management.')}</p>
        </div>

        {/* Payment */}
        <div className="rounded-xl bg-[#FFF3E4] border border-[#FAC775] p-4 mb-5">
          <p className="text-[13px] font-bold text-[#633806] mb-2">{t('입금 안내', 'Payment')}</p>
          <p className="text-[11px] text-[#8B5E0F] mb-2">{t('신청서 작성과 동시에 입금해주세요.', 'Please pay at the same time as submitting.')}</p>
          <p className="text-[11px] text-[#8B5E0F] mb-2">{t('입금자명: 홍길동(에어컨청소)', 'Sender name: Name(ACcleaning)')}</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
            <div className="flex-1"><p className="text-[10px] text-gray-400">{t('케이뱅크 유재훈', 'K-Bank Yoo Jaehoon')}</p><p className="text-[13px] font-bold">100-166-670094</p></div>
            <button onClick={() => { navigator.clipboard.writeText('100-166-670094'); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${copied ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              {copied ? <><Check size={10} className="inline mr-0.5" />{t('복사됨', 'Copied')}</> : <><Copy size={10} className="inline mr-0.5" />{t('복사', 'Copy')}</>}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl bg-white border border-[#F2F2F2] p-5 space-y-4">
          <F label={t('이름', 'Name')} required value={name} onChange={setName} />
          <F label={t('연락처', 'Phone')} required value={phone} onChange={setPhone} type="tel" />
          <F label={t('지점명', 'House Name')} required value={houseName} onChange={setHouseName} />
          <F label={t('방 코드', 'Room Code')} value={roomCode} onChange={setRoomCode} placeholder="A-1" />
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
          <div>
            <label className="text-[12px] font-semibold block mb-1.5">{t('에어컨 위치', 'AC Location')}</label>
            <div className="flex gap-2">
              {AC_LOC.map(a => (
                <button key={a.ko} onClick={() => setAcLocation(a.ko)}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                    acLocation === a.ko ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                  }`}>{t(a.ko, a.en)}</button>
              ))}
            </div>
          </div>
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
          {t('신청하기 (동시 입금 필수)', 'Submit (Payment required simultaneously)')}
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
