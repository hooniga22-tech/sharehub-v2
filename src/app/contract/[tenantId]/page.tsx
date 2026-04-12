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

  const [f, setF] = useState({
    name: '', phone: '', birthDate: '', homeAddress: '',
    guardianName: '', guardianRelation: '', guardianPhone: '',
    rent: 0, mgmt: 0, deposit: 0, startDate: '', endDate: '', roomCode: '',
  })

  const defaultSpecialTerms = [
    '임차인은 임대인의 동의 없이 전대 또는 양도할 수 없다.',
    '임차인은 퇴실 30일 전에 서면 또는 카카오톡으로 통보해야 하며, 미통보 시 1개월 월세에 해당하는 위약금이 발생할 수 있다.',
    '반려동물 반입 및 흡연은 엄격히 금지된다.',
    '공동생활 수칙 반복 위반, 타인에 피해를 주는 행위, 절도 등이 확인될 경우 경고 후 최대 2주 이내 강제퇴실 조치될 수 있다.',
    '개인 부주의로 인한 파손은 본인 부담으로 배상하며, 파손자 불명 시 전체 입주자가 1/N로 부담한다.',
    '퇴실 시 원상복구 의무를 지며, 보증금에서 미납금·파손 배상금을 공제 후 7일 이내 반환한다.',
    '본 계약에 명시되지 않은 사항은 주택임대차보호법 및 민법에 따른다.',
    '관리비에 포함된 항목: 인터넷, 정수기, 청소용역비 (공과금은 별도 청구)',
    '관리비에 포함되지 않은 항목: 전기세, 가스비, 수도세 (입주자 1/N 분담)',
    '냉방/난방을 과도하게 사용할 경우 추가 관리비가 부과될 수 있다.',
    '입주 시 제공되는 비품(침대, 매트리스, 책상, 의자 등)은 퇴실 시 원상태로 반환해야 한다.',
    '매트리스는 반드시 방수 커버를 씌워 사용해야 하며, 오염 시 파손으로 간주하여 배상한다.',
    '공용공간(주방, 화장실, 거실) 사용 후 즉시 정리·청소를 원칙으로 한다.',
    '세탁기·건조기 사용 후 세탁물을 즉시 수거해야 하며, 방치 시 타인이 꺼낼 수 있다.',
    '택배는 각자 관리하며, 공용공간에 방치된 택배로 인한 분실은 책임지지 않는다.',
    '야간(22:00~08:00) 소음을 자제하고, 반복 민원 시 경고 후 퇴실 조치될 수 있다.',
    '계약 기간 중 월세 또는 관리비를 2회 이상 연체할 경우, 임대인은 계약을 해지할 수 있다.',
  ]

  const defaultAppendixTerms = [
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

  const [specialTerms, setSpecialTerms] = useState(defaultSpecialTerms)
  const [appendixTerms, setAppendixTerms] = useState(defaultAppendixTerms)

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
    }).catch(() => {}).finally(() => setLoading(false))
  }, [tenantId])

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#999' }}>불러오는 중...</div>
  if (!tenant) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#999' }}>입주자를 찾을 수 없습니다</div>

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
  const won = (n: number) => n.toLocaleString('ko-KR')

  const today = new Date()
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  const EI = ({ v, onChange }: { v: string; onChange: (v: string) => void }) =>
    editing ? <input style={{ border:'1px solid #3182F6',borderRadius:3,padding:'1px 5px',fontSize:'inherit',background:'#EBF3FE',outline:'none' }} value={v} onChange={e => onChange(e.target.value)} /> : <>{v}</>
  const EN = ({ v, onChange }: { v: number; onChange: (v: number) => void }) =>
    editing ? <input type="number" style={{ border:'1px solid #3182F6',borderRadius:3,padding:'1px 5px',fontSize:'inherit',background:'#EBF3FE',outline:'none',width:100 }} value={v} onChange={e => onChange(Number(e.target.value) || 0)} /> : <>{won(v)}</>

  const S: Record<string, React.CSSProperties> = {
    ct: { fontFamily:"'Malgun Gothic','맑은 고딕','Noto Sans KR',sans-serif", fontSize:'9pt', lineHeight:1.55, color:'#111', maxWidth:750, margin:'0 auto', padding:24, background:'#fff' },
    h1: { fontSize:'14pt', textAlign:'center', fontWeight:700, margin:'0 0 2px' },
    sub: { fontSize:'9pt', textAlign:'center', color:'#666', marginBottom:12 },
    sh: { fontSize:'9.5pt', fontWeight:700, margin:'6px 0 3px', borderBottom:'1.5px solid #111', paddingBottom:2 },
    sh2: { fontSize:'9pt', fontWeight:700, margin:'4px 0 2px' },
    td: { border:'1px solid #aaa', padding:'3px 7px', fontSize:'8.5pt' },
    th: { border:'1px solid #aaa', padding:'3px 7px', fontSize:'8.5pt', background:'#f5f5f5', fontWeight:700, width:'22%', textAlign:'left' as const },
    body: { fontSize:'8.5pt', lineHeight:1.55, margin:'2px 0' },
    abox: { background:'#f9f9f9', border:'1px solid #ddd', borderRadius:4, padding:'6px 10px', margin:'6px 0', fontSize:'8.5pt' },
    sign: { border:'1px solid #aaa', borderRadius:4, padding:'10px 14px', marginBottom:10 },
    sr: { marginBottom:4, fontSize:'8.5pt' },
    ol: { paddingLeft:16, margin:'2px 0' },
    li: { marginBottom:2, fontSize:'8.5pt', lineHeight:1.55 },
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 18mm; }
          html, body { width:210mm!important; margin:0!important; padding:0!important; }
          body > div, #__next, main { max-width:100%!important; width:100%!important; padding:0!important; margin:0!important; }
          .no-print { display:none!important; }
          nav, footer, header, [class*="bottom"], [class*="tab"], [class*="nav"], [class*="bar"] { display:none!important; }
          .pb2 { page-break-before: always; }
        }
      `}</style>

      {/* Control Bar */}
      <div className="no-print" style={{ position:'sticky',top:0,zIndex:10,background:'#fff',borderBottom:'1px solid #eee',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:750,margin:'0 auto' }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <button onClick={() => router.back()} style={{ background:'none',border:'none',cursor:'pointer' }}><ArrowLeft size={20} color="#666" /></button>
          <span style={{ fontSize:15,fontWeight:700 }}>{f.name} 계약서</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={() => setEditing(!editing)}
            style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,border:'none',cursor:'pointer',background:editing?'#e8faf2':'#f2f4f6',color:editing?'#0e6245':'#666' }}>
            {editing ? <Save size={12} /> : <Pencil size={12} />}{editing ? '완료' : '수정'}
          </button>
          <button onClick={() => window.print()}
            style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background:'#3182F6',color:'#fff',fontSize:12,fontWeight:600,border:'none',cursor:'pointer' }}>
            <Printer size={12} /> PDF 출력
          </button>
        </div>
      </div>

      {/* ═══════════ PAGE 1 ═══════════ */}
      <div style={S.ct}>
        <h1 style={S.h1}>쉐어메이트 계약서</h1>
        <p style={S.sub}>Share Mate Contract</p>

        <div style={S.sh}>제1조. 거주공간의 표시</div>
        <table style={{ width:'100%',borderCollapse:'collapse',margin:'4px 0' }}>
          <tbody>
            <tr><th style={S.th}>소재지 (주소)</th><td style={S.td}>{house?.address || '-'}</td></tr>
            <tr><th style={S.th}>하우스명</th><td style={S.td}>{tenant.houseName}</td></tr>
            <tr><th style={S.th}>임대 부분</th><td style={S.td}><EI v={f.roomCode} onChange={v => setF(p => ({ ...p, roomCode: v }))} /></td></tr>
          </tbody>
        </table>

        <div style={S.sh}>제2조. 계약 내용</div>
        <p style={S.body}>위 부동산의 임대차에 대하여 임대인과 임차인은 합의에 의하여 아래와 같이 계약을 체결한다.</p>
        <table style={{ width:'100%',borderCollapse:'collapse',margin:'4px 0' }}>
          <tbody>
            <tr><th style={S.th}>보증금</th><td style={S.td}>₩<EN v={deposit} onChange={v => setF(p => ({ ...p, deposit: v }))} /> — 퇴실 시 최대 7일 이내 반환</td></tr>
            <tr><th style={S.th}>월세</th><td style={S.td}>₩<EN v={rent} onChange={v => setF(p => ({ ...p, rent: v }))} /> / 월</td></tr>
            <tr><th style={S.th}>첫달 일할 월세</th><td style={S.td}>₩{won(proratedRent)} ({remainDays}일 ÷ {daysInMonth}일)</td></tr>
            <tr><th style={S.th}>계약금</th><td style={S.td}>₩500,000 — 계약 시 납부</td></tr>
            <tr><th style={S.th}>잔금</th><td style={{ ...S.td, color:'#E53E3E',fontWeight:700 }}>₩{won(balance)} — 입주 시 납부</td></tr>
            <tr><th style={S.th}>관리비</th><td style={S.td}>₩<EN v={mgmt} onChange={v => setF(p => ({ ...p, mgmt: v }))} /> / 월</td></tr>
            <tr><th style={S.th}>첫달 일할 관리비</th><td style={S.td}>₩{won(proratedMgmt)} ({remainDays}일 ÷ {daysInMonth}일)</td></tr>
          </tbody>
        </table>

        <div style={S.sh2}>제2항 [존속기간]</div>
        <p style={S.body}>임대인은 위 부동산을 임대차 목적대로 사용·수익할 수 있는 상태로 <EI v={f.startDate} onChange={v => setF(p => ({ ...p, startDate: v }))} /> 까지 임차인에게 인도하며, 임대차 기간은 인도일로부터 <EI v={f.endDate} onChange={v => setF(p => ({ ...p, endDate: v }))} /> 까지로 한다.</p>
        <div style={S.sh2}>제3항 [기간 한정]</div>
        <p style={S.body}>계약금은 계약과 동시에 납부하고, 잔금은 입주일에 납부한다.</p>
        <div style={S.sh2}>제4항 [계약 해지]</div>
        <p style={S.body}>임차인이 임대인에게 중도금을 지급하기 전까지, 임대인은 계약금의 배액을 상환하고, 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.</p>
        <div style={S.sh2}>제5항 [계약 종료]</div>
        <p style={S.body}>임대차 계약이 종료된 경우, 임차인은 위 부동산을 원상으로 회복하여 임대인에게 반환한다. 이와 동시에 임대인은 보증금을 임차인에게 반환한다.</p>
        <div style={S.sh2}>제6항 [채무 불이행]</div>
        <p style={S.body}>임대인 또는 임차인이 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 서면으로 최고하고, 이행하지 않으면 계약을 해제하며 손해배상을 청구할 수 있다.</p>
        <div style={S.sh2}>제7항 [계약 중도 해지]</div>
        <p style={S.body}>임차인의 사정으로 계약을 중도 해지할 경우, 퇴실 30일 전에 서면 또는 카카오톡으로 통보해야 하며, 미통보 시 1개월 월세에 해당하는 위약금이 발생할 수 있다.</p>
        <div style={S.sh2}>제8항 [입주 당일]</div>
        <p style={S.body}>입주 당일 집기 및 시설물의 상태를 확인하고, 이상이 있을 경우 즉시 임대인에게 알려야 한다.</p>
        <div style={S.sh2}>제9항 [제공자의 의무]</div>
        <p style={S.body}>임대인(제공자)은 거주 가능한 상태로 집을 유지·관리할 의무가 있으며, 시설이 저하되는 상황이 발생할 경우 최대한 빠르게 복구한다.</p>

        <div style={S.sh}>제3조. 특약 사항</div>
        <ol style={S.ol}>
          {specialTerms.map((t, i) => (
            <li key={i} style={S.li}>
              {editing ? <textarea style={{ width:'100%',fontSize:'8.5pt',lineHeight:1.55,border:'1px solid #3182F6',borderRadius:3,padding:'2px 4px',background:'#EBF3FE' }} rows={2} value={t} onChange={e => { const c = [...specialTerms]; c[i] = e.target.value; setSpecialTerms(c) }} /> : t}
            </li>
          ))}
        </ol>

        {/* 서명란 */}
        <p style={{ textAlign:'right',margin:'6px 0',fontSize:'8.5pt' }}>계약일: {todayStr}</p>
        <div style={{ display:'flex',gap:10,marginBottom:6 }}>
          <div style={{ ...S.sign, flex:1 }}>
            <p style={{ fontWeight:700,fontSize:'9pt',marginBottom:6 }}>임차인</p>
            <div style={S.sr}>이름: <EI v={f.name} onChange={v => setF(p => ({ ...p, name: v }))} /></div>
            <div style={S.sr}>연락처: <EI v={f.phone} onChange={v => setF(p => ({ ...p, phone: v }))} /></div>
            <div style={{ textAlign:'right',marginTop:6,fontSize:'8.5pt' }}>서명: __________________ (인)</div>
          </div>
          <div style={{ ...S.sign, flex:1 }}>
            <p style={{ fontWeight:700,fontSize:'9pt',marginBottom:6 }}>임대인</p>
            <div style={S.sr}>이름: 유재훈</div>
            <div style={S.sr}>연락처: 010-____-____</div>
            <div style={{ textAlign:'right',marginTop:6,fontSize:'8.5pt' }}>서명: __________________ (인)</div>
          </div>
        </div>

        <div style={S.abox}>
          <p style={{ margin:0 }}>■ 임대료(월세) 납입계좌: {house?.landlordName || '-'} (계약서 참조)</p>
          <p style={{ margin:0 }}>■ 관리비 납입계좌: 케이뱅크 유재훈 100-166-670094</p>
        </div>

        {/* ═══════════ PAGE 2: 별지 특약 ═══════════ */}
        <div className="pb2">
          <h1 style={S.h1}>쉐어하우스 별지 특약</h1>
          <p style={{ textAlign:'center',fontSize:'8.5pt',color:'#555',margin:'4px 0 10px',lineHeight:1.55 }}>
            이용자는 쉐어하우스 일원으로서 / 제공자는 쉐어하우스의 대표로서<br />
            마음이 편한 집을 &lsquo;함께&rsquo; 만들어 가는 데 적극 협조할 것을 약속합니다. 계약서를 읽은 후 동의할 경우 서명
          </p>

          <ol style={S.ol}>
            {appendixTerms.map((t, i) => (
              <li key={i} style={S.li}>
                {editing ? <textarea style={{ width:'100%',fontSize:'8.5pt',lineHeight:1.55,border:'1px solid #3182F6',borderRadius:3,padding:'2px 4px',background:'#EBF3FE' }} rows={3} value={t} onChange={e => { const c = [...appendixTerms]; c[i] = e.target.value; setAppendixTerms(c) }} /> : t}
              </li>
            ))}
          </ol>

          <p style={{ margin:'6px 0',fontSize:'8.5pt',fontStyle:'italic' }}>
            운영에 관하여 변동이 있을 시 제공자는 최소 4주 전에 고지 의무를 가진다.
          </p>

          {/* 별지 서명란 */}
          <div style={{ borderTop:'1.5px solid #111',paddingTop:8,marginTop:8 }}>
            <p style={{ fontWeight:700,fontSize:'9pt',marginBottom:6 }}>별지 특약 서명</p>
            <p style={{ fontSize:'8pt',color:'#666',marginBottom:8 }}>상기 별지 특약 사항을 모두 확인하였으며 이에 동의합니다.</p>
            <div style={{ display:'flex',justifyContent:'space-between' }}>
              <div style={{ fontSize:'8.5pt' }}>임차인: ________________________ (인)</div>
              <div style={{ fontSize:'8.5pt' }}>임대인: 유재훈 (인)</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
