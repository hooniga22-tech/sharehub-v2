'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Phone, Calendar, CreditCard, FileText, Save, Copy, Check, ExternalLink, Share2 } from 'lucide-react'

interface TenantData {
  id: string; roomId: string; houseName: string; roomCode: string;
  name: string; phone: string; rent: number; managementFee: number; deposit: number;
  startDate: string; endDate: string; status: string;
  nationality: string; memo: string; token: string;
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

  useEffect(() => {
    fetch(`/api/tenants/${params.id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setTenant(null); else setTenant(d) })
      .catch(() => setTenant(null))
      .finally(() => setLoading(false))
  }, [params.id])

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
    // Refetch
    const r = await fetch(`/api/tenants/${params.id}`)
    const d = await r.json()
    if (!d.error) setTenant(d)
    setEditing(false)
    setSaving(false)
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

        {/* 연락처 */}
        <Card className="mt-3 p-4">
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

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-[var(--bg)]">
        {editing ? (
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {saving ? '저장 중...' : '저장하기'}
          </button>
        ) : (
          <button onClick={startEdit}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white">
            수정하기
          </button>
        )}
      </div>
    </div>
  )
}
