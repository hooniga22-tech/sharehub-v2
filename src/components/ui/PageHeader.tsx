'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PageHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-[var(--card)] border-b border-[var(--border)]">
      <button onClick={() => router.back()} className="text-[var(--text)]">
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>
      <h1 className="text-[17px] font-bold text-[var(--text)] flex-1">{title}</h1>
      {right}
    </div>
  )
}
