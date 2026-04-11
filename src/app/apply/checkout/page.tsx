'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BANKS = ['카카오뱅크','국민은행','신한은행','우리은행','하나은행','농협','기업은행','케이뱅크','토스뱅크','SC제일은행','대구은행','부산은행','경남은행','광주은행','전북은행','제주은행','수협','신협','우체국','새마을금고'];

const t = {
  ko: {
    title: '퇴실 신청',
    deadline: '신청 기한', deadlineVal: '퇴실 14일 전',
    checkoutTime: '퇴실 시간', checkoutTimeVal: '계약 종료일 오전 11시까지',
    checkoutFee: '퇴실비', deposit: '보증금 환급', depositVal: '점검 후 최대 7일 이내',
    step1Title: '쓰레기·짐·청소',
    step1_1: '개인 쓰레기는 종량제 봉투 직접 구매해 배출',
    step1_2: '대형 폐기물은 재활용센터 신고 후 신고번호 부착',
    step2Title: '사진 전송 (필수)',
    step2_warn: '미전송 시 확인 인력 투입 → 5만원 청구',
    step2_1: '필수: 책상·침대 매트리스·침대 밑·서랍장 안·바닥 (최소 5장)',
    step2_2: '화장실·부엌 수납장·냉장고·신발장·방키·에어컨 리모컨',
    step3Title: '집기 상태 확인',
    step3_1: '가구 이상 시 사진과 함께 전달',
    step3_2: '매트리스·벽지·장판 오염·파손 시 비용 청구 가능',
    step4Title: '하우스 단톡 퇴실',
    step4_1: '퇴실 즉시 단톡에서도 퇴실',
    step4_2: '미퇴실 시 강퇴 처리',
    warning: '보증금 환급 계좌는 입주자 본인 명의만 가능. 해외송금 시 수수료 발생 가능',
    thanks: '함께해주셔서 진심으로 감사해요 😄',
    name: '이름', namePh: '이름을 입력하세요', room: '호실',
    checkoutDate: '퇴실 희망일',
    reason: '퇴실 사유', reasonPh: '사유를 선택하세요',
    reason1: '계약만료', reason2: '개인사정', reason3: '직장/학교 이동', reason4: '기타',
    bankAccount: '보증금 환급 계좌',
    bank: '은행', bankPh: '은행 선택',
    accountNum: '계좌번호', accountNumPh: '계좌번호 입력 (숫자만)',
    holder: '예금주', holderPh: '예금주명 입력',
    memo: '전달사항 (선택)', memoPh: '전달하실 내용이 있다면 적어주세요',
    submit: '퇴실 신청하기',
    vName: '이름을 입력해주세요.', vDate: '퇴실 희망일을 선택해주세요.',
    vReason: '퇴실 사유를 선택해주세요.', vBank: '환급 계좌 정보를 모두 입력해주세요.',
    done: '신청이 완료되었어요!',
  },
  en: {
    title: 'Checkout Request',
    deadline: 'Deadline', deadlineVal: '14 days before checkout',
    checkoutTime: 'Checkout Time', checkoutTimeVal: 'By 11:00 AM on contract end date',
    checkoutFee: 'Checkout Fee', deposit: 'Deposit Refund', depositVal: 'Within 7 days after inspection',
    step1Title: 'Trash & Cleaning',
    step1_1: 'Purchase volume-rate bags for personal trash disposal',
    step1_2: 'Report large waste to recycling center, attach report number',
    step2Title: 'Photo Submission (Required)',
    step2_warn: 'If not submitted: inspection staff dispatched → 50,000 KRW charge',
    step2_1: 'Required: desk, mattress, under bed, drawer interior, floor (min. 5 photos)',
    step2_2: 'Bathroom, kitchen cabinet, fridge, shoe rack, room key, AC remote',
    step3Title: 'Furniture Condition',
    step3_1: 'Report any furniture damage with photos',
    step3_2: 'Mattress, wallpaper, flooring stain/damage may incur charges',
    step4Title: 'Leave Group Chat',
    step4_1: 'Leave the house group chat immediately upon checkout',
    step4_2: 'Forced removal if not done',
    warning: "Deposit refund account must be in tenant's own name. Overseas transfer may incur fees.",
    thanks: 'Thank you sincerely for staying with us 😄',
    name: 'Name', namePh: 'Enter your name', room: 'Room',
    checkoutDate: 'Preferred Checkout Date',
    reason: 'Reason for Leaving', reasonPh: 'Select reason',
    reason1: 'Contract expiry', reason2: 'Personal reasons', reason3: 'Job/School relocation', reason4: 'Other',
    bankAccount: 'Deposit Refund Account',
    bank: 'Bank', bankPh: 'Select bank',
    accountNum: 'Account Number', accountNumPh: 'Numbers only',
    holder: 'Account Holder', holderPh: 'Enter account holder name',
    memo: 'Additional Notes (Optional)', memoPh: "Anything you'd like to communicate?",
    submit: 'Submit Checkout Request',
    vName: 'Please enter your name.', vDate: 'Please select checkout date.',
    vReason: 'Please select a reason.', vBank: 'Please fill in all bank details.',
    done: 'Request submitted!',
  },
};

const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, background:'#fff', appearance:'none', WebkitAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23999'/></svg>\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' };
const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:6 };

const steps = [
  { num: 1, icon: '🗑️', titleKey: 'step1Title' as const, items: ['step1_1','step1_2'] as const },
  { num: 2, icon: '📷', titleKey: 'step2Title' as const, items: ['step2_1','step2_2'] as const, warnKey: 'step2_warn' as const },
  { num: 3, icon: '🧰', titleKey: 'step3Title' as const, items: ['step3_1','step3_2'] as const },
  { num: 4, icon: '💬', titleKey: 'step4Title' as const, items: ['step4_1','step4_2'] as const },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ko'|'en'>('ko');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const T = t[lang];

  const handleSubmit = () => {
    if (!name) { alert(T.vName); return; }
    if (!date) { alert(T.vDate); return; }
    if (!reason) { alert(T.vReason); return; }
    if (!bank || !account || !holder) { alert(T.vBank); return; }
    alert(T.done); router.push('/apply');
  };

  return (
    <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'#F7F8FA' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#fff', borderBottom:'1px solid #F0F0F0', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/apply')} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', padding:4, color:'#191919' }}>←</button>
          <span style={{ fontSize:16, fontWeight:700 }}>{T.title}</span>
        </div>
        <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} style={{ background:'#F0F0F0', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', color:'#555' }}>{lang === 'ko' ? 'EN' : 'KO'}</button>
      </div>

      <div style={{ padding:20 }}>
        {/* Info Card */}
        <div style={{ background:'#fff', borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:13, color:'#666' }}>{T.deadline}</span><span style={{ fontSize:13, fontWeight:700, color:'#E53E3E' }}>{T.deadlineVal}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:13, color:'#666' }}>{T.checkoutTime}</span><span style={{ fontSize:13, fontWeight:500 }}>{T.checkoutTimeVal}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:13, color:'#666' }}>{T.checkoutFee}</span><span style={{ fontSize:13, fontWeight:700, color:'#E53E3E' }}>30,000원</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:13, color:'#666' }}>{T.deposit}</span><span style={{ fontSize:13, fontWeight:500 }}>{T.depositVal}</span></div>
          </div>
        </div>

        {/* Step Cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
          {steps.map(s => (
            <div key={s.num} style={{ background:'#fff', borderRadius:14, padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ background:'#3182F6', color:'#fff', width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{s.num}</span>
                <span style={{ fontSize:14, fontWeight:600 }}>{s.icon} {T[s.titleKey]}</span>
              </div>
              {s.warnKey && (
                <div style={{ background:'#FFF5F5', borderRadius:8, padding:'8px 12px', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#E53E3E', fontWeight:600 }}>{T[s.warnKey]}</span>
                </div>
              )}
              <ul style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:4 }}>
                {s.items.map(k => <li key={k} style={{ fontSize:12, color:'#555', lineHeight:1.5 }}>{T[k]}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ background:'#FFF5F5', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
          <p style={{ fontSize:12, color:'#E53E3E', margin:0, lineHeight:1.5 }}>⚠️ {T.warning}</p>
        </div>
        <div style={{ background:'#F0FFF4', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <p style={{ fontSize:12, color:'#276749', margin:0, lineHeight:1.5 }}>{T.thanks}</p>
        </div>

        {/* Form */}
        <div style={{ background:'#fff', borderRadius:14, padding:20 }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.name}</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder={T.namePh} style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.room}</label>
            <input type="text" readOnly style={{ ...inputStyle, background:'#F7F8FA', color:'#666' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.checkoutDate}</label>
            <input value={date} onChange={e => setDate(e.target.value)} type="date" style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.reason}</label>
            <select value={reason} onChange={e => setReason(e.target.value)} style={selectStyle}>
              <option value="">{T.reasonPh}</option>
              <option value="contract">{T.reason1}</option>
              <option value="personal">{T.reason2}</option>
              <option value="relocation">{T.reason3}</option>
              <option value="other">{T.reason4}</option>
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ ...labelStyle, marginBottom:10 }}>{T.bankAccount}</label>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <select value={bank} onChange={e => setBank(e.target.value)} style={selectStyle}>
                <option value="">{T.bankPh}</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <input value={account} onChange={e => setAccount(e.target.value)} type="text" placeholder={T.accountNumPh} style={inputStyle} />
              <input value={holder} onChange={e => setHolder(e.target.value)} type="text" placeholder={T.holderPh} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>{T.memo}</label>
            <textarea placeholder={T.memoPh} rows={3} style={{ ...inputStyle, resize:'none' }} />
          </div>
          <button onClick={handleSubmit} style={{ width:'100%', padding:14, border:'none', borderRadius:12, background:'#191919', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{T.submit}</button>
        </div>
      </div>
    </div>
  );
}
