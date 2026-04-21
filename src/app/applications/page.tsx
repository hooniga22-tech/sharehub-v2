'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import ApplicationsMobile from './ApplicationsMobile';
import ApplicationsDesktop from './ApplicationsDesktop';

export default function ApplicationsPage() {
  const isMobile = useIsMobile();
  return isMobile ? <ApplicationsMobile /> : <ApplicationsDesktop />;
}
