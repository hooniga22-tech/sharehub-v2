import { NextRequest, NextResponse } from 'next/server'

const ACCESS_KEY = process.env.CHANNEL_ACCESS_KEY!
const ACCESS_SECRET = process.env.CHANNEL_ACCESS_SECRET!

async function getChannelToken() {
  const res = await fetch('https://api.channel.io/public/v1/access-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessKey: ACCESS_KEY, accessSecret: ACCESS_SECRET }),
  })
  const data = await res.json()
  return data.accessToken
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, houseName } = await req.json()
    if (!name || !phone) {
      return NextResponse.json({ error: '이름과 연락처가 필요합니다' }, { status: 400 })
    }

    const token = await getChannelToken()

    // 채널톡에서 전화번호로 고객 검색
    const searchRes = await fetch(
      `https://api.channel.io/public/v1/users?mobileNumber=${encodeURIComponent(phone)}`,
      { headers: { 'x-access-token': token } }
    )
    const searchData = await searchRes.json()
    const user = searchData.users?.[0]

    if (!user) {
      return NextResponse.json({ error: '채널톡에서 고객을 찾을 수 없습니다. 먼저 채팅을 시작한 고객만 가능합니다.' }, { status: 404 })
    }

    // 기존 태그 유지 + 입주자 + 하우스명 추가
    const existingTags = user.tags || []
    const newTags = Array.from(new Set([...existingTags, '입주자', ...(houseName ? [houseName] : [])]))

    await fetch(`https://api.channel.io/public/v1/users/${user.id}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-access-token': token },
      body: JSON.stringify({ tags: newTags }),
    })

    return NextResponse.json({ success: true, userId: user.id, name: user.name, tags: newTags })
  } catch (e) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
