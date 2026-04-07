'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check, MapPin, ExternalLink } from 'lucide-react'

interface HouseGuide {
  id: string; name: string; district: string; address: string;
  doorPassword: string; wifiSsid: string; wifiPassword: string;
  memo: string; activeCount: number;
}

type Lang = 'ko' | 'en'

const T: Record<string, Record<Lang, string>> = {
  access: { ko: '접근 정보', en: 'Access Information' },
  address: { ko: '주소', en: 'Address' },
  mapView: { ko: '지도보기', en: 'View Map' },
  doorPw: { ko: '현관 비번', en: 'Door Password' },
  noDoor: { ko: '문의 필요', en: 'Contact Manager' },
  wifiPw: { ko: '와이파이', en: 'WiFi' },
  onRouter: { ko: '공유기에 표시됨', en: 'Shown on router' },
  noWifi: { ko: '문의 필요', en: 'Contact Manager' },
  copied: { ko: '복사됨!', en: 'Copied!' },
  payment: { ko: '납입 안내', en: 'Payment Guide' },
  notice: { ko: '공지사항', en: 'Notice' },
  contact: { ko: '카카오톡으로 문의하기', en: 'Contact via KakaoTalk' },
  notFound: { ko: '존재하지 않는 하우스입니다', en: 'House not found' },
  loading: { ko: '불러오는 중...', en: 'Loading...' },
  house: { ko: '하우스', en: 'House' },
}

const PAYMENT_TEXT: Record<Lang, string[]> = {
  ko: [
    '월세와 관리비는 매월 1일까지 납부해 주세요.',
    '납부 계좌는 계약서를 확인해 주세요.',
    '공과금은 매월 청구됩니다.',
  ],
  en: [
    'Please pay rent and management fee by the 1st of each month.',
    'Please check your contract for payment account details.',
    'Utility bills are charged monthly.',
  ],
}

const NOTICE_TEXT: Record<Lang, string[]> = {
  ko: [
    '남들에게 피해주지 않도록 공동생활에 주의 부탁드립니다 (청소/뒷정리/소음 등)',
    '냉방/난방을 과도하게 하면 추가 관리비가 부과될 수 있습니다',
    '당번 활동 철저히 해주세요 (사진 미업로드 시 벌금 3만원 적용)',
    '갱신/퇴실/고장/기타 문의는 카카오톡 채널로 연락주세요',
  ],
  en: [
    'Please be careful in communal living to avoid inconveniencing others (cleaning, tidying up, noise, etc.)',
    'Excessive cooling/heating may result in additional management fees',
    'Please fulfill your cleaning duties thoroughly (30,000 won fine if photos are not uploaded)',
    'For renewal/check-out/repairs/other inquiries, please contact us via KakaoTalk channel',
  ],
}

export default function HouseGuidePage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<HouseGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lang, setLang] = useState<Lang>('ko')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetch(`/api/house-guide/${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); return }
        setData(d)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  function getWifiDisplay() {
    if (!data) return ''
    if (!data.wifiSsid && !data.wifiPassword) return T.noWifi[lang]
    if (data.wifiPassword === '기계에 써 있음') return T.onRouter[lang]
    const parts = []
    if (data.wifiSsid) parts.push(data.wifiSsid)
    if (data.wifiPassword && data.wifiPassword !== '기계에 써 있음') parts.push(data.wifiPassword)
    return parts.join(' / ')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <p className="text-[14px] text-gray-400">{T.loading[lang]}</p>
    </div>
  )

  if (notFound || !data) return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-2">
      <p className="text-[16px] font-bold text-gray-600">{T.notFound[lang]}</p>
      <p className="text-[13px] text-gray-400">404</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[480px] mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[13px] text-gray-400 font-medium">ShareHub</p>
            <h1 className="text-[24px] font-bold mt-1">{data.name} {T.house[lang]}</h1>
            {data.district && (
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[12px] font-medium">
                {data.district}
              </span>
            )}
          </div>
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setLang('ko')}
              className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                lang === 'ko' ? 'bg-[#3182F6] text-white' : 'text-gray-500'
              }`}>한국어</button>
            <button onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                lang === 'en' ? 'bg-[#3182F6] text-white' : 'text-gray-500'
              }`}>English</button>
          </div>
        </div>

        {/* Section 1: Access Info */}
        <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold mb-4">{T.access[lang]}</h2>

          {/* Address */}
          {data.address && (
            <InfoItem label={T.address[lang]} value={data.address}
              action={
                <a href={`https://map.kakao.com/?q=${encodeURIComponent(data.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold">
                  <MapPin size={11} /> {T.mapView[lang]}
                </a>
              }
            />
          )}

          {/* Door Password */}
          <InfoItem
            label={T.doorPw[lang]}
            value={data.doorPassword || T.noDoor[lang]}
            isEmpty={!data.doorPassword}
            action={data.doorPassword ? (
              <CopyButton text={data.doorPassword} label="door" copied={copied} onCopy={copyText} copiedText={T.copied[lang]} />
            ) : undefined}
          />

          {/* WiFi */}
          <InfoItem
            label={T.wifiPw[lang]}
            value={getWifiDisplay()}
            isEmpty={!data.wifiSsid && !data.wifiPassword}
            isLast
            action={data.wifiPassword && data.wifiPassword !== '기계에 써 있음' ? (
              <CopyButton text={data.wifiPassword} label="wifi" copied={copied} onCopy={copyText} copiedText={T.copied[lang]} />
            ) : undefined}
          />
        </section>

        {/* Section 2: Payment */}
        <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold mb-3">{T.payment[lang]}</h2>
          <div className="flex flex-col gap-2">
            {PAYMENT_TEXT[lang].map((t, i) => (
              <p key={i} className="text-[13px] text-gray-600 leading-relaxed">{t}</p>
            ))}
          </div>
        </section>

        {/* Section 3: Notice */}
        <section className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="text-[15px] font-bold mb-3">{T.notice[lang]}</h2>
          <ol className="flex flex-col gap-2.5">
            {NOTICE_TEXT[lang].map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-600 leading-relaxed">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 4: Contact */}
        <a href="http://pf.kakao.com/_xnxnNxj" target="_blank" rel="noopener noreferrer"
          className="block w-full py-4 rounded-2xl bg-[#FEE500] text-center text-[15px] font-bold text-[#3C1E1E] mb-6">
          {T.contact[lang]}
        </a>

        {/* Footer */}
        <footer className="text-center py-4">
          <p className="text-[11px] text-gray-400">© 2026 ShareHub. 쉐어하우스 운영 관리 플랫폼</p>
        </footer>
      </div>
    </div>
  )
}

function InfoItem({ label, value, isEmpty, isLast, action }: {
  label: string; value: string; isEmpty?: boolean; isLast?: boolean; action?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <div className="flex-1">
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className={`text-[14px] font-medium ${isEmpty ? 'text-gray-400' : 'text-gray-800'}`}>{value}</p>
      </div>
      {action && <div className="ml-3">{action}</div>}
    </div>
  )
}

function CopyButton({ text, label, copied, onCopy, copiedText }: {
  text: string; label: string; copied: string; onCopy: (t: string, l: string) => void; copiedText: string;
}) {
  const isCopied = copied === label
  return (
    <button onClick={() => onCopy(text, label)}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
        isCopied ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
      }`}>
      {isCopied ? <Check size={11} /> : <Copy size={11} />}
      {isCopied ? copiedText : 'Copy'}
    </button>
  )
}
