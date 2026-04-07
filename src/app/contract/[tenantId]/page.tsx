'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Pencil, Save } from 'lucide-react'

interface TenantData {
  id: string; houseName: string; roomCode: string; name: string; phone: string;
  rent: number; managementFee: number; deposit: number;
  startDate: string; endDate: string; status: string; nationality: string; memo: string;
}
interface HouseData {
  name: string; address: string; landlordName: string; memo: string;
}

export default function ContractPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string

  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [house, setHouse] = useState<HouseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  // Editable fields
  const [f, setF] = useState({
    name: '', phone: '', birthDate: '', homeAddress: '',
    guardianName: '', guardianRelation: '', guardianPhone: '',
    rent: 0, mgmt: 0, deposit: 0, startDate: '', endDate: '', roomCode: '',
  })

  // Editable special terms
  const defaultTerms = [
    '[제공자 의무] 쉐어하우스는 집을 소분하여 임대하는 주거 형태로, 제공자는 임대인과 동일하게 주거 가능한 상태로 집을 유지·관리할 의무가 있다. 거주 시설이 저하되는 상황이 발생할 경우 최대한 빠르게 복구하며, 재난 또는 건물 문제로 24시간 이상 거주가 불가능한 상황이 이어질 경우 해당 일수만큼 월세를 일할 계산하여 이용자에게 보상한다.',
    '[공동 거주자의 최소 의무] 하우스메이트 간에 서로 배려하고 문제는 소통으로 해결하며, 최소한의 의무 [청소 / 소음 / 언어 사용 / 따뜻한 인사]를 지킬 것을 약속한다. 쉐어메이트 또는 제공자와 지속적으로 불화가 있을 경우, 제공자의 판단에 따라 강제퇴실 조치되며 최대 2주 이내에 퇴실해야 한다.',
    '[강제 퇴실] 애완동물 반입, 흡연, 공동 생활 수칙 미준수, 쉐어메이트 또는 제공자에게 과도한 불편·불쾌함을 주는 행위, 타인의 물건을 허락 없이 사용하거나 절도하는 행위가 확인될 경우 경고 또는 강제 퇴실 조치가 취해질 수 있다. 강제 퇴실 시 이용자는 1주일 이내로 퇴실해야 한다.',
    '[파손과 배상] 개인 공간 및 공용 공간의 파손 또는 수리가 필요한 경우, 파손자가 배상한다. 파손자가 불명확할 경우 이용자 전원이 배상 비용을 1/N로 부담한다.',
    '[관리와 보상] 집에 대한 유지·관리는 하우스메이트 모두의 의무다. (예: 변기 막힘 / 청결 유지 / 머리카락으로 인한 배수 문제 등) 하우스가 일정 수준 이하의 청결로 지속될 경우 경고 후 이용자 1/N 부담으로 청소업체가 투입될 수 있다. 제공자의 안내를 따르지 않아 발생한 곰팡이, 동파, 파손, 도난 등의 피해에 대해 관리자는 보상 의무가 없다.',
    '[정리와 청결] 공용공간에 개인 물건은 배정된 구역 외에 두지 않으며, 공용공간 사용 후 즉시 원상복구(설거지, 물건 정리 등)를 원칙으로 한다. 반복 위반 시 경고 후 관리인 판단에 따라 처분이 가능하다. 매트리스는 반드시 방수 커버를 씌워 사용해야 하며, 매트리스 오염은 파손으로 간주하여 배상해야 한다.',
    '[수납] 수납공간에 수용 가능한 양의 짐만 반입해야 하며, 초과되는 짐으로 룸메이트에게 피해를 주어서는 안 된다. 배정된 수납공간을 초과하는 짐을 가져올 경우 유료 짐보관 서비스를 별도로 이용해야 한다.',
    '[금전활동 금지] 이용자 사이에서의 금전거래, 물품 판매, 보험·영업활동 일체를 금지한다. 적발 시 즉시 강제 퇴실에 동의하며, 강제 퇴실 시 1개월 이내로 퇴실해야 한다. 내부 거래로 인한 피해는 제공자가 책임지지 않는다.',
    '[쉐어하우스의 개념] 본 계약은 전·월세 개념이 아닌 방을 나눠 사용하는 형태로, 월세 세액공제 대상에 해당되지 않는다.',
    '[운영진 권한] 운영진은 항상 하우스 출입 비밀번호를 공유받아야 하며, 이용자는 운영자의 출입을 통제할 수 없다. 단, 운영진은 출입 전 반드시 사전 고지해야 하며 비상 상황에 한해 고지 없이 출입이 가능하다.',
    '[협력] 운영진이 없는 단체 채팅방 개설, 내부 분란 조장, 쉐어메이트를 비하하는 언어 사용 등의 행위를 하지 않는다. 불편 사항이 있을 경우 제공자와 직접 소통하여 해결한다.',
    '[전입신고] 쉐어하우스는 여러 사람이 방을 소분하여 거주하는 형태로 각각의 세대주를 나눌 수 없기 때문에 전입신고가 불가하며, 이에 동의한다.',
  ]
  const [terms, setTerms] = useState<string[]>(defaultTerms)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenantId}`).then(r => r.json()),
      fetch('/api/houses').then(r => r.json()),
    ]).then(([t, houses]) => {
      if (t.error) return
      setTenant(t)
      const h = Array.isArray(houses) ? houses.find((h: HouseData) => h.name === t.houseName) : null
      setHouse(h || null)
      setF({
        name: t.name, phone: t.phone, birthDate: '', homeAddress: '',
        guardianName: '', guardianRelation: '', guardianPhone: '',
        rent: t.rent, mgmt: t.managementFee, deposit: t.deposit || 2000000,
        startDate: t.startDate, endDate: t.endDate, roomCode: t.roomCode,
      })
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">불러오는 중...</div>
  if (!tenant) return <div className="flex items-center justify-center min-h-screen text-gray-400">입주자를 찾을 수 없습니다</div>

  const deposit = f.deposit || 2000000
  const contractDeposit = 500000
  const balance = deposit - contractDeposit
  const rent = f.rent || 0
  const mgmt = f.mgmt || 0
  const startDate = new Date(f.startDate)
  const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
  const remainDays = daysInMonth - startDate.getDate() + 1
  const proratedRent = Math.round(rent * remainDays / daysInMonth)
  const proratedMgmt = Math.round(mgmt * remainDays / daysInMonth)
  const fmt = (n: number) => n.toLocaleString('ko-KR')

  const today = new Date()
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  function updateTerm(idx: number, val: string) {
    setTerms(prev => prev.map((t, i) => i === idx ? val : t))
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 15mm 18mm; }
          body { margin: 0; }
        }
        .contract { font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 10pt; line-height: 1.8; color: #111; max-width: 750px; margin: 0 auto; padding: 24px; background: #fff; }
        .contract h1 { font-size: 16pt; text-align: center; font-weight: bold; margin-bottom: 20px; }
        .contract h2 { font-size: 11pt; font-weight: bold; margin: 14px 0 6px; border-bottom: 1px solid #333; padding-bottom: 3px; }
        .contract table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
        .contract table td, .contract table th { border: 1px solid #aaa; padding: 5px 8px; }
        .contract table th { background: #f5f5f5; font-weight: bold; width: 28%; }
        .contract .account-box { background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 10px 14px; margin: 10px 0; font-size: 9.5pt; }
        .contract .sign-area { margin-top: 20px; border-top: 1px solid #aaa; padding-top: 14px; }
        .contract .sign-row { margin-bottom: 12px; font-size: 9.5pt; }
        .contract .page-break { page-break-before: always; padding-top: 10px; }
        .contract ol li { margin-bottom: 10px; line-height: 1.75; }
        .edit-input { border: 1px solid #3182F6; border-radius: 4px; padding: 2px 6px; font-size: inherit; background: #EBF3FE; outline: none; }
      `}</style>

      {/* Control Bar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between max-w-[750px] mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-[15px] font-bold">{f.name} 계약서</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
              editing ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
            {editing ? <Save size={12} /> : <Pencil size={12} />}
            {editing ? '완료' : '수정'}
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3182F6] text-white text-[12px] font-semibold">
            <Printer size={12} /> PDF 출력
          </button>
        </div>
      </div>

      {/* Contract Body */}
      <div className="contract">
        <h1>쉐어하우스 임대차 계약서</h1>

        <h2>제1조 [목적 및 임대 목적물]</h2>
        <p>본 계약은 아래 목적물을 임대하는 목적을 위하여 체결된다.</p>
        <table>
          <tbody>
            <tr><th>소재지</th><td>{house?.address || '-'}</td></tr>
            <tr><th>거주 공간</th><td>{editing ? <input className="edit-input w-full" value={f.roomCode} onChange={e => setF(p => ({ ...p, roomCode: e.target.value }))} /> : f.roomCode}</td></tr>
          </tbody>
        </table>

        <h2>제2조 [임대 조건]</h2>
        <table>
          <tbody>
            <tr>
              <th>계약 시작일</th>
              <td>{editing ? <input type="date" className="edit-input" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} /> : f.startDate}</td>
              <th>계약 종료일</th>
              <td>{editing ? <input type="date" className="edit-input" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))} /> : f.endDate}</td>
            </tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr><th>보증금</th><td>₩{editing ? <input type="number" className="edit-input w-32" value={f.deposit} onChange={e => setF(p => ({ ...p, deposit: Number(e.target.value) || 0 }))} /> : fmt(deposit)} — 퇴실 시 최대 7일 이내 반환</td></tr>
            <tr><th>월세</th><td>₩{editing ? <input type="number" className="edit-input w-32" value={f.rent} onChange={e => setF(p => ({ ...p, rent: Number(e.target.value) || 0 }))} /> : fmt(rent)} / 월</td></tr>
            <tr><th>첫달 일할 월세</th><td>₩{fmt(proratedRent)} ({remainDays}일 ÷ {daysInMonth}일)</td></tr>
            <tr><th>계약금</th><td>₩500,000 — 계약 시 납부</td></tr>
            <tr><th>잔금</th><td>₩{fmt(balance)} — 입주 시 납부</td></tr>
            <tr><th>관리비</th><td>₩{editing ? <input type="number" className="edit-input w-32" value={f.mgmt} onChange={e => setF(p => ({ ...p, mgmt: Number(e.target.value) || 0 }))} /> : fmt(mgmt)} / 월</td></tr>
            <tr><th>첫달 일할 관리비</th><td>₩{fmt(proratedMgmt)} ({remainDays}일 ÷ {daysInMonth}일)</td></tr>
          </tbody>
        </table>

        <h2>제3조 [특약 사항]</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li>임차인은 임대인의 동의 없이 전대 또는 양도할 수 없다.</li>
          <li>임차인은 퇴실 30일 전에 서면으로 통보해야 한다. 미통보 시 1개월 월세에 해당하는 위약금이 발생할 수 있다.</li>
          <li>반려동물 반입 및 흡연은 엄격히 금지된다.</li>
          <li>공동생활 수칙 반복 위반, 타인에 피해를 주는 행위, 절도 등이 확인될 경우 경고 후 최대 2주 이내 강제퇴실 조치될 수 있다.</li>
          <li>개인 부주의로 인한 파손은 본인 부담으로 배상하며, 파손자 불명 시 전체 입주자가 1/N로 부담한다.</li>
          <li>퇴실 시 원상복구 의무를 지며, 보증금에서 미납금·파손 배상금을 공제 후 7일 이내 반환한다.</li>
          <li>본 계약에 명시되지 않은 사항은 주택임대차보호법 및 민법에 따른다.</li>
        </ol>

        <div className="account-box">
          <p>■ 월세 납입계좌: {house?.landlordName || '-'} (계약서 참조)</p>
          <p>■ 관리비 납입계좌: 케이뱅크 유재훈 100-166-670094</p>
        </div>

        <p style={{ textAlign: 'right', marginTop: '16px' }}>계약일: {todayStr}</p>

        <div className="sign-area">
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>임차인</p>
          <div className="sign-row">
            이름: {editing ? <input className="edit-input" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /> : f.name}
            &nbsp;&nbsp;&nbsp;&nbsp;본가주소: {editing ? <input className="edit-input w-48" value={f.homeAddress} onChange={e => setF(p => ({ ...p, homeAddress: e.target.value }))} /> : (f.homeAddress || '___________________________')}
          </div>
          <div className="sign-row">
            연락처: {editing ? <input className="edit-input" value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} /> : f.phone}
            &nbsp;&nbsp;&nbsp;&nbsp;생년월일: {editing ? <input className="edit-input w-32" value={f.birthDate} onChange={e => setF(p => ({ ...p, birthDate: e.target.value }))} placeholder="YYYY-MM-DD" /> : (f.birthDate || '_____________')}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(인)
          </div>
          <div className="sign-row">
            보호자: {editing ? <input className="edit-input w-24" value={f.guardianName} onChange={e => setF(p => ({ ...p, guardianName: e.target.value }))} /> : (f.guardianName || '_____________')}
            &nbsp;&nbsp;관계: {editing ? <input className="edit-input w-16" value={f.guardianRelation} onChange={e => setF(p => ({ ...p, guardianRelation: e.target.value }))} /> : (f.guardianRelation || '_______')}
            &nbsp;&nbsp;연락처: {editing ? <input className="edit-input w-32" value={f.guardianPhone} onChange={e => setF(p => ({ ...p, guardianPhone: e.target.value }))} /> : (f.guardianPhone || '________________')}
          </div>
          <p style={{ fontWeight: 'bold', marginTop: '16px', marginBottom: '10px' }}>임대인</p>
          <div className="sign-row">
            이름: 유재훈&nbsp;&nbsp;&nbsp;&nbsp;연락처: 010-____-____&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(인)
          </div>
        </div>

        {/* Page 2: Special Terms */}
        <div className="page-break">
          <h1>쉐어하우스 별지 특약</h1>
          <p style={{ textAlign: 'center', fontSize: '9.5pt', color: '#555', marginBottom: '16px', lineHeight: '1.7' }}>
            이용자는 쉐어하우스 일원으로서 / 제공자는 쉐어하우스의 대표로서<br />
            마음이 편한 집을 &lsquo;함께&rsquo; 만들어 가는 데 적극 협조할 것을 약속합니다.<br />
            계약서를 읽은 후 동의할 경우 서명
          </p>

          <ol style={{ paddingLeft: '20px' }}>
            {terms.map((t, i) => (
              <li key={i}>
                {editing ? (
                  <textarea className="edit-input w-full" rows={3} value={t}
                    onChange={e => updateTerm(i, e.target.value)}
                    style={{ fontSize: '9.5pt', lineHeight: '1.7' }} />
                ) : t}
              </li>
            ))}
          </ol>

          <p style={{ marginTop: '16px', fontSize: '9.5pt', fontStyle: 'italic' }}>
            운영에 변동이 있을 시 제공자는 최소 4주 전에 고지 의무를 가진다.
          </p>

          <div className="sign-area">
            <div className="sign-row">임차인: ________________________ (인)</div>
            <div className="sign-row">임대인: 유재훈 (인)</div>
          </div>
        </div>
      </div>
    </>
  )
}
