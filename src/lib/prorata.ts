// 해당 월 실제 일수 반환
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// 일할계산
export function calcProrata(rent: number, mgmt: number, moveInDay: number, year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = daysInMonth - moveInDay + 1;
  const dailyRate = (rent + mgmt) / daysInMonth;
  const total = Math.round(dailyRate * days);
  const dailyRent = Math.round(rent / daysInMonth * days);
  const dailyMgmt = Math.round(mgmt / daysInMonth * days);
  return { days, daysInMonth, dailyRate: Math.round(dailyRate), total, rentPart: dailyRent, mgmtPart: dailyMgmt };
}

// 이번 달 청구금액 계산 (입주일 기준)
export function getMonthlyCharge(rent: number, mgmt: number, moveInDate: string, targetYear: number, targetMonth: number): {
  amount: number;
  isProrata: boolean;
  detail?: ReturnType<typeof calcProrata>;
} {
  if (!moveInDate) return { amount: rent + mgmt, isProrata: false };
  const d = new Date(moveInDate);
  const moveYear = d.getFullYear();
  const moveMonth = d.getMonth() + 1;
  const moveDay = d.getDate();

  // 입주 첫 달인지 확인
  if (moveYear === targetYear && moveMonth === targetMonth && moveDay > 1) {
    const detail = calcProrata(rent, mgmt, moveDay, targetYear, targetMonth);
    return { amount: detail.total, isProrata: true, detail };
  }
  return { amount: rent + mgmt, isProrata: false };
}
