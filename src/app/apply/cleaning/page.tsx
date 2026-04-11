'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const t = {
  ko: {
    title: '방청소 신청', pricing: '청소 비용',
    single: '1인실', double1: '2인실 (1명)', double2: '2인실 (2명)',
    cancel: '취소', cancelDesc: '청소 하루 전까지 가능',
    account: '입금 계좌', depositor: '입금자명',
    depositorEx: '홍길동(방청소) 형식',
    schedule: '청소 일정', scheduleDesc: '아주머니 방문일에 진행',
    warning: '귀중품(현금·카드·전자기기)은 반드시 미리 보관. 분실 시 책임 없음. 쓰레기는 모아만 드림',
    name: '이름', namePh: '이름을 입력하세요', room: '호실',
    request: '요청사항 (선택)', requestPh: '특별히 요청할 사항이 있다면 적어주세요',
    submit: '신청하기', copied: '복사됨!',
    validName: '이름을 입력해주세요.', done: '신청이 완료되었어요!',
  },
  en: {
    title: 'Room Cleaning Request', pricing: 'Cleaning Fee',
    single: 'Single Room', double1: 'Double (1 person)', double2: 'Double (2 persons)',
    cancel: 'Cancellation', cancelDesc: 'Available until 1 day before',
    account: 'Bank Account', depositor: 'Depositor Name',
    depositorEx: 'Format: Name(RoomCleaning)',
    schedule: 'Schedule', scheduleDesc: 'Done on cleaning lady visit day',
    warning: 'Store valuables (cash, cards, electronics) in advance. Not responsible for lost items. Trash will only be collected.',
    name: 'Name', namePh: 'Enter your name', room: 'Room',
    request: 'Request (Optional)', requestPh: 'Any special requests?',
    submit: 'Submit', copied: 'Copied!',
    validName: 'Please enter your name.', done: 'Request submitted!',
  },
};

const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' };
const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:6 };

export default function CleaningPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ko'|'en'>('ko');
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const T = t[lang];

  const copyAccount = () => {
    navigator.clipboard.writeText('100166670094');
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = () => {
    if (!name) { alert(T.validName); return; }
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
          <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:12 }}>{T.pricing}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {[{l: T.single, p:'20,000원'}, {l: T.double1, p:'15,000원'}, {l: T.double2, p:'30,000원'}].map(r => (
              <div key={r.l} style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'#666' }}>{r.l}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#00B493' }}>{r.p}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid #F0F0F0', paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'#666' }}>{T.cancel}</span>
              <span style={{ fontSize:13, color:'#333' }}>{T.cancelDesc}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#666' }}>{T.account}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6, position:'relative' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>K BANK 유재훈 100-166-670094</span>
                <button onClick={copyAccount} style={{ background:'#F5F5F5', border:'none', borderRadius:6, width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>📋</button>
                {copied && <span style={{ position:'absolute', right:0, top:-24, background:'#333', color:'#fff', padding:'3px 8px', borderRadius:6, fontSize:11, whiteSpace:'nowrap' }}>{T.copied}</span>}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'#666' }}>{T.depositor}</span>
              <span style={{ fontSize:13, fontWeight:500, color:'#E67E22' }}>{T.depositorEx}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'#666' }}>{T.schedule}</span>
              <span style={{ fontSize:13, color:'#333' }}>{T.scheduleDesc}</span>
            </div>
          </div>
        </div>

        <div style={{ background:'#FFF5F5', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <p style={{ fontSize:12, color:'#E53E3E', margin:0, lineHeight:1.5 }}>⚠️ {T.warning}</p>
        </div>

        <div style={{ background:'#fff', borderRadius:14, padding:20 }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.name}</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder={T.namePh} style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.room}</label>
            <input type="text" readOnly style={{ ...inputStyle, background:'#F7F8FA', color:'#666' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>{T.request}</label>
            <textarea placeholder={T.requestPh} rows={3} style={{ ...inputStyle, resize:'none' }} />
          </div>
          <button onClick={handleSubmit} style={{ width:'100%', padding:14, border:'none', borderRadius:12, background:'#00B493', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{T.submit}</button>
        </div>
      </div>
    </div>
  );
}
