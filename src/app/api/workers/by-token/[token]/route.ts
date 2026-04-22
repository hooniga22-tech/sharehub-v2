import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // 1. Supabase workers에서 토큰 매칭
    const { data: w, error } = await supabase
      .from('workers').select('*').eq('access_token', token).single()
    if (error || !w) return NextResponse.json({ error: 'invalid token' }, { status: 404 })

    const worker = { name: w.name, type: w.category || '', token: w.access_token || '' }

    // 2. Supabase branches에서 지점 정보 맵
    const branches = await listOrEmpty<any>(supabase.from('branches').select('name, address, door_code, memo'))
    type HouseInfo = { address: string; doorCode: string; houseMemo: string }
    const houseMap = new Map<string, HouseInfo>()
    for (const b of branches) {
      if (b.name) houseMap.set(b.name, { address: b.address || '', doorCode: b.door_code || '', houseMemo: b.memo || '' })
    }

    // 3. 용역 시트에서 스케줄 (Step 4.3에서 Supabase issues로 전환 예정)
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    const workSheet = await getSheetWithHeaders('용역')
    const wh = workSheet.headers
    const wcol = (name: string) => colIdx(wh, name)
    const wcell = (r: string[], i: number) => (i >= 0 ? (r[i] || '') : '')
    const wIdId = wcol('용역ID'), wIdDate = wcol('예정일'), wIdHouse = wcol('지점명')
    const wIdWorker = wcol('담당자명'), wIdType = wcol('작업종류'), wIdAmount = wcol('정산금액')
    const wIdMemo = wcol('메모'), wIdDone = wcol('완료여부'), wIdRequest = wcol('요청사항')

    let schedules = workSheet.rows
      .map(r => {
        const houseName = wcell(r, wIdHouse)
        const hi = houseMap.get(houseName.trim()) || { address: '', doorCode: '', houseMemo: '' }
        return {
          id: wcell(r, wIdId), date: wcell(r, wIdDate), houseName,
          workerName: wcell(r, wIdWorker), type: wcell(r, wIdType),
          amount: Number(wcell(r, wIdAmount)) || 0, memo: wcell(r, wIdMemo),
          request: wcell(r, wIdRequest), isDone: wcell(r, wIdDone) === 'Y',
          address: hi.address, doorCode: hi.doorCode, houseMemo: hi.houseMemo,
        }
      })
      .filter(s => s.workerName === worker.name)

    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      schedules = schedules.filter(s => s.date.startsWith(prefix))
    }
    schedules.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ worker, schedules })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
