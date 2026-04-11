'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BANKS = ['카카오뱅크','국민은행','신한은행','우리은행','하나은행','농협','기업은행','케이뱅크','토스뱅크','SC제일은행','대구은행','부산은행','경남은행','광주은행','전북은행','제주은행','수협','신협','우체국','새마을금고'];

const t = {
  ko: {
    title: '물품 신청',
    available: '제공 가능', unavailable: '제공 불가',
    items_yes: ['휴지','주방세제','세탁세제','쓰레기봉투','재활용봉투','청소용품','물걸레 밀대'],
    items_no: ['싱크대 배수구','1회용 거름망','핸드워시','물티슈','섬유유연제','키친타올'],
    warning: '운영진 사전 협의 없이 직접 구매 후 청구한 건은 페이백 어려움. 신청 전 집에 재고 없는지 확인',
    name: '이름', namePh: '이름을 입력하세요', room: '호실',
    supplies: '필요한 물품', suppliesPh: '예: 휴지 2개, 주방세제 1개',
    trashBag: '쓰레기봉투 구매',
    refundInfo: '종량제 봉투 구매 시 영수증 사진과 함께 전달해 주시면, 확인 후 입금해 드립니다.',
    bank: '은행', bankPh: '은행 선택',
    accountNum: '계좌번호', accountNumPh: '계좌번호 입력 (숫자만)',
    holder: '예금주', holderPh: '예금주명 입력',
    otherRequest: '기타 요청 (선택)', otherRequestPh: '추가 요청사항이 있다면 적어주세요',
    submit: '신청하기',
    vName: '이름을 입력해주세요.', vSupplies: '필요한 물품을 입력해주세요.',
    vBank: '환급 계좌 정보를 모두 입력해주세요.', done: '신청이 완료되었어요!',
  },
  en: {
    title: 'Supplies Request',
    available: 'Available', unavailable: 'Not Available',
    items_yes: ['Toilet paper','Dish soap','Laundry detergent','Trash bags','Recycling bags','Cleaning supplies','Mop'],
    items_no: ['Sink strainer','Disposable filter','Hand wash','Wet wipes','Fabric softener','Kitchen towel'],
    warning: 'Items purchased without prior approval cannot be reimbursed. Check house inventory before requesting.',
    name: 'Name', namePh: 'Enter your name', room: 'Room',
    supplies: 'Items Needed', suppliesPh: 'e.g., Toilet paper x2, Dish soap x1',
    trashBag: 'Trash Bag Purchase',
    refundInfo: 'Submit receipt photo with your request. Refund will be processed after verification.',
    bank: 'Bank', bankPh: 'Select bank',
    accountNum: 'Account Number', accountNumPh: 'Numbers only',
    holder: 'Account Holder', holderPh: 'Enter account holder name',
    otherRequest: 'Other Request (Optional)', otherRequestPh: 'Any additional requests?',
    submit: 'Submit',
    vName: 'Please enter your name.', vSupplies: 'Please enter items needed.',
    vBank: 'Please fill in all bank details.', done: 'Request submitted!',
  },
};

const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, background:'#fff', appearance:'none', WebkitAppearance:'none', backgroundImage:"url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23999'/></svg>\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' };
const labelStyle: React.CSSProperties = { fontSize:13, fontWeight:600, color:'#333', display:'block', marginBottom:6 };

export default function SuppliesPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ko'|'en'>('ko');
  const [name, setName] = useState('');
  const [supplies, setSupplies] = useState('');
  const [showTrashBag, setShowTrashBag] = useState(false);
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const T = t[lang];

  const handleSubmit = () => {
    if (!name) { alert(T.vName); return; }
    if (!supplies) { alert(T.vSupplies); return; }
    if (showTrashBag && (!bank || !account || !holder)) { alert(T.vBank); return; }
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
          <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:10 }}>{T.available}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {T.items_yes.map(item => <span key={item} style={{ background:'#F0F0F0', padding:'5px 12px', borderRadius:16, fontSize:12, color:'#333' }}>{item}</span>)}
          </div>
          <div style={{ borderTop:'1px solid #F0F0F0', marginBottom:16 }} />
          <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:10 }}>{T.unavailable}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {T.items_no.map(item => <span key={item} style={{ background:'#FFF5F5', padding:'5px 12px', borderRadius:16, fontSize:12, color:'#E53E3E' }}>{item}</span>)}
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
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>{T.supplies}</label>
            <textarea value={supplies} onChange={e => setSupplies(e.target.value)} placeholder={T.suppliesPh} rows={3} style={{ ...inputStyle, resize:'none' }} />
          </div>

          {/* Trash Bag Toggle */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showTrashBag ? 12 : 0 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#333' }}>{T.trashBag}</span>
              <button onClick={() => setShowTrashBag(!showTrashBag)}
                style={{ position:'relative', width:48, height:26, borderRadius:13, border:'none', background: showTrashBag ? '#00B493' : '#DDD', cursor:'pointer', padding:0 }}>
                <span style={{ position:'absolute', top:3, ...(showTrashBag ? { right:3 } : { left:3 }), width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'all .3s' }} />
              </button>
            </div>
            {showTrashBag && (
              <>
                <div style={{ background:'#FFFBEB', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
                  <p style={{ fontSize:12, color:'#92400E', margin:0, lineHeight:1.5 }}>{T.refundInfo}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <select value={bank} onChange={e => setBank(e.target.value)} style={selectStyle}>
                    <option value="">{T.bankPh}</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input value={account} onChange={e => setAccount(e.target.value)} type="text" placeholder={T.accountNumPh} style={inputStyle} />
                  <input value={holder} onChange={e => setHolder(e.target.value)} type="text" placeholder={T.holderPh} style={inputStyle} />
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>{T.otherRequest}</label>
            <textarea placeholder={T.otherRequestPh} rows={3} style={{ ...inputStyle, resize:'none' }} />
          </div>
          <button onClick={handleSubmit} style={{ width:'100%', padding:14, border:'none', borderRadius:12, background:'#00B493', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{T.submit}</button>
        </div>
      </div>
    </div>
  );
}
