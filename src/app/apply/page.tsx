'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Sparkles, Snowflake, Package, DoorOpen, ChevronRight } from 'lucide-react';

const items = [
  { icon: Home, iconBg: '#EEF3FF', iconColor: '#3182F6', title: '투어 신청', desc: '쉐어하우스 방문 투어 예약', href: '/apply/tour' },
  { icon: Sparkles, iconBg: '#E8FBF5', iconColor: '#00B493', title: '방청소 신청', desc: '입주 중 방 청소 요청', href: '/apply/cleaning' },
  { icon: Snowflake, iconBg: '#EEF3FF', iconColor: '#3182F6', title: '에어컨 청소 신청', desc: '에어컨 분해 청소 신청', href: '/apply/aircon' },
  { icon: Package, iconBg: '#FFF8E8', iconColor: '#D97706', title: '물품 신청', desc: '생활용품 보충 요청', href: '/apply/supplies' },
  { icon: DoorOpen, iconBg: '#FFF5F5', iconColor: '#F04452', title: '퇴실 신청', desc: '퇴실 절차 및 보증금 환급', href: '/apply/checkout' },
];

export default function ApplyListPage() {
  const router = useRouter();

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>신청서</span>
      </div>

      {/* Menu Card */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ background: '#fff', borderRadius: 16 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 16px' }} />}
                <Link href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={item.iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: '#888888', margin: 0 }}>{item.desc}</p>
                  </div>
                  <ChevronRight size={18} color="#BBBBBB" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
