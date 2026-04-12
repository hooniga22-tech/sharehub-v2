'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { homeData } from '@/lib/mockData';
import KpiCard from '@/components/ui/KpiCard';
import Chip from '@/components/ui/Chip';
import DateDisplay from '@/components/home/DateDisplay';

const todoColors: Record<string, string> = {
  urgent: '#F04452',
  payment: '#D97706',
  checkout: '#3182F6',
  contract: '#00B493',
};

const todoRoutes: Record<string, string> = {
  urgent: '/issues',
  payment: '/payments',
  checkout: '/vacancy',
  contract: '/tenants',
};

const scheduleColors: Record<string, string> = {
  red: '#F04452',
  green: '#00B493',
  amber: '#D97706',
  blue: '#3182F6',
};

export default function HomePage() {
  const router = useRouter();
  const [occupancy, setOccupancy] = useState(homeData.occupancyRate);
  const [pendingIssues] = useState(homeData.pendingIssues);
  const [weeklyCheckouts] = useState(homeData.weeklyCheckouts);
  const [unpaidAmount, setUnpaidAmount] = useState(homeData.unpaidAmount);
  const [unpaidCount, setUnpaidCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/payments').then(r => r.json()),
    ]).then(([tenants, payments]) => {
      const arr = Array.isArray(tenants) ? tenants : [];
      const active = arr.filter((t: Record<string, string>) => t['상태'] === '입주중' || t['상태'] === '계약중').length;
      const total = arr.length;
      if (total > 0) setOccupancy(Math.round(active / total * 100));

      const payArr = Array.isArray(payments) ? payments : [];
      const unpaid = payArr.filter((p: Record<string, string>) => p['납부여부'] !== '납부');
      const amt = unpaid.reduce((a: number, p: Record<string, string>) =>
        a + (Number(p['월세금액']) || 0) + (Number(p['관리비금액']) || 0), 0);
      if (amt > 0) setUnpaidAmount(amt);
      setUnpaidCount(unpaid.length);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 상단 */}
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>안녕하세요 👋</h1>
        <DateDisplay />
      </div>

      {/* KPI 그리드 */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div onClick={() => router.push('/tenants')} style={{ cursor: 'pointer' }}>
          <KpiCard label="전체 입주율" value={occupancy} suffix="%" color="#00B493" />
        </div>
        <div onClick={() => router.push('/issues')} style={{ cursor: 'pointer' }}>
          <KpiCard label="미처리 이슈" value={pendingIssues} suffix="건" color="#F04452" />
        </div>
        <div onClick={() => router.push('/vacancy')} style={{ cursor: 'pointer' }}>
          <KpiCard label="이번주 퇴실" value={weeklyCheckouts} suffix="건" color="#D97706" />
        </div>
        <div onClick={() => router.push('/payments')} style={{ cursor: 'pointer' }}>
          <KpiCard
            label="이번달 미납"
            value={unpaidAmount > 0 ? (unpaidAmount / 10000).toFixed(0) : String(homeData.unpaidAmount / 10000)}
            suffix="만원"
            color="#F04452"
          />
        </div>
      </div>

      {/* 오늘 할 일 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>오늘 할 일</h2>
            <button onClick={() => router.push('/issues')} style={{ fontSize: 12, color: '#888888', background: 'none', border: 'none', cursor: 'pointer' }}>전체보기</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {homeData.todos.map((todo, i) => (
              <div key={i}>
                <button
                  onClick={() => router.push(todoRoutes[todo.type] || '/issues')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: todoColors[todo.type], flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#191919' }}>{todo.text}</span>
                  </div>
                  <Chip type={todo.type} />
                </button>
                {i < homeData.todos.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이번주 일정 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919', marginBottom: 12 }}>이번주 일정</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {homeData.schedule.map((item, i) => (
              <button
                key={i}
                onClick={() => router.push('/issues')}
                style={{ display: 'flex', gap: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}
              >
                <span style={{ flexShrink: 0, textAlign: 'right', fontSize: 12, color: '#888888', width: 36, paddingTop: 2 }}>{item.date}</span>
                <div style={{ flexShrink: 0, width: 3, borderRadius: 2, background: scheduleColors[item.color], minHeight: 36 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#191919' }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#888888' }}>{item.place}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
