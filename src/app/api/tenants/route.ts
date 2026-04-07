import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `tenant_${Date.now()}`
    const token = Math.random().toString(36).slice(2, 10)
    await appendRow('입주자', [
      id,
      body.roomId || '',
      body.houseName || '',
      body.roomCode || '',
      body.name || '',
      body.phone || '',
      body.rent || 0,
      body.managementFee || 0,
      body.deposit || 0,
      body.startDate || '',
      body.endDate || '',
      body.status || '입주중',
      body.nationality || '',
      body.memo || '',
      token,
    ])
    return NextResponse.json({ ok: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
