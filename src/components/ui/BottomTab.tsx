'use client'

import { useState, useEffect } from 'react'
import { Home, Users, AlertCircle, Building2, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/tenants', label: '입주자', icon: Users },
  { href: '/issues', label: '이슈', icon: AlertCircle },
  { href: '/houses', label: '지점', icon: Building2 },
  { href: '/finance', label: '관리', icon: BarChart2 },
]

export function BottomTab() {
  const pathname = usePathname()
  const [issueCount, setIssueCount] = useState(0)

  useEffect(() => {
    fetch('/api/issues')
      .then(r => r.json())
      .then(d => {
        const count = (d.issues || []).filter((i: { status: string }) => i.status !== '완료').length
        setIssueCount(count)
      })
      .catch(() => {})
  }, [pathname])

  return (
    <div className="flex bg-[var(--card)] border-t border-[var(--border)]">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-2.5 pb-4 relative">
            <div className="relative">
              <Icon size={20} color={active ? 'var(--blue)' : 'var(--sub)'} strokeWidth={active ? 2.5 : 2} />
              {href === '/issues' && issueCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[var(--red)] text-white text-[9px] font-bold px-1">
                  {issueCount > 99 ? '99+' : issueCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] ${active ? 'text-[var(--blue)]' : 'text-[var(--sub)]'}`}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
