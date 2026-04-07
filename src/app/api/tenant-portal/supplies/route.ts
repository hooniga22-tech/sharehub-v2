import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, items, memo } = body

    const tenantRows = await getSheetData('입주자')
    const tenant = tenantRows.find(r => r[14] === token)
    if (!tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]
    const id = `supply_${Date.now()}`
    await appendRow('비품신청', [
      id, tenant[0], tenant[4], tenant[2], tenant[3],
      items, 1, memo || '', '접수', today,
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
