'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const COLORS: Record<string, string> = { 우주: '#7C3AED', 앤코: '#0891B2', 준오: '#B45309' }
const WAIT = '#F59E0B', DONE = '#00B493'
const fmt = (n: number) => n.toLocaleString() + '원'

type Tenant = {
  tenantId: string; name: string; house: string; room: string
  rent: number; paymentId: string; paid: number; transferred: boolean; status: string
}
type PlatformGroup = { account: string; tenants: Tenant[] }
type Data = { month: string; platforms: Record<string, PlatformGroup> }

function kstMonth() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
  const [y, m] = s.replace(/\./g, '').trim().split(/\s+/).map(Number)
  return `${y}-${String(m).padStart(2, '0')}`
}

function recentMonths(count: number): string[] {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
  const [y, m] = s.replace(/\./g, '').trim().split(/\s+/).map(Number)
  const arr: string[] = []
  let yy = y, mm = m
  for (let i = 0; i < count; i++) {
    arr.push(`${yy}-${String(mm).padStart(2, '0')}`)
    mm--
    if (mm === 0) { mm = 12; yy-- }
  }
  return arr
}

export default function PlatformTransferPage() {
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'wait' | 'history' | 'settings'>('wait')
  const [openPlatform, setOpenPlatform] = useState<string | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [selectedMonth, setSelectedMonth] = useState(kstMonth())

  const months = recentMonths(6)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch(`/api/platform-transfers?month=${selectedMonth}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedMonth])

  useEffect(() => { fetchData() }, [fetchData])

  const platforms = data?.platforms || {}
  const allTenants = Object.values(platforms).flatMap(p => p.tenants)
  const waitCount = allTenants.filter(t => !t.transferred && t.status === 'paid').length
  const waitAmount = allTenants.filter(t => !t.transferred && t.status === 'paid').reduce((s, t) => s + t.paid, 0)
  const doneCount = allTenants.filter(t => t.transferred).length
  const doneAmount = allTenants.filter(t => t.transferred).reduce((s, t) => s + t.paid, 0)

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const markTransferred = async (paymentIds: string[]) => {
    if (saving || paymentIds.length === 0) return
    setSaving(true)
    try {
      for (const id of paymentIds) {
        await fetch('/api/platform-transfers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: id, transferred: true }),
        })
      }
      setChecked(new Set())
      fetchData()
    } catch {} finally { setSaving(false) }
  }

  const tabs = [
    { key: 'wait' as const, label: '이체 대기' },
    { key: 'history' as const, label: '이체 이력' },
    { key: 'settings' as const, label: '설정' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px' }}>
          <button onClick={() => router.push('/payments')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#191919' }}>플랫폼 이체 관리</div>
            <div style={{ fontSize: 12, color: '#b0b8c1' }}>{selectedMonth}</div>
          </div>
        </div>
      </div>

      {/* Month Picker */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f2f2f2' }}>
        {months.map(m => {
          const active = selectedMonth === m
          const [y, mm] = m.split('-')
          return (
            <button key={m} onClick={() => setSelectedMonth(m)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: active ? '#3182F6' : '#E5E8EC',
                background: active ? '#EBF3FF' : '#fff',
                color: active ? '#3182F6' : '#8B95A1',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                fontFamily: 'inherit',
              }}>
              {y}년 {Number(mm)}월
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#b0b8c1', fontSize: 13 }}>불러오는 중...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 10, padding: '14px 14px 0' }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '16px 14px', border: `1.5px solid ${WAIT}20` }}>
              <div style={{ fontSize: 12, color: WAIT, fontWeight: 600, marginBottom: 6 }}>이체 대기</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#191F28' }}>{waitCount}<span style={{ fontSize: 13, fontWeight: 400, color: '#8B95A1' }}>건</span></div>
              <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 4 }}>{fmt(waitAmount)}</div>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '16px 14px', border: `1.5px solid ${DONE}20` }}>
              <div style={{ fontSize: 12, color: DONE, fontWeight: 600, marginBottom: 6 }}>이체 완료</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#191F28' }}>{doneCount}<span style={{ fontSize: 13, fontWeight: 400, color: '#8B95A1' }}>건</span></div>
              <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 4 }}>{fmt(doneAmount)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', padding: '14px 14px 0', gap: 4 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: tab === t.key ? '#191F28' : '#fff', color: tab === t.key ? '#fff' : '#8B95A1', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '10px 14px 100px' }}>
            {tab === 'wait' && <WaitTab platforms={platforms} openPlatform={openPlatform} setOpenPlatform={setOpenPlatform} checked={checked} toggleCheck={toggleCheck} markTransferred={markTransferred} saving={saving} onSelect={setSelectedSheet} />}
            {tab === 'history' && <HistoryTab platforms={platforms} />}
            {tab === 'settings' && <SettingsTab platforms={platforms} />}
          </div>
        </>
      )}

      {/* Bottom Sheet Modal */}
      {selectedSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelectedSheet(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} />
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', maxWidth: 430, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#191F28' }}>{selectedSheet.name}</div>
              <button onClick={() => setSelectedSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Row label="지점" value={`${selectedSheet.house} · ${selectedSheet.room}`} />
              <Row label="월세" value={fmt(selectedSheet.rent)} />
              <Row label="납부액" value={fmt(selectedSheet.paid)} />
              <Row label="수납상태" value={selectedSheet.status} color={selectedSheet.status === 'paid' ? '#3182F6' : '#e03131'} />
              <Row label="이체상태" value={selectedSheet.transferred ? '이체완료' : '이체대기'} color={selectedSheet.transferred ? DONE : WAIT} />
            </div>
            {!selectedSheet.transferred && selectedSheet.paymentId && selectedSheet.status === 'paid' && (
              <button onClick={() => { markTransferred([selectedSheet.paymentId]); setSelectedSheet(null) }} disabled={saving}
                style={{ width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 12, border: 'none', background: DONE, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>
                이체 완료 처리
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#8B95A1' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: color || '#191F28' }}>{value}</span>
    </div>
  )
}

function WaitTab({ platforms, openPlatform, setOpenPlatform, checked, toggleCheck, markTransferred, saving, onSelect }: {
  platforms: Record<string, PlatformGroup>; openPlatform: string | null; setOpenPlatform: (v: string | null) => void
  checked: Set<string>; toggleCheck: (id: string) => void
  markTransferred: (ids: string[]) => void; saving: boolean; onSelect: (t: Tenant) => void
}) {
  const names = Object.keys(platforms).sort()

  if (names.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#b0b8c1', fontSize: 13 }}>플랫폼 입주자가 없습니다</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {names.map(name => {
        const group = platforms[name]
        const waiting = group.tenants.filter(t => !t.transferred && t.status === 'paid')
        const totalWait = waiting.reduce((s, t) => s + t.paid, 0)
        const isOpen = openPlatform === name
        const color = COLORS[name] || '#6B7280'
        const checkedIds = waiting.filter(t => t.paymentId && checked.has(t.paymentId)).map(t => t.paymentId)

        return (
          <div key={name} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            {/* Accordion Header */}
            <button onClick={() => setOpenPlatform(isOpen ? null : name)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{name}</span>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>{waiting.length}건</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(totalWait)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2" strokeLinecap="round"
                  style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>

            {/* Accordion Body */}
            {isOpen && (
              <div style={{ borderTop: '1px solid #f2f4f6' }}>
                {/* Account */}
                {group.account && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#FAFBFC' }}>
                    <div style={{ fontSize: 12, color: '#8B95A1' }}>이체 계좌</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{group.account}</span>
                      <button onClick={() => navigator.clipboard.writeText(group.account)}
                        style={{ background: 'none', border: '1px solid #E5E8EC', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#8B95A1', fontFamily: 'inherit' }}>
                        복사
                      </button>
                    </div>
                  </div>
                )}

                {/* Tenant List */}
                {waiting.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: '#b0b8c1' }}>이체 대기 건이 없습니다</div>
                ) : (
                  <>
                    {waiting.map(t => (
                      <div key={t.tenantId} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f8f9fa', gap: 10 }}>
                        <input type="checkbox" checked={checked.has(t.paymentId)} onChange={() => toggleCheck(t.paymentId)}
                          style={{ width: 18, height: 18, accentColor: color, flexShrink: 0 }} />
                        <div onClick={() => onSelect(t)} style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>{t.house} · {t.room}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#191F28', flexShrink: 0 }}>{fmt(t.paid)}</div>
                      </div>
                    ))}

                    {/* Bulk transfer button */}
                    <div style={{ padding: '12px 16px' }}>
                      <button onClick={() => markTransferred(checkedIds.length > 0 ? checkedIds : waiting.filter(t => t.paymentId).map(t => t.paymentId))}
                        disabled={saving}
                        style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>
                        {checkedIds.length > 0 ? `선택 ${checkedIds.length}건 이체 완료` : `전체 ${waiting.length}건 이체 완료`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HistoryTab({ platforms }: { platforms: Record<string, PlatformGroup> }) {
  const transferred = Object.entries(platforms).flatMap(([name, group]) =>
    group.tenants.filter(t => t.transferred).map(t => ({ ...t, platform: name, account: group.account }))
  )

  if (transferred.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#b0b8c1', fontSize: 13 }}>이체 이력이 없습니다</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {transferred.map(t => {
        const color = COLORS[t.platform] || '#6B7280'
        return (
          <div key={t.tenantId} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${color}15`, color }}>{t.platform}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>{t.name}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#191F28' }}>{fmt(t.paid)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8B95A1' }}>
              {t.house} · {t.room} {t.account ? `· ${t.account}` : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SettingsTab({ platforms }: { platforms: Record<string, PlatformGroup> }) {
  const names = Object.keys(platforms).sort()

  if (names.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#b0b8c1', fontSize: 13 }}>플랫폼 설정이 없습니다</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {names.map(name => {
        const group = platforms[name]
        const color = COLORS[name] || '#6B7280'
        return (
          <div key={name} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f2f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{name}</span>
              </div>
              <div style={{ fontSize: 13, color: '#8B95A1' }}>이체 계좌: {group.account || '미설정'}</div>
            </div>
            {group.tenants.map(t => (
              <div key={t.tenantId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #f8f9fa' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#8B95A1' }}>{t.house} · {t.room}</div>
                </div>
                <button onClick={() => alert('이체계좌 변경은 Sheets에서 직접 수정해주세요')}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #E5E8EC', background: '#fff', fontSize: 12, color: '#8B95A1', cursor: 'pointer', fontFamily: 'inherit' }}>
                  변경
                </button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
