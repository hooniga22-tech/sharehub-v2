'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import TenantsMobile from './TenantsMobile';
import TenantsDesktop from './TenantsDesktop';

export default function TenantsPage() {
  const isMobile = useIsMobile();
  return isMobile ? <TenantsMobile /> : <TenantsDesktop />;
}
