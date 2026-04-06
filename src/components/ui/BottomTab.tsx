'use client'

import { Home, Users, AlertCircle, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/tenants', label: '입주자', icon: Users },
  { href: '/issues', label: '이슈', icon: AlertCircle },
  { href: '/finance', label: '정산', icon: BarChart2 },
]

export function BottomTab() {
  const pathname = usePathname()
  return (
    <div className="flex bg-[var(--card)] border-t border-[var(--border)]">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-2.5 pb-4">
            <Icon size={22} color={active ? 'var(--blue)' : 'var(--sub)'} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] ${active ? 'text-[var(--blue)]' : 'text-[var(--sub)]'}`}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
