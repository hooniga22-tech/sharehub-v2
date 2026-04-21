'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BLUE = '#3182F6', GREEN = '#00B493', RED = '#E24B4A', GRAY = '#8b95a1', AMBER = '#F59E0B';

interface AppItem {
  id: string; name: string; phone: string; status: string; createdAt: string;
  [key: string]: string | number | boolean | undefined;
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  '신청접수': { bg: '#E6F0FE', color: BLUE },
  '입금완료': { bg: '#D1F5EB', color: GREEN },
  '투어완료': { bg: '#F2F4F6', color: '#555' },
  '처리중': { bg: '#FFF4DC', color: AMBER },
  '완료': { bg: '#D1F5EB', color: GREEN },
  '처리완료': { bg: '#D1F5EB', color: GREEN },
  '취소': { bg: '#FFE5E5', color: RED },
}

const TABS = [
  { key: 'tour', label: '투어', api: '/api/apply/tour', link: '/apply/tour' },
  { key: 'cleaning', label: '방청소', api: '/api/apply/cleaning', link: '/apply/cleaning' },
  { key: 'aircon', label: '에어컨', api: '/api/apply/aircon', link: '/apply/aircon' },
  { key: 'checkout', label: '퇴실', api: '/api/apply/checkout', link: '/apply/checkout' },
  { key: 'supplies', label: '물품', api: '/api/apply/supplies', link: '' },
]

export default function ApplicationsMobile() {
  const router = useRouter()
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
    <div style={{ minHeight: '100vh', background: '#F7F8FA', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#191F28' }}>신청서 관리</span>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400,
                background: activeTab === t.key ? BLUE : '#fff', color: activeTab === t.key ? '#fff' : '#4e5968',
                border: activeTab === t.key ? 'none' : '1px solid #e5e8eb',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{t.label}</button>
          ))}
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1, borderRadius: 12, background: '#E6F0FE', padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: BLUE }}>신규 신청</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: BLUE }}>{newCount}</div>
          </div>
          <div style={{ flex: 1, borderRadius: 12, background: '#D1F5EB', padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: GREEN }}>전체</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>{items.length}</div>
          </div>
        </div>

        {/* Public Link */}
        {currentTab.link && (
          <div style={{ marginTop: 14, background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #f2f3f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: GRAY }}>공개 신청 링크</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#191F28', wordBreak: 'break-all', marginTop: 2 }}>sharehub-v2.vercel.app{currentTab.link}</div>
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(`https://sharehub-v2.vercel.app${currentTab.link}`)
                setCopied(activeTab); setTimeout(() => setCopied(''), 1500)
              }} style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: copied === activeTab ? '#D1F5EB' : '#E6F0FE', color: copied === activeTab ? GREEN : BLUE,
              }}>
                {copied === activeTab ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY, fontSize: 13 }}>신청 내역이 없습니다</div>
        ) : (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(a => {
              const isExpanded = expandedId === a.id
              const badge = STATUS_BADGE[a.status] || { bg: '#F2F4F6', color: '#555' }
              const displayName = a.name || String(a.tenantName || '')
              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #f2f3f5' }}>
                  <button onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E6F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{displayName?.[0] || '?'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>{displayName}</span>
                        <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color }}>{a.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSummary(a)}</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{a.phone}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2" strokeLinecap="round"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f2f4f6' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginTop: 12, fontSize: 11 }}>
                        {getDetailFields(a).map(f => (
                          <div key={f.label} style={{ display: 'contents' }}>
                            <span style={{ color: GRAY }}>{f.label}</span>
                            <span style={{ textAlign: 'right', fontWeight: 500, color: '#191F28' }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
