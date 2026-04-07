'use client'
import { Lang } from '@/hooks/useLang'

export default function LangToggle({ lang, toggle }: { lang: Lang; toggle: () => void }) {
  return (
    <button onClick={toggle}
      className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
      <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
        lang === 'ko' ? 'bg-white text-[#191919] shadow-sm' : 'text-[#888]'
      }`}>한국어</span>
      <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
        lang === 'en' ? 'bg-white text-[#191919] shadow-sm' : 'text-[#888]'
      }`}>English</span>
    </button>
  )
}
