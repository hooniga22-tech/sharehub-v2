'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Worker, WorkerWithStats, WorkerJob, WorkerField, WorkerStatus } from '@/types/worker'

// ── 색상 ───────────────────────────────────────────────
const GRAY900 = '#191f28'
const GRAY600 = '#4e5968'
const GRAY400 = '#8b95a1'
const LINE = '#e5e8eb'
const BG_SOFT = '#f2f4f6'
const PRIMARY = '#3182f6'
const PRIMARY_SOFT = '#e8f3ff'
const RED = '#F04452'
const RED_SOFT = '#fff0f0'

// ── 필드 컴포넌트 ──────────────────────────────────────
function FieldRow({
  label,
  value,
  editing,
  onChange,
  inputType = 'text',
  options,
  readonly,
  mask,
  fullWidth,
}: {
  label: string
  value: string | number
  editing: boolean
  onChange?: (v: string) => void
  inputType?: 'text' | 'number' | 'date' | 'tel'
  options?: { value: string; label: string }[]
  readonly?: boolean
  mask?: string
  fullWidth?: boolean
}) {
  const displayValue = mask !== undefined ? mask : (value === '' || value == null ? '—' : String(value))

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${PRIMARY}`,
    background: readonly ? BG_SOFT : PRIMARY_SOFT,
    color: readonly ? GRAY600 : GRAY900,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, color: GRAY400, marginBottom: 6 }}>{label}</div>
      {editing && !readonly ? (
        options ? (
          <select
            value={String(value ?? '')}
            onChange={e => onChange?.(e.target.value)}
            style={inputStyle}
          >
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            value={String(value ?? '')}
            onChange={e => onChange?.(e.target.value)}
            readOnly={readonly}
            style={inputStyle}
          />
        )
      ) : editing && readonly ? (
        <input value={String(value ?? '')} readOnly style={inputStyle} />
      ) : (
        <div style={{ fontSize: 14, fontWeight: 500, color: GRAY900, wordBreak: 'break-all' }}>
          {displayValue}
        </div>
      )}
    </div>
  )
}

// 메모(복수 줄)
function MemoField({
  value,
  editing,
  onChange,
}: {
  value: string
  editing: boolean
  onChange: (v: string) => void
}) {
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, color: GRAY400, marginBottom: 6 }}>메모</div>
      {editing ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${PRIMARY}`,
            background: PRIMARY_SOFT,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
      ) : (
        <div style={{ fontSize: 14, fontWeight: 500, color: GRAY900, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
          {value || '—'}
        </div>
      )}
    </div>
  )
}

// 주민번호 앞6자리 마스킹
function maskRrn(v: string): string {
  if (!v) return '—'
  if (v.length < 6) return v
  return `${v.slice(0, 6)} ****`
}

// ── 메인 ───────────────────────────────────────────────
export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data, setData] = useState<WorkerWithStats | null>(null)
  const [jobs, setJobs] = useState<WorkerJob[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Worker | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/management/workers/${id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      fetch(`/api/management/workers/${id}/jobs?limit=3`, { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
    ])
      .then(([d, j]) => {
        setData(d)
        setJobs(Array.isArray(j) ? j : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (data) setForm({ ...data })
  }, [data])

  const startEdit = () => {
    if (data) setForm({ ...data })
    setEditing(true)
  }
  const cancelEdit = () => {
    if (data) setForm({ ...data })
    setEditing(false)
  }

  const save = async () => {
    if (!form || !data) return
    if (!form.name.trim()) { alert('이름을 입력하세요'); return }
    setSaving(true)
    try {
      const { id: _id, token: _tok, thisMonthJobs: _a, thisMonthTotal: _b, ...patch } =
        form as WorkerWithStats
      const res = await fetch(`/api/management/workers/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('save failed')
      const updated: Worker = await res.json()
      setData({
        ...updated,
        thisMonthJobs: data.thisMonthJobs,
        thisMonthTotal: data.thisMonthTotal,
      })
      setEditing(false)
    } catch {
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async () => {
    if (!data) return
    if (!confirm('비활성화 처리하면 목록에서 숨겨집니다. 계속할까요?')) return
    try {
      await fetch(`/api/management/workers/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '만료' }),
      })
      router.push('/management/workers')
    } catch {
      alert('처리 실패')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: GRAY400, fontSize: 13 }}>불러오는 중...</p>
      </div>
    )
  }
  if (!data || !form) {
    return (
      <div style={{ minHeight: '100vh', background: BG_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: GRAY400, fontSize: 13 }}>담당자를 찾을 수 없습니다</p>
      </div>
    )
  }

  const update = (k: keyof Worker, v: string | number) => setForm(prev => (prev ? { ...prev, [k]: v } : prev))

  const isClean = data.field === '청소'
  const avatarBg = isClean ? PRIMARY_SOFT : RED_SOFT
  const avatarFg = isClean ? PRIMARY : RED
  const badgeBg = isClean ? PRIMARY_SOFT : RED_SOFT
  const badgeFg = isClean ? PRIMARY : RED
  const statusBg = data.status === '활동중' ? '#e8f3ff' : '#f2f4f6'
  const statusFg = data.status === '활동중' ? PRIMARY : GRAY600

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
          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: GRAY900 }}>{data.name}</div>
          {editing ? null : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {data.token ? (
                <>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/worker/${data.token}`;
                      navigator.clipboard?.writeText(url).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      });
                    }}
                    style={{
                      background: 'none', border: `1px solid ${LINE}`,
                      borderRadius: 8, padding: '6px 10px',
                      color: GRAY600, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GRAY600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    {copied ? '복사됨!' : '링크 복사'}
                  </button>
                  <button
                    onClick={() => window.open(`/worker/${data.token}`, '_blank')}
                    style={{
                      background: PRIMARY, border: 'none',
                      borderRadius: 8, padding: '6px 10px',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    개인 페이지
                  </button>
                </>
              ) : (
                <span style={{ fontSize: 11, color: GRAY400 }}>링크 미생성</span>
              )}
              <button
                onClick={startEdit}
                style={{
                  background: 'none', border: 'none',
                  color: PRIMARY, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px',
                }}
              >
                편집
              </button>
            </div>
          )}
        </div>

        {/* 프로필 */}
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: avatarBg,
              color: avatarFg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {data.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: GRAY900, marginBottom: 4 }}>{data.name}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ padding: '2px 8px', borderRadius: 6, background: badgeBg, color: badgeFg, fontSize: 11, fontWeight: 600 }}>
                {data.field}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 6, background: statusBg, color: statusFg, fontSize: 11, fontWeight: 600 }}>
                {data.status}
              </span>
            </div>
          </div>
        </div>

        {/* 실적 요약 */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: `1px solid ${LINE}`,
            borderBottom: `1px solid ${LINE}`,
            background: BG_SOFT,
          }}
        >
          <div style={{ fontSize: 13, color: GRAY600 }}>
            이번달 <span style={{ fontWeight: 700, color: GRAY900 }}>{data.thisMonthJobs}건</span>
            <span style={{ margin: '0 6px', color: GRAY400 }}>·</span>
            <span style={{ fontWeight: 700, color: PRIMARY }}>{data.thisMonthTotal.toLocaleString()}원</span>
          </div>
        </div>

        {/* 필드 목록 */}
        <div style={{ padding: '0 20px' }}>
          <FieldRow label="연락처" value={form.phone} editing={editing} inputType="tel" onChange={v => update('phone', v)} />
          <FieldRow label="은행명" value={form.bankName} editing={editing} onChange={v => update('bankName', v)} />
          <FieldRow label="계좌번호" value={form.accountNumber} editing={editing} onChange={v => update('accountNumber', v)} />
          <FieldRow label="예금주" value={form.holder} editing={editing} onChange={v => update('holder', v)} />
          <FieldRow
            label="주민번호 앞6"
            value={form.rrnHead}
            editing={editing}
            onChange={v => update('rrnHead', v)}
            mask={!editing ? maskRrn(form.rrnHead) : undefined}
          />
          <FieldRow
            label="기본금액"
            value={editing ? form.baseAmount : `${form.baseAmount.toLocaleString()}원`}
            editing={editing}
            inputType="number"
            onChange={v => update('baseAmount', Number(v) || 0)}
          />
          <FieldRow label="활동시작일" value={form.startDate} editing={editing} inputType="date" onChange={v => update('startDate', v)} />
          <FieldRow
            label="분야"
            value={form.field}
            editing={editing}
            onChange={v => update('field', v as WorkerField)}
            options={[
              { value: '청소', label: '청소' },
              { value: '수리', label: '수리' },
            ]}
          />
          <FieldRow
            label="상태"
            value={form.status}
            editing={editing}
            onChange={v => update('status', v as WorkerStatus)}
            options={[
              { value: '활동중', label: '활동중' },
              { value: '만료', label: '만료' },
            ]}
          />
          <MemoField value={form.memo} editing={editing} onChange={v => update('memo', v)} />
          {editing && (
            <>
              <FieldRow label="담당자ID" value={data.id} editing={editing} readonly />
              <FieldRow label="링크토큰" value={data.token} editing={editing} readonly />
            </>
          )}
        </div>

        {/* 편집 모드 하단 버튼 */}
        {editing && (
          <div style={{ display: 'flex', gap: 8, padding: '16px 20px' }}>
            <button
              onClick={cancelEdit}
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
              onClick={save}
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
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}

        {/* 최근 작업 */}
        {!editing && (
          <div style={{ padding: '14px 0', borderTop: `1px solid ${LINE}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GRAY900, padding: '0 20px 10px' }}>최근 작업</div>
            {jobs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: GRAY400, fontSize: 13 }}>
                작업 내역이 없어요
              </div>
            ) : (
              jobs.map((j, i) => (
                <div
                  key={j.id || i}
                  style={{
                    padding: '12px 20px',
                    borderTop: `1px solid ${LINE}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: GRAY900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {j.site} · {j.task}
                    </div>
                    <div style={{ fontSize: 11, color: GRAY400, marginTop: 2 }}>{j.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: GRAY900, flexShrink: 0 }}>
                    {j.amount.toLocaleString()}원
                  </div>
                </div>
              ))
            )}
            <a
              href={`/issues?workerName=${encodeURIComponent(data.name)}`}
              style={{
                display: 'block',
                padding: '14px 20px',
                fontSize: 13,
                color: PRIMARY,
                textDecoration: 'none',
                borderTop: `1px solid ${LINE}`,
              }}
            >
              전체 보기 &gt;
            </a>
          </div>
        )}

        {/* 비활성화 버튼 */}
        {!editing && data.status === '활동중' && (
          <div style={{ padding: '24px 0 32px', textAlign: 'center' }}>
            <button
              onClick={deactivate}
              style={{
                background: 'transparent',
                border: 'none',
                color: RED,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '8px 16px',
              }}
            >
              비활성화 처리
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
