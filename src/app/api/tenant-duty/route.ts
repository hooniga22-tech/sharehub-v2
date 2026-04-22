import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    const roomCode = searchParams.get('roomCode')

    if (!house) return NextResponse.json({ error: 'house 필요' }, { status: 400 })

    const supabase = createAdminClient()
    const branches = await listOrEmpty<any>(supabase.from('branches').select('id').eq('name', house))
    const branchId = branches[0]?.id
    if (!branchId) return NextResponse.json({ duties: [], myRoomCode: roomCode || '' })

    const rows = await listOrEmpty<any>(
      supabase.from('duty_schedules').select('*, tenants(name, rooms(room_code))').eq('branch_id', branchId).order('duty_week_start')
    )

    const duties = rows.map(r => ({
      당번ID: r.id || '', 지점명: house, 주차시작일: r.duty_week_start || '',
      방코드: r.tenants?.rooms?.room_code || '', 입주자명: r.tenants?.name || '',
      당번유형: '당번', 완료여부: '예정', 완료일시: '', 완료처리자: '', 면제사유: '',
    }))

    return NextResponse.json({ duties, myRoomCode: roomCode || '' })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
