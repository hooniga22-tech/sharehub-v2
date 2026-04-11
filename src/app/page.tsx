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

const scheduleColors: Record<string, string> = {
  red: '#F04452',
  green: '#00B493',
  amber: '#D97706',
  blue: '#3182F6',
};

export default function HomePage() {
  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 상단 */}
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>안녕하세요 👋</h1>
        <DateDisplay />
      </div>

      {/* KPI 그리드 */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <KpiCard label="전체 입주율" value={homeData.occupancyRate} suffix="%" color="#00B493" />
        <KpiCard label="미처리 이슈" value={homeData.pendingIssues} suffix="건" color="#F04452" />
        <KpiCard label="이번주 퇴실" value={homeData.weeklyCheckouts} suffix="건" color="#D97706" />
        <KpiCard
          label="이번달 미납"
          value={(homeData.unpaidAmount / 10000).toFixed(0)}
          suffix="만원"
          color="#F04452"
        />
      </div>

      {/* 오늘 할 일 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>오늘 할 일</h2>
            <button style={{ fontSize: 12, color: '#888888' }}>전체보기</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {homeData.todos.map((todo, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', background: todoColors[todo.type], flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 14, color: '#191919' }}>{todo.text}</span>
                  </div>
                  <Chip type={todo.type} />
                </div>
                {i < homeData.todos.length - 1 && (
                  <div style={{ height: 1, background: '#F5F5F5' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이번주 일정 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '0.5px solid #F0F0F0' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#191919', marginBottom: 12 }}>
            이번주 일정
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {homeData.schedule.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <span
                  style={{ flexShrink: 0, textAlign: 'right', fontSize: 12, color: '#888888', width: 36, paddingTop: 2 }}
                >
                  {item.date}
                </span>
                <div
                  style={{ flexShrink: 0, width: 3, borderRadius: 2, background: scheduleColors[item.color], minHeight: 36 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#191919' }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#888888' }}>{item.place}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
