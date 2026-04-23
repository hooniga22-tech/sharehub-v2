'use client'

import { useState, useEffect } from 'react'

type LastGen = {
  year_month: string
  executed_at: string
  triggered_by: string
  created_count: number
  skipped_count: number
  status: string
}

function formatKST(iso: string) {
  const d = new Date(iso)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`
}

function formatYM(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}년 ${Number(m)}월`
}

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const CheckIcon = ({ color = '#1B64DA' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

/**
 * Dashboard compact card (70px) - shows last generation info, click to go to /revenue
 */
export function DashboardGenCard({ onClick }: { onClick: () => void }) {
  const [info, setInfo] = useState<LastGen | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payments/last-generation')
      .then(r => r.json())
      .then(d => setInfo(d.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && !info) return null

  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', padding: '14px 16px',
      background: '#fff', borderRadius: 14, border: '0.5px solid #F0F0F0',
      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: '#E6F0FE',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <CalendarIcon />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <>
            <div style={{ width: 160, height: 14, background: '#F2F4F6', borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 120, height: 11, background: '#F2F4F6', borderRadius: 4 }} />
          </>
        ) : info ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>
              {formatYM(info.year_month)} 수납 {info.created_count}건 생성됨
            </div>
            <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 2 }}>
              {formatKST(info.executed_at)} {info.triggered_by === 'auto' ? '자동' : '수동'} 실행
            </div>
          </>
        ) : null}
      </div>
      <ChevronIcon />
    </button>
  )
}

/**
 * Revenue page generate card with manual trigger button
 */
export function RevenueGenCard({ onGenerated }: { onGenerated?: () => void }) {
  const [info, setInfo] = useState<LastGen | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const currentYear = kst.getUTCFullYear()
  const currentMonth = kst.getUTCMonth() + 1

  const loadInfo = () => {
    fetch('/api/payments/last-generation')
      .then(r => r.json())
      .then(d => setInfo(d.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadInfo() }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/payments/generate-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      setResult(data)
      loadInfo()
      onGenerated?.()
      setTimeout(() => setResult(null), 5000)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setGenerating(false)
    }
  }

  const btnDone = result && !generating
  const btnBg = btnDone ? '#00B493' : '#3182F6'

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '0.5px solid #F0F0F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <CalendarIcon />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>
          {currentYear}년 {currentMonth}월 수납
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 12, lineHeight: 1.5 }}>
        매월 1일 09:00에 자동 생성됩니다. 누락 시 아래 버튼으로 수동 생성하세요.
      </p>

      {loading ? (
        <div style={{ width: 200, height: 14, background: '#F2F4F6', borderRadius: 4, marginBottom: 14 }} />
      ) : info ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#E6F0FE', padding: '10px 12px', borderRadius: 10, marginBottom: 14,
        }}>
          <CheckIcon />
          <span style={{ fontSize: 12, color: '#1B64DA' }}>
            마지막 생성: {formatKST(info.executed_at)} · {info.created_count}건
          </span>
        </div>
      ) : (
        <div style={{
          padding: '10px 12px', borderRadius: 10, marginBottom: 14,
          background: '#F2F4F6',
        }}>
          <span style={{ fontSize: 12, color: '#8B95A1' }}>아직 자동 생성 이력 없음</span>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: generating ? '#A0C4F8' : btnBg,
          color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: generating ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
        }}
      >
        {generating ? (
          '생성 중...'
        ) : btnDone ? (
          <>
            <CheckIcon color="#fff" />
            {result.created}건 생성 완료
          </>
        ) : (
          <>
            <RefreshIcon />
            이번달 수납 생성
          </>
        )}
      </button>

      {result && !generating && (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: '#E6F7F0', fontSize: 12, color: '#00785C',
        }}>
          신규 생성 {result.created}건 · 기존 스킵 {result.skipped}건 · 총 {result.total}명 처리
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: '#FFF0F1', fontSize: 12, color: '#F04452',
        }}>
          생성 실패: {error}
        </div>
      )}
    </div>
  )
}
