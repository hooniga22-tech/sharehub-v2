'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function ContractPage() {
  const { tenantId } = useParams()
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tenants?id=${tenantId}`)
      .then(r => r.json())
      .then(data => { setTenant(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tenantId])

  if (loading) return <div style={{textAlign:'center',padding:'80px 0',color:'#8b95a1',fontSize:13}}>불러오는 중...</div>
  if (!tenant) return <div style={{textAlign:'center',padding:'80px 0',color:'#f04452',fontSize:13}}>입주자를 찾을 수 없어요</div>

  const today = new Date()
  const dateStr = `${today.getFullYear()}. ${today.getMonth()+1}. ${today.getDate()}`
  const name    = tenant['이름'] || ''
  const phone   = tenant['연락처'] || ''
  const house   = tenant['지점명'] || ''
  const room    = tenant['방코드'] || ''
  const rent    = Number(tenant['월세']) || 0
  const mgmt    = Number(tenant['관리비']) || 0
  const deposit = Number(tenant['보증금']) || 0
  const moveIn  = tenant['입주일'] || ''
  const moveOut = tenant['퇴실일'] || ''

  const moveInDate = new Date(moveIn)
  const lastDay = new Date(moveInDate.getFullYear(), moveInDate.getMonth()+1, 0).getDate() || 30
  const remainDays = Math.max(1, lastDay - moveInDate.getDate() + 1)
  const firstRent = Math.round(rent / lastDay * remainDays)
  const firstMgmt = Math.round(mgmt / lastDay * remainDays)
  const contractFee = 500000
  const balance = deposit - contractFee + firstRent + mgmt
  const fmt = (n: number) => '₩' + n.toLocaleString()

  return (
    <>
      <div className="no-print" style={{position:'fixed',top:16,right:16,zIndex:999,display:'flex',gap:8}}>
        <button onClick={() => history.back()} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #ddd',background:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>← 뒤로</button>
        <button onClick={() => window.print()} style={{padding:'10px 20px',borderRadius:8,border:'none',background:'#3182f6',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>🖨️ PDF 출력</button>
      </div>

      <div id="contract-wrap">
        {/* ━━━ 1페이지 ━━━ */}
        <div className="page page1">
          <h1 className="main-title">쉐어메이트 계약서</h1>
          <p className="sub-title">Share Mate Contract</p>
          <p className="intro">다음과 같이 합의하여 쉐어메이트 계약을 체결한다.</p>

          <div className="section-title">제 1 조. 거주공간의 표시</div>
          <table className="info-table"><tbody>
            <tr><td className="lbl">소재지 (주소)</td><td>서울시 {house} 소재</td></tr>
            <tr><td className="lbl">하우스명</td><td>{house}</td></tr>
            <tr><td className="lbl">임대 부분</td><td>{room}</td></tr>
          </tbody></table>

          <div className="section-title">제 2 조. 계약 내용</div>
          <p className="clause-intro">위 부동산의 임대차에 대하여 임대인과 임차인은 합의에 의하여 아래와 같이 계약을 체결한다.</p>
          <table className="info-table"><tbody>
            <tr><td className="lbl">보증금</td><td>{fmt(deposit)} — 퇴실 시 최대 7일 이내 반환</td></tr>
            <tr><td className="lbl">월세</td><td>{fmt(rent)} / 월</td></tr>
            <tr><td className="lbl">첫달 일할 월세</td><td>{fmt(firstRent)} ({remainDays}일 / {lastDay}일)</td></tr>
            <tr><td className="lbl">계약금</td><td>{fmt(contractFee)} — 계약 시 납부</td></tr>
            <tr><td className="lbl">잔금</td><td style={{color:'#c00',fontWeight:600}}>{fmt(balance)} — 입주 시 납부</td></tr>
            <tr><td className="lbl">관리비</td><td>{fmt(mgmt)} / 월</td></tr>
            <tr><td className="lbl">첫달 일할 관리비</td><td>{fmt(firstMgmt)} ({remainDays}일 / {lastDay}일)</td></tr>
          </tbody></table>

          <p className="clause"><b>제2항 [존속기간]</b> 임대인은 위 부동산을 {moveIn}까지 임차인에게 인도하며, 임대차 기간은 인도일로부터 {moveOut}까지로 한다.</p>
          <p className="clause"><b>제3항 [기간 한정]</b> 계약금은 계약과 동시에 납부하고, 잔금은 입주일에 납부한다.</p>
          <p className="clause"><b>제4항 [계약의 해지]</b> 임차인이 중도금을 지불하기 전까지, 임대인은 계약금의 배액을 상환하고, 임차인은 계약금을 포기하고 계약을 해제할 수 있다.</p>
          <p className="clause"><b>제5항 [계약의 종료]</b> 계약 종료 후, 임차인은 부동산을 원상 복구하여 반환하고, 임대인은 보증금을 반환한다.</p>
          <p className="clause"><b>제6항 [채무 불이행]</b> 불이행 시 상대방은 서면으로 최고하고, 이행하지 않으면 계약을 해제하며 손해배상을 청구할 수 있다.</p>
          <p className="clause"><b>제7항 [중도 해지]</b> 퇴실 30일 전 서면/카카오톡 통보 필수. 미통보 시 1개월 월세 위약금 발생.</p>
          <p className="clause"><b>제8항 [입주 당일]</b> 집기·시설물 상태 확인 후 이상 시 즉시 임대인에게 고지.</p>
          <p className="clause"><b>제9항 [제공자의 의무]</b> 임대인은 거주 가능한 상태로 유지·관리하며 시설 저하 시 빠르게 복구한다.</p>

          <div className="section-title">제 3 조. 특약 사항</div>
          <ol className="terms">
            <li>임차인은 임대인의 동의 없이 전대 또는 양도할 수 없다.</li>
            <li>퇴실 30일 전 서면/카카오톡 통보 필수. 미통보 시 1개월 월세 위약금.</li>
            <li>반려동물 반입 및 흡연은 엄격히 금지된다.</li>
            <li>공동생활 수칙 반복 위반, 피해 행위, 절도 시 경고 후 최대 2주 이내 강제퇴실.</li>
            <li>개인 부주의 파손은 본인 부담. 파손자 불명 시 입주자 1/N 부담.</li>
            <li>퇴실 시 원상복구 의무. 보증금에서 미납금·파손 배상금 공제 후 7일 이내 반환.</li>
            <li>본 계약에 명시되지 않은 사항은 주택임대차보호법 및 민법에 따른다.</li>
            <li>관리비 포함: 인터넷, 정수기, 청소용역비 (공과금 별도)</li>
            <li>관리비 미포함: 전기세, 가스비, 수도세 (입주자 1/N 분담)</li>
            <li>냉방/난방 과도 사용 시 추가 관리비 부과 가능.</li>
            <li>입주 시 제공 비품(침대, 매트리스, 책상, 의자 등)은 퇴실 시 원상태 반환.</li>
            <li>매트리스 방수 커버 필수. 오염 시 파손으로 간주하여 배상.</li>
            <li>공용공간 사용 후 즉시 정리·청소 원칙.</li>
            <li>세탁기·건조기 사용 후 세탁물 즉시 수거. 방치 시 타인 수거 가능.</li>
            <li>택배 각자 관리. 공용공간 방치 택배 분실 책임 없음.</li>
            <li>야간(22:00~08:00) 소음 자제. 반복 민원 시 경고 후 퇴실 조치.</li>
            <li>월세/관리비 2회 이상 연체 시 임대인은 계약을 해지할 수 있다.</li>
          </ol>

          <p className="date-right">계약일: {dateStr}</p>
          <div className="sign-area">
            <div className="sign-box">
              <div className="sign-title">임차인</div>
              <div className="sign-line">이름: {name}</div>
              <div className="sign-line">연락처: {phone}</div>
              <div className="sign-sig">서명: ________________________ (인)</div>
            </div>
            <div className="sign-box">
              <div className="sign-title">임대인</div>
              <div className="sign-line">이름: 유재훈</div>
              <div className="sign-line">연락처: 010-____-____</div>
              <div className="sign-sig">서명: ________________________ (인)</div>
            </div>
          </div>
          <div className="account-box">
            <div>■ 임대료(월세) 납입계좌: — (계약서 참조)</div>
            <div>■ 관리비 납입계좌: 케이뱅크 유재훈 100-166-670094</div>
          </div>
        </div>

        {/* ━━━ 2페이지: 별지 특약 ━━━ */}
        <div className="page page2">
          <h1 className="byeolji-title">쉐어하우스 별지 특약</h1>
          <p className="byeolji-intro">이용자는 쉐어하우스 일원으로서 / 제공자는 쉐어하우스의 대표로서<br/>마음이 편한 집을 &lsquo;함께&rsquo; 만들어 가는데 적극 협조할 것을 약속합니다<br/>계약서를 읽은 후 동의할 경우 서명</p>
          <ol className="byeolji-terms">
            <li><b>[제공자 의무]</b> 쉐어하우스는 집을 소분하여 임대하는 주거 형태로, 제공자는 주거 가능한 상태로 유지·관리할 의무가 있다. 재난/건물 문제로 24시간 이상 거주 불가 시 해당 일수만큼 월세 일할계산으로 보상한다.</li>
            <li><b>[공동 거주자의 최소 의무]</b> 하우스메이트 간 배려하고 소통으로 해결하며, [청소/소음/언어사용/따뜻한 인사]를 지킨다. 지속적 불화 시 제공자 판단하에 강제퇴실, 최대 2주 이내 퇴실.</li>
            <li><b>[강제 퇴실]</b> 애완동물 반입, 흡연, 수칙 미준수, 과도한 불편/절도 시 경고 또는 강제퇴실. 강제퇴실 시 1주일 이내 퇴실.</li>
            <li><b>[파손과 배상]</b> 파손자가 배상. 파손자 불명 시 이용자 전원 1/N 부담.</li>
            <li><b>[관리와 보상]</b> 유지·관리는 모두의 의무. 청결 미달 시 경고 후 1/N 부담 청소업체 투입 가능. 안내 미준수로 인한 피해는 관리자 보상 의무 없음.</li>
            <li><b>[정리와 청결]</b> 공용공간 개인물건 배정구역 외 금지. 사용 후 즉시 원상복구 원칙. 매트리스 방수커버 필수, 오염 시 파손 간주 배상.</li>
            <li><b>[수납]</b> 수납공간 수용 가능한 양만 반입. 초과 짐으로 룸메이트 피해 금지. 초과 시 유료 짐보관 서비스 이용.</li>
            <li><b>[금전활동 금지]</b> 이용자 간 금전거래·물품판매·보험영업 일체 금지. 적발 시 즉시 강제퇴실, 1개월 내 퇴실. 내부 거래 피해는 제공자 무책임.</li>
            <li><b>[쉐어하우스의 개념]</b> 본 계약은 전·월세 개념이 아닌 방을 나눠 사용하는 형태로, 월세 세액공제 대상 아님.</li>
            <li><b>[운영진 권한]</b> 운영진은 출입 비밀번호를 공유받으며, 이용자는 출입을 통제할 수 없다. 출입 전 사전 고지 필수, 비상 상황에 한해 고지 없이 출입 가능.</li>
            <li><b>[협력]</b> 운영진 없는 단체 채팅방 개설, 분란 조장, 비하 언어 사용 금지. 불편 사항은 제공자와 직접 소통.</li>
            <li><b>[전입신고]</b> 쉐어하우스는 각각의 세대주를 나눌 수 없어 전입신고 불가하며, 이에 동의한다.</li>
          </ol>
          <p className="byeolji-oath">운영에 관하여 변동이 있을 시 제공자는 최소 4주 이전에 고지 의무를 가진다.</p>
          <div className="byeolji-sign-area">
            <div className="byeolji-sign-title">별지 특약 서명</div>
            <p className="byeolji-sign-desc">상기 별지 특약 사항을 모두 확인하였으며 이에 동의합니다.</p>
            <div className="byeolji-sign-row">
              <span>임차인: ________________________ (인)</span>
              <span>임대인: 유재훈 (인)</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        #contract-wrap { font-family:'Noto Sans KR','Malgun Gothic',sans-serif; color:#000; background:#fff; }
        .page { width:794px; min-height:1123px; margin:20px auto; padding:40px 50px; box-sizing:border-box; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.15); font-size:9.5pt; line-height:1.55; }
        .main-title { font-size:18pt; text-align:center; font-weight:700; margin:0 0 2px; letter-spacing:2px; }
        .sub-title { font-size:9pt; text-align:center; color:#555; margin:0 0 8px; }
        .intro { font-size:9pt; margin:0 0 8px; }
        .clause-intro { font-size:8.5pt; margin:2px 0 4px; }
        .section-title { font-size:10pt; font-weight:700; border-bottom:1px solid #333; padding-bottom:2px; margin:8px 0 4px; }
        .info-table { width:100%; border-collapse:collapse; margin:4px 0 6px; font-size:8.5pt; }
        .info-table td { border:0.5px solid #aaa; padding:3px 8px; }
        .info-table .lbl { background:#f5f5f5; font-weight:600; width:28%; }
        .clause { font-size:8.5pt; margin:2px 0; line-height:1.5; }
        .clause b { font-weight:700; }
        .terms { font-size:8pt; margin:2px 0 4px; padding-left:18px; }
        .terms li { margin:1.5px 0; line-height:1.5; }
        .date-right { text-align:right; font-size:8.5pt; margin:6px 0 4px; }
        .sign-area { display:flex; gap:10px; margin:4px 0; }
        .sign-box { flex:1; border:0.5px solid #aaa; padding:8px 12px; font-size:8.5pt; }
        .sign-title { font-weight:700; font-size:9pt; margin-bottom:4px; }
        .sign-line { margin:2px 0; }
        .sign-sig { text-align:right; margin-top:8px; }
        .account-box { border:0.5px solid #aaa; padding:5px 10px; margin-top:6px; font-size:8pt; line-height:1.7; }
        .byeolji-title { font-size:16pt; font-weight:700; text-align:center; margin:0 0 6px; }
        .byeolji-intro { font-size:8.5pt; text-align:center; line-height:1.7; margin:0 0 10px; color:#333; border-bottom:0.5px solid #ccc; padding-bottom:8px; }
        .byeolji-terms { font-size:8.5pt; margin:0 0 8px; padding-left:18px; }
        .byeolji-terms li { margin-bottom:5px; line-height:1.6; }
        .byeolji-terms b { font-weight:700; }
        .byeolji-oath { font-size:8.5pt; font-weight:700; margin:8px 0 10px; border-top:0.5px solid #ccc; padding-top:8px; }
        .byeolji-sign-area { border-top:0.5px solid #333; padding-top:8px; }
        .byeolji-sign-title { font-size:9.5pt; font-weight:700; margin-bottom:3px; }
        .byeolji-sign-desc { font-size:8.5pt; margin-bottom:6px; }
        .byeolji-sign-row { display:flex; justify-content:space-between; font-size:8.5pt; }
        @media print {
          @page { size:A4; margin:7mm 13mm; }
          .no-print { display:none!important; }
          nav,footer,header,button,[class*="nav"],[class*="tab"],[class*="bottom"],[class*="bar"] { display:none!important; }
          #contract-wrap { width:100%; }
          .page { width:100%; min-height:0; margin:0; padding:0; box-shadow:none; font-size:8.5pt; line-height:1.45; }
          .page1 { page-break-after:always; }
          .page2 { page-break-before:always; }
          .main-title { font-size:15pt; margin:0 0 2px; }
          .section-title { margin:5px 0 3px; font-size:9pt; }
          .clause { font-size:7.5pt; margin:1.5px 0; }
          .terms { font-size:7.5pt; }
          .terms li { margin:1px 0; }
          .info-table td { padding:2px 5px; font-size:7.5pt; }
          .sign-box { padding:5px 8px; font-size:7.5pt; }
          .account-box { font-size:7.5pt; padding:4px 8px; }
          .byeolji-title { font-size:14pt; }
          .byeolji-terms li { margin-bottom:4px; font-size:8pt; line-height:1.55; }
          .byeolji-intro { font-size:8pt; }
        }
      `}</style>
    </>
  )
}
