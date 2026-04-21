'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Work = {
  rowIndex: number
  용역ID: string
  예정일: string
  지점명: string
  담당자명: string
  작업종류: string
  정산금액: number
  메모: string
  요청사항: string
  완료여부: 'Y' | 'N'
  완료일: string
}

const BG = '#f2f4f6'
const SOFT = '#f2f4f6'
const LINE = '#e5e8eb'
const GRAY900 = '#191f28'
const GRAY600 = '#4e5968'
const GRAY400 = '#8b95a1'
const PRIMARY = '#3182f6'
const GREEN = '#00B493'
const RED = '#F04452'

const CARD: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: '14px 16px',
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: GRAY400,
  letterSpacing: 0.4, marginBottom: 10, display: 'block',
}

const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  minHeight: 36, gap: 12,
}

const LABEL: React.CSSProperties = { fontSize: 13, color: GRAY400, flexShrink: 0 }
const VALUE: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: GRAY900, textAlign: 'right' }
const INPUT: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, color: GRAY900,
  textAlign: 'right', border: `1px solid ${LINE}`,
  background: '#fff', borderRadius: 8, padding: '6px 10px',
  fontFamily: 'inherit', outline: 'none', width: 160,
}

const WORK_TYPES = ['청소', '수리', '점검', '소독', '폐기물', '기타']

export default function IssueWorkDetailMobile() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<Work>>({})
  const [saving, setSaving] = useState(false)
  const [houseNames, setHouseNames] = useState<string[]>([])
  const [staffNames, setStaffNames] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then((d: any[]) => {
      setHouseNames((Array.isArray(d) ? d : []).map(h => h['지점명']).filter(Boolean).sort())
    }).catch(() => {})
    fetch('/api/workers/staff').then(r => r.json()).then((d: any[]) => {
      setStaffNames((Array.isArray(d) ? d : []).map(s => s['이름']).filter(Boolean).sort())
    }).catch(() => {})
  }, [])

  // 요청사항: 자동 저장 (debounced on blur)
  const [request, setRequest] = useState('')
  const lastSavedRequest = useRef('')
  const [requestSaved, setRequestSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/issues/work/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoading(false); return }
        setWork(d)
        setRequest(d.요청사항 || '')
        lastSavedRequest.current = d.요청사항 || ''
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Frame router={router}>
        <p style={{ textAlign: 'center', color: GRAY400, fontSize: 13, padding: '60px 0' }}>불러오는 중...</p>
      </Frame>
    )
  }
  if (!work) {
    return (
      <Frame router={router}>
        <p style={{ textAlign: 'center', color: GRAY400, fontSize: 13, padding: '60px 0' }}>작업을 찾을 수 없어요</p>
      </Frame>
    )
  }

  const isDone = work.완료여부 === 'Y'

  const startEdit = () => {
    setDraft({
      예정일: work.예정일,
      지점명: work.지점명,
      담당자명: work.담당자명,
      작업종류: work.작업종류,
      정산금액: work.정산금액,
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    setSaving(true)
    const body: any = {
      예정일: draft.예정일,
      지점명: draft.지점명,
      담당자명: draft.담당자명,
      작업종류: draft.작업종류,
      정산금액: Number(draft.정산금액) || 0,
    }
    const res = await fetch(`/api/issues/work/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) { alert('저장 실패'); return }
    const updated = await res.json()
    setWork(updated)
    setEditing(false)
  }

  const toggleDone = async (next: 'Y' | 'N') => {
    if (next === work.완료여부) return
    const res = await fetch(`/api/issues/work/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 완료여부: next }),
    })
    if (!res.ok) { alert('상태 변경 실패'); return }
    const updated = await res.json()
    setWork(updated)
  }

  const flushRequest = async () => {
    const trimmed = request
    if (trimmed === lastSavedRequest.current) return
    const res = await fetch(`/api/issues/work/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 요청사항: trimmed }),
    })
    if (res.ok) {
      lastSavedRequest.current = trimmed
      const updated = await res.json()
      setWork(updated)
      setRequestSaved(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setRequestSaved(false), 1500)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('이 작업을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/issues/work/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('삭제 실패'); return }
    router.push('/issues')
  }

  const badgeColor = work.작업종류.includes('청소') ? GREEN
    : work.작업종류.includes('수리') ? RED : GRAY400
  const badgeBg = work.작업종류.includes('청소') ? '#E6F7F2'
    : work.작업종류.includes('수리') ? '#fff0f0' : SOFT

  return (
    <Frame
      router={router}
      rightSlot={
        editing ? (
          <button
            onClick={saveEdit}
            disabled={saving}
            style={topBtnStyle(PRIMARY)}
          >
            {saving ? '저장중' : '저장'}
          </button>
        ) : (
          <button onClick={startEdit} style={topBtnStyle(PRIMARY)}>편집</button>
        )
      }
    >
      {/* 카드 1: 기본 정보 */}
      <div style={CARD}>
        <span style={SECTION_LABEL}>기본 정보</span>

        <div style={ROW}>
          <span style={LABEL}>예정일</span>
          {editing ? (
            <input
              type="date"
              value={(draft.예정일 || '').slice(0, 10)}
              onChange={e => setDraft(d => ({ ...d, 예정일: e.target.value }))}
              style={INPUT}
            />
          ) : (
            <span style={VALUE}>{work.예정일 || '-'}</span>
          )}
        </div>
        <Divider />

        <div style={ROW}>
          <span style={LABEL}>지점</span>
          {editing ? (
            <select
              value={draft.지점명 || ''}
              onChange={e => setDraft(d => ({ ...d, 지점명: e.target.value }))}
              style={{ ...INPUT, width: 160 }}
            >
              {draft.지점명 && !houseNames.includes(draft.지점명) && (
                <option value={draft.지점명}>{draft.지점명}</option>
              )}
              {houseNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <span style={VALUE}>{work.지점명 || '-'}</span>
          )}
        </div>
        <Divider />

        <div style={ROW}>
          <span style={LABEL}>작업</span>
          {editing ? (
            <select
              value={draft.작업종류 || ''}
              onChange={e => setDraft(d => ({ ...d, 작업종류: e.target.value }))}
              style={{ ...INPUT, width: 160 }}
            >
              {!WORK_TYPES.includes(draft.작업종류 || '') && draft.작업종류 && (
                <option value={draft.작업종류}>{draft.작업종류}</option>
              )}
              {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                borderRadius: 6, background: badgeBg, color: badgeColor,
              }}>
                {firstLabel(work.작업종류)}
              </span>
              <span style={{ ...VALUE, textAlign: 'left' }}>{work.작업종류 || '-'}</span>
            </div>
          )}
        </div>
        <Divider />

        <div style={ROW}>
          <span style={LABEL}>담당자</span>
          {editing ? (
            <select
              value={draft.담당자명 || ''}
              onChange={e => setDraft(d => ({ ...d, 담당자명: e.target.value }))}
              style={{ ...INPUT, width: 160 }}
            >
              {draft.담당자명 && !staffNames.includes(draft.담당자명) && (
                <option value={draft.담당자명}>{draft.담당자명}</option>
              )}
              {staffNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <span style={VALUE}>{work.담당자명 || '-'}</span>
          )}
        </div>
        <Divider />

        <div style={ROW}>
          <span style={LABEL}>금액</span>
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                inputMode="numeric"
                value={String(draft.정산금액 ?? 0)}
                onChange={e => setDraft(d => ({ ...d, 정산금액: Number(e.target.value) || 0 }))}
                style={{ ...INPUT, width: 130, textAlign: 'right' }}
              />
              <span style={{ fontSize: 14, color: GRAY600 }}>원</span>
            </div>
          ) : (
            <span style={VALUE}>{(work.정산금액 || 0).toLocaleString()}원</span>
          )}
        </div>
      </div>

      {/* 카드 2: 요청사항 */}
      <div style={CARD}>
        <span style={SECTION_LABEL}>요청사항</span>
        <textarea
          value={request}
          onChange={e => setRequest(e.target.value)}
          onBlur={flushRequest}
          placeholder="입주자 추가 요청이나 특이사항을 적어주세요"
          style={{
            width: '100%', minHeight: 80,
            border: `1px solid ${LINE}`, background: SOFT, borderRadius: 8,
            padding: 10, fontSize: 14, lineHeight: 1.5,
            color: GRAY900, fontFamily: 'inherit', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ minHeight: 16, marginTop: 6, textAlign: 'right' }}>
          {requestSaved && (
            <span style={{ fontSize: 11, color: GREEN, fontWeight: 500 }}>저장됨</span>
          )}
        </div>
      </div>

      {/* 메모 (내부 기록) — 편집 모드에서만 노출 */}
      {editing && (
        <div style={CARD}>
          <span style={SECTION_LABEL}>내부 메모</span>
          <textarea
            value={(draft as any).메모 ?? work.메모 ?? ''}
            onChange={e => setDraft(d => ({ ...d, 메모: e.target.value } as any))}
            placeholder="내부 기록용 메모"
            style={{
              width: '100%', minHeight: 60,
              border: `1px solid ${LINE}`, background: SOFT, borderRadius: 8,
              padding: 10, fontSize: 13, lineHeight: 1.5,
              color: GRAY900, fontFamily: 'inherit', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* 삭제 버튼 */}
      <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
        <button
          onClick={handleDelete}
          style={{
            background: 'transparent', border: 'none',
            color: RED, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', padding: '10px 16px', fontFamily: 'inherit',
          }}
        >
          작업 삭제
        </button>
      </div>
    </Frame>
  )
}

// ── 작은 컴포넌트들 ─────────────────────────────────────

function Frame({
  router,
  rightSlot,
  children,
}: {
  router: ReturnType<typeof useRouter>
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ background: BG, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 430, margin: '0 auto' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', height: 52, background: BG,
        }}>
          <button
            onClick={() => router.back()}
            aria-label="뒤로가기"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#191f28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#191f28' }}>작업 상세</span>
          <div style={{ minWidth: 56, display: 'flex', justifyContent: 'flex-end' }}>{rightSlot}</div>
        </header>
        <div style={{ padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f1f3', margin: '4px 0' }} />
}

function topBtnStyle(color: string): React.CSSProperties {
  return {
    background: 'transparent', border: 'none', color,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    padding: '6px 4px', fontFamily: 'inherit',
  }
}

function statusBtnStyle(active: boolean, activeColor: string): React.CSSProperties {
  return {
    flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
    background: active ? activeColor : SOFT,
    color: active ? '#fff' : GRAY600,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }
}

function firstLabel(workType: string): string {
  if (workType.includes('청소')) return '청소'
  if (workType.includes('수리')) return '수리'
  return '기타'
}
