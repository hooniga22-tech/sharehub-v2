'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Copy, Check, ChevronDown } from 'lucide-react'

interface AppItem {
  id: string; name: string; phone: string; status: string; createdAt: string;
  [key: string]: string | number | boolean | undefined;
}

const statusVariant: Record<string, 'blue' | 'green' | 'gray' | 'red' | 'amber'> = {
  '신청접수': 'blue', '입금완료': 'green', '투어완료': 'gray', '처리중': 'amber', '완료': 'green', '처리완료': 'green', '취소': 'red',
}

const TABS = [
  { key: 'tour', label: '투어', api: '/api/apply/tour', link: '/apply/tour' },
  { key: 'cleaning', label: '방청소', api: '/api/apply/cleaning', link: '/apply/cleaning' },
  { key: 'aircon', label: '에어컨', api: '/api/apply/aircon', link: '/apply/aircon' },
  { key: 'checkout', label: '퇴실', api: '/api/apply/checkout', link: '/apply/checkout' },
  { key: 'supplies', label: '물품', api: '/api/apply/supplies', link: '' },
]

export default function ApplicationsPage() {
  const [items, setItems] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState('')
  const [activeTab, setActiveTab] = useState('tour')

  const currentTab = TABS.find(t => t.key === activeTab)!

  function fetchItems() {
    setLoading(true)
    fetch(currentTab.api).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setItems(d.sort((a: AppItem, b: AppItem) => (b.createdAt || '').localeCompare(a.createdAt || ''))) })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [activeTab])

  const newCount = items.filter(a => a.status === '신청접수').length

  function getDetailFields(item: AppItem): { label: string; value: string }[] {
    const fields: { label: string; value: string }[] = []
    if (activeTab === 'tour') {
      if (item.region) fields.push({ label: '희망지역', value: String(item.region) })
      if (item.houseName) fields.push({ label: '희망하우스', value: String(item.houseName) })
      if (item.roomType) fields.push({ label: '방타입', value: String(item.roomType) })
      if (item.tourDate) fields.push({ label: '투어날짜', value: `${item.tourDate} ${item.tourTime || ''}` })
      if (item.moveInDate) fields.push({ label: '입주일', value: String(item.moveInDate) })
      if (item.contractPeriod) fields.push({ label: '계약기간', value: String(item.contractPeriod) })
      if (item.inquiry) fields.push({ label: '문의', value: String(item.inquiry) })
    } else if (activeTab === 'cleaning') {
      if (item.houseName) fields.push({ label: '지점', value: String(item.houseName) })
      if (item.roomType) fields.push({ label: '방타입', value: String(item.roomType) })
      if (item.cleanDate) fields.push({ label: '청소날짜', value: String(item.cleanDate) })
      if (item.request) fields.push({ label: '요청', value: String(item.request) })
    } else if (activeTab === 'aircon') {
      if (item.houseName) fields.push({ label: '지점', value: String(item.houseName) })
      if (item.roomCode) fields.push({ label: '방코드', value: String(item.roomCode) })
      if (item.roomType) fields.push({ label: '방타입', value: String(item.roomType) })
      if (item.acLocation) fields.push({ label: '에어컨위치', value: String(item.acLocation) })
      if (item.request) fields.push({ label: '요청', value: String(item.request) })
    } else if (activeTab === 'checkout') {
      if (item.houseName) fields.push({ label: '지점', value: String(item.houseName) })
      if (item.roomCode) fields.push({ label: '방코드', value: String(item.roomCode) })
      if (item.checkoutDate) fields.push({ label: '퇴실일', value: String(item.checkoutDate) })
      if (item.refundAccount) fields.push({ label: '환불계좌', value: String(item.refundAccount) })
      if (item.reason) fields.push({ label: '사유', value: String(item.reason) })
      if (item.memo) fields.push({ label: '메모', value: String(item.memo) })
    } else if (activeTab === 'supplies') {
      if (item.houseName) fields.push({ label: '지점', value: String(item.houseName) })
      if (item.roomCode) fields.push({ label: '방코드', value: String(item.roomCode) })
      if (item.items) fields.push({ label: '요청물품', value: String(item.items) })
      if (item.detail) fields.push({ label: '상세', value: String(item.detail) })
    }
    fields.push({ label: '신청일', value: String(item.createdAt) })
    return fields
  }

  function getSummary(item: AppItem) {
    if (activeTab === 'tour') return `${item.region || ''} · ${item.roomType || ''} · ${item.tourDate || ''} ${item.tourTime || ''}`
    if (activeTab === 'cleaning') return `${item.houseName || ''} · ${item.roomType || ''} · ${item.cleanDate || ''}`
    if (activeTab === 'aircon') return `${item.houseName || ''} · ${item.roomCode || ''} · ${item.roomType || ''}`
    if (activeTab === 'checkout') return `${item.houseName || ''} · ${item.roomCode || ''} · ${item.checkoutDate || ''}`
    if (activeTab === 'supplies') return `${item.houseName || ''} · ${item.roomCode || ''} · ${item.items || ''}`
    return ''
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="신청 관리" />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeTab === t.key ? 'bg-[var(--blue)] text-white' : 'bg-[var(--card)] text-[var(--sub)] border border-[var(--border)]'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Summary */}
        <div className="flex gap-2.5 mt-4">
          <div className="flex-1 rounded-xl bg-[var(--blue-light)] p-3 text-center">
            <p className="text-[10px] text-[var(--blue)]">신규 신청</p>
            <p className="text-[18px] font-bold text-[var(--blue)]">{newCount}</p>
          </div>
          <div className="flex-1 rounded-xl bg-[var(--green-light)] p-3 text-center">
            <p className="text-[10px] text-[var(--green)]">전체</p>
            <p className="text-[18px] font-bold text-[var(--green)]">{items.length}</p>
          </div>
        </div>

        {/* Public Link */}
        <Card className="mt-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[var(--sub)]">공개 신청 링크</p>
              <p className="text-[12px] font-medium break-all">sharehub-v2.vercel.app{currentTab.link}</p>
            </div>
            <button onClick={() => {
              navigator.clipboard.writeText(`https://sharehub-v2.vercel.app${currentTab.link}`)
              setCopied(activeTab); setTimeout(() => setCopied(''), 1500)
            }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${copied === activeTab ? 'bg-green-50 text-green-600' : 'bg-[var(--blue-light)] text-[var(--blue)]'}`}>
              {copied === activeTab ? <><Check size={11} className="inline mr-1" />복사됨</> : <><Copy size={11} className="inline mr-1" />복사</>}
            </button>
          </div>
        </Card>

        {/* List */}
        {loading ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-[13px] text-[var(--sub)] py-8 text-center">신청 내역이 없습니다</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {items.map(a => {
              const isExpanded = expandedId === a.id
              return (
                <Card key={a.id} className="px-4 py-3.5">
                  <button onClick={() => setExpandedId(isExpanded ? null : a.id)} className="w-full text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center shrink-0">
                        <span className="text-[14px] font-bold text-[var(--blue)]">{(a.name || String(a.tenantName || ''))?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">{a.name || String(a.tenantName || '')}</span>
                          <Chip label={a.status} variant={statusVariant[a.status] || 'gray'} />
                        </div>
                        <p className="text-[11px] text-[var(--sub)] mt-0.5 truncate">{getSummary(a)}</p>
                        <p className="text-[11px] text-[var(--sub)]">{a.phone}</p>
                      </div>
                      <ChevronDown size={14} className={`text-[var(--sub)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-3">
                        {getDetailFields(a).map(f => (
                          <span key={f.label} className="contents">
                            <span className="text-[var(--sub)]">{f.label}</span>
                            <span className="text-right font-medium">{f.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
