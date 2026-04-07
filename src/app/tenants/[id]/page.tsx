'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useSheets } from '@/hooks/useSheets'
import { Edit2, UserMinus, FileText, Phone, Calendar, CreditCard, Save, X } from 'lucide-react'
import { calcContractProgress, won } from '@/lib/contract'

// row: [0]ID [1]방ID [2]지점명 [3]방코드 [4]이름 [5]연락처 [6]월세 [7]관리비 [8]보증금 [9]입주일 [10]퇴실일 [11]상태 [12]국적 [13]메모 [14]토큰

export default function TenantDetailPage() {
  const params = useParams()
  const { data: tenants, loading } = useSheets('입주자')
  const [editingMemo, setEditingMemo] = useState(false)
  const [memo, setMemo] = useState('')

  const t = tenants.find(r => r[0] === params.id)

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--sub)]">불러오는 중...</div>
  if (!t) return <div className="flex items-center justify-center min-h-screen text-[var(--sub)]">입주자를 찾을 수 없습니다</div>

  const name = t[4], phone = t[5], house = t[2], room = t[3]
  const rent = Number(t[6]) || 0, maintenance = Number(t[7]) || 0, deposit = Number(t[8]) || 0
  const startDate = t[9], endDate = t[10], status = t[11] || '입주중'
  const nationality = t[12], memoText = t[13]
  const isActive = status === '입주중'
  const progress = calcContractProgress(startDate, endDate)

  if (!editingMemo && memo !== memoText) setMemo(memoText || '')

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="입주자 상세"
        right={<button className="text-[13px] font-semibold text-[var(--blue)] flex items-center gap-1"><Edit2 size={14} /> 수정</button>}
      />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Profile Header */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-[var(--blue)]" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--blue)] flex items-center justify-center shrink-0">
                  <span className="text-[18px] font-bold text-white">{name?.[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[17px] font-bold">{name}</h3>
                    <Chip label={status} variant={isActive ? 'green' : status === '퇴실예정' ? 'amber' : 'gray'} />
                    {nationality && nationality !== '한국' && <Chip label={nationality} variant="blue" />}
                  </div>
                  <p className="text-[13px] text-[var(--sub)] mt-0.5">{house} · {room}</p>
                  {phone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone size={12} color="var(--sub)" />
                      <span className="text-[12px] text-[var(--sub)]">{phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center gap-1.5">
              <FileText size={14} /> 계약서 출력
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-[var(--red-light)] text-[var(--red)] flex items-center justify-center gap-1.5">
              <UserMinus size={14} /> 퇴실 처리
            </button>
          </div>
        )}

        {/* Contract Period */}
        <Card className="mt-3 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar size={14} color="var(--blue)" />
            <span className="text-[12px] font-bold text-[var(--sub)]">계약기간</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold">{startDate || '-'}</span>
            <span className="text-[13px] font-semibold">{endDate || '-'}</span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progress.percent}%`, backgroundColor: progress.daysLeft <= 60 ? 'var(--amber)' : 'var(--blue)' }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[var(--sub)]">{progress.percent}% 경과</span>
            <span className={`text-[11px] font-semibold ${progress.daysLeft <= 60 ? 'text-[var(--amber)]' : 'text-[var(--blue)]'}`}>
              {progress.daysLeft > 0 ? `D-${progress.daysLeft}` : '만료'}
            </span>
          </div>
        </Card>

        {/* Amount Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: '보증금', value: won(deposit), color: 'text-[var(--text)]' },
            { label: '월세', value: won(rent), color: 'text-[var(--blue)]' },
            { label: '관리비', value: won(maintenance), color: 'text-[var(--text)]' },
          ].map(item => (
            <Card key={item.label} className="p-3 text-center">
              <p className={`text-[14px] font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-[var(--sub)] mt-1">{item.label}</p>
            </Card>
          ))}
        </div>

        {/* Memo */}
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-[var(--sub)] flex items-center gap-1">
              <CreditCard size={12} /> 관리자 메모
            </span>
            {editingMemo ? (
              <div className="flex gap-1.5">
                <button onClick={() => { /* TODO: save via API */ setEditingMemo(false) }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--green-light)]">
                  <Save size={14} color="var(--green)" />
                </button>
                <button onClick={() => { setMemo(memoText || ''); setEditingMemo(false) }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--border)]">
                  <X size={14} color="var(--sub)" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingMemo(true)} className="text-[12px] font-semibold text-[var(--blue)]">편집</button>
            )}
          </div>
          {editingMemo ? (
            <textarea value={memo} onChange={e => setMemo(e.target.value)}
              className="w-full text-[13px] bg-transparent outline-none resize-none min-h-[60px]" autoFocus />
          ) : (
            <p className="text-[13px] min-h-[24px]">{memoText || <span className="text-[var(--sub)]">메모 없음</span>}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
