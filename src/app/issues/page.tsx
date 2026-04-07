'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { useSheets } from '@/hooks/useSheets'
import { CheckCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const statuses = ['전체', '접수', '진행중', '완료', '보류']
const statusVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  '접수': 'red', '진행중': 'amber', '완료': 'green', '보류': 'gray',
}
const categoryVariant: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  '수리': 'blue', '청소': 'green', '민원': 'amber', '교체': 'blue', '기타': 'gray',
}

// row: [0]ID [1]지점명 [2]방코드 [3]제목 [4]내용 [5]카테고리 [6]상태 [7]담당자 [8]등록일 [9]완료일 [10]비용 [11]메모

export default function IssuesPage() {
  const { data: issues, loading, refetch } = useSheets('이슈')
  const [filter, setFilter] = useState('전체')

  const filtered = filter === '전체' ? issues : issues.filter(r => r[6] === filter)
  const openCount = issues.filter(r => r[6] !== '완료').length

  async function quickResolve(rowIndex: number) {
    const row = [...issues[rowIndex]]
    row[6] = '완료'
    row[9] = new Date().toISOString().slice(0, 10)
    await fetch('/api/sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet: '이슈', rowIndex, row }),
    })
    refetch()
  }

  async function reopen(rowIndex: number) {
    const row = [...issues[rowIndex]]
    row[6] = '접수'
    row[9] = ''
    await fetch('/api/sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet: '이슈', rowIndex, row }),
    })
    refetch()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="이슈"
        right={<Link href="/issues/new" className="text-[14px] font-semibold text-[var(--blue)]">등록</Link>}
      />

      {openCount > 0 && (
        <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-[var(--red-light)] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--red)]">미해결 이슈 {openCount}건</span>
        </div>
      )}

      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              filter === s ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}>{s}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">이슈가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2.5 mt-1">
            {filtered.map((r, i) => {
              const realIndex = issues.indexOf(r)
              return (
                <Card key={i} className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {r[5] && <Chip label={r[5]} variant={categoryVariant[r[5]] || 'gray'} />}
                    <Chip label={r[6] || '접수'} variant={statusVariant[r[6]] || 'gray'} />
                  </div>
                  <p className="text-[14px] font-semibold mt-1">{r[3]}</p>
                  {r[4] && <p className="text-[12px] text-[var(--sub)] mt-0.5 line-clamp-2">{r[4]}</p>}
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--sub)] flex-wrap">
                    <span>{r[1]} {r[2]}</span>
                    {r[7] && <span>· {r[7]}</span>}
                    {Number(r[10]) > 0 && <span>· {Number(r[10]).toLocaleString()}원</span>}
                    {r[8] && <span>· {r[8]}</span>}
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    {r[6] !== '완료' ? (
                      <button onClick={() => quickResolve(realIndex)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[var(--green-light)] text-[var(--green)] flex items-center gap-1">
                        <CheckCircle size={12} /> 해결완료
                      </button>
                    ) : (
                      <button onClick={() => reopen(realIndex)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#F2F2F2] text-[var(--sub)] flex items-center gap-1">
                        <RotateCcw size={12} /> 재오픈
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
