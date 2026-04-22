import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import * as XLSX from 'xlsx'
import { requireAdmin } from '@/lib/auth-helpers'

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet)

    const supabase = createAdminClient()
    const tenantRows = await listOrEmpty<any>(
      supabase.from('tenants').select('id, name, monthly_rent, phone, rooms(room_code, branches(name, district))').eq('status', 'active')
    )
    const tenants = tenantRows.map(t => ({
      id: t.id, name: t.name || '', house: t.rooms?.branches?.name || '',
      room: t.rooms?.room_code || '', rent: t.monthly_rent || 0,
      district: t.rooms?.branches?.district || '', phone: t.phone || '',
    }))

    const results = rows.map((row, i) => {
      const sender = String(row['입금자명'] || row['보내는분'] || row['이름'] || '').trim()
      const amount = Number(row['금액'] || row['입금액'] || row['거래금액'] || 0)
      const date = String(row['날짜'] || row['거래일'] || row['입금일'] || '')

      const exactMatch = tenants.find(t => t.name === sender && t.rent === amount)
      if (exactMatch) return { id: `match_${i}`, sender, amount, date, matchType: 'confirmed' as const, matchedTenant: exactMatch, confidence: '완전일치' }

      const nameMatch = tenants.find(t => t.name === sender)
      if (nameMatch) return { id: `match_${i}`, sender, amount, date, matchType: 'review_amount' as const, matchedTenant: nameMatch, confidence: '금액불일치' }

      const partialMatch = tenants.find(t => sender.includes(t.name) || t.name.includes(sender))
      if (partialMatch) return { id: `match_${i}`, sender, amount, date, matchType: 'review_name' as const, matchedTenant: partialMatch, confidence: '이름유사' }

      return { id: `match_${i}`, sender, amount, date, matchType: 'unmatched' as const, matchedTenant: null, confidence: null }
    })

    return NextResponse.json({
      total: results.length,
      confirmed: results.filter(r => r.matchType === 'confirmed').length,
      review: results.filter(r => r.matchType === 'review_name' || r.matchType === 'review_amount').length,
      unmatched: results.filter(r => r.matchType === 'unmatched').length,
      results,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
