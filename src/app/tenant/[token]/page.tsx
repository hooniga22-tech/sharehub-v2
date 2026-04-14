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
  const { data: dutyData } = useSWR(
    tenant?.['지점명'] ? `/api/tenant-duty?house=${encodeURIComponent(tenant['지점명'])}&roomCode=${encodeURIComponent(tenant['방코드'] || '')}` : null, fetcher,
    { refreshInterval: 0, revalidateOnFocus: true }
  );
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
  const [expandedYM, setExpandedYM] = useState<Set<string>>(new Set());
  const [oldPayOpen, setOldPayOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);

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

  const fmtWeek = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
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
  const dday = Math.max(0, Math.ceil((new Date(tenant['퇴실일'] || '').getTime() - Date.now()) / 86400000));
  const rawDuties = dutyData?.duties || [];
  const myRoomCode = dutyData?.myRoomCode || room;
  const today = new Date().toISOString().split('T')[0];
  const todayMonday = (() => { const d = new Date(); const dow = d.getDay(); d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); return d.toISOString().split('T')[0]; })();

  // 같은 주(월요일 기준) 중복 당번 제거 — 최신 주차시작일만 유지
  const duties = (() => {
    const getMonday = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    };
    const seen = new Map<string, any>();
    for (const d of rawDuties) {
      const mon = getMonday(d.주차시작일 || '');
      const key = `${mon}_${d.방코드}_${d.당번유형}`;
      const existing = seen.get(key);
      if (!existing || (d.주차시작일 || '') > (existing.주차시작일 || '')) {
        seen.set(key, d);
      }
    }
    return [...seen.values()].sort((a: any, b: any) => (a.주차시작일 || '').localeCompare(b.주차시작일 || ''));
  })();

  const nextMyDuty = duties.find((d: any) => d.방코드 === myRoomCode && d.주차시작일 >= todayMonday && d.완료여부 !== '스킵');

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

        {/* Payment History (A안 + 계좌) */}
        {(() => {
          const allPayments = Array.isArray(rawPayments) ? rawPayments : [];
          const sorted = [...allPayments].sort((a: any, b: any) => (b.연월 || '').localeCompare(a.연월 || ''));
          const recent2 = sorted.slice(0, 2);
          const older = sorted.slice(2);

          // First month pro-rata
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
          const depositAmt = Number(tenant['보증금']) || 0;

          const rentAccount = house?.['월세계좌'] || t('계약서 참조', 'See contract');
          const mgmtAccount = house?.['관리비계좌'] || t('계약서 참조', 'See contract');

          const toggleYM = (ym: string) => {
            setExpandedYM(prev => {
              const next = new Set(prev);
              next.has(ym) ? next.delete(ym) : next.add(ym);
              return next;
            });
          };

          // Auto-expand recent 2
          const isExpanded = (ym: string, idx: number) => idx < 2 ? !expandedYM.has(ym) : expandedYM.has(ym);

          const PayRowWithDetail = ({ p, idx }: { p: any; idx: number }) => {
            const paid = p.상태 === '납부완료';
            const [pY, pM] = (p.연월 || '').split('-');
            const expanded = isExpanded(p.연월, idx);
            const nowDate = new Date();
            const currentYM = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
            const isCurrent = p.연월 === currentYM;
            const statusLabel = paid ? t('완료', 'Paid') : (isCurrent ? t('예정', 'Due') : t('미납', 'Unpaid'));
            const statusColor = paid ? GREEN : (isCurrent ? BLUE : RED);

            return (
              <div style={{ borderTop: '1px solid #f2f4f6' }}>
                <div onClick={() => toggleYM(p.연월)} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', cursor: 'pointer', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28', minWidth: 76, flexShrink: 0 }}>{pY}{t('년 ', '.')}{Number(pM)}{t('월', '')}</span>
                  <span style={{ fontSize: 12, color: '#4e5968', flex: 1 }}>
                    {t('월세', 'Rent')} {fmt(rent)} · <span style={{ color: '#00b493' }}>{t('관리비', 'Mgmt')} {fmt(mgmt)}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, flexShrink: 0 }}>{statusLabel}</span>
                </div>
                {expanded && (
                  <div style={{ padding: '0 18px 14px', display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: '#f2f3f5', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#191f28', marginBottom: 4 }}>{t('월세', 'Rent')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(rent)}</div>
                      <div style={{ fontSize: 11, color: GRAY, marginTop: 4, wordBreak: 'break-all' }}>{rentAccount}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f2f3f5', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#00b493', marginBottom: 4 }}>{t('관리비', 'Mgmt')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(mgmt)}</div>
                      <div style={{ fontSize: 11, color: GRAY, marginTop: 4, wordBreak: 'break-all' }}>{mgmtAccount}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          };

          return (
            <Card>
              <CardTitle title={t('납부 내역', 'Payment History')} />

              {allPayments.length > 0 ? (
                <>
                  {/* 최신 2개월 (기본 펼침) */}
                  {recent2.map((p: any, i: number) => <PayRowWithDetail key={p.수납ID || i} p={p} idx={i} />)}

                  {/* 이전 N개월 아코디언 */}
                  {older.length > 0 && (
                    <>
                      <div onClick={() => setOldPayOpen(!oldPayOpen)}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 18px', cursor: 'pointer', borderTop: '1px solid #f2f4f6' }}>
                        <span style={{ fontSize: 12, color: GRAY, fontWeight: 500 }}>{t(`이전 ${older.length}개월`, `${older.length} more months`)} {oldPayOpen ? '▲' : '▼'}</span>
                      </div>
                      {oldPayOpen && older.map((p: any, i: number) => <PayRowWithDetail key={p.수납ID || i} p={p} idx={i + 2} />)}
                    </>
                  )}
                </>
              ) : !moveInDate ? (
                <div style={{ padding: '20px 18px', textAlign: 'center', color: GRAY, fontSize: 13 }}>
                  {t('납부 내역이 없어요', 'No payment history')}
                </div>
              ) : null}

              {/* 하단: 잔금 + 계약금 */}
              {moveInDate && (
                <div style={{ borderTop: '1px solid #e5e8eb' }}>
                  {/* 잔금① 보증금잔액 + 월세일할 */}
                  <div style={{ borderTop: '1px solid #f2f4f6' }}>
                    <div onClick={() => setBalanceOpen(!balanceOpen)} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', cursor: 'pointer', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28', minWidth: 76, flexShrink: 0 }}>{t('잔금①', 'Balance①')}</span>
                      <span style={{ fontSize: 12, color: '#4e5968', flex: 1 }}>
                        {t('보증금', 'Deposit')} {fmt(depositAmt)} + {t('월세', 'Rent')}{isProrata ? t(' 일할', ' pro-rata') : ''} {fmt(firstRent)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: GREEN, flexShrink: 0 }}>{t('완료', 'Paid')}</span>
                    </div>
                    {balanceOpen && isProrata && (
                      <div style={{ margin: '0 18px 14px', background: '#f2f3f5', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: GRAY, marginBottom: 6 }}>
                          {t(`일할계산 (${moveMonth}/${moveDay} ~ ${moveMonth}/${daysInMoveMonth}, ${moveDays}일/${daysInMoveMonth}일)`,
                            `Pro-rata (${moveMonth}/${moveDay} ~ ${moveMonth}/${daysInMoveMonth}, ${moveDays}d/${daysInMoveMonth}d)`)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                          <span>{t('보증금 잔액', 'Deposit')}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(depositAmt)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                          <span>{t('월세 일할', 'Rent pro-rata')}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(firstRent)}</span>
                        </div>
                        <div style={{ height: 1, background: '#e5e8eb', margin: '6px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: BLUE }}>
                          <span>{t('합계', 'Total')}</span>
                          <span>{fmt(depositAmt + firstRent)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 잔금② 관리비일할 */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #f2f4f6', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28', minWidth: 76, flexShrink: 0 }}>{t('잔금②', 'Balance②')}</span>
                    <span style={{ fontSize: 12, color: '#00b493', flex: 1 }}>
                      {t('관리비', 'Mgmt')}{isProrata ? t(' 일할', ' pro-rata') : ''} {fmt(firstMgmt)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: GREEN, flexShrink: 0 }}>{t('완료', 'Paid')}</span>
                  </div>

                  {/* 계약금 — 수납 탭에 연월='계약금' 행이 있을 때만 표시 */}
                  {(() => {
                    const allPay = Array.isArray(rawPayments) ? rawPayments : [];
                    const depositPay = allPay.find((p: any) => p.연월 === '계약금');
                    if (!depositPay) return null;
                    const dpAmt = Number(depositPay.납부액) || Number(depositPay.청구액) || 0;
                    const dpPaid = depositPay.상태 === '납부완료';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #f2f4f6', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28', minWidth: 76, flexShrink: 0 }}>{t('계약금', 'Deposit')}</span>
                        <span style={{ fontSize: 12, color: '#4e5968', flex: 1 }}>{fmt(dpAmt)}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: dpPaid ? GREEN : RED, flexShrink: 0 }}>{dpPaid ? t('완료', 'Paid') : t('미납', 'Unpaid')}</span>
                      </div>
                    );
                  })()}
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
                {nextMyDuty
                  ? t(`다음 내 당번: ${fmtWeek(nextMyDuty.주차시작일)}주`, `My next duty: ${fmtWeek(nextMyDuty.주차시작일)}`)
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
                {duties.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: GRAY, fontSize: 12 }}>{t('등록된 당번 일정이 없어요', 'No duty schedule available')}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {duties.map((d: any) => {
                      const isMine = d.방코드 === myRoomCode && d.당번유형 === '당번';
                      const isThisWeek = d.주차시작일 === todayMonday;
                      const isPast = d.주차시작일 < todayMonday;
                      const isSkip = d.완료여부 === '스킵' || d.당번유형 === '청소주';
                      const isDone = d.완료여부 === '완료';
                      const displayName = isSkip ? t('정기청소', 'Cleaning Service') : (d.입주자명 || d.방코드 || '-');
                      return (
                        <div key={d.당번ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: isMine ? '#ebf3ff' : isThisWeek ? '#f8f9fa' : 'transparent', border: isMine ? `1.5px solid ${BLUE}` : '1.5px solid transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: isPast ? GRAY : '#191f28', fontWeight: isThisWeek || isMine ? 600 : 400 }}>{fmtWeek(d.주차시작일)}{t('주', '')}</span>
                            {isThisWeek && <span style={{ fontSize: 10, color: BLUE, fontWeight: 600 }}>{t('이번주', 'This week')}</span>}
                            {isPast && !isSkip && <span style={{ fontSize: 10, color: isDone ? GREEN : GRAY }}>{isDone ? t('완료', 'Done') : t('미완료', 'Incomplete')}</span>}
                            {isSkip && <span style={{ fontSize: 10, color: GRAY }}>{t('스킵', 'Skip')}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: isSkip ? GRAY : isMine ? BLUE : isPast ? GRAY : '#191f28', fontWeight: isMine ? 700 : 400 }}>{displayName}</span>
                            {isMine && <span style={{ fontSize: 10, background: BLUE, color: '#fff', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{t('내 당번', 'My Turn')}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
