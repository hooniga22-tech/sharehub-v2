'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import DutyMobile from './DutyMobile';
import DutyDesktop from './DutyDesktop';

export default function DutyPage() {
  const isMobile = useIsMobile();
  return isMobile ? <DutyMobile /> : <DutyDesktop />;
}
