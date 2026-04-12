'use client';

import Link from 'next/link';
import { manageMenus } from '@/lib/mockData';
import { Home, Wrench, CalendarDays, ClipboardList, TrendingUp, CreditCard, BarChart3, Receipt, Zap, ChevronRight } from 'lucide-react';

const iconMap: Record<string, typeof Home> = {
  vacancy: Home, worker: Wrench, duty: CalendarDays, applications: ClipboardList, investors: TrendingUp,
  payment: CreditCard, profit: BarChart3, expense: Receipt, utility: Zap,
};

export default function ManagePage() {
  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>관리</h1>
      </div>

      {/* 운영 관리 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#888888', marginBottom: 8 }}>운영 관리</p>
        <div style={{ background: '#fff', borderRadius: 16 }}>
          {manageMenus.operation.map((menu, i) => {
            const Icon = iconMap[menu.slug] || Home;
            return (
              <div key={menu.slug}>
                {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 16px' }} />}
                <Link href={menu.slug === 'applications' ? '/apply' : menu.slug === 'worker' ? '/workers' : menu.slug === 'investors' ? '/investors' : menu.slug === 'vacancy' ? '/vacancy' : menu.slug === 'duty' ? '/duty' : `/manage/${menu.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: menu.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={menu.iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>{menu.name}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{menu.desc}</p>
                  </div>
                  {menu.badge && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: menu.slug === 'vacancy' ? '#FFF8E8' : '#EEF3FF',
                      color: menu.slug === 'vacancy' ? '#D97706' : '#3182F6',
                    }}>
                      {menu.badge}
                    </span>
                  )}
                  <ChevronRight size={18} color="#BBBBBB" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* 수납·정산 */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#888888', marginBottom: 8 }}>수납 · 정산</p>
        <div style={{ background: '#fff', borderRadius: 16 }}>
          {manageMenus.finance.map((menu, i) => {
            const Icon = iconMap[menu.slug] || CreditCard;
            return (
              <div key={menu.slug}>
                {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 16px' }} />}
                <Link href={menu.slug === 'payment' ? '/payments' : menu.slug === 'utility' ? '/utility' : menu.slug === 'profit' ? '/revenue' : menu.slug === 'expense' ? '/opex' : `/manage/${menu.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: menu.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={menu.iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>{menu.name}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>{menu.desc}</p>
                  </div>
                  {menu.badge && (
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#FFF0F0', color: '#F04452' }}>
                      {menu.badge}
                    </span>
                  )}
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
