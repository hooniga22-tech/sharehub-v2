'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import VacancyMobile from './VacancyMobile';
import VacancyDesktop from './VacancyDesktop';

export default function VacancyPage() {
  const isMobile = useIsMobile();
  return isMobile ? <VacancyMobile /> : <VacancyDesktop />;
}
