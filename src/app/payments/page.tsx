'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import PaymentsMobile from './PaymentsMobile';
import PaymentsDesktop from './PaymentsDesktop';

export default function PaymentsPage() {
  const isMobile = useIsMobile();
  return isMobile ? <PaymentsMobile /> : <PaymentsDesktop />;
}
