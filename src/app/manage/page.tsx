'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import ManageMobile from './ManageMobile';
import ManageDesktop from './ManageDesktop';

export default function ManagePage() {
  const isMobile = useIsMobile();
  return isMobile ? <ManageMobile /> : <ManageDesktop />;
}
