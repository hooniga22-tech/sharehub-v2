import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/layout/BottomNav'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ShareHub — 쉐어하우스 관리',
  description: '쉐어하우스 운영 관리 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKR.className}>
      <body style={{ background: '#e8e8e8' }}>
        <div
          style={{
            maxWidth: 430,
            margin: '0 auto',
            minHeight: '100vh',
            position: 'relative',
            background: '#F7F8FA',
          }}
        >
          {children}
          <BottomNav />
          <div style={{ height: 58 }} />
        </div>
      </body>
    </html>
  )
}
