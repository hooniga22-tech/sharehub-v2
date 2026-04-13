import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, title, content, category } = body

    const tenantRows = await getSheetData('입주자')
    // 입주자: [0]ID [2]지점명 [3]방코드 [5]이름 [19]링크토큰
    const tenant = tenantRows.find(r => r[19] === token)
    if (!tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const id = `issue_${Date.now()}`
    const today = new Date().toISOString().split('T')[0]
    await appendRow('이슈', [
      id, tenant[2], tenant[3], title, content,
      category || '민원', '접수', '', today, '', 0,
      `입주자 신청: ${tenant[5]}`,
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
