import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const houseId = searchParams.get('houseId')
    const houseName = searchParams.get('houseName')

    const supabase = createAdminClient()
    let query = supabase.from('rooms').select('*, branches!inner(name)').order('room_code')

    if (houseId) query = query.eq('branch_id', houseId)
    if (houseName) query = query.eq('branches.name', houseName)

    const rows = await listOrEmpty<any>(query)

    const rooms = rows.map((r: any, i: number) => ({
      _rowIndex: i,
      id: r.id || '',
      houseId: r.branch_id || '',
      houseName: r.branches?.name || '',
      roomCode: r.room_code || '',
      roomType: r.room_type || '',
      area: r.area || '',
      baseRent: r.base_rent || 0,
      memo: r.memo || '',
    }))

    return NextResponse.json(rooms)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
