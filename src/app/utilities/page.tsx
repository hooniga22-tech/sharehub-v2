'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import UtilitiesMobile from './UtilitiesMobile';
import UtilitiesDesktop from './UtilitiesDesktop';

export default function UtilitiesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <UtilitiesMobile /> : <UtilitiesDesktop />;
}
