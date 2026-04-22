import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const decoded = decodeURIComponent(slug)
    const supabase = createAdminClient()

    // 지점 조회 (name 또는 id로)
    const branches = await listOrEmpty<any>(supabase.from('branches').select('*'))
    const branch = branches.find(b => b.name?.trim() === decoded || b.id === decoded)
    if (!branch) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // 활성 입주자 수
    const tenants = await listOrEmpty<any>(
      supabase.from('tenants').select('id, rooms!inner(branch_id)').eq('status', 'active')
    )
    const activeCount = tenants.filter(t => t.rooms?.branch_id === branch.id).length

    return NextResponse.json({
      id: branch.id, name: branch.name, district: branch.district || '',
      address: branch.address || '', doorPassword: branch.door_code || '',
      wifiSsid: branch.wifi_ssid || '', wifiPassword: branch.wifi_password || '',
      landlordName: branch.landlord_name || '', memo: branch.memo || '', activeCount,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
