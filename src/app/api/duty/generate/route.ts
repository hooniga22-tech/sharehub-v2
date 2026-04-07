import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addWeeks(date: Date, weeks: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}
function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

export async function POST(req: Request) {
  try {
    const { houseName, weeksAhead = 12, workerWeeks = [] } = await req.json()

    const tenantRows = await getSheetData('입주자')
    const existingDuty = await getSheetData('당번')

    const activeTenants = tenantRows
      .filter(r => r[2]?.trim() === houseName && r[11] === '입주중')
      .map(r => ({ id: r[0], name: r[4], roomCode: r[3] }))

    if (activeTenants.length === 0) {
      return NextResponse.json({ error: '활성 입주자 없음' }, { status: 400 })
    }

    const existingWeeks = new Set(
      existingDuty.filter(r => r[1]?.trim() === houseName).map(r => r[5])
    )

    const startMonday = getMonday(new Date())
    const results = []
    let tenantIdx = 0

    for (let w = 0; w < weeksAhead; w++) {
      const weekStart = addWeeks(startMonday, w)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const wsStr = fmtDate(weekStart)
      const weStr = fmtDate(weekEnd)

      if (existingWeeks.has(wsStr)) continue

      if (workerWeeks.includes(wsStr)) {
        const id = `duty_${Date.now()}_${w}`
        await appendRow('당번', [id, houseName, '', '', '', wsStr, weStr, 'Y', '', 'N', '청소용역'])
        await new Promise(r => setTimeout(r, 80))
        results.push({ weekStart: wsStr, type: 'skip_worker' })
        continue
      }

      const tenant = activeTenants[tenantIdx % activeTenants.length]
      tenantIdx++
      const id = `duty_${Date.now()}_${w}`
      await appendRow('당번', [id, houseName, tenant.id, tenant.name, tenant.roomCode, wsStr, weStr, 'N', '', 'N', ''])
      await new Promise(r => setTimeout(r, 80))
      results.push({ weekStart: wsStr, tenantName: tenant.name, type: 'assigned' })
    }

    return NextResponse.json({ ok: true, count: results.length, results })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
