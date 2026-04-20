'use client';

import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint: number = 1024): boolean {
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  // 마운트 전에는 모바일로 취급 (기존 동작과 동일하게 유지)
  if (!mounted) return true;
  return isMobile;
}
