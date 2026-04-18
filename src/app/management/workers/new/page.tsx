'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Worker, WorkerField, WorkerStatus } from '@/types/worker'

const GRAY900 = '#191f28'
const GRAY600 = '#4e5968'
const GRAY400 = '#8b95a1'
const LINE = '#e5e8eb'
const BG_SOFT = '#f2f4f6'
const PRIMARY = '#3182f6'
const PRIMARY_SOFT = '#e8f3ff'

type FormState = Omit<Worker, 'id' | 'token'>

const INITIAL: FormState = {
  name: '',
  field: '청소',
  status: '활동중',
  phone: '',
  bankName: '',
  accountNumber: '',
  holder: '',
  rrnHead: '',
  baseAmount: 0,
  startDate: '',
  memo: '',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, color: GRAY400, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${PRIMARY}`,
  background: PRIMARY_SOFT,
  color: GRAY900,
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function WorkerNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)

  const update = (k: keyof FormState, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { alert('이름을 입력하세요'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/management/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('create failed')
      const created: Worker = await res.json()
      router.push(`/management/workers/${created.id}`)
    } catch {
      alert('등록 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG_SOFT }}>
      <div style={{ maxWidth: 430, margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
        {/* 상단바 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: `1px solid ${LINE}`,
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 5,
          }}
        >
          <button
            onClick={() => router.push('/management/workers')}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex' }}
            aria-label="뒤로"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GRAY900} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: GRAY900 }}>담당자 등록</div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <Field label="이름 *">
            <input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="예: 홍길동"
              style={inputStyle}
            />
          </Field>
          <Field label="분야">
            <select value={form.field} onChange={e => update('field', e.target.value as WorkerField)} style={inputStyle}>
              <option value="청소">청소</option>
              <option value="수리">수리</option>
            </select>
          </Field>
          <Field label="상태">
            <select value={form.status} onChange={e => update('status', e.target.value as WorkerStatus)} style={inputStyle}>
              <option value="활동중">활동중</option>
              <option value="만료">만료</option>
            </select>
          </Field>
          <Field label="연락처">
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="010-0000-0000"
              style={inputStyle}
            />
          </Field>
          <Field label="은행명">
            <input value={form.bankName} onChange={e => update('bankName', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="계좌번호">
            <input value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="예금주">
            <input value={form.holder} onChange={e => update('holder', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="주민번호 앞6">
            <input value={form.rrnHead} onChange={e => update('rrnHead', e.target.value)} maxLength={6} style={inputStyle} />
          </Field>
          <Field label="기본금액">
            <input
              type="number"
              value={form.baseAmount}
              onChange={e => update('baseAmount', Number(e.target.value) || 0)}
              style={inputStyle}
            />
          </Field>
          <Field label="활동시작일">
            <input
              type="date"
              value={form.startDate}
              onChange={e => update('startDate', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="메모">
            <textarea
              value={form.memo}
              onChange={e => update('memo', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '16px 20px 32px' }}>
          <button
            onClick={() => router.push('/management/workers')}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: BG_SOFT,
              color: GRAY600,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              flex: 2,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: PRIMARY,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
