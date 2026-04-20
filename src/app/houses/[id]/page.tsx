'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import HouseDetailMobile from './HouseDetailMobile';
import HouseDetailDesktop from './HouseDetailDesktop';

export default function HouseDetailPage() {
  const isMobile = useIsMobile();
  return isMobile ? <HouseDetailMobile /> : <HouseDetailDesktop />;
}
