'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Tenant {
  id: string; houseName: string; roomCode: string; name: string;
  status: string; endDate: string; startDate: string;
}
interface House {
  id: string; name: string; address: string; district: string;
}

export default function VacancyPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [district, setDistrict] = useState('전체')

  useEffect(() => {
    Promise.all([
      fetch('/api/tenants').then(r => r.json()).catch(() => []),
      fetch('/api/houses').then(r => r.json()).catch(() => []),
    ]).then(([t, h]) => {
      if (Array.isArray(t)) setTenants(t)
      if (Array.isArray(h)) setHouses(h)
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 공실: status가 '공실' '퇴실' '미입주' 인 경우
  const vacancies = useMemo(() =>
    tenants.filter(t => {
      const s = t.status || ''
      return s === '공실' || s === '퇴실' || s === '미입주'
    }), [tenants])

  // 공실예정: 입주중이고 30일 이내 퇴실
  const soonVacancies = useMemo(() =>
    tenants.filter(t => {
      if (t.status !== '입주중') return false
      if (!t.endDate) return false
      const end = new Date(t.endDate)
      const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000)
      return diff >= 0 && diff <= 30
    }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
    [tenants, today])

  // 지역 목록 추출
  const districts = useMemo(() => {
    const set = new Set<string>()
    tenants.forEach(t => {
      const h = houses.find(h => h.name === t.houseName)
      const addr = h?.address || h?.district || ''
      const match = addr.match(/([가-힣]+구)/)
      if (match) set.add(match[1])
    })
    return ['전체', ...Array.from(set).sort()]
  }, [tenants, houses])

  function getDistrict(houseName: string) {
    const h = houses.find(h => h.name === houseName)
    const addr = h?.address || ''
    const match = addr.match(/([가-힣]+구)/)
    return match ? match[1] : ''
  }

  const filteredVacancies = district === '전체'
    ? vacancies
    : vacancies.filter(t => getDistrict(t.houseName) === district)

  const filteredSoon = district === '전체'
    ? soonVacancies
    : soonVacancies.filter(t => getDistrict(t.houseName) === district)

  function vacancyDays(t: Tenant) {
    if (!t.endDate) return 0
    const end = new Date(t.endDate)
    return Math.max(0, Math.ceil((today.getTime() - end.getTime()) / 86400000))
  }

  function dDay(endDate: string) {
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - today.getTime()) / 86400000)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* 파란 헤더 */}
      <div style={{background:'#3182F6'}}>
        <div className="flex items-center gap-2 px-4 pt-12 pb-4">
          <button onClick={() => router.back()}>
            <ChevronLeft size={22} color="white" />
          </button>
          <span className="text-[17px] font-bold text-white">공실 관리</span>
        </div>

        {/* 요약 숫자 */}
        <div className="flex items-center px-4 pb-4 gap-0">
          <div className="flex-1 text-center">
            <div className="text-[26px] font-bold text-white">{loading ? '-' : filteredVacancies.length}</div>
            <div className="text-[11px] text-white/70 mt-0.5">현재 공실</div>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="flex-1 text-center">
            <div className="text-[26px] font-bold text-white">{loading ? '-' : filteredSoon.length}</div>
            <div className="text-[11px] text-white/70 mt-0.5">30일내 예정</div>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="flex-1 text-center">
            <div className="text-[26px] font-bold text-white">{houses.length}</div>
            <div className="text-[11px] text-white/70 mt-0.5">전체 지점</div>
          </div>
        </div>

        {/* 지역 필터 */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
          {districts.map(d => (
            <button key={d} onClick={() => setDistrict(d)}
              className="shrink-0 text-[12px] px-3.5 py-1.5 rounded-full transition-colors"
              style={d === district
                ? {background:'white', color:'#191F28', fontWeight:600}
                : {border:'1px solid rgba(255,255,255,0.35)', color:'rgba(255,255,255,0.8)'}
              }>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 py-5 flex flex-col gap-4">

        {/* 현재 공실 */}
        <div>
          <p className="text-[14px] font-bold mb-2">현재 공실</p>
          {loading ? (
            <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
              <p className="text-[13px] text-[var(--sub)]">불러오는 중...</p>
            </div>
          ) : filteredVacancies.length === 0 ? (
            <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
              <p className="text-[14px] text-[var(--sub)]">현재 공실 없음</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--card)] overflow-hidden">
              {filteredVacancies.map((t, i) => (
                <div key={t.id}
                  className={`px-4 py-3.5 flex items-center justify-between ${i < filteredVacancies.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <div>
                    <p className="text-[15px] font-bold">{t.houseName} · {t.roomCode}</p>
                    <p className="text-[12px] text-[var(--sub)] mt-1">
                      {getDistrict(t.houseName)}{getDistrict(t.houseName) ? ' · ' : ''}{vacancyDays(t) > 0 ? `${vacancyDays(t)}일째 공실` : '공실'}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-1 rounded-[6px] bg-[#FCEBEB] text-[#791F1F]">공실</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 공실 예정 */}
        <div>
          <p className="text-[14px] font-bold mb-2">공실 예정</p>
          {loading ? (
            <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
              <p className="text-[13px] text-[var(--sub)]">불러오는 중...</p>
            </div>
          ) : filteredSoon.length === 0 ? (
            <div className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center">
              <p className="text-[14px] text-[var(--sub)]">30일 이내 공실 예정 없음</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--card)] overflow-hidden">
              {filteredSoon.map((t, i) => {
                const d = dDay(t.endDate)
                const urgent = d <= 7
                return (
                  <div key={t.id}
                    className={`px-4 py-3.5 flex items-center justify-between ${i < filteredSoon.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                    <div>
                      <p className="text-[15px] font-bold">{t.houseName} · {t.roomCode} · {t.name}</p>
                      <p className="text-[12px] text-[var(--sub)] mt-1">
                        {getDistrict(t.houseName)}{getDistrict(t.houseName) ? ' · ' : ''}{t.endDate} 퇴실
                      </p>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-1 rounded-[6px]"
                      style={urgent
                        ? {background:'#FCEBEB', color:'#791F1F'}
                        : {background:'#FEF3E2', color:'#633806'}
                      }>
                      D-{d}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
