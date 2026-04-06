import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '쉐어하우스 관리',
  description: '쉐어하우스 운영 관리 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="max-w-[430px] mx-auto min-h-screen bg-[var(--bg)] relative">
          {children}
        </div>
      </body>
    </html>
  )
}
