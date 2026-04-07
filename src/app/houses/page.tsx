'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { BottomTab } from '@/components/ui/BottomTab'
import { KeyRound, Wifi, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface HouseItem {
  id: string; name: string; district: string; address: string;
  doorPassword: string; wifiSsid: string; wifiPassword: string;
  buildingRent: number; memo: string;
}

const DISTRICTS = ['전체', '강남구', '관악구', '구로구', '동대문구', '마포구', '서대문구', '성동구', '성북구', '영등포구', '용산구', '중구']

export default function HousesPage() {
  const [houses, setHouses] = useState<HouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [districtFilter, setDistrictFilter] = useState('전체')

  useEffect(() => {
    fetch('/api/houses')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHouses(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (districtFilter === '전체') return houses
    return houses.filter(h => h.district === districtFilter)
  }, [houses, districtFilter])

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="지점 관리"
        right={<span className="text-[13px] text-[var(--sub)]">전체 {houses.length}개</span>}
      />

      {/* District Filter */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {DISTRICTS.map(d => (
          <button key={d} onClick={() => setDistrictFilter(d)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              districtFilter === d ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
            }`}>{d}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">지점이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2.5 mt-1">
            {filtered.map(h => (
              <Link key={h.id} href={`/houses/${h.id}`}>
                <Card className="px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[15px] font-bold">{h.name}</span>
                        {h.district && <Chip label={h.district} variant="gray" />}
                      </div>
                      {h.address && <p className="text-[12px] text-[var(--sub)] line-clamp-1">{h.address}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <KeyRound size={14} color={h.doorPassword ? 'var(--blue)' : 'var(--border)'} />
                      <Wifi size={14} color={h.wifiSsid ? 'var(--green)' : 'var(--border)'} />
                      <ChevronRight size={16} color="var(--sub)" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <BottomTab />
      </div>
    </div>
  )
}
