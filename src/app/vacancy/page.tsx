'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'

interface TenantRow { houseName: string; roomCode: string; name: string; endDate: string; status: string }
interface HouseRow { name: string; district: string }

export default function VacancyPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [houses, setHouses] = useState<HouseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [districtFilter, setDistrictFilter] = useState('전체')

  useEffect(() => {
    Promise.all([
      fetch('/api/sheets?sheet=입주자').then(r => r.json()).catch(() => []),
      fetch('/api/houses').then(r => r.json()).catch(() => []),
    ]).then(([tRows, hRows]) => {
      const ts = Array.isArray(tRows) ? tRows : []
      setTenants(ts.map((r: string[]) => ({
        houseName: r[2]?.trim() || '', roomCode: r[3] || '', name: r[4] || '',
        endDate: r[10] || '', status: r[11] || '',
      })))
      if (Array.isArray(hRows)) setHouses(hRows.map((h: { name: string; district: string }) => ({ name: h.name, district: h.district })))
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date()
  const districts = useMemo(() => ['전체', ...new Set(houses.map(h => h.district).filter(Boolean))], [houses])

  // 현재 공실: 퇴실 또는 공실 상태
  const vacant = useMemo(() => {
    return tenants
      .filter(t => t.status === '퇴실' || t.status === '공실')
      .filter(t => districtFilter === '전체' || houses.find(h => h.name === t.houseName)?.district === districtFilter)
      .map(t => {
        const h = houses.find(x => x.name === t.houseName)
        const vacantDays = t.endDate ? Math.max(0, Math.ceil((today.getTime() - new Date(t.endDate).getTime()) / 86400000)) : 0
        return { ...t, district: h?.district || '', vacantDays }
      })
  }, [tenants, houses, districtFilter])

  // 공실 예정: 입주중 + 30일 이내 만료
  const upcoming = useMemo(() => {
    return tenants
      .filter(t => {
        if (t.status !== '입주중' || !t.endDate) return false
        const dDay = Math.ceil((new Date(t.endDate).getTime() - today.getTime()) / 86400000)
        return dDay >= 0 && dDay <= 30
      })
      .filter(t => districtFilter === '전체' || houses.find(h => h.name === t.houseName)?.district === districtFilter)
      .map(t => {
        const h = houses.find(x => x.name === t.houseName)
        const dDay = Math.ceil((new Date(t.endDate).getTime() - today.getTime()) / 86400000)
        return { ...t, district: h?.district || '', dDay }
      })
      .sort((a, b) => a.dDay - b.dDay)
  }, [tenants, houses, districtFilter])

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      <PageHeader title="공실 관리" />

      {/* Blue Header */}
      <div className="px-4 pt-5 pb-4" style={{ background: '#3182F6' }}>
        <p className="text-[13px] text-white/80 mb-3">공실 현황</p>
        <div className="flex items-center">
          <div className="flex-1 text-center">
            <p className="text-[26px] font-bold text-white">{vacant.length}</p>
            <p className="text-[11px] text-white/70">현재 공실</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="flex-1 text-center">
            <p className="text-[26px] font-bold text-white">{upcoming.length}</p>
            <p className="text-[11px] text-white/70">30일내 예정</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="flex-1 text-center">
            <p className="text-[26px] font-bold text-white">{houses.length}</p>
            <p className="text-[11px] text-white/70">전체 지점</p>
          </div>
        </div>
        <div className="flex gap-1.5 mt-4 overflow-x-auto no-scrollbar">
          {districts.map(d => (
            <button key={d} onClick={() => setDistrictFilter(d)}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
              style={districtFilter === d
                ? { background: '#fff', color: '#191F28', fontWeight: 700 }
                : { border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.75)' }
              }>{d}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-5">
        {loading ? (
          <p className="text-[13px] text-gray-400 text-center py-8">불러오는 중...</p>
        ) : (
          <>
            {/* 현재 공실 */}
            <div>
              <p className="text-[14px] font-bold mb-2">현재 공실</p>
              {vacant.length === 0 ? (
                <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
                  <p className="text-[14px] text-[var(--sub)]">현재 공실 없음</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[var(--card)] overflow-hidden">
                  {vacant.map((v, i) => (
                    <div key={i} className={`flex justify-between items-center px-4 py-3.5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                      <div>
                        <p className="text-[15px] font-bold">{v.houseName} · {v.roomCode}</p>
                        <p className="text-[12px] text-[var(--sub)] mt-1">{v.district} · {v.vacantDays}일째 공실</p>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-1 rounded-[6px]" style={{ background: '#FCEBEB', color: '#791F1F' }}>공실</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 공실 예정 */}
            <div>
              <p className="text-[14px] font-bold mb-2">공실 예정</p>
              {upcoming.length === 0 ? (
                <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
                  <p className="text-[14px] text-[var(--sub)]">30일 이내 공실 예정 없음</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[var(--card)] overflow-hidden">
                  {upcoming.map((u, i) => (
                    <div key={i} className={`flex justify-between items-center px-4 py-3.5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                      <div>
                        <p className="text-[15px] font-bold">{u.houseName} · {u.roomCode} · {u.name}</p>
                        <p className="text-[12px] text-[var(--sub)] mt-1">{u.district} · {u.endDate} 퇴실</p>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-1 rounded-[6px]"
                        style={u.dDay <= 7 ? { background: '#FCEBEB', color: '#791F1F' } : { background: '#FEF3E2', color: '#633806' }}>
                        D-{u.dDay}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
