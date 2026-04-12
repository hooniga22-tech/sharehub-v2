import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const { house, weeksAhead = 8 } = await req.json()

    // 입주중 입주자 (방코드 순)
    const tenantRows = await getSheetData('입주자')
    const tenants = tenantRows
      .filter(r => r[2] === house && (r[8] === '입주중' || r[8] === '계약중'))
      .sort((a, b) => (a[3] || '') > (b[3] || '') ? 1 : -1)

    // 청소 용역 날짜
    const workerRows = await getSheetData('용역')
    const cleanDates = workerRows
      .filter(r => r[2] === house && (r[4] || '').includes('청소'))
      .map(r => r[1] || '')

    // 기존 당번
    const dutyRows = await getSheetData('당번')
    const existing = dutyRows.filter(r => r[1] === house).map(r => r[2])

    // 이번주 월요일
    const today = new Date()
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    monday.setHours(0, 0, 0, 0)

    const newDuties = []
    let tenantIdx = 0

    for (let w = 0; w < weeksAhead; w++) {
      const weekStart = new Date(monday)
      weekStart.setDate(monday.getDate() + w * 7)
      const weekStartStr = weekStart.toISOString().split('T')[0]

      if (existing.includes(weekStartStr)) continue

      // 청소주 확인
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const isCleaningWeek = cleanDates.some(d => {
        const date = new Date(d)
        return date >= weekStart && date <= weekEnd
      })

      if (isCleaningWeek) {
        newDuties.push({ 지점명: house, 주차시작일: weekStartStr, 방코드: '', 입주자명: '', 당번유형: '청소주', 완료여부: '스킵' })
        continue
      }

      if (tenants.length === 0) continue

      const t = tenants[tenantIdx % tenants.length]
      newDuties.push({
        지점명: house, 주차시작일: weekStartStr,
        방코드: t[3] || '', 입주자명: t[5] || '',
        당번유형: '당번',
        완료여부: weekStartStr < today.toISOString().split('T')[0] ? '미완료' : '예정',
      })
      tenantIdx++
    }

    return NextResponse.json({ duties: newDuties, count: newDuties.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
