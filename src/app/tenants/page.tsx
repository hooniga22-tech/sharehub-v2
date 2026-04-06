'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

const houses = ['전체', '역삼하우스', '강남하우스', '서초하우스']

const tenants = [
  { id: '1', name: '김민수', phone: '010-1234-5678', house: '역삼하우스', room: '302호', rent: 650000, maintenance: 100000, deposit: 3000000, period: '2024.01.15 ~ 2024.12.14', startDate: '2024-01-15', endDate: '2024-12-14', status: '입주중' as const, paid: true },
  { id: '2', name: '박서연', phone: '010-2345-6789', house: '역삼하우스', room: '201호', rent: 550000, maintenance: 100000, deposit: 2000000, period: '2024.03.01 ~ 2025.02.28', startDate: '2024-03-01', endDate: '2025-02-28', status: '입주중' as const, paid: true },
  { id: '3', name: '이지현', phone: '010-3456-7890', house: '강남하우스', room: '105호', rent: 700000, maintenance: 120000, deposit: 3000000, period: '2024.02.01 ~ 2024.04.30', startDate: '2024-02-01', endDate: '2024-04-30', status: '퇴실예정' as const, paid: false },
  { id: '4', name: '최동혁', phone: '010-4567-8901', house: '강남하우스', room: '203호', rent: 600000, maintenance: 120000, deposit: 2500000, period: '2024.01.01 ~ 2024.12.31', startDate: '2024-01-01', endDate: '2024-12-31', status: '입주중' as const, paid: true },
  { id: '5', name: '정하윤', phone: '010-5678-9012', house: '서초하우스', room: '101호', rent: 720000, maintenance: 100000, deposit: 3000000, period: '2023.12.01 ~ 2024.11.30', startDate: '2023-12-01', endDate: '2024-11-30', status: '입주중' as const, paid: false },
  { id: '6', name: '오승우', phone: '010-6789-0123', house: '서초하우스', room: '304호', rent: 580000, maintenance: 100000, deposit: 2000000, period: '2024.01.01 ~ 2024.06.30', startDate: '2024-01-01', endDate: '2024-06-30', status: '퇴실예정' as const, paid: true },
]

const statusVariant: Record<string, 'green' | 'amber' | 'gray'> = {
  '입주중': 'green',
  '퇴실예정': 'amber',
  '퇴실': 'gray',
}

export default function TenantsPage() {
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [statusCard, setStatusCard] = useState<'all' | 'unpaid' | 'expiring'>('all')

  const filtered = useMemo(() => {
    let list = filter === '전체' ? tenants : tenants.filter(t => t.house === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.phone.includes(q) || t.room.includes(q))
    }
    if (statusCard === 'unpaid') list = list.filter(t => !t.paid && t.status === '입주중')
    if (statusCard === 'expiring') list = list.filter(t => t.status === '퇴실예정')
    return list
  }, [filter, search, statusCard])

  const activeTenants = tenants.filter(t => t.status === '입주중')
  const unpaidCount = activeTenants.filter(t => !t.paid).length
  const expiringCount = tenants.filter(t => t.status === '퇴실예정').length

  const grouped = filtered.reduce<Record<string, typeof tenants>>((acc, t) => {
    if (!acc[t.house]) acc[t.house] = []
    acc[t.house].push(t)
    return acc
  }, {})

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="입주자"
        right={
          <Link href="/tenants/new" className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--blue)]">
            <Plus size={18} color="#fff" />
          </Link>
        }
      />

      {/* Status Cards — v1 스타일 4칸 그리드 */}
      <div className="grid grid-cols-3 gap-2 px-5 pt-3">
        <button
          onClick={() => setStatusCard(statusCard === 'all' ? 'all' : 'all')}
          className={`rounded-xl p-3 text-center transition-all ${statusCard === 'all' ? 'ring-2 ring-[var(--blue)]' : ''}`}
          style={{ background: 'var(--blue-light)' }}
        >
          <p className="text-[18px] font-bold text-[var(--blue)]">{activeTenants.length}</p>
          <p className="text-[10px] font-semibold text-[var(--sub)]">전체</p>
        </button>
        <button
          onClick={() => setStatusCard(statusCard === 'unpaid' ? 'all' : 'unpaid')}
          className={`rounded-xl p-3 text-center transition-all ${statusCard === 'unpaid' ? 'ring-2 ring-[var(--red)]' : ''}`}
          style={{ background: 'var(--red-light)' }}
        >
          <p className="text-[18px] font-bold text-[var(--red)]">{unpaidCount}</p>
          <p className="text-[10px] font-semibold text-[var(--sub)]">미납</p>
        </button>
        <button
          onClick={() => setStatusCard(statusCard === 'expiring' ? 'all' : 'expiring')}
          className={`rounded-xl p-3 text-center transition-all ${statusCard === 'expiring' ? 'ring-2 ring-[var(--amber)]' : ''}`}
          style={{ background: 'var(--amber-light)' }}
        >
          <p className="text-[18px] font-bold text-[var(--amber)]">{expiringCount}</p>
          <p className="text-[10px] font-semibold text-[var(--sub)]">만료임박</p>
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pt-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sub)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름, 연락처, 호실 검색"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[13px] outline-none placeholder:text-[var(--sub)]"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {houses.map(h => (
          <button
            key={h}
            onClick={() => setFilter(h)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              filter === h
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Tenant List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {Object.entries(grouped).map(([house, list]) => (
          <div key={house} className="mt-3">
            <p className="text-[13px] text-[var(--sub)] font-medium mb-2">{house} <span className="text-[var(--blue)]">{list.length}</span></p>
            <div className="flex flex-col gap-2">
              {list.map(t => (
                <Link key={t.id} href={`/tenants/${t.id}`}>
                  <Card className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-[var(--blue)]">{t.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold">{t.name}</span>
                        <span className="text-[12px] text-[var(--sub)]">{t.room}</span>
                        {!t.paid && t.status === '입주중' && <Chip label="미납" variant="red" />}
                      </div>
                      <p className="text-[12px] text-[var(--sub)] mt-0.5">{t.period}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[14px] font-semibold">{t.rent.toLocaleString()}원</span>
                      <Chip label={t.status} variant={statusVariant[t.status]} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
