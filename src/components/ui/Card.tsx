import clsx from 'clsx'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const hasBg = className.includes('bg-')
  return (
    <div className={clsx(!hasBg && 'bg-[var(--card)]', 'rounded-2xl', className)}>
      {children}
    </div>
  )
}
