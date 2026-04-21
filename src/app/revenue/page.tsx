'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import RevenueMobile from './RevenueMobile';
import RevenueDesktop from './RevenueDesktop';

export default function RevenuePage() {
  const isMobile = useIsMobile();
  return isMobile ? <RevenueMobile /> : <RevenueDesktop />;
}
