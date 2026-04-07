'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useParams, useRouter } from 'next/navigation'
import { Copy, MapPin, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface HouseDetail {
  id: string; name: string; district: string; address: string;
  doorPassword: string; wifiSsid: string; wifiPassword: string;
  buildingRent: number; investorRatio: number; operatorRatio: number;
  landlordName: string; landlordPhone: string; memo: string;
}

interface TenantRow {
  id: string; houseName: string; roomCode: string; name: string;
  endDate: string; status: string;
}

const toMan = (n: number) => Math.round(n / 10000).toLocaleString() + '만'

const statusVariant: Record<string, 'green' | 'amber' | 'gray'> = {
  '입주중': 'green', '퇴실예정': 'amber',
}

export default function HouseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [house, setHouse] = useState<HouseDetail | null>(null)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [tenantIncome, setTenantIncome] = useState(0)
  const [issueCount, setIssueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    address: '', doorPassword: '', wifiSsid: '', wifiPassword: '',
    buildingRent: '', landlordName: '', landlordPhone: '', memo: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/houses/${id}`).then(r => r.json()),
      fetch('/api/sheets?sheet=입주자').then(r => r.json()),
      fetch('/api/issues').then(r => r.json()),
    ]).then(([h, tenantRows, issueData]) => {
      if (h.error) { setHouse(null); return }
      setHouse(h)
      setForm({
        address: h.address || '', doorPassword: h.doorPassword || '',
        wifiSsid: h.wifiSsid || '', wifiPassword: h.wifiPassword || '',
        buildingRent: String(h.buildingRent || ''), landlordName: h.landlordName || '',
        landlordPhone: h.landlordPhone || '', memo: h.memo || '',
      })

      // Filter tenants for this house
      if (Array.isArray(tenantRows)) {
        const filtered = tenantRows
          .filter((r: string[]) => r[2]?.trim() === h.name && r[11] !== '퇴실')
          .map((r: string[]) => ({
            id: r[0], houseName: r[2], roomCode: r[3], name: r[4],
            endDate: r[10] || '', status: r[11] || '',
          }))
        setTenants(filtered)
        const income = tenantRows
          .filter((r: string[]) => r[2]?.trim() === h.name && r[11] !== '퇴실')
          .reduce((s: number, r: string[]) => s + (Number(r[6]) || 0) + (Number(r[7]) || 0), 0)
        setTenantIncome(income)
      }

      // Filter issues for this house
      const issues = issueData?.issues || []
      const pending = issues.filter((i: { houseName: string; status: string }) =>
        i.houseName === h.name && i.status !== '완료'
      )
      setIssueCount(pending.length)
    })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  async function handleSave() {
    if (!house) return
    setSaving(true)
    await fetch(`/api/houses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        buildingRent: Number(form.buildingRent) || 0,
      }),
    })
    setHouse({
      ...house, ...form,
      buildingRent: Number(form.buildingRent) || 0,
    })
    setSaving(false)
    setEditing(false)
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="지점 상세" />
      <p className="text-[13px] text-[var(--sub)] py-8 text-center">불러오는 중...</p>
    </div>
  )

  if (!house) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="지점 상세" />
      <p className="text-[13px] text-[var(--sub)] py-8 text-center">지점을 찾을 수 없습니다</p>
    </div>
  )

  const isConsignment = house.buildingRent === 0

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={house.name}
        right={
          !editing ? (
            <button onClick={() => setEditing(true)} className="text-[14px] font-semibold text-[var(--blue)]">수정</button>
          ) : (
            <button onClick={() => setEditing(false)} className="text-[14px] font-semibold text-[var(--sub)]">취소</button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Name + District */}
        <div className="flex items-center gap-2 mt-3">
          <Chip label={house.district || '미분류'} variant="blue" />
          {isConsignment && <Chip label="위탁운영" variant="amber" />}
        </div>

        {/* Section 1: Access Info */}
        <Card className="mt-4 px-4 py-4">
          <p className="text-[13px] font-bold text-[var(--sub)] mb-3">접근 정보</p>

          {/* Address */}
          <InfoRow label="주소" editing={editing}
            value={editing ? form.address : house.address}
            onChange={v => setForm({ ...form, address: v })}
            action={house.address ? (
              <div className="flex gap-1">
                <a href={`https://map.kakao.com/?q=${encodeURIComponent(house.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[var(--blue-light)]">
                  <MapPin size={12} color="var(--blue)" />
                </a>
                <CopyBtn text={house.address} label="주소" copied={copied} onCopy={copyToClipboard} />
              </div>
            ) : undefined}
          />

          <InfoRow label="현관 비번" editing={editing}
            value={editing ? form.doorPassword : house.doorPassword}
            onChange={v => setForm({ ...form, doorPassword: v })}
            placeholder="미등록"
            action={house.doorPassword ? <CopyBtn text={house.doorPassword} label="비번" copied={copied} onCopy={copyToClipboard} /> : undefined}
          />

          <InfoRow label="와이파이 SSID" editing={editing}
            value={editing ? form.wifiSsid : house.wifiSsid}
            onChange={v => setForm({ ...form, wifiSsid: v })}
            placeholder="미등록"
            action={house.wifiSsid ? <CopyBtn text={house.wifiSsid} label="SSID" copied={copied} onCopy={copyToClipboard} /> : undefined}
          />

          <InfoRow label="와이파이 비번" editing={editing}
            value={editing ? form.wifiPassword : house.wifiPassword}
            onChange={v => setForm({ ...form, wifiPassword: v })}
            placeholder="미등록"
            action={house.wifiPassword ? <CopyBtn text={house.wifiPassword} label="WiFi" copied={copied} onCopy={copyToClipboard} /> : undefined}
            isLast
          />
        </Card>

        {/* Section 2: Operation Info */}
        <Card className="mt-3 px-4 py-4">
          <p className="text-[13px] font-bold text-[var(--sub)] mb-3">운영 정보</p>

          <InfoRow label="집월세" editing={editing}
            value={editing ? form.buildingRent : (isConsignment ? '위탁운영' : `${toMan(house.buildingRent)}원`)}
            onChange={v => setForm({ ...form, buildingRent: v })}
            type={editing ? 'number' : 'text'}
          />

          <InfoRow label="건물주/투자자" editing={editing}
            value={editing ? form.landlordName : house.landlordName}
            onChange={v => setForm({ ...form, landlordName: v })}
            placeholder="미등록"
          />

          <InfoRow label="연락처" editing={editing}
            value={editing ? form.landlordPhone : house.landlordPhone}
            onChange={v => setForm({ ...form, landlordPhone: v })}
            placeholder="미등록"
            action={house.landlordPhone ? <CopyBtn text={house.landlordPhone} label="연락처" copied={copied} onCopy={copyToClipboard} /> : undefined}
          />

          <InfoRow label="메모" editing={editing}
            value={editing ? form.memo : house.memo}
            onChange={v => setForm({ ...form, memo: v })}
            placeholder="-"
            isLast
          />
        </Card>

        {/* Section 3: This month stats */}
        <Card className="mt-3 px-4 py-4">
          <p className="text-[13px] font-bold text-[var(--sub)] mb-3">이번달 현황</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--sub)]">입주중</p>
              <p className="text-[18px] font-bold text-[var(--green)]">{tenants.filter(t => t.status === '입주중').length}명</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--sub)]">이번달 수입</p>
              <p className="text-[18px] font-bold text-[var(--blue)]">{toMan(tenantIncome)}원</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--sub)]">미처리 이슈</p>
              <p className="text-[18px] font-bold text-[var(--red)]">{issueCount}건</p>
            </div>
          </div>
        </Card>

        {/* Section 4: Tenant List */}
        {tenants.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[15px] font-bold mb-2">입주자 ({tenants.length}명)</h3>
            <div className="flex flex-col gap-2">
              {tenants.map(t => (
                <Link key={t.id} href={`/tenants/${t.id}`}>
                  <Card className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold">{t.roomCode}</span>
                        <span className="text-[13px]">{t.name}</span>
                      </div>
                      {t.endDate && <p className="text-[11px] text-[var(--sub)] mt-0.5">계약종료 {t.endDate}</p>}
                    </div>
                    <Chip label={t.status} variant={statusVariant[t.status] || 'gray'} />
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      {editing && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3 bg-[var(--bg)]">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold bg-[var(--blue)] text-white flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? '저장 중...' : '정보 수정하기'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Info Row Component ── */
function InfoRow({ label, value, editing, onChange, placeholder = '', action, isLast, type = 'text' }: {
  label: string; value: string; editing: boolean; onChange?: (v: string) => void;
  placeholder?: string; action?: React.ReactNode; isLast?: boolean; type?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${!isLast ? 'border-b border-[var(--border)]' : ''}`}>
      <span className="text-[12px] text-[var(--sub)] shrink-0 w-24">{label}</span>
      {editing && onChange ? (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 text-right text-[13px] font-medium bg-transparent outline-none border-b border-[var(--blue)] px-1 py-0.5" />
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`text-[13px] font-medium text-right ${!value || value === placeholder ? 'text-[var(--sub)]' : ''}`}>
            {value || placeholder}
          </span>
          {action}
        </div>
      )}
    </div>
  )
}

/* ── Copy Button ── */
function CopyBtn({ text, label, copied, onCopy }: {
  text: string; label: string; copied: string; onCopy: (t: string, l: string) => void;
}) {
  return (
    <button onClick={(e) => { e.preventDefault(); onCopy(text, label) }}
      className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
      {copied === label ? <Check size={12} color="var(--green)" /> : <Copy size={12} color="var(--sub)" />}
    </button>
  )
}
