'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Chip from '@/components/ui/Chip';
import { tenantDetails, formatWon } from '@/lib/mockData';
import { Phone, MessageSquare, FileText, Wind, Wrench, Sparkles, ChevronRight } from 'lucide-react';

const activityIcons: Record<string, { icon: typeof Wind; bg: string; color: string }> = {
  aircon: { icon: Wind, bg: '#EEF3FF', color: '#3182F6' },
  repair: { icon: Wrench, bg: '#FFF0F0', color: '#F04452' },
  clean: { icon: Sparkles, bg: '#E8FBF5', color: '#00B493' },
  contract: { icon: FileText, bg: '#F3EEFF', color: '#7C3AED' },
};

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: '#E8FBF5', color: '#00B493', label: '납부완료' },
  unpaid: { bg: '#FEE2E2', color: '#F04452', label: '미납' },
  checkout: { bg: '#FFF8E8', color: '#D97706', label: '퇴실예정' },
};

function getDday(dateStr: string) {
  const target = new Date(dateStr);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenant = tenantDetails[id];

  if (!tenant) {
    return (
      <>
        <PageHeader title="입주자 상세" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBBBBB' }}>입주자를 찾을 수 없어요</p>
        </div>
      </>
    );
  }

  const dday = getDday(tenant.contractEnd);
  const badge = statusBadge[tenant.paymentStatus];

  const contractInfo = [
    { label: '지점·호실', value: `${tenant.house} ${tenant.room}` },
    { label: '입주일', value: tenant.moveInDate },
    { label: '계약만료', value: tenant.contractEnd },
    { label: '잔여기간', value: `D-${dday}`, valueColor: dday > 30 ? '#00B493' : '#D97706' },
    { label: '월세', value: formatWon(tenant.monthlyRent) },
    { label: '보증금', value: formatWon(tenant.deposit) },
    { label: '납부일', value: `매월 ${tenant.paymentDay}일` },
    { label: '이번달 납부', value: badge.label, valueColor: badge.color },
  ];

  return (
    <div style={{ paddingBottom: 16, background: '#F7F8FA', minHeight: '100vh' }}>
      <PageHeader title="입주자 상세" rightButton={<button style={{ fontSize: 14, color: '#3182F6', fontWeight: 500 }}>편집</button>} />

      {/* 프로필 히어로 */}
      <div style={{ background: '#fff', padding: '20px 16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <Avatar name={tenant.name} size={56} />
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, marginTop: 8 }}>{tenant.name}</h2>
          <p style={{ fontSize: 13, color: '#888888' }}>{tenant.house} · {tenant.room}</p>
          <span style={{ marginTop: 8, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`tel:${tenant.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, border: '1px solid #F0F0F0', fontSize: 14, fontWeight: 500, color: '#191919' }}>
            <Phone size={16} /> 전화
          </a>
          <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, background: '#3182F6', fontSize: 14, fontWeight: 500, color: '#fff' }}>
            <MessageSquare size={16} /> 알림톡
          </button>
        </div>
      </div>

      {/* 계약 정보 */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>계약 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 0' }}>
          {contractInfo.map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: 12, color: '#888888' }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: (item as { valueColor?: string }).valueColor || '#191919' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 입주 계약서 */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="#7C3AED" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>입주 계약서</p>
            <p style={{ fontSize: 12, color: '#888888' }}>2025.09.28 서명완료 · PDF</p>
          </div>
          <ChevronRight size={18} color="#BBBBBB" />
        </button>
      </div>

      {/* 납부 내역 */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>납부 내역</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tenant.payments.map((p, i) => {
            const dotColor = p.status === 'paid' ? '#00B493' : p.status === 'late' ? '#D97706' : '#F04452';
            return (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{p.month} {p.type}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{formatWon(p.amount)}</p>
                    <p style={{ fontSize: 11, color: '#888888' }}>
                      {p.status === 'unpaid' ? '미납' : `${p.date} 납부`}
                      {p.lateDays ? ` (${p.lateDays}일 연체)` : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 활동 이력 */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>활동 이력</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tenant.activities.map((act, i) => {
            const iconInfo = activityIcons[act.icon] || activityIcons.repair;
            const Icon = iconInfo.icon;
            return (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: iconInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={iconInfo.color} />
                  </div>
                  {i < tenant.activities.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: '#F0F0F0', minHeight: 20 }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Chip type={act.status} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{act.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#888888' }}>{act.desc}</p>
                  <p style={{ fontSize: 11, color: '#BBBBBB', marginTop: 2 }}>{act.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 관리자 메모 */}
      <div style={{ background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>관리자 메모</h3>
          <button style={{ fontSize: 12, color: '#3182F6', fontWeight: 500 }}>편집</button>
        </div>
        <p style={{ fontSize: 14, color: '#191919', lineHeight: 1.6 }}>{tenant.memo}</p>
        <p style={{ fontSize: 11, color: '#BBBBBB', marginTop: 8 }}>마지막 수정 {tenant.memoUpdatedAt}</p>
      </div>
    </div>
  );
}
