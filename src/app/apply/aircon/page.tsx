'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const t = {
  ko: {
    title: '에어컨 청소 신청', pricing: '청소 비용',
    single: '1인실', double1: '2인실 (1명)', double2: '2인실 (2명/인)',
    normalPrice: '일반 가격: 80,000~100,000원',
    account: '입금 계좌', depositor: '입금자명',
    depositorEx: '홍길동(에어컨청소) 형식',
    schedule: '청소 일정', scheduleDesc: '기사님 스케줄에 맞춰 진행',
    info: '에어컨 없는 방은 신청 불필요. 관리비에 미포함',
    name: '이름', namePh: '이름을 입력하세요', room: '호실',
    roomType: '방 유형', roomTypePh: '방 유형을 선택하세요',
    opt1: '1인실', opt2: '2인실 (1명 사용)', opt3: '2인실 (2명 사용)',
    request: '요청사항 (선택)', requestPh: '특별히 요청할 사항이 있다면 적어주세요',
    submit: '신청하기', copied: '복사됨!',
    validName: '이름을 입력해주세요.', validType: '방 유형을 선택해주세요.',
    done: '신청이 완료되었어요!',
  },
  en: {
    title: 'AC Cleaning Request', pricing: 'Cleaning Fee',
    single: 'Single Room', double1: 'Double (1 person)', double2: 'Double (2 persons/each)',
    normalPrice: 'Normal price: 80,000~100,000 KRW',
    account: 'Bank Account', depositor: 'Depositor Name',
    depositorEx: 'Format: Name(ACCleaning)',
    schedule: 'Schedule', scheduleDesc: 'Based on technician availability',
    info: 'No need to apply if room has no AC. Not included in maintenance fee.',
    name: 'Name', namePh: 'Enter your name', room: 'Room',
    roomType: 'Room Type', roomTypePh: 'Select room type',
    opt1: 'Single Room', opt2: 'Double (1 person)', opt3: 'Double (2 persons)',
    request: 'Request (Optional)', requestPh: 'Any special requests?',
    submit: 'Submit', copied: 'Copied!',
    validName: 'Please enter your name.', validType: 'Please select room type.',
    done: 'Request submitted!',
  },
};

const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, background:'#fff', appearance:'none', WebkitAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23999'/></svg>\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' };
const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:6 };

export default function AirconPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ko'|'en'>('ko');
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('');
  const T = t[lang];

  const copyAccount = () => {
    navigator.clipboard.writeText('100166670094');
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = () => {
    if (!name) { alert(T.validName); return; }
    if (!roomType) { alert(T.validType); return; }
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
        <div style={{ background:'#fff', borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:12 }}>{T.pricing}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
            {[{l:T.single,p:'40,000원'},{l:T.double1,p:'30,000원'},{l:T.double2,p:'20,000원'}].map(r => (
              <div key={r.l} style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'#666' }}>{r.l}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#3182F6' }}>{r.p}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:'#999', marginBottom:16 }}>{T.normalPrice}</div>
          <div style={{ borderTop:'1px solid #F0F0F0', paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#666' }}>{T.account}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6, position:'relative' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>케이뱅크 유재훈 100-166-670094</span>
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

        <div style={{ background:'#EBF8FF', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <p style={{ fontSize:12, color:'#2B6CB0', margin:0, lineHeight:1.5 }}>ℹ️ {T.info}</p>
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
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.roomType}</label>
            <select value={roomType} onChange={e => setRoomType(e.target.value)} style={selectStyle}>
              <option value="">{T.roomTypePh}</option>
              <option value="single">{T.opt1}</option>
              <option value="double1">{T.opt2}</option>
              <option value="double2">{T.opt3}</option>
            </select>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>{T.request}</label>
            <textarea placeholder={T.requestPh} rows={3} style={{ ...inputStyle, resize:'none' }} />
          </div>
          <button onClick={handleSubmit} style={{ width:'100%', padding:14, border:'none', borderRadius:12, background:'#3182F6', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{T.submit}</button>
        </div>
      </div>
    </div>
  );
}
