'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useParams } from 'next/navigation';
import { getDaysInMonth } from '@/lib/prorata';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#f59f00';
const fmt = (n: number) => n.toLocaleString() + '원';

const SUPPLIES = ['화장지', '주방세제', '세탁세제', '수세미', '고무장갑', '기타'];

const Toast = ({ msg }: { msg: string }) => (
  <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{msg}</div>
);

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f2f4f6', overflow: 'hidden', ...style }}>{children}</div>
);

const CardTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f2f4f6' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
    <path d="M9 18L15 12L9 6" stroke="#c4c9d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke={GRAY} strokeWidth="1.8" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={GRAY} strokeWidth="1.8" />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
    <polyline points="15 3 21 3 21 9" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="10" y1="14" x2="21" y2="3" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const BottomSheet = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} onClick={onClose}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ width: 36, height: 4, background: '#e5e8eb', borderRadius: 2, margin: '0 auto 20px' }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: '#191f28', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  </div>
);

export default function TenantPortalPage() {
  const { token } = useParams<{ token: string }>();

  const { data: tenantData, isLoading: tenantLoading } = useSWR(
    token ? `/api/tenants?token=${token}` : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const tenant = tenantData?.error ? null : tenantData;
  const { data: housesData } = useSWR(
    tenant ? '/api/houses' : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const house = Array.isArray(housesData) ? housesData.find((h: any) => h['지점명'] === tenant?.['지점명']) : null;
  const { data: rawPayments } = useSWR(
    tenant?.['입주자ID'] ? `/api/payments?tenantId=${tenant['입주자ID']}` : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true }
  );
  const paymentHistory = useMemo(() => {
    const list = Array.isArray(rawPayments) ? rawPayments : [];
    return [...list].sort((a: any, b: any) => (b.연월 || '').localeCompare(a.연월 || '')).slice(0, 6);
  }, [rawPayments]);
  const loading = tenantLoading;

  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [toast, setToast] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [dutyOpen, setDutyOpen] = useState(true);
  const [issueSheet, setIssueSheet] = useState<string | null>(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [selSupplies, setSelSupplies] = useState<string[]>([]);
  const [etcText, setEtcText] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const ko = lang === 'ko';
  const t = (k: string, e: string) => ko ? k : e;
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const copyText = (text: string) => { navigator.clipboard?.writeText(text); showToast(t('복사됐어요!', 'Copied!')); };

  const submitSupply = async () => {
    if (!selSupplies.length || !tenant) return;
    const items = selSupplies.map(s => s === '기타' ? `기타: ${etcText}` : s);
    await fetch('/api/tenants/portal/supply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, tenantName: tenant['이름'], house: tenant['지점명'], room: tenant['방코드'], items, note: etcText }),
    });
    setSelSupplies([]); setEtcText('');
    showToast(t('신청됐어요!', 'Submitted!'));
  };

  const submitIssue = async () => {
    if (!issueTitle.trim() || !tenant) return;
    await fetch('/api/issues', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 지점명: tenant['지점명'], 방코드: tenant['방코드'], 제목: issueTitle, 내용: issueDesc, 카테고리: '기타', 상태: '접수', 등록일: new Date().toISOString().split('T')[0] }),
    });
    setIssueTitle(''); setIssueDesc(''); setIssueSheet(null);
    showToast(t('접수됐어요!', 'Submitted!'));
  };

  // Schedule generation
  const generateSchedule = () => {
    const today = new Date();
    const myRoom = tenant?.['방코드'] || '';
    const rooms = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2'];
    const schedule: { weekStart: Date; room: string; isMine: boolean; isPast: boolean }[] = [];
    for (let w = -4; w <= 4; w++) {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1 + w * 7);
      const room = rooms[((w + 8) % rooms.length)];
      schedule.push({ weekStart: new Date(monday), room, isMine: room === myRoom, isPast: monday < today });
    }
    return schedule;
  };

  const fmtWeek = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

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
  const dday = Math.max(0, Math.ceil((new Date(tenant['퇴실일'] || '').getTime() - Date.now()) / 86400000));
  const schedule = generateSchedule();

  // Notices (static for now)
  const notices = [
    { id: 1, title: t('이번주 수요일 보일러 점검 예정', 'Boiler inspection this Wednesday'), date: t('4월 13일', 'Apr 13'), important: true, house: houseName },
    { id: 2, title: t('4월 공과금 고지서 발송 완료', 'April utility bills sent'), date: t('4월 1일', 'Apr 1'), important: false, house: '' },
    { id: 3, title: t('쓰레기 분리수거 요일 변경 안내', 'Recycling day change notice'), date: t('3월 28일', 'Mar 28'), important: false, house: '' },
  ];

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      {toast && <Toast msg={toast} />}

      {/* Repair Bottom Sheet */}
      {issueSheet === '수리' && (
        <BottomSheet title={t('수리 신청', 'Repair Request')} onClose={() => setIssueSheet(null)}>
          <div style={{ background: '#fff8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: '#191f28', lineHeight: 1.7, border: '1px solid #ffe0cc' }}>
            <div style={{ fontWeight: 700, color: RED, marginBottom: 8 }}>{t('신청 전 확인해 주세요', 'Before requesting')}</div>
            {[
              t('어떤 문제인지 최대한 자세히 설명해 주세요.', 'Describe the problem in detail.'),
              t('모델명이 있는 제품은 모델명도 알려주세요.', 'Include model numbers if applicable.'),
              t('제품 모델명 사진 + 문제 발생 장면 사진을 함께 보내주세요.', 'Attach photos of the model and the issue.'),
            ].map((txt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: RED, marginTop: 6, flexShrink: 0 }} />
                <span style={{ lineHeight: 1.6 }}>{txt}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: GRAY, lineHeight: 1.7, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#191f28', fontWeight: 600, marginBottom: 4 }}>{t('카카오톡으로 문의해 주세요', 'Please contact us via KakaoTalk')}</div>
            <div style={{ fontSize: 12, color: GRAY }}>{t('사진 첨부 후 매니저가 빠르게 처리해 드려요', 'Attach photos and we\'ll handle it quickly')}</div>
          </div>
          <button onClick={() => { setIssueSheet(null); window.open('https://pf.kakao.com/_xnxnNxj/chat', '_blank'); }}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#3182f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('매니저에게 문의하기', 'Contact Manager')}
          </button>
        </BottomSheet>
      )}

      {/* Other Issue Bottom Sheet */}
      {issueSheet === '기타' && (
        <BottomSheet title={t('기타 문의', 'Other Inquiry')} onClose={() => setIssueSheet(null)}>
          <input value={issueTitle} onChange={e => setIssueTitle(e.target.value)} placeholder={t('제목', 'Title')}
            style={{ width: '100%', padding: '11px 13px', border: '1px solid #e5e8eb', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder={t('내용', 'Details')}
            style={{ width: '100%', height: 80, padding: '11px 13px', border: '1px solid #e5e8eb', borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
          <button onClick={submitIssue}
            style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: issueTitle ? BLUE : '#e5e8eb', color: '#fff', fontSize: 14, fontWeight: 700, cursor: issueTitle ? 'pointer' : 'not-allowed' }}>
            {t('접수하기', 'Submit')}
          </button>
        </BottomSheet>
      )}

      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 16px 16px', borderBottom: '1px solid #f2f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#191f28' }}>{t(`안녕하세요, ${name}님 👋`, `Hello, ${name} 👋`)}</div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>{houseName} · {room}</div>
          </div>
          <div style={{ display: 'flex', background: '#f2f4f6', borderRadius: 20, padding: 3 }}>
            {(['ko', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 12px', borderRadius: 16, border: 'none', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#191f28' : GRAY, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: lang === l ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
              {l === 'ko' ? '한' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* D-day */}
        <div style={{ background: 'linear-gradient(135deg,#3182f6,#1a6bd4)', borderRadius: 16, padding: '22px 22px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginBottom: 6, fontWeight: 500 }}>{t('계약 잔여일', 'Contract Remaining')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>D-{dday}</div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,.8)', lineHeight: 1.8 }}>
              <div>{tenant['입주일']}</div>
              <div>~ {tenant['퇴실일']}</div>
            </div>
          </div>
        </div>

        {/* Notices */}
        <Card>
          <div onClick={() => setNoticeOpen(!noticeOpen)} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{t('공지사항', 'Notice')}</span>
              {notices.some(n => n.important) && (
                <span style={{ fontSize: 10, background: RED, color: '#fff', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                  {notices.filter(n => n.important).length}
                </span>
              )}
            </div>
            <Chevron open={noticeOpen} />
          </div>
          {noticeOpen && (
            <div style={{ borderTop: '1px solid #f2f4f6' }}>
              {notices.map((n, i, arr) => (
                <div key={n.id} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f2f4f6' : 'none', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    {n.important && <span style={{ fontSize: 10, background: '#fff0f1', color: RED, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>{t('중요', 'Important')}</span>}
                    {n.house && <span style={{ fontSize: 10, background: '#ebf3ff', color: BLUE, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>{houseName}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#191f28', fontWeight: n.important ? 600 : 400, lineHeight: 1.5 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: GRAY, marginTop: 3 }}>{n.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* House Info */}
        {house && (
          <Card>
            <CardTitle title={t('하우스 정보', 'House Info')} />
            {[
              { l: t('현관 비번', 'Door Code'), v: house['현관비번'], cp: true },
              { l: t('와이파이', 'WiFi'), v: house['와이파이SSID'], cp: false },
              { l: t('비밀번호', 'Password'), v: house['와이파이PW'], cp: true },
              { l: t('주소', 'Address'), v: house['주소'], cp: false },
            ].map((row, i, arr) => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f2f4f6' : 'none' }}>
                <span style={{ fontSize: 13, color: GRAY, flexShrink: 0 }}>{row.l}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28', textAlign: 'right' }}>{row.v || '-'}</span>
                  {row.cp && row.v && <button onClick={() => copyText(row.v)} style={{ border: 'none', background: '#f2f4f6', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><CopyIcon /></button>}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Payment History */}
        {(() => {
          const allPayments = Array.isArray(rawPayments) ? rawPayments : [];
          const nowDate = new Date();
          const curYM = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
          const curPay = allPayments.find((p: any) => p.연월 === curYM);
          const pastPays = [...allPayments].filter((p: any) => p.연월 !== curYM).sort((a: any, b: any) => (b.연월 || '').localeCompare(a.연월 || ''));

          // First month pro-rata calc
          const moveInDate = tenant['입주일'] || '';
          const moveD = moveInDate ? new Date(moveInDate) : null;
          const moveYear = moveD ? moveD.getFullYear() : 0;
          const moveMonth = moveD ? moveD.getMonth() + 1 : 0;
          const moveDay = moveD ? moveD.getDate() : 1;
          const daysInMoveMonth = moveYear ? getDaysInMonth(moveYear, moveMonth) : 30;
          const moveDays = daysInMoveMonth - moveDay + 1;
          const isProrata = moveDay > 1;
          const firstRent = isProrata ? Math.round(rent / daysInMoveMonth * moveDays) : rent;
          const firstMgmt = isProrata ? Math.round(mgmt / daysInMoveMonth * moveDays) : mgmt;
          const firstTotal = firstRent + firstMgmt;
          const depositAmt = Number(tenant['보증금']) || 0;

          // Current month D-day (assuming due date is 5th)
          const dueDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 5);
          const curDday = Math.ceil((dueDate.getTime() - nowDate.getTime()) / 86400000);
          const curIsPaid = curPay?.상태 === '납부완료';

          // Account info from house
          const rentAccount = house?.['월세계좌'] || t('계약서 참조', 'See contract');
          const mgmtAccount = house?.['관리비계좌'] || t('계약서 참조', 'See contract');

          return (
            <Card>
              <CardTitle title={t('납부 내역', 'Payment History')} />

              {/* ① 계약금 */}
              {depositAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: '1px solid #f2f4f6' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{t('계약금', 'Deposit')}</div>
                    <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{moveInDate || '-'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(depositAmt)}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e6f9f0', color: GREEN }}>{t('납부완료', 'Paid')}</span>
                  </div>
                </div>
              )}

              {/* ② 잔금 + 첫달 */}
              {moveInDate && (
                <div style={{ borderTop: '1px solid #f2f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{t('잔금 + 첫달 납부', 'Balance + 1st Month')}</div>
                      <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{moveInDate}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(depositAmt + firstTotal)}</span>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e6f9f0', color: GREEN }}>{t('납부완료', 'Paid')}</span>
                    </div>
                  </div>
                  {/* 상세 박스 */}
                  <div style={{ margin: '0 18px 14px', background: '#f2f3f5', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
                      <span>{t('보증금 잔액', 'Deposit Balance')}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(depositAmt)}</span>
                    </div>
                    <div style={{ height: 1, background: '#e5e8eb', margin: '6px 0' }} />
                    {isProrata ? (
                      <>
                        <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>
                          {t(`첫달 일할 (${moveMonth}/${moveDay} ~ ${moveMonth}/${daysInMoveMonth}, ${moveDays}일/${daysInMoveMonth}일)`,
                            `Pro-rata (${moveMonth}/${moveDay} ~ ${moveMonth}/${daysInMoveMonth}, ${moveDays}d/${daysInMoveMonth}d)`)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                          <span>{t('월세 일할', 'Rent (pro-rata)')}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(firstRent)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
                          <span>{t('관리비 일할', 'Mgmt (pro-rata)')}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(firstMgmt)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                          <span>{t('월세', 'Rent')}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(rent)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
                          <span>{t('관리비', 'Mgmt Fee')}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(mgmt)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ height: 1, background: '#e5e8eb', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: BLUE }}>
                      <span>{t('합계', 'Total')}</span>
                      <span>{fmt(depositAmt + firstTotal)}</span>
                    </div>
                  </div>
                  {/* 계좌 안내 */}
                  <div style={{ margin: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{t('월세 계좌', 'Rent Account')}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#191f28' }}>{rentAccount}</span>
                    </div>
                    <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{t('관리비 계좌', 'Mgmt Account')}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#191f28' }}>{mgmtAccount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ③ 이번달 납부예정 */}
              <div style={{ borderTop: '1px solid #f2f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: curIsPaid ? '#191f28' : BLUE }}>
                      {nowDate.getMonth() + 1}{t('월 월세·관리비', ' Rent & Mgmt')}
                    </div>
                    <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>
                      {curIsPaid ? (curPay?.납부일 || '') + t(' 납부', ' paid') : (curDday > 0 ? `D-${curDday}` : t('납부일 경과', 'Overdue'))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: curIsPaid ? '#191f28' : BLUE }}>{fmt(Number(curPay?.청구액 || 0) || (rent + mgmt))}</span>
                    {curIsPaid ? (
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e6f9f0', color: GREEN }}>{t('납부완료', 'Paid')}</span>
                    ) : (
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#edf3ff', color: BLUE }}>{t('납부예정', 'Due')}</span>
                    )}
                  </div>
                </div>
                {!curIsPaid && (
                  <div style={{ margin: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{t('월세', 'Rent')} {fmt(rent)}</span>
                      <span style={{ fontSize: 11, color: '#555' }}>{rentAccount}</span>
                    </div>
                    <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: GRAY }}>{t('관리비', 'Mgmt')} {fmt(mgmt)}</span>
                      <span style={{ fontSize: 11, color: '#555' }}>{mgmtAccount}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ④ 납부 이력 토글 */}
              {pastPays.length > 0 && (
                <div style={{ borderTop: '1px solid #f2f4f6' }}>
                  <div onClick={() => setHistoryOpen(!historyOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{t('납부 이력', 'Payment History')}</span>
                    <span style={{ fontSize: 12, color: GRAY }}>{historyOpen ? t('접기 ▲', 'Close ▲') : t('펼치기 ▼', 'Open ▼')}</span>
                  </div>
                  {historyOpen && (
                    <div style={{ margin: '0 18px 14px' }}>
                      <div style={{ background: '#f2f3f5', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {pastPays.map((p: any, i: number) => {
                          const paid = p.상태 === '납부완료';
                          const [pY, pM] = (p.연월 || '').split('-');
                          const amt = Number(paid ? p.납부액 : p.청구액) || 0;
                          return (
                            <div key={p.수납ID || i}>
                              {i > 0 && <div style={{ height: 1, background: '#e5e8eb', margin: '4px 0' }} />}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 12, fontWeight: 500, color: '#191f28', minWidth: 60 }}>{pY}{t('년 ', '.')}{Number(pM)}{t('월', '')}</span>
                                  {paid && p.납부일 && <span style={{ fontSize: 11, color: GRAY }}>{p.납부일.slice(5)}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 12, fontWeight: 500, color: '#191f28' }}>{amt > 0 ? fmt(amt) : '-'}</span>
                                  <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: paid ? '#e6f9f0' : '#fff0f1', color: paid ? GREEN : RED }}>
                                    {paid ? t('납부완료', 'Paid') : t('미납', 'Unpaid')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {allPayments.length === 0 && !depositAmt && !moveInDate && (
                <div style={{ padding: '20px 18px', textAlign: 'center', color: GRAY, fontSize: 13 }}>
                  {t('납부 내역이 없어요', 'No payment history')}
                </div>
              )}
            </Card>
          );
        })()}

        {/* Duty */}
        <Card>
          <div onClick={() => setDutyOpen(!dutyOpen)} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: dutyOpen ? '1px solid #f2f4f6' : 'none' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{t('청소 당번 안내', 'Cleaning Duty')}</div>
              <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>
                {schedule.find(s => s.isMine && !s.isPast)
                  ? t(`다음 내 당번: ${fmtWeek(schedule.find(s => s.isMine && !s.isPast)!.weekStart)}주`, `My next duty: ${fmtWeek(schedule.find(s => s.isMine && !s.isPast)!.weekStart)}`)
                  : t('당번 일정 없음', 'No upcoming duty')}
              </div>
            </div>
            <Chevron open={dutyOpen} />
          </div>
          {dutyOpen && (
            <div style={{ padding: '12px 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
                {[
                  t('매주 지정된 당번이 공용구역을 청소합니다.', 'Clean common areas each week.'),
                  t('사진 미업로드 시 벌금 30,000원이 부과됩니다.', '30,000 won fine if photo not uploaded.'),
                ].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: ORANGE, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: GRAY, lineHeight: 1.5 }}>{txt}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #f2f4f6', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: GRAY, marginBottom: 8 }}>{t('당번 일정', 'Schedule')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {schedule.map((s, i) => {
                    const isThisWeek = i === 4;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: s.isMine ? '#ebf3ff' : isThisWeek ? '#f8f9fa' : 'transparent', border: s.isMine ? `1.5px solid ${BLUE}` : '1.5px solid transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: s.isPast ? GRAY : '#191f28', fontWeight: isThisWeek || s.isMine ? 600 : 400 }}>{fmtWeek(s.weekStart)}{t('주', '')}</span>
                          {isThisWeek && <span style={{ fontSize: 10, color: BLUE, fontWeight: 600 }}>{t('이번주', 'This week')}</span>}
                          {s.isPast && <span style={{ fontSize: 10, color: GRAY }}>{t('완료', 'Done')}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: s.isMine ? BLUE : s.isPast ? GRAY : '#191f28', fontWeight: s.isMine ? 700 : 400 }}>{s.room}</span>
                          {s.isMine && <span style={{ fontSize: 10, background: BLUE, color: '#fff', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{t('내 당번', 'My Turn')}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Supplies */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#191f28', marginBottom: 14 }}>{t('비품 신청', 'Supply Request')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUPPLIES.map(s => {
              const sel = selSupplies.includes(s);
              return (
                <button key={s} onClick={() => setSelSupplies(p => sel ? p.filter(x => x !== s) : [...p, s])}
                  style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${sel ? '#191f28' : '#e5e8eb'}`, background: sel ? '#191f28' : '#fff', color: sel ? '#fff' : '#4e5968', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {s}
                </button>
              );
            })}
          </div>
          {selSupplies.includes('기타') && (
            <input value={etcText} onChange={e => setEtcText(e.target.value)} placeholder={t('필요한 물품을 입력해 주세요', 'Enter item name')}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e8eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginTop: 10 }} />
          )}
          <button onClick={submitSupply}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: selSupplies.length ? '#191f28' : '#f2f3f5', color: selSupplies.length ? '#fff' : '#8b95a1', fontSize: 14, fontWeight: 600, cursor: selSupplies.length ? 'pointer' : 'not-allowed', marginTop: 14 }}>
            {t('신청하기', 'Request')}
          </button>
        </div>

        {/* Issues */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 8px', fontSize: 15, fontWeight: 700, color: '#191f28' }}>{t('불편사항 신청', 'Report Issue')}</div>
          {[
            { key: '수리', label: t('수리 신청', 'Repair Request'), sub: t('시설 고장·파손 신고', 'Report facility damage'), action: () => setIssueSheet('수리') },
            { key: '청소', label: t('청소 요청', 'Cleaning Request'), sub: t('공용공간 청소 요청', 'Common area cleaning'), action: () => window.open('/apply/cleaning', '_blank') },
            { key: '기타', label: t('기타 문의', 'Other Inquiry'), sub: t('그 외 문의사항', 'Other inquiries'), action: () => setIssueSheet('기타') },
          ].map(item => (
            <div key={item.key} onClick={item.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #f2f3f5', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#8b95a1', marginTop: 2 }}>{item.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          ))}
        </div>

        {/* Bottom Buttons */}
        <button onClick={() => window.open('https://pf.kakao.com/_xnxnNxj/chat', '_blank')} style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', background: '#3182f6', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {t('매니저에게 문의하기', 'Contact Manager')}
        </button>

        <button onClick={() => window.open('/apply/checkout', '_blank')} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: '1px solid #e5e8eb', background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#8b95a1', textAlign: 'center', fontFamily: 'inherit' }}>
          {t('퇴실 신청', 'Move-out Request')}
        </button>
      </div>
    </div>
  );
}
