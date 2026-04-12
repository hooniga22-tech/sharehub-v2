'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Copy, MessageCircle } from 'lucide-react';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452';
const fmt = (n: number) => n.toLocaleString() + '원';

const SUPPLIES_KO = ['화장지', '주방세제', '샴푸', '린스', '바디워시', '수세미', '세탁세제', '기타'];
const SUPPLIES_EN = ['Toilet Paper', 'Dish Soap', 'Shampoo', 'Conditioner', 'Body Wash', 'Sponge', 'Laundry Det.', 'Other'];
const CATS_KO = ['수리', '청소', '기타'];
const CATS_EN = ['Repair', 'Cleaning', 'Other'];

export default function TenantPortalPage() {
  const { token } = useParams<{ token: string }>();

  const [tenant, setTenant] = useState<any>(null);
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [toast, setToast] = useState('');

  // Supplies
  const [selSupplies, setSelSupplies] = useState<string[]>([]);
  const [supplyNote, setSupplyNote] = useState('');

  // Issue
  const [issueCat, setIssueCat] = useState('수리');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  const t = (ko: string, en: string) => lang === 'ko' ? ko : en;
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const copyText = (text: string) => { navigator.clipboard?.writeText(text); showToast(t('복사됐어요!', 'Copied!')); };

  useEffect(() => {
    import('@/lib/channeltalk').then(({ loadChannelTalk, bootChannelTalk }) => {
      loadChannelTalk();

      fetch(`/api/tenants?token=${token}`)
        .then(r => r.json())
        .then(async (data) => {
          if (data.error) { setLoading(false); return; }
          setTenant(data);

          // Load house info
          try {
            const houses = await fetch('/api/houses').then(r => r.json());
            const found = Array.isArray(houses) ? houses.find((h: any) => h['지점명'] === data['지점명']) : null;
            if (found) setHouse(found);
          } catch { /* ignore */ }

          bootChannelTalk({
            memberId: token,
            name: data['이름'],
            mobileNumber: data['연락처'],
            tags: ['입주자', data['지점명'], data['구'] || ''].filter(Boolean),
            customAttributes: {
              house: data['지점명'] || '', room: data['방코드'] || '',
              contractEnd: data['퇴실일'] || '', status: data['상태'] || '',
            },
          });

          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [token]);

  const calcDday = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  };

  const toggleSupply = (item: string) => {
    setSelSupplies(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const submitSupply = async () => {
    if (!selSupplies.length || !tenant) return;
    await fetch('/api/tenants/portal/supply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, tenantName: tenant['이름'], house: tenant['지점명'], room: tenant['방코드'], items: selSupplies, note: supplyNote }),
    });
    setSelSupplies([]); setSupplyNote('');
    showToast(t('신청됐어요!', 'Request submitted!'));
  };

  const submitIssue = async () => {
    if (!issueTitle.trim() || !tenant) return;
    setIssueLoading(true);
    await fetch('/api/issues', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 지점명: tenant['지점명'], 방코드: tenant['방코드'], 제목: issueTitle, 내용: issueDesc, 카테고리: issueCat, 상태: '접수', 등록일: new Date().toISOString().split('T')[0] }),
    });
    setIssueTitle(''); setIssueDesc(''); setIssueLoading(false);
    showToast(t('접수됐어요! 매니저가 확인 후 연락드릴게요.', 'Submitted! Manager will contact you.'));
  };

  const handleContact = async () => {
    const { openChannelTalk } = await import('@/lib/channeltalk');
    openChannelTalk();
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: GRAY, fontSize: 13 }}>{t('불러오는 중...', 'Loading...')}</p></div>;

  if (!tenant) return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <p style={{ fontSize: 40 }}>🔒</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{t('유효하지 않은 링크예요', 'Invalid link')}</p>
      <p style={{ fontSize: 13, color: GRAY }}>{t('매니저에게 문의해 주세요.', 'Please contact your manager.')}</p>
    </div>
  );

  const name = tenant['이름'] || '';
  const houseName = tenant['지점명'] || '';
  const room = tenant['방코드'] || '';
  const rent = Number(tenant['월세']) || 0;
  const mgmt = Number(tenant['관리비']) || 0;
  const deposit = Number(tenant['보증금']) || 0;
  const dday = calcDday(tenant['퇴실일']);
  const supplyItems = lang === 'ko' ? SUPPLIES_KO : SUPPLIES_EN;
  const catItems = lang === 'ko' ? CATS_KO : CATS_EN;

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 20px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#191f28' }}>{t(`안녕하세요, ${name}님 👋`, `Hello, ${name} 👋`)}</div>
            <div style={{ fontSize: 13, color: GRAY, marginTop: 4 }}>{houseName} · {room}</div>
          </div>
          <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            style={{ background: '#F2F4F6', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
            {lang === 'ko' ? 'EN' : '한'}
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* D-day Card */}
        <div style={{ background: BLUE, borderRadius: 14, padding: 20, marginBottom: 12, color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{t('계약 잔여일', 'Days Remaining')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>D-{Math.max(0, dday)}</div>
            <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.8, lineHeight: 1.6 }}>
              {tenant['입주일']} ~<br />{tenant['퇴실일']}
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            {t('월세', 'Rent')} {fmt(rent)} / {t('관리비', 'Mgmt')} {fmt(mgmt)}
          </div>
        </div>

        {/* Contract Info */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f2f4f6' }}>
            <span style={{ fontSize: 13, color: GRAY }}>{t('월 납부액', 'Monthly')}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>{fmt(rent + mgmt)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: GRAY }}>{t('보증금', 'Deposit')}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(deposit)}</span>
          </div>
        </div>

        {/* House Info */}
        {house && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t('하우스 정보', 'House Info')}</div>
            {[
              { l: t('현관 비번', 'Door Code'), v: house['현관비번'], copy: true },
              { l: t('와이파이', 'WiFi'), v: house['와이파이SSID'] },
              { l: t('비밀번호', 'Password'), v: house['와이파이PW'], copy: true },
              { l: t('주소', 'Address'), v: house['주소'] },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f2f4f6' }}>
                <span style={{ fontSize: 12, color: GRAY }}>{row.l}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#191f28', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.v || '-'}</span>
                  {row.copy && row.v && (
                    <button onClick={() => copyText(row.v)} style={{ background: '#f2f4f6', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Copy size={12} color={GRAY} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Notice */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💰 {t('납부 안내', 'Payment Info')}</div>
          {[
            t('월세/관리비는 매월 1일까지 납부해 주세요.', 'Rent/management fee due by the 1st.'),
            t('공과금은 별도 청구됩니다.', 'Utility bills are charged separately.'),
            t('납부 계좌는 계약서를 확인해 주세요.', 'Check your contract for bank details.'),
          ].map((text, i) => (
            <p key={i} style={{ fontSize: 12, color: '#555', margin: '4px 0', lineHeight: 1.5 }}>• {text}</p>
          ))}
        </div>

        {/* Duty Notice */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🧹 {t('청소 당번 안내', 'Cleaning Duty')}</div>
          {[
            t('매주 지정된 당번이 공용구역을 청소합니다.', 'A designated person cleans shared areas weekly.'),
            t('당번표는 단체 카톡방을 확인해 주세요.', 'Check the group chat for the schedule.'),
            t('사진 미업로드 시 벌금 30,000원이 부과됩니다.', '30,000 KRW fine if photo not uploaded.'),
            t('당번 교환은 당사자끼리 조율 후 매니저에게 알려주세요.', 'Swap with housemates, then notify manager.'),
          ].map((text, i) => (
            <p key={i} style={{ fontSize: 12, color: '#555', margin: '4px 0', lineHeight: 1.5 }}>• {text}</p>
          ))}
        </div>

        {/* Supplies Request */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📦 {t('비품 신청', 'Supply Request')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {supplyItems.map((item, i) => {
              const selected = selSupplies.includes(SUPPLIES_KO[i]);
              return (
                <button key={item} onClick={() => toggleSupply(SUPPLIES_KO[i])}
                  style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${selected ? BLUE : '#E8E8E8'}`, background: selected ? '#EBF4FF' : '#fff', color: selected ? BLUE : '#555', fontSize: 12, fontWeight: selected ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {item}
                </button>
              );
            })}
          </div>
          <button onClick={submitSupply} disabled={!selSupplies.length}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: selSupplies.length ? BLUE : '#E8E8E8', color: selSupplies.length ? '#fff' : '#999', fontSize: 13, fontWeight: 600, cursor: selSupplies.length ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {t('신청하기', 'Submit')}
          </button>
        </div>

        {/* Issue Report */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔧 {t('불편사항 신청', 'Report Issue')}</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {catItems.map((c, i) => (
              <button key={c} onClick={() => setIssueCat(CATS_KO[i])}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${issueCat === CATS_KO[i] ? BLUE : '#E8E8E8'}`, background: issueCat === CATS_KO[i] ? '#EBF4FF' : '#fff', color: issueCat === CATS_KO[i] ? BLUE : '#555', fontSize: 12, fontWeight: issueCat === CATS_KO[i] ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                {c}
              </button>
            ))}
          </div>
          <input value={issueTitle} onChange={e => setIssueTitle(e.target.value)} placeholder={t('제목 (예: 화장실 변기 막힘)', 'Title (e.g., Toilet clogged)')} style={{ ...inputStyle, marginBottom: 8 }} />
          <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder={t('내용 (선택)', 'Details (optional)')} rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 10 }} />
          <button onClick={submitIssue} disabled={!issueTitle.trim() || issueLoading}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: issueTitle.trim() ? BLUE : '#E8E8E8', color: issueTitle.trim() ? '#fff' : '#999', fontSize: 13, fontWeight: 600, cursor: issueTitle.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {issueLoading ? t('접수 중...', 'Submitting...') : t('접수하기', 'Submit')}
          </button>
        </div>

        {/* Contact Manager */}
        <button onClick={handleContact}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#191f28', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          <MessageCircle size={16} /> {t('매니저에게 문의하기', 'Contact Manager')}
        </button>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
