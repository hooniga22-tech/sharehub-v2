'use client'

type ChipVariant = 'blue' | 'green' | 'red' | 'amber' | 'gray'

const variants = {
  blue: 'bg-[var(--blue-light)] text-[var(--blue)]',
  green: 'bg-[var(--green-light)] text-[var(--green)]',
  red: 'bg-[var(--red-light)] text-[var(--red)]',
  amber: 'bg-[var(--amber-light)] text-[var(--amber)]',
  gray: 'bg-[#F2F2F2] text-[var(--sub)]',
}

export function Chip({ label, variant = 'gray' }: { label: string; variant?: ChipVariant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {label}
    </span>
  )
}
