'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Phone, Calendar, CreditCard, FileText, Save, Copy, Check, ExternalLink, Share2, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface TenantData {
  id: string; roomId: string; houseName: string; roomCode: string;
  name: string; phone: string; rent: number; managementFee: number; deposit: number;
  startDate: string; endDate: string; status: string;
  nationality: string; memo: string; token: string;
}

interface PaymentItem {
  id: string; tenantId: string; type: string; dueDate: string;
  rent: number; mgmtFee: number; rentPaid: boolean; mgmtPaid: boolean; memo: string;
}

function calcDday(endDate: string) {
  if (!endDate) return { days: 0, label: '종료일 미정', urgent: false }
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { days: diff, label: '계약 만료됨', urgent: false }
  if (diff === 0) return { days: 0, label: 'D-Day', urgent: true }
  return { days: diff, label: `D-${diff}`, urgent: diff <= 30 }
}

function fmt(n: number) { return n.toLocaleString('ko-KR') }

const statusVariant: Record<string, 'green' | 'amber' | 'gray'> = {
  '입주중': 'green', '퇴실예정': 'amber', '퇴실': 'gray',
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<TenantData>>({})
  const [saving, setSaving] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Payment timeline
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    fetch(`/api/tenants/${params.id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setTenant(null); else setTenant(d) })
      .catch(() => setTenant(null))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    if (!tenant) return
    // Try localStorage first
    const stored = localStorage.getItem(`timeline_${tenant.id}`)
    if (stored) {
      try { setPayments(JSON.parse(stored)); return } catch {}
    }
    // Fallback: fetch from API then auto-generate if empty
    setPaymentsLoading(true)
    fetch(`/api/payments?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setPayments(d)
          localStorage.setItem(`timeline_${tenant.id}`, JSON.stringify(d))
        } else if (tenant.startDate && tenant.endDate) {
          const generated = generateLocalTimeline(tenant)
          setPayments(generated)
          localStorage.setItem(`timeline_${tenant.id}`, JSON.stringify(generated))
        }
      })
      .catch(() => {
        if (tenant.startDate && tenant.endDate) {
          const generated = generateLocalTimeline(tenant)
          setPayments(generated)
          localStorage.setItem(`timeline_${tenant.id}`, JSON.stringify(generated))
        }
      })
      .finally(() => setPaymentsLoading(false))
  }, [tenant])

  function startEdit() {
    if (!tenant) return
    setForm({ ...tenant })
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/tenants/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const r = await fetch(`/api/tenants/${params.id}`)
    const d = await r.json()
    if (!d.error) setTenant(d)
    setEditing(false)
    setSaving(false)
  }

  function togglePayment(paymentId: string, field: 'rentPaid' | 'mgmtPaid', currentVal: boolean) {
    const updated = payments.map(p => p.id === paymentId ? { ...p, [field]: !currentVal } : p)
    setPayments(updated)
    if (tenant) localStorage.setItem(`timeline_${tenant.id}`, JSON.stringify(updated))
    // Also update API (fire-and-forget)
    fetch(`/api/payments/${paymentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !currentVal }),
    }).catch(() => {})
  }

  function resetAllTimelines() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('timeline_'))
    keys.forEach(k => localStorage.removeItem(k))
    setPayments([])
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--sub)]">불러오는 중...</div>
  if (!tenant) return <div className="flex items-center justify-center min-h-screen text-[var(--sub)]">입주자를 찾을 수 없습니다</div>

  const dday = calcDday(tenant.endDate)
  const monthlyTotal = tenant.rent + tenant.managementFee

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={editing ? '입주자 수정' : '입주자 상세'}
        right={
          !editing ? (
            <button onClick={startEdit} className="text-[13px] font-semibold text-[var(--blue)]">수정</button>
          ) : (
            <button onClick={() => setEditing(false)} className="text-[13px] font-semibold text-[var(--sub)]">취소</button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Profile Header */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            <div className={`h-1.5 ${tenant.status === '입주중' ? 'bg-[var(--green)]' : tenant.status === '퇴실예정' ? 'bg-[var(--amber)]' : 'bg-[var(--sub)]'}`} />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--blue)] flex items-center justify-center shrink-0">
                  <span className="text-[18px] font-bold text-white">{tenant.name?.[0]}</span>
                </div>
                <div className="flex-1">
                  {editing ? (
                    <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="text-[17px] font-bold w-full outline-none border-b border-[var(--blue)] pb-0.5" />
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[17px] font-bold">{tenant.name}</h3>
                      <Chip label={tenant.status} variant={statusVariant[tenant.status] || 'gray'} />
                    </div>
                  )}
                  <p className="text-[13px] text-[var(--sub)] mt-0.5">{tenant.houseName} · {tenant.roomCode}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 계약 정보 */}
        <Card className="mt-3 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar size={14} color="var(--blue)" />
            <span className="text-[12px] font-bold text-[var(--sub)]">계약 정보</span>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--sub)]">계약 시작일</label>
                  <input type="date" value={form.startDate || ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--sub)]">계약 종료일</label>
                  <input type="date" value={form.endDate || ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--sub)]">상태</label>
                <select value={form.status || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none">
                  <option value="입주중">입주중</option>
                  <option value="퇴실예정">퇴실예정</option>
                  <option value="퇴실">퇴실</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]">{tenant.startDate || '-'} ~ {tenant.endDate || '-'}</span>
                <span className={`text-[12px] font-bold ${dday.urgent ? 'text-[var(--red)]' : dday.days < 0 ? 'text-[var(--sub)]' : 'text-[var(--blue)]'}`}>
                  {dday.label}
                </span>
              </div>
              <p className="text-[11px] text-[var(--sub)]">방 구분: {tenant.roomCode}</p>
            </>
          )}
        </Card>

        {/* 납부 정보 */}
        <Card className="mt-3 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <CreditCard size={14} color="var(--blue)" />
            <span className="text-[12px] font-bold text-[var(--sub)]">납부 정보</span>
          </div>
          {editing ? (
            <div className="space-y-3">
              {[
                { key: 'rent' as const, label: '월세' },
                { key: 'managementFee' as const, label: '관리비' },
                { key: 'deposit' as const, label: '보증금' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold text-[var(--sub)]">{f.label}</label>
                  <input type="number" value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--sub)]">월세</span>
                <span className="font-semibold">{fmt(tenant.rent)}원</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--sub)]">관리비</span>
                <span className="font-semibold">{fmt(tenant.managementFee)}원</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--sub)]">보증금</span>
                <span className="font-semibold">{fmt(tenant.deposit)}원</span>
              </div>
              <div className="border-t border-[var(--border)] pt-2 mt-2 flex justify-between">
                <span className="text-[13px] font-semibold text-[var(--blue)]">월 납부액</span>
                <span className="text-[15px] font-bold text-[var(--blue)]">{fmt(monthlyTotal)}원</span>
              </div>
            </div>
          )}
        </Card>

        {/* 납부 타임라인 */}
        <TimelineSection
          payments={payments}
          paymentsLoading={paymentsLoading}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          onToggle={togglePayment}
          onReset={resetAllTimelines}
        />

        {/* 연락처 */}
        <Card className="mt-5 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Phone size={14} color="var(--blue)" />
            <span className="text-[12px] font-bold text-[var(--sub)]">연락처</span>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--sub)]">전화번호</label>
                <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[var(--sub)]">국적</label>
                <input value={form.nationality || ''} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none" />
              </div>
            </div>
          ) : (
            <>
              {tenant.phone ? (
                <a href={`tel:${tenant.phone}`} className="text-[14px] text-[var(--blue)] font-medium">{tenant.phone}</a>
              ) : (
                <p className="text-[13px] text-[var(--sub)]">전화번호 없음</p>
              )}
              {tenant.nationality && <p className="text-[12px] text-[var(--sub)] mt-1">국적: {tenant.nationality}</p>}
            </>
          )}
        </Card>

        {/* 메모 */}
        <Card className="mt-3 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <FileText size={14} color="var(--blue)" />
            <span className="text-[12px] font-bold text-[var(--sub)]">메모</span>
          </div>
          {editing ? (
            <textarea value={form.memo || ''} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              placeholder="메모를 입력해주세요" rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[13px] outline-none resize-none placeholder:text-[var(--sub)]" />
          ) : (
            <p className="text-[13px] min-h-[24px]">
              {tenant.memo || <span className="text-[var(--sub)]">메모 없음</span>}
            </p>
          )}
        </Card>

        {/* 입주자 개인 링크 */}
        {tenant.token && (
          <Card className="mt-3 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Share2 size={14} color="var(--blue)" />
              <span className="text-[12px] font-bold text-[var(--sub)]">입주자 개인 링크</span>
            </div>
            <p className="text-[11px] text-[var(--sub)] mb-3 break-all">
              sharehub-v2.vercel.app/tenant/{tenant.token}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://sharehub-v2.vercel.app/tenant/${tenant.token}`)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 1500)
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold bg-[var(--blue-light)] text-[var(--blue)]">
                {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                {linkCopied ? '복사됨!' : '링크 복사'}
              </button>
              <a href={`/tenant/${tenant.token}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--sub)]">
                <ExternalLink size={12} /> 링크 열기
              </a>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Fixed Buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-[var(--bg)]">
        {editing ? (
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {saving ? '저장 중...' : '저장하기'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={startEdit}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white">
              수정하기
            </button>
            <a href={`/contract/${tenant.id}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-center flex items-center justify-center gap-1.5">
              <FileText size={16} /> 계약서
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Generate Local Timeline ── */
function generateLocalTimeline(tenant: TenantData): PaymentItem[] {
  const records: PaymentItem[] = []
  const start = new Date(tenant.startDate)
  const end = new Date(tenant.endDate)
  const rent = tenant.rent || 0
  const mgmt = tenant.managementFee || 0

  records.push({ id: `lp_${tenant.id}_0`, tenantId: tenant.id, type: '계약금', dueDate: tenant.startDate, rent: 0, mgmtFee: 0, rentPaid: false, mgmtPaid: false, memo: '보증금 납부' })
  records.push({ id: `lp_${tenant.id}_1`, tenantId: tenant.id, type: '잔금+첫달', dueDate: tenant.startDate, rent, mgmtFee: mgmt, rentPaid: false, mgmtPaid: false, memo: '' })

  const cur = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  let idx = 2
  while (cur < lastMonth) {
    const m = cur.getMonth() + 1
    const dueDate = `${cur.getFullYear()}-${String(m).padStart(2, '0')}-01`
    records.push({ id: `lp_${tenant.id}_${idx}`, tenantId: tenant.id, type: `${m}월 정기납부`, dueDate, rent, mgmtFee: mgmt, rentPaid: false, mgmtPaid: false, memo: '' })
    cur.setMonth(cur.getMonth() + 1)
    idx++
  }

  const lastDue = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`
  records.push({ id: `lp_${tenant.id}_${idx}`, tenantId: tenant.id, type: '마지막달', dueDate: lastDue, rent, mgmtFee: mgmt, rentPaid: false, mgmtPaid: false, memo: '' })

  return records
}

/* ── Timeline Section ── */
function TimelineSection({ payments, paymentsLoading, showCompleted, setShowCompleted, onToggle, onReset }: {
  payments: PaymentItem[]; paymentsLoading: boolean;
  showCompleted: boolean; setShowCompleted: (v: boolean) => void;
  onToggle: (id: string, field: 'rentPaid' | 'mgmtPaid', val: boolean) => void;
  onReset: () => void;
}) {
  const today = new Date().toISOString().split('T')[0]
  const thisYM = today.slice(0, 7)

  const completed = payments.filter(p => p.rentPaid && (p.mgmtFee === 0 || p.mgmtPaid))
  const overdue = payments.filter(p => !(p.rentPaid && (p.mgmtFee === 0 || p.mgmtPaid)) && p.dueDate < today)
  const thisMonth = payments.filter(p => !(p.rentPaid && (p.mgmtFee === 0 || p.mgmtPaid)) && p.dueDate >= today && p.dueDate.slice(0, 7) === thisYM)
  const future = payments.filter(p => !(p.rentPaid && (p.mgmtFee === 0 || p.mgmtPaid)) && p.dueDate >= today && p.dueDate.slice(0, 7) !== thisYM)

  if (paymentsLoading) return <p className="text-[13px] text-[var(--sub)] py-4 text-center mt-5">불러오는 중...</p>
  if (payments.length === 0) return null

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Clock size={14} color="var(--blue)" />
          <span className="text-[14px] font-bold">납부 타임라인</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--sub)]">{completed.length}/{payments.length} 완료</span>
          <button onClick={onReset} className="text-[9px] text-gray-400 underline">초기화</button>
        </div>
      </div>

      {/* Overdue - pinned top */}
      {overdue.map((p, i) => (
        <TLCard key={p.id} p={p} variant="overdue" onToggle={onToggle} isLast={false} />
      ))}

      {/* This month - highlighted */}
      {thisMonth.map(p => (
        <TLCard key={p.id} p={p} variant="current" onToggle={onToggle} isLast={false} />
      ))}

      {/* Completed - collapsed */}
      {completed.length > 0 && (
        <button onClick={() => setShowCompleted(!showCompleted)}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-2 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#00B33C] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">✓</span>
            </div>
            <span className="text-[12px] font-semibold text-[var(--sub)]">완료된 납부 {completed.length}건</span>
          </div>
          <span className="text-[11px] text-[var(--sub)]">{showCompleted ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
      )}
      {showCompleted && completed.map(p => (
        <TLCard key={p.id} p={p} variant="done" onToggle={onToggle} isLast={false} />
      ))}

      {/* Future */}
      {future.map((p, i) => (
        <TLCard key={p.id} p={p} variant="future" onToggle={onToggle} isLast={i === future.length - 1} />
      ))}
    </div>
  )
}

/* ── Timeline Card (redesigned) ── */
function TLCard({ p, variant, onToggle, isLast }: {
  p: PaymentItem; variant: 'done' | 'overdue' | 'current' | 'future';
  onToggle: (id: string, field: 'rentPaid' | 'mgmtPaid', val: boolean) => void;
  isLast: boolean;
}) {
  const dueMonth = new Date(p.dueDate).getMonth() + 1

  const styles = {
    done: { dot: '#00B33C', dotText: '✓', bg: 'bg-white', border: '', opacity: 'opacity-60', badge: 'bg-[var(--green-light)] text-[var(--green)]', badgeText: '완료' },
    overdue: { dot: '#F04452', dotText: '!', bg: 'bg-[#FFF5F5]', border: 'border-l-[3px] border-l-[#F04452]', opacity: '', badge: 'bg-[var(--red-light)] text-[var(--red)]', badgeText: '미납' },
    current: { dot: '#3182F6', dotText: String(dueMonth), bg: 'bg-[#F0F6FF]', border: 'border-l-[3px] border-l-[#3182F6]', opacity: '', badge: 'bg-[var(--blue-light)] text-[var(--blue)]', badgeText: '이번달' },
    future: { dot: '#D3D1C7', dotText: String(dueMonth), bg: 'bg-white', border: '', opacity: 'opacity-40', badge: 'bg-gray-100 text-gray-500', badgeText: '예정' },
  }
  const s = styles[variant]

  return (
    <div className={`flex gap-3 ${s.opacity}`}>
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ backgroundColor: s.dot }}>{s.dotText}</div>
        {!isLast && <div className="w-px flex-1 bg-[#F2F2F2] min-h-[16px]" />}
      </div>
      <div className={`flex-1 mb-2 rounded-xl border border-[#F2F2F2] ${s.bg} ${s.border} p-3`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold">{p.type}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.badge}`}>{s.badgeText}</span>
          </div>
          <span className="text-[10px] text-[var(--sub)]">{p.dueDate}</span>
        </div>

        {/* Amount rows - show detail for overdue + current, summary for done + future */}
        {(variant === 'overdue' || variant === 'current') && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1 flex items-center justify-between bg-white rounded-lg px-2.5 py-2 border border-[#F2F2F2]">
              <div>
                <p className="text-[9px] text-[var(--sub)]">월세통장</p>
                <p className="text-[12px] font-bold">{fmt(p.rent)}원</p>
              </div>
              <button onClick={() => onToggle(p.id, 'rentPaid', p.rentPaid)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  p.rentPaid ? 'bg-[#00B33C] text-white' : 'bg-gray-200 text-gray-400'
                }`}>{p.rentPaid ? '✓' : ''}</button>
            </div>
            {p.mgmtFee > 0 && (
              <div className="flex-1 flex items-center justify-between bg-white rounded-lg px-2.5 py-2 border border-[#F2F2F2]">
                <div>
                  <p className="text-[9px] text-[var(--sub)]">관리비통장</p>
                  <p className="text-[12px] font-bold">{fmt(p.mgmtFee)}원</p>
                </div>
                <button onClick={() => onToggle(p.id, 'mgmtPaid', p.mgmtPaid)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    p.mgmtPaid ? 'bg-[#00B33C] text-white' : 'bg-gray-200 text-gray-400'
                  }`}>{p.mgmtPaid ? '✓' : ''}</button>
              </div>
            )}
          </div>
        )}

        {variant === 'done' && (
          <div className="flex gap-3 text-[11px] text-[var(--sub)] mt-1">
            <span>월세 {fmt(p.rent)}원 ✓</span>
            {p.mgmtFee > 0 && <span>관리비 {fmt(p.mgmtFee)}원 ✓</span>}
          </div>
        )}

        {variant === 'future' && (
          <p className="text-[11px] text-gray-400 mt-1">예정</p>
        )}
      </div>
    </div>
  )
}
