'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { useSheets } from '@/hooks/useSheets'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

const statusVariant: Record<string, 'green' | 'amber' | 'gray'> = {
  '입주중': 'green', '퇴실예정': 'amber', '퇴실': 'gray',
}

// 입주자 row: [0]ID [1]방ID [2]지점명 [3]방코드 [4]이름 [5]연락처 [6]월세 [7]관리비 [8]보증금 [9]입주일 [10]퇴실일 [11]상태

export default function TenantsPage() {
  const { data: tenants, loading } = useSheets('입주자')
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')

  const houses = useMemo(() => {
    const set = new Set(tenants.map(r => r[2]))
    return ['전체', ...Array.from(set).sort()]
  }, [tenants])

  const filtered = useMemo(() => {
    let list = filter === '전체' ? tenants : tenants.filter(r => r[2] === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => r[4]?.toLowerCase().includes(q) || r[5]?.includes(q) || r[3]?.includes(q) || r[2]?.toLowerCase().includes(q))
    }
    return list
  }, [tenants, filter, search])

  const activeTenants = tenants.filter(r => r[11] === '입주중')
  const expiringCount = tenants.filter(r => r[11] === '퇴실예정').length

  const grouped = filtered.reduce<Record<string, string[][]>>((acc, r) => {
    const house = r[2] || '미지정'
    if (!acc[house]) acc[house] = []
    acc[house].push(r)
    return acc
  }, {})

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="입주자"
        right={
          <Link href="/tenants/new" className="flex items-center gap-1 text-[14px] font-semibold text-[var(--blue)]">
            <Plus size={16} /> 등록
          </Link>
        }
      />

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-2 px-5 pt-3">
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--blue-light)' }}>
          <p className="text-[18px] font-bold text-[var(--blue)]">{activeTenants.length}</p>
          <p className="text-[10px] font-semibold text-[var(--sub)]">전체</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--amber-light)' }}>
          <p className="text-[18px] font-bold text-[var(--amber)]">{expiringCount}</p>
          <p className="text-[10px] font-semibold text-[var(--sub)]">퇴실예정</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--green-light)' }}>
          <p className="text-[18px] font-bold text-[var(--green)]">{tenants.length}</p>
          <p className="text-[10px] font-semibold text-[var(--sub)]">총 등록</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pt-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sub)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 연락처, 호실, 지점명 검색"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[13px] outline-none placeholder:text-[var(--sub)]" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {houses.map(h => (
          <button key={h} onClick={() => setFilter(h)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              filter === h ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}>{h}</button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">입주자가 없습니다</p>
        ) : (
          Object.entries(grouped).map(([house, list]) => (
            <div key={house} className="mt-3">
              <p className="text-[13px] text-[var(--sub)] font-medium mb-2">{house} <span className="text-[var(--blue)]">{list.length}</span></p>
              <div className="flex flex-col gap-2">
                {list.map((r, i) => (
                  <Link key={i} href={`/tenants/${encodeURIComponent(r[0])}`}>
                    <Card className="px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                        <span className="text-[14px] font-bold text-[var(--blue)]">{r[4]?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">{r[4]}</span>
                          <span className="text-[12px] text-[var(--sub)]">{r[3]}</span>
                        </div>
                        <p className="text-[12px] text-[var(--sub)] mt-0.5">{r[9]} ~ {r[10]}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[14px] font-semibold">{Number(r[6] || 0).toLocaleString()}원</span>
                        <Chip label={r[11] || '입주중'} variant={statusVariant[r[11]] || 'gray'} />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
