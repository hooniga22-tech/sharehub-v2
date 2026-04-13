'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, AlertTriangle, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/tenants', label: '입주자', icon: Users },
  { href: '/issues', label: '이슈', icon: AlertTriangle },
  { href: '/manage', label: '관리', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const hideOnPaths = ['/houses', '/tenants/', '/issues/', '/apply', '/payments', '/workers', '/worker', '/utility', '/revenue', '/investor', '/vacancy', '/duty', '/opex', '/tenant', '/contract'];
  const isSubPage = hideOnPaths.some(
    (p) => pathname.startsWith(p) && pathname !== '/tenants' && pathname !== '/issues'
  );
  if (isSubPage) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 58,
        background: '#fff',
        borderTop: '1px solid #F0F0F0',
        zIndex: 50,
        display: 'flex',
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: active ? '#3182F6' : '#CCCCCC',
              fontWeight: active ? 700 : 400,
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 10 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
