'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check, MapPin, ChevronRight, Loader2, Calendar, ArrowLeftRight } from 'lucide-react'

type Lang = 'ko' | 'en'

interface TenantData {
  id: string; houseName: string; roomCode: string; name: string; phone: string;
  rent: number; managementFee: number; deposit: number;
  startDate: string; endDate: string; status: string; nationality: string; memo: string; dDay: number | null;
}
interface HouseData {
  name: string; district: string; address: string;
  doorPassword: string; wifiSsid: string; wifiPassword: string; memo: string;
}
interface IssueItem { id: string; title: string; category: string; status: string; createdAt: string }
interface DutyItem {
  id: string; houseName: string; tenantId: string; tenantName: string; roomCode: string;
  weekStart: string; weekEnd: string; isDone: boolean; note: string;
}
interface ExchangeItem {
  id: string; requesterId: string; requesterName: string; requesterWeek: string;
  targetId: string; targetName: string; targetWeek: string; status: string;
}

function formatWeek(ws: string, we: string) {
  const s = new Date(ws), e = new Date(we)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${s.getMonth() + 1}/${s.getDate()}(${days[s.getDay()]}) ~ ${e.getMonth() + 1}/${e.getDate()}(${days[e.getDay()]})`
}
function getMonday(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

const T: Record<string, Record<Lang, string>> = {
  hello: { ko: '안녕하세요', en: 'Hello' },
  nim: { ko: '님 👋', en: ' 👋' },
  contract: { ko: '내 계약 정보', en: 'My Contract' },
  period: { ko: '계약 기간', en: 'Contract Period' },
  rent: { ko: '월세', en: 'Rent' },
  mgmt: { ko: '관리비', en: 'Management Fee' },
  deposit: { ko: '보증금', en: 'Deposit' },
  monthly: { ko: '월 납부액', en: 'Monthly Payment' },
  perMonth: { ko: '/월', en: '/mo' },
  expiringSoon: { ko: '계약 만료가 다가오고 있어요!', en: 'Your contract is expiring soon!' },
  expired: { ko: '계약 만료됨', en: 'Expired' },
  payment: { ko: '납부 안내', en: 'Payment Guide' },
  duty: { ko: '청소 당번 안내', en: 'Cleaning Duty Guide' },
  guide: { ko: '하우스 가이드', en: 'House Guide' },
  doorPw: { ko: '현관 비번', en: 'Door Password' },
  wifi: { ko: '와이파이', en: 'WiFi' },
  address: { ko: '주소', en: 'Address' },
  mapView: { ko: '지도보기', en: 'View Map' },
  onRouter: { ko: '공유기에 표시됨', en: 'Shown on router' },
  noData: { ko: '문의 필요', en: 'Contact Manager' },
  viewGuide: { ko: '전체 입주 가이드 보기 →', en: 'View full house guide →' },
  myDuty: { ko: '내 청소 당번', en: 'My Cleaning Duty' },
  thisWeekDuty: { ko: '이번주 내 당번입니다', en: 'This week is your duty' },
  dutyPhotoNotice: { ko: '공용 청소 완료 후 단톡방에 사진 업로드 필수', en: 'Upload photos to group chat after cleaning' },
  dutyFineNotice: { ko: '미업로드 시 벌금 30,000원 발생', en: 'Fine of ₩30,000 if photos not uploaded' },
  nextDuty: { ko: '다음 내 당번', en: 'Next duty' },
  weeksLater: { ko: '주 후', en: 'weeks later' },
  dutySchedule: { ko: '당번 순서', en: 'Duty Schedule' },
  exchangeReq: { ko: '당번 교환 신청', en: 'Request Duty Swap' },
  exchangeAlert: { ko: '님이 교환을 요청했어요', en: ' requested a swap' },
  accept: { ko: '수락', en: 'Accept' },
  reject: { ko: '거절', en: 'Reject' },
  noDuty: { ko: '등록된 당번이 없습니다', en: 'No duties assigned yet' },
  issue: { ko: '불편사항 신청', en: 'Report an Issue' },
  issueTitle: { ko: '제목', en: 'Title' },
  issueContent: { ko: '내용 (선택)', en: 'Details (optional)' },
  submit: { ko: '신청하기', en: 'Submit' },
  issueSuccess: { ko: '접수되었습니다! 매니저가 확인 후 연락드릴게요', en: 'Submitted! The manager will contact you.' },
  myIssues: { ko: '내 신청 내역', en: 'My Requests' },
  supplies: { ko: '비품 신청', en: 'Request Supplies' },
  supplyMemo: { ko: '요청사항 (선택)', en: 'Notes (optional)' },
  supplySuccess: { ko: '신청되었습니다! 2-3일 내로 배송됩니다.', en: 'Requested! Delivery in 2-3 days.' },
  contact: { ko: '카카오톡으로 문의하기', en: 'Contact via KakaoTalk' },
  notFound: { ko: '유효하지 않은 링크입니다.\n매니저에게 문의해주세요.', en: 'Invalid link.\nPlease contact your manager.' },
  copied: { ko: '복사됨!', en: 'Copied!' },
  active: { ko: '입주중', en: 'Active' },
  exitSoon: { ko: '퇴실예정', en: 'Ending Soon' },
}

const PAYMENT_KO = ['월세와 관리비는 매월 1일까지 납부해 주세요.', '공과금은 별도 청구됩니다.', '납부 계좌는 계약서를 확인해 주세요.']
const PAYMENT_EN = ['Please pay rent and management fee by the 1st of each month.', 'Utility bills are charged separately.', 'Please check your contract for payment account details.']

const DUTY_KO = ['매주 지정된 당번이 공용구역을 청소합니다.', '당번표는 단체 카톡방을 확인해 주세요.', '사진 미업로드 시 벌금 3만원이 부과됩니다.', '당번 교환은 당사자끼리 조율 후 매니저에게 알려주세요.']
const DUTY_EN = ['Designated members clean common areas each week.', 'Check the group KakaoTalk chat for the cleaning schedule.', 'A 30,000 won fine applies if photos are not uploaded.', 'For duty swaps, coordinate with the other party and inform the manager.']

const CATEGORIES_KO = ['수리', '청소', '기타']
const CATEGORIES_EN = ['Repair', 'Cleaning', 'Other']
const CAT_MAP: Record<string, string> = { 'Repair': '수리', 'Cleaning': '청소', 'Other': '기타' }

const SUPPLIES_KO = ['화장지', '주방세제', '샴푸', '린스', '바디워시', '수세미', '세탁세제', '기타']
const SUPPLIES_EN = ['Toilet Paper', 'Dish Soap', 'Shampoo', 'Conditioner', 'Body Wash', 'Sponge', 'Laundry Detergent', 'Other']

const statusVariant: Record<string, string> = {
  '접수': 'bg-red-50 text-red-600', '진행중': 'bg-amber-50 text-amber-600', '완료': 'bg-green-50 text-green-600',
}
const catVariant: Record<string, string> = {
  '수리': 'bg-blue-50 text-blue-600', '청소': 'bg-green-50 text-green-600', '민원': 'bg-amber-50 text-amber-600', '기타': 'bg-gray-100 text-gray-600',
}

function fmt(n: number) { return n.toLocaleString() }

export default function TenantPortalPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<{ tenant: TenantData; house: HouseData | null; myIssues: IssueItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lang, setLang] = useState<Lang>('ko')
  const [copied, setCopied] = useState('')

  // Issue form
  const [issueCategory, setIssueCategory] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [issueContent, setIssueContent] = useState('')
  const [issueSending, setIssueSending] = useState(false)
  const [issueSuccess, setIssueSuccess] = useState(false)

  // Supply form
  const [selectedSupplies, setSelectedSupplies] = useState<string[]>([])
  const [supplyMemo, setSupplyMemo] = useState('')
  const [supplySending, setSupplySending] = useState(false)
  const [supplySuccess, setSupplySuccess] = useState(false)

  // Duty
  const [allDuties, setAllDuties] = useState<DutyItem[]>([])
  const [exchanges, setExchanges] = useState<ExchangeItem[]>([])

  useEffect(() => {
    fetch(`/api/tenant-portal/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); return }
        setData(d)
        // Fetch duties for this house
        if (d.tenant?.houseName) {
          fetch(`/api/duty?houseName=${encodeURIComponent(d.tenant.houseName)}`)
            .then(r => r.json()).then(dd => { if (Array.isArray(dd)) setAllDuties(dd.sort((a: DutyItem, b: DutyItem) => a.weekStart.localeCompare(b.weekStart))) }).catch(() => {})
        }
        if (d.tenant?.id) {
          fetch(`/api/duty/exchange?tenantId=${d.tenant.id}`)
            .then(r => r.json()).then(ex => { if (Array.isArray(ex)) setExchanges(ex.filter((e: ExchangeItem) => e.status === '대기')) }).catch(() => {})
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  async function submitIssue() {
    if (!issueTitle.trim() || !issueCategory) return
    setIssueSending(true)
    const cat = lang === 'en' ? (CAT_MAP[issueCategory] || issueCategory) : issueCategory
    await fetch('/api/tenant-portal/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title: issueTitle.trim(), content: issueContent, category: cat }),
    })
    setIssueSending(false)
    setIssueSuccess(true)
    setIssueTitle('')
    setIssueContent('')
    setIssueCategory('')
    setTimeout(() => setIssueSuccess(false), 3000)
  }

  async function submitSupply() {
    if (selectedSupplies.length === 0 || !data) return
    setSupplySending(true)
    await fetch('/api/apply/supplies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: data.tenant.id,
        tenantName: data.tenant.name,
        houseName: data.tenant.houseName,
        roomCode: data.tenant.roomCode,
        items: selectedSupplies,
        detail: supplyMemo,
      }),
    })
    setSupplySending(false)
    setSupplySuccess(true)
    setSelectedSupplies([])
    setSupplyMemo('')
    setTimeout(() => setSupplySuccess(false), 3000)
  }

  function toggleSupply(item: string) {
    setSelectedSupplies(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  )

  if (notFound || !data) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-8 text-center">
      <p className="text-[16px] font-bold text-gray-600 whitespace-pre-line">{T.notFound[lang]}</p>
    </div>
  )

  const { tenant: t, house: h, myIssues } = data
  const monthly = t.rent + t.managementFee
  const categories = lang === 'ko' ? CATEGORIES_KO : CATEGORIES_EN
  const supplies = lang === 'ko' ? SUPPLIES_KO : SUPPLIES_EN

  function getWifiDisplay() {
    if (!h) return T.noData[lang]
    if (!h.wifiSsid && !h.wifiPassword) return T.noData[lang]
    if (h.wifiPassword === '기계에 써 있음') return T.onRouter[lang]
    const parts = []
    if (h.wifiSsid) parts.push(h.wifiSsid)
    if (h.wifiPassword && h.wifiPassword !== '기계에 써 있음') parts.push(h.wifiPassword)
    return parts.join(' / ')
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold">{T.hello[lang]}, {t.name}{T.nim[lang]}</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{t.houseName} · {t.roomCode}</p>
            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              t.status === '입주중' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {t.status === '입주중' ? T.active[lang] : T.exitSoon[lang]}
            </span>
          </div>
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setLang('ko')}
              className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${lang === 'ko' ? 'bg-[#3182F6] text-white' : 'text-gray-500'}`}>한국어</button>
            <button onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${lang === 'en' ? 'bg-[#3182F6] text-white' : 'text-gray-500'}`}>English</button>
          </div>
        </div>

        {/* Section 1: Contract */}
        <Section title={T.contract[lang]}>
          <Row label={T.period[lang]} value={`${t.startDate} ~ ${t.endDate || '-'}`} />
          {t.dDay !== null && (
            <div className="mb-3">
              <span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-bold ${
                t.dDay < 0 ? 'bg-red-50 text-red-600' :
                t.dDay <= 30 ? 'bg-amber-50 text-amber-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {t.dDay < 0 ? T.expired[lang] : `D-${t.dDay}`}
              </span>
              {t.dDay >= 0 && t.dDay <= 30 && (
                <p className="text-[12px] text-amber-600 mt-1">{T.expiringSoon[lang]}</p>
              )}
            </div>
          )}
          <Row label={T.rent[lang]} value={`₩${fmt(t.rent)}`} />
          <Row label={T.mgmt[lang]} value={`₩${fmt(t.managementFee)}`} />
          <Row label={T.deposit[lang]} value={`₩${fmt(t.deposit)}`} />
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[13px] font-semibold">{T.monthly[lang]}</span>
            <span className="text-[17px] font-bold text-[#3182F6]">₩{fmt(monthly)}{T.perMonth[lang]}</span>
          </div>
        </Section>

        {/* Section 2: Payment */}
        <Section title={T.payment[lang]}>
          {(lang === 'ko' ? PAYMENT_KO : PAYMENT_EN).map((t, i) => (
            <p key={i} className="text-[13px] text-gray-600 leading-relaxed mb-1.5">{t}</p>
          ))}
        </Section>

        {/* Section 3: Duty */}
        <Section title={T.duty[lang]}>
          <ol className="flex flex-col gap-2">
            {(lang === 'ko' ? DUTY_KO : DUTY_EN).map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-600 leading-relaxed">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* Section 4: House Guide */}
        {h && (
          <Section title={T.guide[lang]}>
            <GuideRow label={T.doorPw[lang]} value={h.doorPassword || T.noData[lang]} isEmpty={!h.doorPassword}
              copyable={!!h.doorPassword} copied={copied} onCopy={copyText} copiedText={T.copied[lang]} copyLabel="door" />
            <GuideRow label={T.wifi[lang]} value={getWifiDisplay()} isEmpty={!h.wifiSsid && !h.wifiPassword}
              copyable={!!h.wifiPassword && h.wifiPassword !== '기계에 써 있음'} copied={copied} onCopy={copyText}
              copiedText={T.copied[lang]} copyLabel="wifi" copyValue={h.wifiPassword} />
            {h.address && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <div>
                  <p className="text-[11px] text-gray-400">{T.address[lang]}</p>
                  <p className="text-[13px] font-medium text-gray-800">{h.address}</p>
                </div>
                <a href={`https://map.kakao.com/?q=${encodeURIComponent(h.address)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold">
                  <MapPin size={11} /> {T.mapView[lang]}
                </a>
              </div>
            )}
            <a href={`/house/${encodeURIComponent(h.name)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between mt-3 text-[13px] font-semibold text-[#3182F6]">
              {T.viewGuide[lang]} <ChevronRight size={14} />
            </a>
          </Section>
        )}

        {/* Section 5: My Duty */}
        <DutySection
          lang={lang} t={t} token={token}
          allDuties={allDuties} exchanges={exchanges}
          setExchanges={setExchanges} setAllDuties={setAllDuties}
        />

        {/* Section 6: Issue Report */}
        <Section title={T.issue[lang]}>
          {issueSuccess ? (
            <div className="py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                <Check size={20} className="text-green-600" />
              </div>
              <p className="text-[13px] text-green-600 font-medium">{T.issueSuccess[lang]}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {categories.map(c => (
                  <button key={c} onClick={() => setIssueCategory(c)}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-colors ${
                      issueCategory === c ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]' : 'border-gray-200 text-gray-500'
                    }`}>{c}</button>
                ))}
              </div>
              <input value={issueTitle} onChange={e => setIssueTitle(e.target.value)}
                placeholder={T.issueTitle[lang]}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[14px] outline-none placeholder:text-gray-400" />
              <textarea value={issueContent} onChange={e => setIssueContent(e.target.value)}
                placeholder={T.issueContent[lang]} rows={2}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[14px] outline-none resize-none placeholder:text-gray-400" />
              <button onClick={submitIssue} disabled={!issueTitle.trim() || !issueCategory || issueSending}
                className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                  issueTitle.trim() && issueCategory ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                {issueSending ? <Loader2 size={14} className="animate-spin mx-auto" /> : T.submit[lang]}
              </button>
            </div>
          )}

          {myIssues.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[12px] font-semibold text-gray-400 mb-2">{T.myIssues[lang]}</p>
              {myIssues.slice(0, 3).map(i => (
                <div key={i.id} className="flex items-center gap-2 py-2 border-b border-gray-50">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catVariant[i.category] || 'bg-gray-100 text-gray-600'}`}>{i.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusVariant[i.status] || 'bg-gray-100 text-gray-600'}`}>{i.status}</span>
                  <span className="text-[12px] flex-1 truncate">{i.title}</span>
                  <span className="text-[10px] text-gray-400">{i.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Section 6: Supplies */}
        <Section title={T.supplies[lang]}>
          {supplySuccess ? (
            <div className="py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                <Check size={20} className="text-green-600" />
              </div>
              <p className="text-[13px] text-green-600 font-medium">{T.supplySuccess[lang]}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {supplies.map(s => (
                  <button key={s} onClick={() => toggleSupply(s)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-colors ${
                      selectedSupplies.includes(s)
                        ? 'border-[#3182F6] bg-blue-50 text-[#3182F6]'
                        : 'border-gray-200 text-gray-500'
                    }`}>{s}</button>
                ))}
              </div>
              <input value={supplyMemo} onChange={e => setSupplyMemo(e.target.value)}
                placeholder={T.supplyMemo[lang]}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[14px] outline-none placeholder:text-gray-400" />
              <button onClick={submitSupply} disabled={selectedSupplies.length === 0 || supplySending}
                className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                  selectedSupplies.length > 0 ? 'bg-[#3182F6] text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                {supplySending ? <Loader2 size={14} className="animate-spin mx-auto" /> : T.submit[lang]}
              </button>
            </div>
          )}
        </Section>

        {/* Contact */}
        <a href="http://pf.kakao.com/_xnxnNxj" target="_blank" rel="noopener noreferrer"
          className="block w-full py-4 rounded-2xl bg-[#FEE500] text-center text-[15px] font-bold text-[#3C1E1E] mb-6">
          {T.contact[lang]}
        </a>

        <footer className="text-center py-4">
          <p className="text-[11px] text-gray-400">© 2026 ShareHub</p>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
      <h2 className="text-[15px] font-bold mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-[13px] text-gray-400">{label}</span>
      <span className="text-[13px] font-medium text-gray-800">{value}</span>
    </div>
  )
}

function GuideRow({ label, value, isEmpty, copyable, copied, onCopy, copiedText, copyLabel, copyValue }: {
  label: string; value: string; isEmpty?: boolean; copyable?: boolean;
  copied: string; onCopy: (t: string, l: string) => void; copiedText: string; copyLabel: string; copyValue?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className={`text-[13px] font-medium ${isEmpty ? 'text-gray-400' : 'text-gray-800'}`}>{value}</p>
      </div>
      {copyable && (
        <button onClick={() => onCopy(copyValue || value, copyLabel)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
            copied === copyLabel ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
          {copied === copyLabel ? <Check size={11} /> : <Copy size={11} />}
          {copied === copyLabel ? copiedText : 'Copy'}
        </button>
      )}
    </div>
  )
}

/* ── Duty Section ── */
function DutySection({ lang, t, token, allDuties, exchanges, setExchanges, setAllDuties }: {
  lang: Lang; t: TenantData; token: string;
  allDuties: DutyItem[]; exchanges: ExchangeItem[];
  setExchanges: (v: ExchangeItem[]) => void; setAllDuties: (v: DutyItem[]) => void;
}) {
  const thisMonday = getMonday(new Date()).toISOString().split('T')[0]
  const myDuties = allDuties.filter(d => d.tenantId === t.id)
  const thisWeekMine = myDuties.find(d => d.weekStart === thisMonday)
  const futureMine = myDuties.filter(d => d.weekStart > thisMonday && !d.isDone)
  const nextDuty = futureMine[0]
  const weeksUntilNext = nextDuty ? Math.round((new Date(nextDuty.weekStart).getTime() - Date.now()) / (7 * 86400000)) : 0

  const pendingExchanges = exchanges.filter(e => e.targetId === t.id && e.status === '대기')

  async function respondExchange(excId: string, action: string) {
    await fetch('/api/duty/exchange', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchangeId: excId, action }),
    })
    setExchanges(exchanges.filter(e => e.id !== excId))
    if (action === '수락') {
      const res = await fetch(`/api/duty?houseName=${encodeURIComponent(t.houseName)}`)
      const d = await res.json()
      if (Array.isArray(d)) setAllDuties(d.sort((a: DutyItem, b: DutyItem) => a.weekStart.localeCompare(b.weekStart)))
    }
  }

  if (allDuties.length === 0) {
    return (
      <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-[15px] font-bold mb-3">{T.myDuty[lang]}</h2>
        <p className="text-[13px] text-gray-400 text-center py-3">{T.noDuty[lang]}</p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
      <h2 className="text-[15px] font-bold mb-3">{T.myDuty[lang]}</h2>

      {/* Exchange alerts */}
      {pendingExchanges.map(ex => (
        <div key={ex.id} className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-3">
          <p className="text-[12px] font-semibold text-amber-700">
            {ex.requesterName}{T.exchangeAlert[lang]}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            {formatWeek(ex.requesterWeek, '')} ↔ {formatWeek(ex.targetWeek, '')}
          </p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => respondExchange(ex.id, '수락')}
              className="flex-1 py-1.5 rounded-lg bg-[#3182F6] text-white text-[11px] font-bold">{T.accept[lang]}</button>
            <button onClick={() => respondExchange(ex.id, '거절')}
              className="flex-1 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-[11px] font-bold">{T.reject[lang]}</button>
          </div>
        </div>
      ))}

      {/* This week highlight */}
      {thisWeekMine && (
        <div className="rounded-xl bg-[#3182F6] p-4 mb-3">
          <p className="text-[12px] text-white/80">{T.thisWeekDuty[lang]}</p>
          <p className="text-[12px] text-white/70 mt-1">
            <Calendar size={11} className="inline mr-1" />
            {formatWeek(thisWeekMine.weekStart, thisWeekMine.weekEnd)}
          </p>
          <p className="text-[11px] text-white/60 mt-2">{T.dutyPhotoNotice[lang]}</p>
          <p className="text-[11px] text-red-200 mt-0.5">{T.dutyFineNotice[lang]}</p>
        </div>
      )}

      {/* Next duty */}
      {!thisWeekMine && nextDuty && (
        <div className="rounded-xl bg-blue-50 p-3 mb-3">
          <p className="text-[12px] font-semibold text-blue-700">{T.nextDuty[lang]}</p>
          <p className="text-[12px] text-blue-600 mt-0.5">
            {formatWeek(nextDuty.weekStart, nextDuty.weekEnd)}
            <span className="text-blue-400 ml-2">({lang === 'ko' ? `약 ${weeksUntilNext}${T.weeksLater[lang]}` : `~${weeksUntilNext} ${T.weeksLater[lang]}`})</span>
          </p>
        </div>
      )}

      {/* Full schedule (compact) */}
      <p className="text-[12px] font-semibold text-gray-400 mb-2 mt-2">{T.dutySchedule[lang]}</p>
      <div className="flex flex-col gap-1">
        {allDuties.slice(0, 12).map(d => {
          const isMine = d.tenantId === t.id
          const isSkip = d.note === '청소용역'
          const isCurrent = d.weekStart === thisMonday
          return (
            <div key={d.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-[11px] ${
              isMine ? 'bg-blue-50' : isSkip ? 'bg-gray-50' : ''
            }`}>
              <span className="text-gray-400 w-24 shrink-0">{formatWeek(d.weekStart, d.weekEnd).split(' ~ ')[0]}</span>
              <span className={`flex-1 font-medium ${isSkip ? 'text-gray-400' : isMine ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                {isSkip ? (lang === 'ko' ? '용역' : 'Cleaning Service') : d.tenantName}
              </span>
              {isCurrent && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[9px] font-bold">{lang === 'ko' ? '이번주' : 'This week'}</span>}
              {d.isDone && <span className="text-green-600">✓</span>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
