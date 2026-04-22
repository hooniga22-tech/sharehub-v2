'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LogoutButton() {
  const router = useRouter()
  const pathname = usePathname()

  // 로그인 페이지, 포털, 신청 페이지에서는 숨김
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/apply') ||
    pathname.startsWith('/investor-portal') ||
    pathname.startsWith('/tenant') ||
    pathname.startsWith('/worker')
  ) {
    return null
  }

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        position: 'fixed',
        top: 12,
        right: 16,
        zIndex: 9999,
        padding: '6px 14px',
        background: '#FFFFFF',
        border: '1px solid #EAEDF0',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        color: '#4E5968',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4E5968" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      로그아웃
    </button>
  )
}
