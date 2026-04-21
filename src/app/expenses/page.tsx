'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import ExpensesMobile from './ExpensesMobile';
import ExpensesDesktop from './ExpensesDesktop';

export default function ExpensesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <ExpensesMobile /> : <ExpensesDesktop />;
}
