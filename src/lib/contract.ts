// 일할계산
export function calcProrated(moveInDate: string, monthlyRent: number, maintenanceFee: number) {
  if (!moveInDate) return { proratedRent: monthlyRent, proratedMaint: maintenanceFee, remainDays: 0, totalDays: 0 }
  const d = new Date(moveInDate)
  const totalDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const remainDays = totalDays - d.getDate() + 1
  return {
    proratedRent: Math.round((monthlyRent / totalDays) * remainDays),
    proratedMaint: Math.round((maintenanceFee / totalDays) * remainDays),
    remainDays,
    totalDays,
  }
}

// 잔금계산
export function calcBalance(deposit: number, contractDeposit: number, proratedRent: number, proratedMaint: number, discount: number) {
  return deposit - contractDeposit + proratedRent + proratedMaint - (discount || 0)
}

// 계약 진행률
export function calcContractProgress(start: string, end: string) {
  if (!start || !end) return { percent: 0, daysLeft: 0, totalDays: 0, elapsed: 0 }
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const now = Date.now()
  const totalDays = Math.ceil((e - s) / 86400000)
  const elapsed = Math.ceil((now - s) / 86400000)
  const daysLeft = Math.max(0, Math.ceil((e - now) / 86400000))
  const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)))
  return { percent, daysLeft, totalDays, elapsed }
}

// 금액 포맷
export function won(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n || 0) + '원'
}
