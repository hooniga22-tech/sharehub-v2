'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import DashboardMobile from './DashboardMobile';
import DashboardDesktop from './DashboardDesktop';

export default function HomePage() {
  const isMobile = useIsMobile();
  return isMobile ? <DashboardMobile /> : <DashboardDesktop />;
}
