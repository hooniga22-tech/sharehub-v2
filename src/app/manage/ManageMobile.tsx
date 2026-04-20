'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182F6', GREEN = '#00B493', RED = '#e03131';

function kstYM() {
  const s = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const [y, m] = s.replace(/\./g, '').trim().split(/\s+/).map(Number);
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default function ManageMobile() {
  const router = useRouter();
  const [unpaid, setUnpaid] = useState<number | null>(null);
  const [vacant, setVacant] = useState<number | null>(null);

  useEffect(() => {
    const ym = kstYM();
    const [y, m] = ym.split('-');
    fetch(`/api/payments?year=${y}&month=${m}`)
      .then(r => r.json())
      .then(d => setUnpaid((d.summary?.unpaid ?? 0) + (d.summary?.partial ?? 0)))
      .catch(() => {});

    fetch('/api/tenants')
      .then(r => r.json())
      .then((arr: any[]) => setVacant(Array.isArray(arr) ? arr.filter(t => t.상태 === '공실').length : 0))
      .catch(() => {});
  }, []);

  const bigCards = [
    {
      title: '수납 관리',
      sub: unpaid === null ? '...' : unpaid === 0 ? '이번 달 납부 완료' : `이번 달 미납 ${unpaid}건`,
      color: unpaid === null ? '#8B95A1' : unpaid === 0 ? GREEN : BLUE,
      href: '/payments',
    },
    {
      title: '공실 관리',
      sub: vacant === null ? '...' : vacant === 0 ? '전 호실 입주중' : `현재 공실 ${vacant}호실`,
      color: vacant === null ? '#8B95A1' : vacant === 0 ? GREEN : RED,
      href: '/vacancy',
    },
  ];

  const smallCards = [
    { title: '청소·수리', sub: '청소·수리 일정', href: '/issues' },
    { title: '당번 관리', sub: '청소 당번표', href: '/duty' },
    { title: '공과금', sub: '공과금 내역', href: '/utilities' },
    { title: '지출 관리', sub: '지출 기록', href: '/expenses' },
    { title: '투자자', sub: '투자자 현황', href: '/investors' },
    { title: '플랫폼 이체', sub: '이체 현황', href: '/payments/platform' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '24px 16px 12px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: '#191F28' }}>관리</h1>
      </div>

      {/* Big Cards — 2열 */}
      <div style={{ display: 'flex', gap: 10, padding: '0 14px', marginBottom: 12 }}>
        {bigCards.map(c => (
          <div key={c.title} onClick={() => router.push(c.href)}
            style={{ flex: 1, background: '#fff', borderRadius: 16, padding: 18, cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#191F28', marginBottom: 10 }}>{c.title}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>
              {c.sub === '...' ? '...' : c.sub.match(/\d+/)?.[0] ?? ''}
              {c.sub !== '...' && !c.sub.match(/\d+/) && (
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.sub}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 4 }}>
              {c.sub === '...' ? '' : c.sub.match(/\d+/) ? c.sub.replace(/\d+/, '').trim() : ''}
            </div>
          </div>
        ))}
      </div>

      {/* 운영 카드 그리드 — 빠른 이동 */}
      <div style={{ padding: '0 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8B95A1', marginBottom: 8 }}>빠른 이동</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {smallCards.map(c => (
            <div key={c.title} onClick={() => router.push(c.href)}
              style={{ background: '#fff', borderRadius: 14, padding: '16px 12px', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#191F28', marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: '#8B95A1' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 메뉴 리스트 */}
      <div style={{ padding: '0 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8B95A1', marginBottom: 8 }}>전체 메뉴</div>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { title: '지점 관리', sub: '지점별 정보 및 방 현황', href: '/houses' },
            { title: '입주 신청', sub: '입주 신청서 관리', href: '/apply' },
            { title: '수납 관리', sub: '월세 수납 현황', href: '/payments' },
            { title: '공실 관리', sub: '공실 현황 및 모집', href: '/vacancy' },
            { title: '청소·수리', sub: '청소·수리 일정', href: '/issues' },
            { title: '담당자 관리', sub: '용역 담당자 정보', href: '/management/workers' },
            { title: '당번 관리', sub: '청소 당번표', href: '/duty' },
            { title: '공과금 관리', sub: '공과금 내역 관리', href: '/utilities' },
            { title: '지출 관리', sub: '지출 기록 관리', href: '/expenses' },
            { title: '수익 현황', sub: '수익 대시보드', href: '/revenue' },
            { title: '투자자 관리', sub: '투자자 현황', href: '/investors' },
            { title: '플랫폼 이체', sub: '이체 현황 관리', href: '/payments/platform' },
            { title: '퇴실자 관리', sub: '퇴실 완료 이력', href: '/checkout' },
          ].map((item, i) => (
            <div key={item.href}>
              {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 16px' }} />}
              <div onClick={() => router.push(item.href)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>{item.sub}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
