'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 스타일 상수 ────────────────────────────────────────
const BG = '#F7F8FA'
const CARD = '#FFFFFF'
const LINE = '#E5E8EB'
const SOFT = '#F2F4F6'
const INK = '#191F28'
const SUB = '#4E5968'
const MUTE = '#8B95A1'
const BLUE = '#3182F6'
const GREEN = '#00B493'
const RED = '#F04452'
const ORANGE = '#F59E0B'

const PRESET_TAGS = ['청소', '수리', '이슈', '점검', '교체', '설치']
const AMOUNT_PRESETS = [30000, 40000, 50000, 60000, 70000]
const DEFAULT_WORKERS = ['이인실', '이미경', '진진수', '담당자미정']

type Step = 1 | 2 | 3 | 4 | 5 | 6
const TOTAL = 6

type House = { 지점ID: string; 지점명: string; 구: string }
type Staff = { 담당자ID: string; 이름: string; 링크토큰: string }

type Form = {
  gu: string
  houseName: string
  tags: string[]
  worker: string
  startDate: string
  endDate: string
  amount: number | ''
  memo: string
}

const EMPTY: Form = {
  gu: '', houseName: '', tags: [], worker: '',
  startDate: '', endDate: '', amount: '', memo: '',
}

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function tagColor(t: string): string {
  if (t.includes('청소')) return BLUE
  if (t.includes('수리')) return RED
  if (t.includes('이슈') || t.includes('민원') || t.includes('고장')) return ORANGE
  return MUTE
}

function tagBg(t: string): string {
  if (t.includes('청소')) return '#E6F0FE'
  if (t.includes('수리')) return '#FEE6E6'
  if (t.includes('이슈') || t.includes('민원') || t.includes('고장')) return '#FFF4E0'
  return '#F2F4F6'
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<Form>({ ...EMPTY, startDate: todayYmd() })
  const [houses, setHouses] = useState<House[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [districtsLoading, setDistrictsLoading] = useState(true)
  const [customTag, setCustomTag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null)

  // 담당자/구 목록은 첫 진입 시 1회 로드
  useEffect(() => {
    fetch('/api/workers/staff')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setStaff(d) })
      .catch(() => setStaff([]))
    fetch('/api/houses/districts')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDistricts(d) })
      .catch(() => setDistricts([]))
      .finally(() => setDistrictsLoading(false))
  }, [])

  // 구 변경 시 지점 목록 로드
  useEffect(() => {
    if (!form.gu) return
    fetch(`/api/houses?gu=${encodeURIComponent(form.gu)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHouses(d) })
      .catch(() => setHouses([]))
  }, [form.gu])

  const validSteps: Record<Step, boolean> = {
    1: !!form.gu,
    2: !!form.houseName,
    3: form.tags.length > 0,
    4: !!form.worker,
    5: !!form.startDate,
    6: true,
  }

  const handleNext = () => {
    if (!validSteps[step]) return
    if (step < TOTAL) setStep((step + 1) as Step)
  }
  const handlePrev = () => {
    if (step === 1) {
      router.push('/issues')
      return
    }
    setStep((step - 1) as Step)
  }
  // Step 5에서 일정을 비워 둔 채 바로 요약으로 이동 (인벤토리로 등록되게)
  const skipSchedule = () => {
    setForm({ ...form, startDate: '', endDate: '', amount: '' })
    setStep(6)
  }

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/issues/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          지점명: form.houseName,
          태그: form.tags,
          담당자명: form.worker === '담당자미정' ? '' : form.worker,
          시작일: form.startDate,
          마감일: form.endDate,
          금액: form.amount === '' ? 0 : form.amount,
          메모: form.memo,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.id) {
        alert(data.error || '등록에 실패했어요')
        return
      }
      setSubmitted({ id: data.id })
    } finally {
      setSubmitting(false)
    }
  }

  // ── 서브 헤더 ───────────────────────────────────────
  const headerTitles: Record<Step, string> = {
    1: '어느 구인가요?',
    2: '어느 지점인가요?',
    3: '어떤 작업인가요?',
    4: '담당자를 정해주세요',
    5: '기간과 금액',
    6: '메모 & 확인',
  }

  if (submitted) {
    return (
      <Screen>
        <Header onBack={() => router.push('/issues')} title="할일 등록" right={null} />
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: GREEN, margin: '40px auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 6 }}>등록되었어요</div>
          <div style={{ fontSize: 12, color: MUTE, marginBottom: 24 }}>ID: {submitted.id}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => router.push('/issues')}
              style={btnStyle('primary')}
            >
              목록으로
            </button>
            <button
              onClick={() => { setSubmitted(null); setForm({ ...EMPTY, startDate: todayYmd() }); setStep(1) }}
              style={btnStyle('ghost')}
            >
              하나 더 등록
            </button>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <Header
        onBack={handlePrev}
        title="할일 등록"
        right={
          <span style={{ fontSize: 12, color: MUTE, fontWeight: 500 }}>
            {step} / {TOTAL}
          </span>
        }
      />

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0', justifyContent: 'center' }}>
        {Array.from({ length: TOTAL }, (_, i) => {
          const idx = i + 1
          const state = idx < step ? 'done' : idx === step ? 'current' : 'todo'
          const bg = state === 'done' ? GREEN : state === 'current' ? BLUE : '#D1D6DB'
          const w = state === 'current' ? 20 : 8
          return (
            <div key={idx} style={{
              width: w, height: 8, borderRadius: 4, background: bg,
              transition: 'all 0.2s',
            }} />
          )
        })}
      </div>

      {/* 스텝 타이틀 */}
      <div style={{ padding: '18px 20px 8px' }}>
        <div style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginBottom: 4 }}>STEP {step}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, letterSpacing: -0.3 }}>
          {headerTitles[step]}
        </h2>
      </div>

      {/* 스텝 콘텐츠 */}
      <div style={{ padding: '8px 16px 120px' }}>
        {step === 1 && <StepGu form={form} setForm={setForm} districts={districts} loading={districtsLoading} />}
        {step === 2 && <StepHouse form={form} setForm={setForm} houses={houses} />}
        {step === 3 && <StepTags form={form} setForm={setForm} customTag={customTag} setCustomTag={setCustomTag} />}
        {step === 4 && <StepWorker form={form} setForm={setForm} staff={staff} />}
        {step === 5 && <StepDateAmount form={form} setForm={setForm} onSkip={skipSchedule} />}
        {step === 6 && <StepSummary form={form} setForm={setForm} />}
      </div>

      {/* 하단 이전/다음 바 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          width: '100%', maxWidth: 430,
          display: 'flex', gap: 8,
          padding: '12px 16px 20px', background: BG,
          borderTop: `1px solid ${LINE}`,
        }}>
          <button onClick={handlePrev} style={btnStyle('ghost')}>
            {step === 1 ? '취소' : '이전'}
          </button>
          {step < TOTAL ? (
            <button
              onClick={handleNext}
              disabled={!validSteps[step]}
              style={btnStyle(validSteps[step] ? 'primary' : 'disabled')}
            >
              다음
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              style={btnStyle(submitting ? 'disabled' : 'primary')}
            >
              {submitting ? '등록 중…' : '등록하기'}
            </button>
          )}
        </div>
      </div>
    </Screen>
  )
}

// ── 공통 컴포넌트 ───────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <div style={{ maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>
        {children}
      </div>
    </div>
  )
}

function Header({ onBack, title, right }: { onBack: () => void; title: string; right: React.ReactNode }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 52, padding: '0 12px', background: BG,
    }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4,
        display: 'flex', alignItems: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>{title}</span>
      <div style={{ minWidth: 44, textAlign: 'right' }}>{right}</div>
    </header>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%', height: 48, boxSizing: 'border-box',
    borderRadius: 12, padding: '0 12px',
    border: `1px solid ${LINE}`, background: CARD, color: INK,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
}

function btnStyle(variant: 'primary' | 'ghost' | 'muted' | 'disabled'): React.CSSProperties {
  const base: React.CSSProperties = {
    flex: 1, height: 48, borderRadius: 12, border: 'none',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit',
  }
  if (variant === 'primary') return { ...base, background: BLUE, color: '#fff' }
  if (variant === 'ghost') return { ...base, background: '#fff', color: SUB, border: `1px solid ${LINE}` }
  if (variant === 'muted') return { ...base, background: '#f8f9fa', color: '#666', fontWeight: 600 }
  return { ...base, background: '#D1D6DB', color: '#fff', cursor: 'not-allowed' }
}

// ── Step 1: 구 ───────────────────────────────────────
function StepGu({ form, setForm, districts, loading }: {
  form: Form; setForm: (f: Form) => void
  districts: string[]; loading: boolean
}) {
  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: MUTE, fontSize: 13 }}>
        불러오는 중…
      </div>
    )
  }
  if (districts.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: MUTE, fontSize: 13 }}>
        등록된 지점이 없어요
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {districts.map(g => {
        const selected = form.gu === g
        return (
          <button
            key={g}
            onClick={() => setForm({ ...form, gu: g, houseName: '' })}
            style={{
              height: 56, borderRadius: 12,
              border: `1px solid ${selected ? BLUE : LINE}`,
              background: selected ? '#EFF6FF' : CARD,
              color: selected ? BLUE : INK,
              fontSize: 15, fontWeight: selected ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {g}
          </button>
        )
      })}
    </div>
  )
}

// ── Step 2: 지점 ────────────────────────────────────
function StepHouse({ form, setForm, houses }: { form: Form; setForm: (f: Form) => void; houses: House[] }) {
  if (houses.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: MUTE, fontSize: 13 }}>
        해당 구에 등록된 지점이 없어요
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {houses.map(h => {
        const selected = form.houseName === h.지점명
        return (
          <button
            key={h.지점ID || h.지점명}
            onClick={() => setForm({ ...form, houseName: h.지점명 })}
            style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${selected ? BLUE : LINE}`,
              background: selected ? '#EFF6FF' : CARD,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: selected ? BLUE : INK }}>
              {h.지점명}
            </div>
            <div style={{ fontSize: 11, color: MUTE, marginTop: 2 }}>{h.구}</div>
          </button>
        )
      })}
    </div>
  )
}

// ── Step 3: 태그 ────────────────────────────────────
function StepTags({
  form, setForm, customTag, setCustomTag,
}: {
  form: Form; setForm: (f: Form) => void
  customTag: string; setCustomTag: (v: string) => void
}) {
  const toggle = (t: string) => {
    if (form.tags.includes(t)) {
      setForm({ ...form, tags: form.tags.filter(x => x !== t) })
    } else {
      setForm({ ...form, tags: [...form.tags, t] })
    }
  }
  const remove = (t: string) => {
    setForm({ ...form, tags: form.tags.filter(x => x !== t) })
  }
  const addCustom = () => {
    const t = customTag.trim()
    if (!t) return
    if (form.tags.includes(t)) { setCustomTag(''); return }
    setForm({ ...form, tags: [...form.tags, t] })
    setCustomTag('')
  }

  return (
    <div>
      {/* 선택된 태그 */}
      {form.tags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginBottom: 6 }}>선택됨</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {form.tags.map(t => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 8px 6px 12px', borderRadius: 100,
                background: tagBg(t), color: tagColor(t),
                fontSize: 12, fontWeight: 600,
              }}>
                {t}
                <button onClick={() => remove(t)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', alignItems: 'center',
                  color: tagColor(t), opacity: 0.7,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 프리셋 */}
      <div style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginBottom: 6 }}>추천 태그</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {PRESET_TAGS.map(t => {
          const selected = form.tags.includes(t)
          return (
            <button key={t} onClick={() => toggle(t)} style={{
              padding: '8px 14px', borderRadius: 100,
              border: `1px solid ${selected ? tagColor(t) : LINE}`,
              background: selected ? tagBg(t) : CARD,
              color: selected ? tagColor(t) : INK,
              fontSize: 13, fontWeight: selected ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              #{t}
            </button>
          )
        })}
      </div>

      {/* 커스텀 입력 */}
      <div style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginBottom: 6 }}>직접 입력</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={customTag}
          onChange={e => setCustomTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder="새 태그"
          style={{
            flex: 1, height: 44, borderRadius: 12, padding: '0 12px',
            border: `1px solid ${LINE}`, background: CARD, color: INK,
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={addCustom}
          disabled={!customTag.trim()}
          style={{
            minWidth: 72, height: 44, borderRadius: 12, border: 'none',
            background: customTag.trim() ? BLUE : '#D1D6DB',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: customTag.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}
        >
          추가
        </button>
      </div>
    </div>
  )
}

// ── Step 4: 담당자 ──────────────────────────────────
function StepWorker({ form, setForm, staff }: { form: Form; setForm: (f: Form) => void; staff: Staff[] }) {
  // 담당자 시트 이름 목록 (중복 제거)
  const sheetNames = [...new Set(staff.map(s => s.이름).filter(Boolean))]
  // 기본 추천과 시트 이름 병합 (시트 이름 우선)
  const names = [
    ...DEFAULT_WORKERS.filter(n => n !== '담당자미정').filter(n => !sheetNames.includes(n)),
    ...sheetNames,
  ]
  const ordered = [...names, '담당자미정']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {ordered.map(n => {
        const selected = form.worker === n
        const unassigned = n === '담당자미정'
        return (
          <button
            key={n}
            onClick={() => setForm({ ...form, worker: n })}
            style={{
              height: 56, borderRadius: 12,
              border: `1px solid ${selected ? BLUE : LINE}`,
              background: selected ? '#EFF6FF' : CARD,
              color: selected ? BLUE : (unassigned ? MUTE : INK),
              fontSize: 14, fontWeight: selected ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

// ── Step 5: 기간/금액 ──────────────────────────────
function StepDateAmount({ form, setForm, onSkip }: {
  form: Form; setForm: (f: Form) => void
  onSkip: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 6 }}>시작일 *</div>
        <input
          type="date"
          value={form.startDate}
          onChange={e => setForm({ ...form, startDate: e.target.value })}
          style={inputStyle()}
        />
      </div>
      <div>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 6 }}>마감일</div>
        <input
          type="date"
          value={form.endDate}
          onChange={e => setForm({ ...form, endDate: e.target.value })}
          style={inputStyle()}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            type="button"
            onClick={onSkip}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 12, color: '#666', textDecoration: 'underline',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            나중에 일정 잡기
          </button>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 6 }}>금액</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {AMOUNT_PRESETS.map(a => {
            const selected = form.amount === a
            return (
              <button key={a} onClick={() => setForm({ ...form, amount: selected ? '' : a })}
                style={{
                  padding: '8px 14px', borderRadius: 100,
                  border: `1px solid ${selected ? BLUE : LINE}`,
                  background: selected ? '#EFF6FF' : CARD,
                  color: selected ? BLUE : INK,
                  fontSize: 13, fontWeight: selected ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {a.toLocaleString()}원
              </button>
            )
          })}
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={form.amount === '' ? '' : String(form.amount)}
          onChange={e => {
            const v = e.target.value
            setForm({ ...form, amount: v === '' ? '' : Number(v) })
          }}
          placeholder="직접 입력"
          style={inputStyle()}
        />
      </div>
    </div>
  )
}

// ── Step 6: 요약 + 메모 ─────────────────────────────
function StepSummary({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  const rows: [string, string][] = [
    ['구', form.gu || '-'],
    ['지점', form.houseName || '-'],
    ['태그', form.tags.length ? form.tags.join(', ') : '-'],
    ['담당자', form.worker || '-'],
    ['시작일', form.startDate || '-'],
    ['마감일', form.endDate || '-'],
    ['금액', form.amount === '' ? '-' : `${Number(form.amount).toLocaleString()}원`],
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: CARD, borderRadius: 14, padding: '8px 4px' }}>
        {rows.map(([k, v], i) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px',
            borderBottom: i < rows.length - 1 ? `1px solid ${SOFT}` : 'none',
          }}>
            <span style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600, marginBottom: 6 }}>담당자 메모</div>
        <textarea
          value={form.memo}
          onChange={e => setForm({ ...form, memo: e.target.value })}
          placeholder="담당자에게 전달할 내용을 적어주세요"
          style={{
            width: '100%', minHeight: 90, boxSizing: 'border-box',
            borderRadius: 12, padding: 12,
            border: `1px solid ${LINE}`, background: CARD, color: INK,
            fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit',
            outline: 'none', resize: 'vertical',
          }}
        />
      </div>
    </div>
  )
}
