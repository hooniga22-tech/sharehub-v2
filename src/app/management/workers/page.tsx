'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkerWithStats } from '@/types/worker'
import WorkerCard from '@/components/workers/WorkerCard'

export default function WorkersListPage() {
  const router = useRouter()
  const [workers, setWorkers] = useState<WorkerWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/management/workers', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setWorkers(Array.isArray(d) ? d : []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f2f4f6' }}>
      <div style={{ maxWidth: 430, margin: '0 auto', background: '#f2f4f6', minHeight: '100vh', position: 'relative' }}>
        {/* 헤더 */}
        <div
          style={{
            background: '#fff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e8eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/manage')}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex' }}
              aria-label="뒤로"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191f28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18L9 12L15 6" />
              </svg>
            </button>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#191f28', letterSpacing: '-0.3px' }}>담당자</div>
          </div>
          <div style={{ fontSize: 13, color: '#8b95a1' }}>총 {workers.length}명</div>
        </div>

        {/* 본문 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b95a1', fontSize: 13 }}>
            불러오는 중...
          </div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8b95a1', fontSize: 14 }}>
            등록된 담당자가 없어요
          </div>
        ) : (
          <div
            style={{
              padding: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              paddingBottom: 96,
            }}
          >
            {workers.map(w => (
              <WorkerCard
                key={w.id}
                worker={w}
                onClick={() => router.push(`/management/workers/${w.id}`)}
              />
            ))}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => router.push('/management/workers/new')}
          aria-label="담당자 추가"
          style={{
            position: 'fixed',
            right: 'max(16px, calc(50% - 215px + 16px))',
            bottom: 16,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#191f28',
            color: '#fff',
            fontSize: 28,
            lineHeight: '52px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
