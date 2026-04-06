'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { BottomTab } from '@/components/ui/BottomTab'
import { Plus } from 'lucide-react'
import Link from 'next/link'

const houses = ['전체', '역삼하우스', '강남하우스', '서초하우스']

const tenants = [
  { name: '김민수', house: '역삼하우스', room: '302호', rent: 650000, period: '2024.01 ~ 2024.12', status: '입주중' as const },
  { name: '박서연', house: '역삼하우스', room: '201호', rent: 550000, period: '2024.03 ~ 2025.02', status: '입주중' as const },
  { name: '이지현', house: '강남하우스', room: '105호', rent: 700000, period: '2024.02 ~ 2024.04', status: '퇴실예정' as const },
  { name: '최동혁', house: '강남하우스', room: '203호', rent: 600000, period: '2024.01 ~ 2024.12', status: '입주중' as const },
  { name: '정하윤', house: '서초하우스', room: '101호', rent: 720000, period: '2023.12 ~ 2024.11', status: '입주중' as const },
  { name: '오승우', house: '서초하우스', room: '304호', rent: 580000, period: '2024.01 ~ 2024.06', status: '퇴실예정' as const },
]

const statusVariant: Record<string, 'green' | 'amber' | 'gray'> = {
  '입주중': 'green',
  '퇴실예정': 'amber',
  '퇴실': 'gray',
}

export default function TenantsPage() {
  const [filter, setFilter] = useState('전체')

  const filtered = filter === '전체' ? tenants : tenants.filter(t => t.house === filter)
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
          <div key={house} className="mt-4">
            <p className="text-[13px] text-[var(--sub)] font-medium mb-2">{house}</p>
            <div className="flex flex-col gap-2">
              {list.map((t, i) => (
                <Card key={i} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                    <span className="text-[14px] font-bold text-[var(--blue)]">{t.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{t.name}</span>
                      <span className="text-[12px] text-[var(--sub)]">{t.room}</span>
                    </div>
                    <p className="text-[12px] text-[var(--sub)] mt-0.5">{t.period}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[14px] font-semibold">{t.rent.toLocaleString()}원</span>
                    <Chip label={t.status} variant={statusVariant[t.status]} />
                  </div>
                </Card>
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
