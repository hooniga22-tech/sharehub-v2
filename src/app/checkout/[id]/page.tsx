'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useParams, useRouter } from 'next/navigation';

const BLUE = '#3182F6', RED = '#E24B4A', GRAY = '#8b95a1';
const fmt = (n: number) => n.toLocaleString() + '원';

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 12, ...style }}>{children}</div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: '#191f28', marginBottom: 14 }}>{title}</div>
);

export default function CheckoutSettlementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: app, mutate } = useSWR(id ? `/api/apply/checkout?id=${id}` : null, fetcher);
  const { data: allTenants } = useSWR('/api/tenants', fetcher);

  // 입주자 매칭 (입주자ID 또는 이름+방코드)
  const tenant = useMemo(() => {
    if (!app || !Array.isArray(allTenants)) return null;
    if (app.입주자ID) return allTenants.find((t: any) => t.입주자ID === app.입주자ID);
    return allTenants.find((t: any) => t.이름 === app.name && t.방코드 === app.roomCode);
  }, [app, allTenants]);

  const deposit = Number(tenant?.보증금 || 0);

  // 체크리스트
  const [checkRent, setCheckRent] = useState(false);
  const [checkMgmt, setCheckMgmt] = useState(false);
  const [checkClean, setCheckClean] = useState(false);

  // 공제 항목
  const [exitFee, setExitFee] = useState(30000);
  const [unpaidRent, setUnpaidRent] = useState(0);
  const [unpaidMgmt, setUnpaidMgmt] = useState(0);
  const [extraDeduct, setExtraDeduct] = useState(0);
  const [extraReason, setExtraReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const totalDeduct = exitFee + unpaidRent + unpaidMgmt + extraDeduct;
  const finalAmount = deposit - totalDeduct;
  const allChecked = checkRent && checkMgmt && checkClean;

  const handleConfirm = async () => {
    if (!allChecked || submitting || !app) return;
    setSubmitting(true);
    const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\. /g, '-').replace('.', '').replace(/(\d+)-(\d+)-(\d+)/, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    await fetch('/api/apply/checkout', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: app.id,
        퇴실비: exitFee,
        미납월세: unpaidRent,
        미납관리비: unpaidMgmt,
        추가공제금액: extraDeduct,
        추가공제사유: extraReason,
        월세완납확인: 'Y',
        관리비완납확인: 'Y',
        청소완료확인: 'Y',
        정산확정여부: 'Y',
        정산확정일: today,
        최종반환금액: finalAmount,
        상태: '정산완료',
      }),
    });
    await mutate();
    setDone(true);
    setSubmitting(false);
  };

  if (!app) return <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>;
  if (app.error) return <div style={{ textAlign: 'center', padding: '80px 0', color: RED, fontSize: 13 }}>신청을 찾을 수 없습니다</div>;

  if (done || app.정산확정여부 === 'Y') {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '40px 16px', background: '#f7f8fa', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#191f28', marginBottom: 6 }}>정산 확정 완료</div>
          <div style={{ fontSize: 13, color: GRAY }}>{app.name} · {app.houseName} · {app.roomCode}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: BLUE, marginTop: 16 }}>{fmt(Number(app.최종반환금액 || finalAmount))}</div>
          <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>최종 반환금액</div>
          <button onClick={() => router.push('/checkout')} style={{ marginTop: 32, padding: '12px 32px', background: BLUE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>목록으로</button>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    background: '#EBF3FF', border: '0.5px solid #3182F6', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, color: BLUE, fontWeight: 600,
    textAlign: 'right', outline: 'none', width: 120, fontFamily: 'inherit',
  };

  const CheckCircle = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{
      width: 24, height: 24, borderRadius: '50%', border: checked ? 'none' : '1.5px solid #ddd',
      background: checked ? BLUE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    }}>
      {checked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 0 32px', background: '#f7f8fa', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ padding: '24px 20px 16px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#191f28', margin: 0 }}>퇴실 정산 처리</h1>
        <p style={{ fontSize: 13, color: GRAY, marginTop: 4 }}>
          {app.name} · {app.houseName} · {app.roomCode} · {app.checkoutDate}
        </p>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* 섹션1: 체크리스트 */}
        <Card>
          <SectionTitle title="체크리스트" />
          {[
            { label: '월세 완납 확인', checked: checkRent, toggle: () => setCheckRent(!checkRent) },
            { label: '관리비 완납 확인', checked: checkMgmt, toggle: () => setCheckMgmt(!checkMgmt) },
            { label: '청소 완료 확인', checked: checkClean, toggle: () => setCheckClean(!checkClean) },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #f2f4f6' : 'none' }}>
              <span style={{ fontSize: 14, color: '#333' }}>{item.label}</span>
              <CheckCircle checked={item.checked} onToggle={item.toggle} />
            </div>
          ))}
        </Card>

        {/* 섹션2: 공제 항목 입력 */}
        <Card>
          <SectionTitle title="공제 항목 입력" />
          {[
            { label: '퇴실비', value: exitFee, set: setExitFee },
            { label: '미납 월세', value: unpaidRent, set: setUnpaidRent },
            { label: '미납 관리비', value: unpaidMgmt, set: setUnpaidMgmt },
            { label: '추가 공제 금액', value: extraDeduct, set: setExtraDeduct },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f2f4f6' : 'none' }}>
              <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
              <input type="number" value={item.value} onChange={e => item.set(Number(e.target.value) || 0)} style={inputStyle} />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
            <span style={{ fontSize: 13, color: '#555' }}>추가 공제 사유</span>
            <input type="text" value={extraReason} onChange={e => setExtraReason(e.target.value)} placeholder="사유 입력"
              style={{ ...inputStyle, width: 160, textAlign: 'left', fontWeight: 400, color: '#333' }} />
          </div>
        </Card>

        {/* 섹션3: 정산 미리보기 */}
        <div style={{ background: '#f7f9ff', borderRadius: 10, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#191f28', marginBottom: 14 }}>정산 미리보기</div>
          {[
            { label: '보증금 원금', value: deposit, color: '#333' },
            { label: '- 퇴실비', value: exitFee, color: RED },
            { label: '- 미납 합계', value: unpaidRent + unpaidMgmt, color: (unpaidRent + unpaidMgmt) > 0 ? RED : GRAY },
            { label: '- 추가 공제', value: extraDeduct, color: extraDeduct > 0 ? RED : GRAY },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 13, color: '#888' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: item.color }}>{item.label.startsWith('-') ? `-${fmt(item.value)}` : fmt(item.value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e5e8eb', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>최종 반환금액</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: BLUE }}>{fmt(finalAmount)}</span>
          </div>
        </div>

        {/* 확정 버튼 */}
        <button onClick={handleConfirm} disabled={!allChecked || submitting} style={{
          width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700,
          background: allChecked ? BLUE : '#e8e8ee', color: allChecked ? '#fff' : '#aaa',
          cursor: allChecked ? 'pointer' : 'default', fontFamily: 'inherit',
        }}>
          {submitting ? '처리 중...' : allChecked ? '정산 확정 · 입주자에게 공개' : '체크리스트 완료 후 확정 가능'}
        </button>
      </div>
    </div>
  );
}
