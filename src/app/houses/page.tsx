'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import HousesMobile from './HousesMobile';
import HousesDesktop from './HousesDesktop';

export default function HousesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <HousesMobile /> : <HousesDesktop />;
}
