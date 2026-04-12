import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `sup_${Date.now()}`
    await appendRow('비품신청', [
      id,
      body.token || '',
      body.tenantName || '',
      body.house || '',
      body.room || '',
      (body.items || []).join(', '),
      '',
      body.note || '',
      '접수',
      new Date().toISOString().split('T')[0],
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
