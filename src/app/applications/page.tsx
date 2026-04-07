'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Copy, Check, ChevronDown } from 'lucide-react'

interface TourApp {
  id: string; name: string; phone: string; gender: string; region: string;
  houseName: string; roomType: string; moveInDate: string; contractPeriod: string;
  tourDate: string; tourTime: string; inquiry: string; feePaid: boolean;
  status: string; createdAt: string;
}

const statusVariant: Record<string, 'blue' | 'green' | 'gray' | 'red' | 'amber'> = {
  '신청접수': 'blue', '입금완료': 'green', '투어완료': 'gray', '취소': 'red',
}

const TABS = ['투어', '방청소', '에어컨', '퇴실', '물품']

export default function ApplicationsPage() {
  const [apps, setApps] = useState<TourApp[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('투어')

  function fetchApps() {
    setLoading(true)
    fetch('/api/apply/tour').then(r => r.json())
      .then(d => { if (Array.isArray(d)) setApps(d.sort((a: TourApp, b: TourApp) => b.createdAt.localeCompare(a.createdAt))) })
      .catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchApps() }, [])

  const today = new Date().toISOString().split('T')[0]
  const thisWeekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const newCount = apps.filter(a => a.status === '신청접수').length
  const waitingCount = apps.filter(a => a.status === '신청접수' && !a.feePaid).length
  const thisWeekTours = apps.filter(a => a.tourDate >= today && a.tourDate <= thisWeekEnd && a.status !== '취소').length

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/apply/tour/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function toggleFee(id: string, current: boolean) {
    await fetch(`/api/apply/tour/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feePaid: !current }),
    })
    setApps(prev => prev.map(a => a.id === id ? { ...a, feePaid: !current } : a))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="신청 관리" />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeTab === t ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
              }`}>{t}</button>
          ))}
        </div>

        {activeTab !== '투어' ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">준비중입니다</p>
        ) : (
          <>
            {/* Summary */}
            <div className="flex gap-2.5 mt-4">
              <div className="flex-1 rounded-xl bg-[var(--blue-light)] p-3 text-center">
                <p className="text-[10px] text-[var(--blue)]">신규 신청</p>
                <p className="text-[18px] font-bold text-[var(--blue)]">{newCount}</p>
              </div>
              <div className="flex-1 rounded-xl bg-[var(--amber-light)] p-3 text-center">
                <p className="text-[10px] text-[var(--amber)]">입금 대기</p>
                <p className="text-[18px] font-bold text-[var(--amber)]">{waitingCount}</p>
              </div>
              <div className="flex-1 rounded-xl bg-[var(--green-light)] p-3 text-center">
                <p className="text-[10px] text-[var(--green)]">이번주 투어</p>
                <p className="text-[18px] font-bold text-[var(--green)]">{thisWeekTours}</p>
              </div>
            </div>

            {/* Public Link */}
            <Card className="mt-4 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[var(--sub)]">공개 신청 링크</p>
                  <p className="text-[12px] font-medium break-all">sharehub-v2.vercel.app/apply/tour</p>
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText('https://sharehub-v2.vercel.app/apply/tour')
                  setCopied(true); setTimeout(() => setCopied(false), 1500)
                }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${copied ? 'bg-green-50 text-green-600' : 'bg-[var(--blue-light)] text-[var(--blue)]'}`}>
                  {copied ? <><Check size={11} className="inline mr-1" />복사됨</> : <><Copy size={11} className="inline mr-1" />복사</>}
                </button>
              </div>
            </Card>

            {/* List */}
            {loading ? (
              <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
            ) : apps.length === 0 ? (
              <p className="text-[13px] text-[var(--sub)] py-8 text-center">신청 내역이 없습니다</p>
            ) : (
              <div className="mt-4 flex flex-col gap-2.5">
                {apps.map(a => {
                  const isExpanded = expandedId === a.id
                  return (
                    <Card key={a.id} className="px-4 py-3.5">
                      <button onClick={() => setExpandedId(isExpanded ? null : a.id)} className="w-full text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                            <span className="text-[14px] font-bold text-[var(--blue)]">{a.name?.[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold">{a.name}</span>
                              {a.gender && <span className="text-[11px] text-[var(--sub)]">{a.gender}</span>}
                              <Chip label={a.status} variant={statusVariant[a.status] || 'gray'} />
                            </div>
                            <p className="text-[11px] text-[var(--sub)] mt-0.5">
                              {a.region} · {a.roomType} · {a.tourDate} {a.tourTime}
                            </p>
                            <p className="text-[11px] text-[var(--sub)]">{a.phone}</p>
                          </div>
                          <ChevronDown size={14} className={`text-[var(--sub)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-3">
                            {a.houseName && <><span className="text-[var(--sub)]">희망 하우스</span><span className="text-right font-medium">{a.houseName}</span></>}
                            {a.moveInDate && <><span className="text-[var(--sub)]">입주일</span><span className="text-right font-medium">{a.moveInDate}</span></>}
                            {a.contractPeriod && <><span className="text-[var(--sub)]">계약기간</span><span className="text-right font-medium">{a.contractPeriod}</span></>}
                            <span className="text-[var(--sub)]">신청일</span><span className="text-right font-medium">{a.createdAt}</span>
                            <span className="text-[var(--sub)]">투어비</span>
                            <span className="text-right">
                              <button onClick={() => toggleFee(a.id, a.feePaid)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.feePaid ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {a.feePaid ? '입금완료' : '미입금'}
                              </button>
                            </span>
                          </div>
                          {a.inquiry && (
                            <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50 text-[11px] text-gray-600">{a.inquiry}</div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => updateStatus(a.id, '입금완료')}
                              className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-[var(--green-light)] text-[var(--green)]">입금 확인</button>
                            <button onClick={() => updateStatus(a.id, '투어완료')}
                              className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600">투어 완료</button>
                            <button onClick={() => updateStatus(a.id, '취소')}
                              className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-[var(--red-light)] text-[var(--red)]">취소</button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
