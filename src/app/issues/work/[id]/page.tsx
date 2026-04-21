'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import IssueWorkDetailMobile from './IssueWorkDetailMobile';
import IssueWorkDetailDesktop from './IssueWorkDetailDesktop';

export default function WorkDetailPage() {
  const isMobile = useIsMobile();
  return isMobile ? <IssueWorkDetailMobile /> : <IssueWorkDetailDesktop />;
}
