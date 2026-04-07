'use client'
import { useState } from 'react'

export type Lang = 'ko' | 'en'

export function useLang(defaultLang: Lang = 'ko') {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const toggle = () => setLang(l => l === 'ko' ? 'en' : 'ko')
  const t = (ko: string, en: string) => lang === 'ko' ? ko : en
  return { lang, toggle, t }
}
