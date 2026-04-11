'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const BRANCHES: Record<string, string[]> = {
  '마포구': ['연남점','합정점','망원점','상수점'],
  '서대문구': ['신촌점','연희점','홍제점'],
  '은평구': ['응암점','불광점'],
  '동대문구': ['회기점','청량리점','이문점'],
  '성북구': ['안암점','성신여대점','길음점'],
};

const t = {
  ko: {
    title: '투어 신청', tourFee: '투어비', account: '입금 계좌',
    discount: '계약 시 첫달 할인', under6: '6개월 미만', over6: '6개월 이상',
    noRefund: '환불 불가',
    warning: '2시간 전 미연락 시 자동 취소. 당일 취소·투어비 모두 환불 불가',
    name: '이름', namePh: '이름을 입력하세요',
    phone: '연락처', phonePh: '010-0000-0000',
    district: '구', districtPh: '구를 선택하세요',
    branch: '지점', branchPh: '지점을 선택하세요',
    date: '희망 날짜', otherDate: '다른 날짜',
    time: '희망 시간',
    memo: '문의사항 (선택)', memoPh: '궁금한 점이 있다면 적어주세요',
    submit: '투어 신청하기', copied: '복사됨!',
    validName: '이름과 연락처를 입력해주세요.',
    validDate: '희망 날짜를 선택해주세요.',
    validTime: '희망 시간을 선택해주세요.',
    done: '신청이 완료되었어요!',
  },
  en: {
    title: 'Tour Request', tourFee: 'Tour Fee', account: 'Bank Account',
    discount: 'First Month Discount', under6: 'Under 6 months', over6: '6 months or more',
    noRefund: 'No Refund',
    warning: 'Auto-cancelled if no contact 2hrs before. No refund for same-day cancellation or tour fee.',
    name: 'Name', namePh: 'Enter your name',
    phone: 'Phone', phonePh: '010-0000-0000',
    district: 'District', districtPh: 'Select district',
    branch: 'Branch', branchPh: 'Select branch',
    date: 'Preferred Date', otherDate: 'Other date',
    time: 'Preferred Time',
    memo: 'Inquiry (Optional)', memoPh: 'Any questions?',
    submit: 'Submit Tour Request', copied: 'Copied!',
    validName: 'Please enter name and phone.',
    validDate: 'Please select a date.',
    validTime: 'Please select a time.',
    done: 'Request submitted!',
  },
};

const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, background:'#fff', appearance:'none', WebkitAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23999'/></svg>\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' };
const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:6 };

function getTimeSlots() {
  const slots: string[] = [];
  for (let h = 10; h <= 19; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`);
    if (h < 19) slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
}

export default function TourPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ko'|'en'>('ko');
  const [district, setDistrict] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const T = t[lang];
  const times = getTimeSlots();
  const branches = district ? BRANCHES[district] || [] : [];

  const dates = useMemo(() => {
    const days = ['일','월','화','수','목','금','토'];
    const daysEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const arr: { value: string; label: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const mm = d.getMonth() + 1; const dd = d.getDate();
      const dayLabel = lang === 'ko' ? days[d.getDay()] : daysEn[d.getDay()];
      arr.push({
        value: `${d.getFullYear()}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`,
        label: `${mm}/${dd}(${dayLabel})`,
      });
    }
    return arr;
  }, [lang]);

  const copyAccount = () => {
    navigator.clipboard.writeText('3333010839846');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = () => {
    if (!name || !phone) { alert(T.validName); return; }
    if (!selectedDate) { alert(T.validDate); return; }
    if (!selectedTime) { alert(T.validTime); return; }
    alert(T.done);
    router.push('/apply');
  };

  return (
    <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'#F7F8FA' }}>
      {/* Header */}
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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:13, color:'#666' }}>{T.tourFee}</span>
            <span style={{ fontSize:15, fontWeight:700, color:'#3182F6' }}>10,000원</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:13, color:'#666' }}>{T.account}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6, position:'relative' }}>
              <span style={{ fontSize:13, fontWeight:500 }}>카카오뱅크 유재훈 3333-01-0839-846</span>
              <button onClick={copyAccount} style={{ background:'#F5F5F5', border:'none', borderRadius:6, width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>📋</button>
              {copied && <span style={{ position:'absolute', right:0, top:-24, background:'#333', color:'#fff', padding:'3px 8px', borderRadius:6, fontSize:11, whiteSpace:'nowrap' }}>{T.copied}</span>}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <span style={{ fontSize:13, color:'#666' }}>{T.discount}</span>
            <div style={{ marginTop:6, display:'flex', gap:12 }}>
              <span style={{ fontSize:13 }}><span style={{ color:'#3182F6', fontWeight:600 }}>{T.under6}</span> 2만원</span>
              <span style={{ fontSize:13 }}><span style={{ color:'#3182F6', fontWeight:600 }}>{T.over6}</span> 3만원</span>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'#666' }}>{T.noRefund}</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#E53E3E' }}>{T.noRefund}</span>
          </div>
        </div>

        {/* Warning */}
        <div style={{ background:'#FFF5F5', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <p style={{ fontSize:12, color:'#E53E3E', margin:0, lineHeight:1.5 }}>⚠️ {T.warning}</p>
        </div>

        {/* Form */}
        <div style={{ background:'#fff', borderRadius:14, padding:20 }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.name}</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder={T.namePh} style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.phone}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder={T.phonePh} style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.district}</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={selectStyle}>
              <option value="">{T.districtPh}</option>
              {Object.keys(BRANCHES).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.branch}</label>
            <select style={selectStyle}>
              <option value="">{T.branchPh}</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Date Pills */}
          <div style={{ marginBottom:16 }}>
            <label style={{ ...labelStyle, marginBottom:8 }}>{T.date}</label>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch' }}>
              {dates.map(d => (
                <button key={d.value} onClick={() => { setSelectedDate(d.value); setShowDateInput(false); }}
                  style={{ flexShrink:0, padding:'8px 14px', borderRadius:20, border:`1px solid ${selectedDate === d.value ? '#3182F6' : '#E8E8E8'}`, background: selectedDate === d.value ? '#EBF4FF' : '#fff', color: selectedDate === d.value ? '#3182F6' : '#555', fontSize:13, fontWeight: selectedDate === d.value ? 600 : 400, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  {d.label}
                </button>
              ))}
              <button onClick={() => { setShowDateInput(!showDateInput); setSelectedDate(''); }}
                style={{ flexShrink:0, padding:'8px 14px', borderRadius:20, border:`1px solid ${showDateInput ? '#3182F6' : '#E8E8E8'}`, background: showDateInput ? '#EBF4FF' : '#fff', color: showDateInput ? '#3182F6' : '#555', fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                {T.otherDate}
              </button>
            </div>
            {showDateInput && (
              <input type="date" onChange={e => { setSelectedDate(e.target.value); setShowDateInput(false); }} style={{ ...inputStyle, marginTop:8 }} />
            )}
          </div>

          {/* Time Grid */}
          <div style={{ marginBottom:16 }}>
            <label style={{ ...labelStyle, marginBottom:8 }}>{T.time}</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
              {times.map(tm => (
                <button key={tm} onClick={() => setSelectedTime(tm)}
                  style={{ padding:'10px 4px', borderRadius:10, border:`1px solid ${selectedTime === tm ? '#3182F6' : '#E8E8E8'}`, background: selectedTime === tm ? '#EBF4FF' : '#fff', color: selectedTime === tm ? '#3182F6' : '#555', fontSize:13, fontWeight: selectedTime === tm ? 600 : 400, cursor:'pointer', fontFamily:'inherit' }}>
                  {tm}
                </button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>{T.memo}</label>
            <textarea placeholder={T.memoPh} rows={3} style={{ ...inputStyle, resize:'none' }} />
          </div>

          <button onClick={handleSubmit} style={{ width:'100%', padding:14, border:'none', borderRadius:12, background:'#3182F6', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{T.submit}</button>
        </div>
      </div>
    </div>
  );
}
