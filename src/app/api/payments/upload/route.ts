import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import * as XLSX from 'xlsx'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

    // Parse Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet)

    // Get tenant list
    const tenantRows = await getSheetData('입주자')
    const tenants = tenantRows
      .filter(r => r[8] === '입주중' || r[8] === '계약중')
      .map(r => ({
        id: r[0] || '',
        name: r[5] || '',
        house: r[2] || '',
        room: r[3] || '',
        rent: Number(r[9]) || 0,
        district: r[1] || '',
        phone: r[12] || '',
      }))

    // Match each row
    const results = rows.map((row, i) => {
      const sender = String(row['입금자명'] || row['보내는분'] || row['이름'] || '').trim()
      const amount = Number(row['금액'] || row['입금액'] || row['거래금액'] || 0)
      const date = String(row['날짜'] || row['거래일'] || row['입금일'] || '')

      // Try matching
      // 1. Exact name + amount match
      const exactMatch = tenants.find(t => t.name === sender && t.rent === amount)
      if (exactMatch) {
        return {
          id: `match_${i}`,
          sender,
          amount,
          date,
          matchType: 'confirmed' as const,
          matchedTenant: exactMatch,
          confidence: '완전일치',
        }
      }

      // 2. Exact name, different amount
      const nameMatch = tenants.find(t => t.name === sender)
      if (nameMatch) {
        return {
          id: `match_${i}`,
          sender,
          amount,
          date,
          matchType: 'review_amount' as const,
          matchedTenant: nameMatch,
          confidence: '금액불일치',
        }
      }

      // 3. Partial name match (contains)
      const partialMatch = tenants.find(t => sender.includes(t.name) || t.name.includes(sender))
      if (partialMatch) {
        return {
          id: `match_${i}`,
          sender,
          amount,
          date,
          matchType: 'review_name' as const,
          matchedTenant: partialMatch,
          confidence: '이름유사',
        }
      }

      // 4. Unmatched
      return {
        id: `match_${i}`,
        sender,
        amount,
        date,
        matchType: 'unmatched' as const,
        matchedTenant: null,
        confidence: null,
      }
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
