'use client'

import { useState } from 'react'
import type { TenantSpan, HandoverSpan, HouseTimeline } from '@/types/timeline'
import { STATUS_COLORS, STATUS_LABEL, MONTHS, DAYS_IN_MONTH, calcProRata, barStyle } from '@/lib/timeline'

const TODAY = new Date()
const TODAY_YEAR = TODAY.getFullYear()
const TODAY_MONTH = TODAY.getMonth()
const TODAY_DAY = TODAY.getDate()
const TODAY_LEFT_PCT =
  ((TODAY_MONTH + (TODAY_DAY - 1) / DAYS_IN_MONTH[TODAY_MONTH]) / 12) * 100
const ROW_H = 48
const LABEL_W = 110

// 바에 적용되는 진한 상태 색상 (spec)
const BAR_STYLES = {
  in:   { bg: '#dbeafe', border: '#3182f6', fg: '#1d4ed8' },
  soon: { bg: '#fde7b8', border: '#f59e0b', fg: '#92400e' },
  out:  { bg: '#ffcfcf', border: '#F04452', fg: '#991b1b' },
} as const

type StatusFilter = 'all' | 'soon' | 'out'

interface Props {
  houses: HouseTimeline[]
  searchQuery?: string
  selectedGu?: string
  onTenantClick?: (tenantId: string) => void
}

// 퇴실일 원본 문자열 → MM/DD ("2026-06-22", "2026. 10. 31" 등 수용)
function exitMMDD(raw?: string): string {
  if (!raw) return ''
  const s = String(raw).replace(/\s+/g, '')
  const m = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (!m) return ''
  return `${Number(m[2])}/${Number(m[3])}`
}

// 현재 오늘 시점에 활성인지 (handover는 해당 월이 오늘 달과 같은지)
function isActiveNow(t: TenantSpan | HandoverSpan): boolean {
  if (t.type === 'handover') {
    return (t as HandoverSpan).month === TODAY_MONTH
  }
  const sp = t as TenantSpan
  return sp.startMonth <= TODAY_MONTH && sp.endMonth >= TODAY_MONTH
}

// 상태 타입이 필터와 매칭되는지
function matchesFilter(t: TenantSpan | HandoverSpan, f: StatusFilter): boolean {
  if (f === 'all') return true
  if (t.type === 'handover') {
    return f === 'out'
  }
  const sp = t as TenantSpan
  return sp.type === f
}

export default function TenantTimeline({ houses, searchQuery, selectedGu, onTenantClick }: Props) {
  // 구 필터
  const guFiltered = houses.filter(h => {
    if (selectedGu && selectedGu !== '전체') return h.district === selectedGu
    return true
  })

  // 검색 필터 (하우스명 또는 입주자 이름)
  const filtered = guFiltered.filter(h => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    if (h.name.toLowerCase().includes(q)) return true
    return h.rooms.some(r =>
      r.tenants.some(t =>
        t.type === 'handover'
          ? ((t as HandoverSpan).n1.toLowerCase().includes(q) || (t as HandoverSpan).n2.toLowerCase().includes(q))
          : (t as TenantSpan).name?.toLowerCase().includes(q)
      )
    )
  })

  const [openHouses, setOpenHouses] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modal, setModal] = useState<{
    visible: boolean
    code: string
    loc: string
    house: string
    span: TenantSpan | HandoverSpan | null
  }>({ visible: false, code: '', loc: '', house: '', span: null })

  function toggleHouse(id: string) {
    setOpenHouses(p => ({ ...p, [id]: !p[id] }))
  }

  function openModal(code: string, loc: string, house: string, span: TenantSpan | HandoverSpan) {
    setModal({ visible: true, code, loc, house, span })
  }

  function closeModal() {
    setModal(p => ({ ...p, visible: false }))
  }

  // 상태별 카운트 (오늘 시점 기준)
  let inC = 0, soonC = 0, outC = 0
  filtered.forEach(h => h.rooms.forEach(r => {
    const cur = r.tenants.find(isActiveNow)
    if (!cur) return
    if (cur.type === 'handover' || cur.type === 'in') inC++
    else if (cur.type === 'soon') soonC++
    else if (cur.type === 'out') outC++
  }))
  const totalC = inC + soonC + outC

  const statusChips: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: 'all',  label: '전체',     count: totalC, color: '#191f28' },
    { key: 'soon', label: '종료임박', count: soonC,  color: '#f59e0b' },
    { key: 'out',  label: '퇴실확정', count: outC,   color: '#F04452' },
  ]

  return (
    <div>
      {/* 상태 필터 칩 */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 14px 10px', background: '#fff' }}>
        {statusChips.map(chip => {
          const active = statusFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => setStatusFilter(prev => prev === chip.key ? 'all' : chip.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 100,
                border: active ? `1px solid ${chip.color}` : `1px solid ${chip.color}`,
                background: active ? chip.color : '#fff',
                color: active ? '#fff' : chip.color,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {chip.label}
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '1px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center',
                background: active ? 'rgba(255,255,255,0.25)' : '#f2f4f6',
                color: active ? '#fff' : chip.color,
              }}>
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* House cards */}
      {filtered.map(house => {
        const isOpen = !!openHouses[house.id]
        const vacRooms = house.rooms.filter(r => r.tenants.length === 0).length
        const soonRooms = house.rooms.filter(r =>
          r.tenants.some(t => t.type === 'soon' &&
            (t as TenantSpan).startMonth <= TODAY_MONTH && (t as TenantSpan).endMonth >= TODAY_MONTH)
        ).length
        const outRooms = house.rooms.filter(r =>
          r.tenants.some(t => t.type === 'out' &&
            (t as TenantSpan).startMonth <= TODAY_MONTH && (t as TenantSpan).endMonth >= TODAY_MONTH)
        ).length

        return (
          <div key={house.id} style={{ background: '#fff', marginBottom: 2 }}>
            {/* House header */}
            <div
              onClick={() => toggleHouse(house.id)}
              style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #F2F4F6' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#191F28' }}>{house.name}</div>
                <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 2 }}>{house.district} · {house.total}호실</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {vacRooms > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#F2F4F6', color: '#8B95A1' }}>공실 {vacRooms}</span>}
                {soonRooms > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFFBEB', color: '#F59E0B' }}>종료임박 {soonRooms}</span>}
                {outRooms > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FEF2F2', color: '#F04452' }}>퇴실 {outRooms}</span>}
                <svg style={{ transition: 'transform .25s', transform: isOpen ? 'rotate(180deg)' : '' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Timeline rows */}
            {isOpen && (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `${LABEL_W}px repeat(12,1fr)`, minWidth: 500 }}>
                  {/* Month header */}
                  <div style={{ width: LABEL_W, padding: '6px 12px', fontSize: 10, fontWeight: 700, color: '#8B95A1', background: '#FAFBFC', borderRight: '1px solid #E5E8EC', borderBottom: '1px solid #E5E8EC', position: 'sticky', left: 0, zIndex: 6, boxSizing: 'border-box', flexShrink: 0 }}>호실</div>
                  {MONTHS.map((m, i) => (
                    <div key={m} style={{
                      padding: '6px 2px', fontSize: 9,
                      fontWeight: i === TODAY_MONTH ? 700 : 700,
                      textAlign: 'center',
                      background: i === TODAY_MONTH ? '#e8f3ff' : '#FAFBFC',
                      color: i === TODAY_MONTH ? '#3182f6' : '#8B95A1',
                      borderBottom: '1px solid #E5E8EC',
                      borderRight: '1px solid #F2F4F6',
                    }}>{m}월</div>
                  ))}

                  {/* Room rows */}
                  {house.rooms.map(room => {
                    const isVacant = room.tenants.length === 0
                    // 활성 bar가 현재 상태 필터에 매칭되는지 → row 배경 하이라이트
                    const rowMatches = statusFilter !== 'all' && room.tenants.some(t =>
                      isActiveNow(t) && matchesFilter(t, statusFilter)
                    )
                    const rowBg = rowMatches ? '#fffbf0' : (isVacant ? '#FAFBFC' : '#fff')

                    return (
                    <div key={room.code} style={{ display: 'contents' }}>
                      {/* Label */}
                      <div style={{
                        width: LABEL_W, padding: '0 12px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        position: 'sticky', left: 0, zIndex: 4,
                        background: rowBg,
                        borderRight: '1px solid #E5E8EC',
                        height: ROW_H, flexShrink: 0, boxSizing: 'border-box',
                      }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isVacant ? '#8b95a1' : '#191f28',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{room.code}</span>
                        <span style={{
                          fontSize: 10, color: '#8b95a1',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{isVacant ? '공실' : room.loc}</span>
                      </div>

                      {/* Bar area */}
                      <div style={{
                        gridColumn: '2/14', display: 'grid', gridTemplateColumns: 'repeat(12,1fr)',
                        position: 'relative', height: ROW_H,
                        borderBottom: '1px solid #F2F4F6',
                        background: rowBg,
                      }}>
                        {/* Month BG cells */}
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} style={{
                            borderRight: '1px solid #F2F4F6',
                            background: i === TODAY_MONTH && !rowMatches ? 'rgba(49,130,246,.05)' : 'transparent',
                          }} />
                        ))}

                        {/* 오늘 세로선 */}
                        <div style={{
                          position: 'absolute',
                          top: 0, bottom: 0,
                          left: `${TODAY_LEFT_PCT}%`,
                          width: 2,
                          background: '#3182f6',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }} />

                        {/* Bars */}
                        {room.tenants.map((t, ti) => {
                          const matched = matchesFilter(t, statusFilter)
                          const dim = statusFilter !== 'all' && !matched
                          const opacity = dim ? 0.3 : 1

                          if (t.type === 'handover') {
                            const hov = t as HandoverSpan
                            const bs = barStyle(hov.month, hov.month)
                            const top = BAR_STYLES.out
                            const bottom = BAR_STYLES[hov.typeN2] || BAR_STYLES.in
                            return (
                              <div key={ti}
                                onClick={() => openModal(room.code, room.loc, house.name, hov)}
                                style={{
                                  position: 'absolute', top: 5, height: ROW_H - 10,
                                  left: bs.left, width: bs.width,
                                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                                  display: 'flex', flexDirection: 'column', zIndex: 2,
                                  opacity,
                                  border: `1px solid ${bottom.border}`,
                                }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 7px', fontSize: 9, fontWeight: 700, background: top.bg, color: top.fg, overflow: 'hidden', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,.6)' }}>{hov.n1}</div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 7px', fontSize: 9, fontWeight: 700, background: bottom.bg, color: bottom.fg, overflow: 'hidden', whiteSpace: 'nowrap' }}>{hov.n2}</div>
                              </div>
                            )
                          }

                          const sp = t as TenantSpan
                          const bs = barStyle(sp.startMonth, sp.endMonth)
                          const colors = BAR_STYLES[sp.type] || BAR_STYLES.in
                          const exit = exitMMDD(sp.contractEnd)
                          return (
                            <div key={ti}
                              onClick={() => openModal(room.code, room.loc, house.name, sp)}
                              style={{
                                position: 'absolute', top: 5, height: ROW_H - 10,
                                left: bs.left, width: bs.width, borderRadius: 20,
                                background: colors.bg, color: colors.fg,
                                border: `1px solid ${colors.border}`,
                                display: 'flex', alignItems: 'center',
                                padding: '0 10px', gap: 6,
                                overflow: 'hidden', whiteSpace: 'nowrap',
                                cursor: 'pointer', zIndex: 2,
                                opacity,
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{sp.name}</span>
                              {exit && (
                                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {exit}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal */}
      {modal.visible && modal.span && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, background: '#E5E8EC', borderRadius: 2, margin: '12px auto 14px' }} />
            <ModalContent
              code={modal.code} loc={modal.loc} house={modal.house}
              span={modal.span}
              onClose={closeModal}
              onDetail={id => { closeModal(); onTenantClick?.(id) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ModalContent({ code, loc, house, span, onClose, onDetail }: {
  code: string; loc: string; house: string
  span: TenantSpan | HandoverSpan
  onClose: () => void; onDetail: (id: string) => void
}) {
  const t = span.type
  const fmtW = (n: number) => n.toLocaleString('ko-KR') + '원'

  if (t === 'handover') {
    const hov = span as HandoverSpan
    const dim = DAYS_IN_MONTH[hov.month]
    const outDays = hov.outDay
    const inDays = dim - hov.inDay + 1
    const out$ = Math.round(hov.rent1 / dim * outDays)
    const in$ = Math.round(hov.rent2 / dim * inDays)
    return (
      <div>
        <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #F2F4F6' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', display: 'inline-block', marginBottom: 6 }}>월중 교체</span>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>{code} · {MONTHS[hov.month]}월 교체</div>
          <div style={{ fontSize: 13, color: '#8B95A1', marginTop: 3 }}>{house}</div>
        </div>
        <div style={{ padding: '0 20px' }}>
          {[
            { title: '퇴실 입주자', name: hov.n1, rent: hov.rent1, deposit: hov.deposit1, day: hov.outDay, isOut: true, days: outDays, amt: out$, id: hov.tenantId1 },
            { title: '신규 입주자', name: hov.n2, rent: hov.rent2, deposit: hov.deposit2, day: hov.inDay, isOut: false, days: inDays, amt: in$, id: hov.tenantId2 },
          ].map(sec => (
            <div key={sec.title} style={{ padding: '14px 0', borderBottom: '1px solid #F2F4F6' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#8B95A1', letterSpacing: .4, marginBottom: 10, textTransform: 'uppercase' }}>{sec.title}</div>
              {[
                ['이름', sec.name],
                ['임대료', `${fmtW(sec.rent)}/월`],
                ['보증금', fmtW(sec.deposit)],
                [sec.isOut ? '퇴실일' : '입실일', `${MONTHS[hov.month]}월 ${sec.day}일`],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: '#8B95A1' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: sec.isOut ? '#F04452' : '#10B981' }}>{v}</span>
                </div>
              ))}
              <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#8B95A1' }}>일할 계산 ({sec.days}일 / {dim}일)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ color: '#8B95A1' }}>정산 임대료</span>
                  <span style={{ color: '#3182F6' }}>{fmtW(sec.amt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px 20px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: 'none', background: '#F2F4F6', color: '#8B95A1', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>닫기</button>
          <button onClick={() => onDetail(hov.tenantId2 || '')} style={{ flex: 1, padding: 13, borderRadius: 12, border: 'none', background: '#3182F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>정산 처리</button>
        </div>
      </div>
    )
  }

  const sp = span as TenantSpan
  const colors = STATUS_COLORS[sp.type] || STATUS_COLORS.in
  const period = sp.startMonth === sp.endMonth ? `${MONTHS[sp.startMonth]}월` : `${MONTHS[sp.startMonth]}월 ~ ${MONTHS[sp.endMonth]}월`
  const dim_s = DAYS_IN_MONTH[sp.startMonth]
  const dim_e = DAYS_IN_MONTH[sp.endMonth]
  const pr1 = sp.inDay && sp.inDay > 1 ? calcProRata(sp.rent, sp.inDay, dim_s, true) : null
  const pr2 = sp.outDay && sp.outDay < dim_e ? calcProRata(sp.rent, sp.outDay, dim_e, false) : null
  const fmtD = (s?: string) => { if (!s) return '-'; const d = new Date(s); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` }

  return (
    <div>
      <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #F2F4F6' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: colors.bg, color: colors.fg, display: 'inline-block', marginBottom: 6 }}>{STATUS_LABEL[sp.type]}</span>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#191F28' }}>{sp.name}</div>
        <div style={{ fontSize: 13, color: '#8B95A1', marginTop: 3 }}>{code} · {loc} · {house}</div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ padding: '14px 0', borderBottom: pr1 || pr2 ? '1px solid #F2F4F6' : 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#8B95A1', letterSpacing: .4, marginBottom: 10, textTransform: 'uppercase' }}>계약 정보</div>
          {([
            ['임대료', `${fmtW(sp.rent)}/월`, '#3182F6'],
            ['보증금', fmtW(sp.deposit), ''],
            ['기간', period, ''],
            ['계약 종료일', fmtD(sp.contractEnd), sp.type === 'soon' ? '#F59E0B' : sp.type === 'out' ? '#F04452' : ''],
            sp.inDay && sp.inDay > 1 ? ['입실일', `${MONTHS[sp.startMonth]}월 ${sp.inDay}일`, '#10B981'] : null,
            sp.outDay ? ['퇴실일', `${MONTHS[sp.endMonth]}월 ${sp.outDay}일`, '#F04452'] : null,
          ] as (string[] | null)[]).filter(Boolean).map(row => {
            const [k, v, c] = row as string[]
            return (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: '#8B95A1' }}>{k}</span>
                <span style={{ fontWeight: 700, color: c || '#191F28' }}>{v}</span>
              </div>
            )
          })}
        </div>
        {(pr1 || pr2) && (
          <div style={{ padding: '14px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#8B95A1', letterSpacing: .4, marginBottom: 10, textTransform: 'uppercase' }}>일할 계산</div>
            {pr1 && (
              <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#8B95A1' }}>첫 달 ({MONTHS[sp.startMonth]}월 {sp.inDay}일 입실 · {pr1.days}일)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ color: '#8B95A1' }}>정산 임대료</span><span style={{ color: '#3182F6' }}>{fmtW(pr1.amount)}</span>
                </div>
              </div>
            )}
            {pr2 && (
              <div style={{ background: '#F2F4F6', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#8B95A1' }}>마지막 달 ({MONTHS[sp.endMonth]}월 {sp.outDay}일 퇴실 · {pr2.days}일)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ color: '#8B95A1' }}>정산 임대료</span><span style={{ color: '#3182F6' }}>{fmtW(pr2.amount)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px 20px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: 'none', background: '#F2F4F6', color: '#8B95A1', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>닫기</button>
        <button onClick={() => onDetail(sp.tenantId || '')} style={{ flex: 1, padding: 13, borderRadius: 12, border: 'none', background: '#3182F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>입주자 상세</button>
      </div>
    </div>
  )
}
