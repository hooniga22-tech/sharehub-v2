import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function POST(req: Request) {
  try {
    const { house, weeksAhead = 8 } = await req.json()
    const supabase = createAdminClient()

    // 지점 ID
    const { data: branch } = await supabase.from('branches').select('id').eq('name', house).limit(1).single()
    if (!branch) return NextResponse.json({ duties: [], count: 0 })

    // 입주중 입주자 (방코드 순)
    const tenants = await listOrEmpty<any>(
      supabase.from('tenants').select('id, name, rooms(room_code)')
        .eq('branch_id', branch.id).in('status', ['active', 'contracted']).order('name')
    )
    tenants.sort((a: any, b: any) => ((a.rooms?.room_code || '') > (b.rooms?.room_code || '') ? 1 : -1))

    // 청소 용역 날짜
    const cleanRows = await listOrEmpty<any>(
      supabase.from('issues').select('scheduled_date, category')
        .eq('branch_id', branch.id).ilike('category', '%청소%')
    )
    const cleanDates = cleanRows.map((r: any) => r.scheduled_date || '')

    // 기존 당번 주차시작일
    const existingRows = await listOrEmpty<any>(
      supabase.from('duty_schedules').select('duty_week_start').eq('branch_id', branch.id)
    )
    const existing = existingRows.map((r: any) => r.duty_week_start)

    // 이번주 월요일
    const today = new Date()
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    monday.setHours(0, 0, 0, 0)

    const newDuties = []
    let tenantIdx = 0

    for (let w = 0; w < weeksAhead; w++) {
      const weekStart = new Date(monday)
      weekStart.setDate(monday.getDate() + w * 7)
      const weekStartStr = weekStart.toISOString().split('T')[0]

      if (existing.includes(weekStartStr)) continue

      // 청소주 확인
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const isCleaningWeek = cleanDates.some((d: string) => {
        const date = new Date(d)
        return date >= weekStart && date <= weekEnd
      })

      if (isCleaningWeek) {
        newDuties.push({ 지점명: house, 주차시작일: weekStartStr, 방코드: '', 입주자명: '', 당번유형: '청소주', 완료여부: '스킵' })
        continue
      }

      if (tenants.length === 0) continue

      const t = tenants[tenantIdx % tenants.length]
      newDuties.push({
        지점명: house, 주차시작일: weekStartStr,
        방코드: t.rooms?.room_code || '', 입주자명: t.name || '',
        당번유형: '당번',
        완료여부: weekStartStr < today.toISOString().split('T')[0] ? '미완료' : '예정',
      })
      tenantIdx++
    }

    return NextResponse.json({ duties: newDuties, count: newDuties.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
