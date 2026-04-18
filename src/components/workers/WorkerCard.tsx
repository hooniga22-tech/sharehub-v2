'use client'

import type { WorkerWithStats } from '@/types/worker'

type Props = {
  worker: WorkerWithStats
  onClick: () => void
}

export default function WorkerCard({ worker, onClick }: Props) {
  const isClean = worker.field === '청소'
  const badgeBg = isClean ? '#e8f3ff' : '#fff0f0'
  const badgeFg = isClean ? '#3182f6' : '#F04452'
  const isExpired = worker.status === '만료'

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 14,
        border: '1px solid #e5e8eb',
        cursor: 'pointer',
        opacity: isExpired ? 0.55 : 1,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 6,
          background: isExpired ? '#f2f4f6' : badgeBg,
          color: isExpired ? '#8b95a1' : badgeFg,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {worker.field}{isExpired ? ' · 만료' : ''}
      </span>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#191f28', marginBottom: 2 }}>
        {worker.name}
      </div>
      <div style={{ fontSize: 11, color: '#8b95a1', marginBottom: 14 }}>
        {worker.phone || '—'}
      </div>
      <div style={{ height: 1, background: '#e5e8eb', marginBottom: 10 }} />
      <div style={{ fontSize: 10, color: '#8b95a1', marginBottom: 2 }}>이번달</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#191f28' }}>
        {worker.thisMonthJobs}건
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#3182f6', marginTop: 2 }}>
        {worker.thisMonthTotal.toLocaleString()}원
      </div>
    </div>
  )
}
