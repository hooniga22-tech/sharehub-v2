'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Loader2 } from 'lucide-react'

interface HouseItem { id: string; name: string; district: string }
interface RoomItem { id: string; houseName: string; roomCode: string; roomType: string; baseRent: number }

const STEPS = ['지점/방 선택', '기본 정보', '계약 정보']

function fmtNum(n: number) { return n.toLocaleString() }
const toMan = (n: number) => Math.round(n / 10000).toLocaleString() + '만'

export default function NewTenantPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [houses, setHouses] = useState<HouseItem[]>([])
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [selectedHouse, setSelectedHouse] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null)
  const [loadingRooms, setLoadingRooms] = useState(false)

  // Step 2
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nationality, setNationality] = useState('한국')
  const [memo, setMemo] = useState('')

  // Step 3
  const [rent, setRent] = useState('')
  const [mgmtFee, setMgmtFee] = useState('100000')
  const [deposit, setDeposit] = useState('2000000')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('입주중')

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/houses')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHouses(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedHouse) { setRooms([]); return }
    setLoadingRooms(true)
    setSelectedRoom(null)
    fetch(`/api/rooms?houseName=${encodeURIComponent(selectedHouse)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRooms(d) })
      .catch(() => {})
      .finally(() => setLoadingRooms(false))
  }, [selectedHouse])

  useEffect(() => {
    if (selectedRoom) setRent(String(selectedRoom.baseRent || ''))
  }, [selectedRoom])

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!selectedHouse) e.house = '지점을 선택해주세요'
    if (!selectedRoom) e.room = '방을 선택해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = '이름을 입력해주세요'
    if (!phone.trim()) e.phone = '연락처를 입력해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep3() {
    const e: Record<string, string> = {}
    if (!startDate) e.startDate = '시작일을 입력해주세요'
    if (!endDate) e.endDate = '종료일을 입력해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  async function handleSubmit() {
    if (!validateStep3()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom!.id,
          houseName: selectedHouse,
          roomCode: selectedRoom!.roomCode,
          name: name.trim(),
          phone: phone.trim(),
          rent: Number(rent) || 0,
          managementFee: Number(mgmtFee) || 0,
          deposit: Number(deposit) || 0,
          startDate,
          endDate,
          status,
          nationality,
          memo,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setDone(true)
        setTimeout(() => router.push('/tenants'), 2000)
      } else {
        setErrors({ submit: '등록 실패: ' + (data.error || '알 수 없는 오류') })
      }
    } catch {
      setErrors({ submit: '네트워크 오류가 발생했습니다' })
    } finally {
      setSubmitting(false)
    }
  }

  const monthlyTotal = (Number(rent) || 0) + (Number(mgmtFee) || 0)

  // Done screen
  if (done) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-5">
        <div className="w-16 h-16 rounded-full bg-[var(--green-light)] flex items-center justify-center mb-4">
          <Check size={32} color="var(--green)" />
        </div>
        <p className="text-[20px] font-bold">등록 완료!</p>
        <p className="text-[13px] text-[var(--sub)] mt-1">입주자 목록으로 이동합니다...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="신규 입주자 등록" />

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1.5 py-4 px-5">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step > i + 1 ? 'bg-[var(--green)] text-white' :
              step === i + 1 ? 'bg-[var(--blue)] text-white' :
              'bg-[var(--border)] text-[var(--sub)]'
            }`}>
              {step > i + 1 ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-[11px] hidden sm:inline ${step === i + 1 ? 'font-semibold' : 'text-[var(--sub)]'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight size={12} color="var(--border)" />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* STEP 1: House + Room */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <p className="text-[15px] font-bold mb-3">지점 선택</p>
              <select value={selectedHouse} onChange={e => setSelectedHouse(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-[var(--bg)] border text-[14px] outline-none ${
                  errors.house ? 'border-[var(--red)]' : 'border-[var(--border)]'
                }`}>
                <option value="">지점을 선택하세요</option>
                {houses.map(h => (
                  <option key={h.id} value={h.name}>{h.name} ({h.district})</option>
                ))}
              </select>
              {errors.house && <p className="text-[11px] text-[var(--red)] mt-1">{errors.house}</p>}
            </Card>

            {selectedHouse && (
              <Card className="p-4">
                <p className="text-[15px] font-bold mb-3">방 선택</p>
                {loadingRooms ? (
                  <p className="text-[13px] text-[var(--sub)] text-center py-4">불러오는 중...</p>
                ) : rooms.length === 0 ? (
                  <p className="text-[13px] text-[var(--sub)] text-center py-4">등록된 방이 없습니다</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {rooms.map(r => (
                      <button key={r.id} onClick={() => setSelectedRoom(r)}
                        className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                          selectedRoom?.id === r.id
                            ? 'border-[var(--blue)] bg-[var(--blue-light)]'
                            : 'border-[var(--border)] bg-[var(--bg)]'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[14px] font-semibold">{r.roomCode}</span>
                            <span className="text-[12px] text-[var(--sub)] ml-2">{r.roomType}</span>
                          </div>
                          <span className="text-[13px] font-bold text-[var(--blue)]">
                            {r.baseRent > 0 ? `${fmtNum(r.baseRent)}원` : '-'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {errors.room && <p className="text-[11px] text-[var(--red)] mt-1">{errors.room}</p>}
              </Card>
            )}
          </div>
        )}

        {/* STEP 2: Basic Info */}
        {step === 2 && (
          <Card className="p-4">
            <p className="text-[15px] font-bold mb-4">기본 정보</p>
            <div className="flex flex-col gap-4">
              <Field label="계약자명" required value={name} onChange={setName}
                placeholder="이름" error={errors.name} />
              <Field label="연락처" required value={phone} onChange={setPhone}
                placeholder="010-0000-0000" error={errors.phone} type="tel" />
              <Field label="국적" value={nationality} onChange={setNationality}
                placeholder="한국" />
              <div>
                <label className="text-[13px] font-semibold mb-1.5 block">메모 (선택)</label>
                <textarea value={memo} onChange={e => setMemo(e.target.value)}
                  placeholder="특이사항" rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[14px] outline-none resize-none placeholder:text-[var(--sub)]" />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Contract Info */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <p className="text-[15px] font-bold mb-4">계약 정보</p>
              <div className="flex flex-col gap-4">
                <Field label="월세 (원)" value={rent} onChange={setRent}
                  type="number" placeholder="0" />
                <Field label="관리비 (원)" value={mgmtFee} onChange={setMgmtFee}
                  type="number" placeholder="100000" />
                <Field label="보증금 (원)" value={deposit} onChange={setDeposit}
                  type="number" placeholder="2000000" />
                <Field label="계약 시작일" required value={startDate} onChange={setStartDate}
                  type="date" error={errors.startDate} />
                <Field label="계약 종료일" required value={endDate} onChange={setEndDate}
                  type="date" error={errors.endDate} />
                <div>
                  <label className="text-[13px] font-semibold mb-1.5 block">상태</label>
                  <div className="flex gap-2">
                    {['입주중', '퇴실예정'].map(s => (
                      <button key={s} onClick={() => setStatus(s)}
                        className={`flex-1 py-3 rounded-xl text-[13px] font-semibold border transition-colors ${
                          status === s
                            ? 'border-[var(--blue)] bg-[var(--blue-light)] text-[var(--blue)]'
                            : 'border-[var(--border)] text-[var(--sub)]'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Monthly Total */}
            <div className="rounded-2xl bg-[var(--blue-light)] p-4 text-center">
              <p className="text-[12px] text-[var(--blue)]">월 납부액</p>
              <p className="text-[22px] font-bold text-[var(--blue)]">{toMan(monthlyTotal)}원</p>
              <p className="text-[11px] text-[var(--blue)] opacity-70">
                월세 {fmtNum(Number(rent) || 0)} + 관리비 {fmtNum(Number(mgmtFee) || 0)}
              </p>
            </div>

            {/* Summary */}
            <Card className="p-4">
              <p className="text-[13px] font-bold text-[var(--sub)] mb-2">등록 요약</p>
              <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                <span className="text-[var(--sub)]">지점/방</span>
                <span className="text-right font-medium">{selectedHouse} {selectedRoom?.roomCode}</span>
                <span className="text-[var(--sub)]">계약자</span>
                <span className="text-right font-medium">{name}</span>
                <span className="text-[var(--sub)]">연락처</span>
                <span className="text-right font-medium">{phone}</span>
                <span className="text-[var(--sub)]">보증금</span>
                <span className="text-right font-medium">{fmtNum(Number(deposit) || 0)}원</span>
                <span className="text-[var(--sub)]">계약기간</span>
                <span className="text-right font-medium">{startDate} ~ {endDate}</span>
              </div>
            </Card>

            {errors.submit && (
              <p className="text-[13px] text-[var(--red)] text-center">{errors.submit}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3 bg-[var(--bg)]">
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={() => { setStep(step - 1); setErrors({}) }}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--sub)]">
              이전
            </button>
          )}
          {step < 3 ? (
            <button onClick={goNext}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-[var(--blue)] text-white">
              다음
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold bg-[var(--blue)] text-white flex items-center justify-center gap-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? '등록 중...' : '등록하기'}
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
      <label className="text-[13px] font-semibold mb-1.5 block">
        {label} {required && <span className="text-[var(--red)]">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl bg-[var(--bg)] border text-[14px] outline-none placeholder:text-[var(--sub)] ${
          error ? 'border-[var(--red)]' : 'border-[var(--border)]'
        }`} />
      {error && <p className="text-[11px] text-[var(--red)] mt-1">{error}</p>}
    </div>
  )
}
