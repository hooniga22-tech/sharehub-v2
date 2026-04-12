import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [year, m] = month.split('-')
    const targetMonth = `${year}-${m}`

    // Get tenants and payment data
    const [tenantRows, paymentRows] = await Promise.all([
      getSheetData('입주자'),
      getSheetData('납부'),
    ])

    // Parse tenants (active only)
    const tenants = tenantRows
      .filter(r => r[8] === '입주중' || r[8] === '계약중')
      .map(r => ({
        id: r[0] || '',
        district: r[1] || '',
        house: r[2] || '',
        roomCode: r[3] || '',
        name: r[5] || '',
        rent: Number(r[9]) || 0,
        deposit: Number(r[10]) || 0,
        phone: r[12] || '',
        paymentDay: 1,
      }))

    // Parse payments for this month
    const payments = paymentRows
      .filter(r => (r[6] || '').startsWith(targetMonth))
      .map(r => ({
        id: r[0] || '',
        tenantId: r[1] || '',
        tenantName: r[2] || '',
        houseName: r[3] || '',
        roomCode: r[4] || '',
        type: r[5] || '',
        dueDate: r[6] || '',
        rent: Number(r[7]) || 0,
        mgmtFee: Number(r[8]) || 0,
        rentPaid: r[9] === 'Y',
        mgmtPaid: r[10] === 'Y',
      }))

    // Build per-tenant status
    const tenantPayments = tenants.map(t => {
      const tp = payments.filter(p => p.tenantId === t.id)
      const hasPaid = tp.some(p => p.rentPaid)
      const dueDate = tp[0]?.dueDate || `${targetMonth}-01`
      const lateDays = !hasPaid ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)) : 0

      return {
        ...t,
        status: hasPaid ? 'paid' as const : 'unpaid' as const,
        lateDays,
        monthlyRent: t.rent,
      }
    })

    const unpaid = tenantPayments.filter(t => t.status === 'unpaid')
    const paid = tenantPayments.filter(t => t.status === 'paid')

    return NextResponse.json({
      month: targetMonth,
      total: tenantPayments.length,
      unpaidCount: unpaid.length,
      paidCount: paid.length,
      unpaidAmount: unpaid.reduce((s, t) => s + t.monthlyRent, 0),
      paidAmount: paid.reduce((s, t) => s + t.monthlyRent, 0),
      rate: tenantPayments.length > 0 ? Math.round((paid.length / tenantPayments.length) * 100) : 0,
      tenants: tenantPayments,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
