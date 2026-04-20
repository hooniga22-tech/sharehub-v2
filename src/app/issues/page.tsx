'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import IssuesMobile from './IssuesMobile';
import IssuesDesktop from './IssuesDesktop';

export default function IssuesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <IssuesMobile /> : <IssuesDesktop />;
}
