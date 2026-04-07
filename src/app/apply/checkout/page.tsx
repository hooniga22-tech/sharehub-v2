'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import LangToggle from '@/components/ui/LangToggle'
import { Check, Loader2 } from 'lucide-react'

export default function CheckoutApplyPage() {
  const { lang, toggle, t } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [houseName, setHouseName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [checkoutDate, setCheckoutDate] = useState('')
  const [refundAccount, setRefundAccount] = useState('')
  const [reason, setReason] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !houseName.trim() || !roomCode.trim() || !checkoutDate) return
    setSubmitting(true)
    await fetch('/api/apply/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), houseName, roomCode, checkoutDate, refundAccount, reason, memo }),
    })
    setSubmitting(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4"><Check size={32} className="text-green-600" /></div>
      <h2 className="text-[20px] font-bold">{t('퇴실 신청이 완료됐어요!', 'Check-out request submitted!')}</h2>
      <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{t('함께해주셔서 진심으로 감사합니다.\n항상 응원하겠습니다.', 'Thank you so much for staying with us.\nWe wish you all the best.')}</p>
    </div>
  )

  const REASONS = [
    { ko: '계약만료', en: 'Contract end' },
    { ko: '개인사정', en: 'Personal' },
    { ko: '이사', en: 'Moving' },
    { ko: '기타', en: 'Other' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6 pb-32">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[13px] text-gray-400 font-medium">ShareHub</p>
            <h1 className="text-[22px] font-bold mt-1">{t('퇴실 신청', 'Check-out Request')}</h1>
          </div>
          <LangToggle lang={lang} toggle={toggle} />
        </div>

        {/* Checklist */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-3">
          <p className="text-[13px] font-bold text-blue-800 mb-2">{t('퇴실 체크리스트 (4가지 필수)', 'Check-out Checklist (4 required)')}</p>
          <ol className="text-[11px] text-blue-700 space-y-2 list-decimal pl-4">
            <li>{t('쓰레기·짐·가구 정리 + 청소', 'Dispose trash, remove belongings & clean')}<br /><span className="text-blue-500">{t('→ 개인 쓰레기는 종량제 봉투 구매 후 직접 배출', '→ Use your own trash bags')}</span></li>
            <li>{t('사진 전송 필수 (미전송 시 5만원 청구)', 'Photos required (KRW 50,000 fee if not sent)')}<br /><span className="text-blue-500">{t('→ 방·화장실·냉장고·분리수거 공간 등 최소 5장', '→ Min. 5 photos: room, bathroom, fridge, trash area')}</span></li>
            <li>{t('집기 상태 확인 (파손·오염 사진 포함)', 'Check item condition (include damage photos)')}</li>
            <li>{t('하우스 단톡방 퇴실', 'Leave the group chat')}</li>
          </ol>
        </div>

        {/* Checkout Fee */}
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-3">
          <p className="text-[13px] font-bold text-red-800 mb-1">{t('퇴실비', 'Check-out Fee')}</p>
          <p className="text-[12px] text-red-700">{t('퇴실비 30,000원 (계약서에 따름)', 'Check-out fee: KRW 30,000 (as per contract)')}</p>
          <p className="text-[11px] text-red-600 mt-1">{t('하우스 리프레쉬(시설 유지·교체·AS)에 사용됩니다.', 'Used for house refresh (maintenance, replacement, repairs).')}</p>
        </div>

        {/* Deposit Refund */}
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-3">
          <p className="text-[13px] font-bold text-green-800 mb-1">{t('보증금 환불', 'Deposit Refund')}</p>
          <div className="text-[11px] text-green-700 space-y-1">
            <p>{t('퇴실 확인 후 최대 7일 이내 환불', 'Refunded within 7 days after inspection')}</p>
            <p>{t('환불 전 금액과 내역을 먼저 안내드립니다.', 'Refund amount shared in advance.')}</p>
            <p>{t('본인 명의 계좌만 가능 (한국 계좌 또는 해외송금)', 'Must be under your name (Korean or international)')}</p>
          </div>
        </div>

        {/* Checkout Time */}
        <div className="rounded-xl bg-gray-100 p-4 mb-5 text-[11px] text-gray-500 space-y-1">
          <p>{t('계약 종료일 오전 11시', 'Check-out by 11am on contract end date')}</p>
          <p>{t('11시까지 어렵다면 최소 7일 전 매니저와 상의', 'Contact manager at least 7 days in advance if unable')}</p>
        </div>

        {/* Form */}
        <div className="rounded-xl bg-white border border-[#F2F2F2] p-5 space-y-4">
          <F label={t('이름', 'Name')} required value={name} onChange={setName} />
          <F label={t('연락처', 'Phone')} required value={phone} onChange={setPhone} type="tel" />
          <F label={t('지점명', 'House Name')} required value={houseName} onChange={setHouseName} />
          <F label={t('방 코드', 'Room Code')} required value={roomCode} onChange={setRoomCode} placeholder="A-1" />
          <div>
            <label className="text-[12px] font-semibold mb-1.5 block">{t('퇴실 예정일', 'Check-out Date')} <span className="text-red-500">*</span></label>
            <input type="date" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none" />
          </div>
          <div>
            <label className="text-[12px] font-semibold mb-1.5 block">{t('보증금 환불 계좌', 'Refund Account')}</label>
            <input value={refundAccount} onChange={e => setRefundAccount(e.target.value)}
              placeholder={t('은행명 + 계좌번호 + 예금주', 'Bank + Account number + Holder')}
              className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none placeholder:text-gray-300" />
            <p className="text-[10px] text-gray-400 mt-1">{t('반드시 본인 명의 계좌를 입력해주세요', 'Must be under your name')}</p>
          </div>
          <div>
            <label className="text-[12px] font-semibold block mb-1.5">{t('퇴실 사유', 'Reason')}</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button key={r.ko} onClick={() => setReason(r.ko)}
                  className={`py-2.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                    reason === r.ko ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-[#F2F2F2] text-gray-500'
                  }`}>{t(r.ko, r.en)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold block mb-1.5">{t('추가 메모', 'Additional Notes')}</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2} placeholder={t('선택사항', 'Optional')}
              className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#F2F2F2] text-[14px] outline-none resize-none placeholder:text-gray-300" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-3 bg-[#F9FAFB]">
        <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !houseName.trim() || !roomCode.trim() || !checkoutDate || submitting}
          className={`w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 ${
            name.trim() && phone.trim() && houseName.trim() && roomCode.trim() && checkoutDate ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
          }`}>
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {t('퇴실 신청하기', 'Submit Check-out Request')}
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
