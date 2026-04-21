# ShareHub v2 — 프로젝트 컨텍스트

## 1. 개요
- **스택**: Next.js 16 + TypeScript + React 19 + Google Sheets (백엔드)
- **경로**: /Users/jay/sharehub-v2
- **배포**: sharehub-v2.vercel.app (git push → Vercel 자동 배포)
- **GitHub**: hooniga22-tech/sharehub-v2
- **주요 의존성**: googleapis, swr, lucide-react, xlsx, @notionhq/client

## 2. 프로젝트 구조

### 디렉토리 맵
```
src/
├── app/                    # Next.js App Router 페이지
│   ├── api/                # API Routes (65+ 엔드포인트)
│   ├── apply/              # 공개 신청 폼 5종 (tour/cleaning/aircon/checkout/supplies)
│   ├── applications/       # 신청서 관리 (관리자)
│   ├── duty/               # 당번 관리
│   ├── expenses/           # 지출 관리
│   ├── houses/             # 지점 관리 + [id] 상세
│   ├── investor/           # 투자자 포털 [token]
│   ├── investor-portal/    # 투자자 포털 (구버전)
│   ├── investors/          # 투자자 관리 (관리자)
│   ├── issues/             # 일정/이슈 + work/[id] 상세
│   ├── manage/             # 관리 허브
│   ├── management/workers/ # 담당자 관리 + [id] 상세 + new
│   ├── payments/           # 수납 관리 + platform/ + upload/
│   ├── revenue/            # 수익 현황
│   ├── tenant/             # 입주자 포털 [token]
│   ├── tenants/            # 입주자 관리 + [id] 상세
│   ├── utilities/          # 공과금 관리
│   ├── vacancy/            # 공실 관리
│   ├── DashboardMobile.tsx / DashboardDesktop.tsx  # 홈 대시보드
│   ├── page.tsx            # 홈 라우터
│   └── layout.tsx          # 전역 레이아웃 (BottomNav 포함)
├── components/
│   ├── layout/BottomNav.tsx  # 모바일 하단 탭바 (zIndex: 50)
│   ├── TenantTimeline.tsx    # 간트 차트 컴포넌트
│   └── ui/                   # Chip 등 공통 UI
├── lib/
│   ├── sheets.ts             # Google Sheets CRUD 헬퍼
│   ├── useIsMobile.ts        # 1024px breakpoint 훅
│   ├── fetcher.ts            # SWR fetcher
│   └── timeline.ts           # 간트 타임라인 빌더
└── types/
    ├── timeline.ts           # 간트 타입 (TenantSpan, HouseTimeline 등)
    └── worker.ts             # 담당자 타입
```

### PC/모바일 분리 페이지 (13쌍)

| 경로 | Mobile | Desktop | 비고 |
|---|---|---|---|
| `/` | DashboardMobile | DashboardDesktop | 캘린더 + KPI + 미처리신청 |
| `/issues` | IssuesMobile | IssuesDesktop | 3탭(일정/담당자/정산), hideChrome prop |
| `/issues/work/[id]` | IssueWorkDetailMobile | IssueWorkDetailDesktop | 편집모드 토글 |
| `/tenants` | TenantsMobile | TenantsDesktop | 간트+표 토글, 상세패널 |
| `/payments` | PaymentsMobile | PaymentsDesktop | 4탭(현황/미납/매칭/플랫폼) |
| `/houses` | HousesMobile | HousesDesktop → HousesPcLayout | 마스터-디테일 공유 |
| `/houses/[id]` | HouseDetailMobile | HouseDetailDesktop → HousesPcLayout | selectedHouseId prop |
| `/manage` | ManageMobile | ManageDesktop | 3섹션 대시보드 |
| `/utilities` | UtilitiesMobile | UtilitiesDesktop | 일괄입력 테이블 |
| `/expenses` | ExpensesMobile | ExpensesDesktop | 좌 폼+우 리스트 |
| `/vacancy` | VacancyMobile | VacancyDesktop | 구 사이드+카드 그리드 |
| `/applications` | ApplicationsMobile | ApplicationsDesktop | 5종 통합 인박스 |
| `/duty` | DutyMobile | DutyDesktop | 마스터-디테일 |

### 미분리 페이지 (PC도 모바일 UI 그대로)
- `/payments/platform`, `/payments/upload`, `/revenue`, `/investors`
- `/management/workers`, `/management/workers/[id]`, `/management/workers/new`
- `/tenant/[token]`, `/investor/[token]`, `/worker/[token]`
- `/apply/*` (공개 신청 폼 5종)

## 3. Google Sheets 스키마

스프레드시트 ID: 환경변수 `GOOGLE_SHEETS_ID`

### 주요 시트 탭

| 시트 탭 | 컬럼 (0-based) |
|---|---|
| **입주자** | [0]입주자ID [1]구 [2]지점명 [3]방코드 [4]방타입 [5]이름 [6]입주일 [7]퇴실일 [8]상태 [9]보증금 [10]월세 [11]관리비 [12]메모 [13]연락처 [14]생년월일 [15]주소 [16]투자자 [17]투자자계좌 [18]투자자연락처 [19]링크토큰 |
| **수납** | [0]수납ID [1]입주자ID [2]지점명 [3]방코드 [4]이름 [5]연월 [6]청구액 [7]납부액 [8]납부일 [9]상태 [10]납부방법 [11]메모 |
| **지점** | [0]지점ID [1]지점명 [2]구 [3]주소 [4]현관비번 [5]와이파이SSID [6]와이파이PW [7]집월세 [8]투자자토큰 [9]총방수 [10]건물주명 [11]건물주연락처 [12]메모 |
| **방** | [0]id [1]houseId [2]houseName [3]roomCode [4]roomType [5]area [6]baseRent [7]memo |
| **이슈** | [0]이슈ID [1]지점명 [2]방코드 [3]제목 [4]내용 [5]카테고리 [6]상태 [7]담당자 [8]등록일 [9]완료일 [10]비용 [11]메모 |
| **용역** | 헤더 기반 파싱 — 용역ID/예정일/지점명/담당자명/작업종류/정산금액/메모/요청사항/완료여부/완료일 |
| **용역담당자** | 헤더 기반 — 담당자ID/이름/연락처/계좌번호/은행명/예금주/분야/상태/구분/링크토큰/기본금액/활동시작일/메모 |
| **운영지출** | [0]지출ID [1]날짜 [2]유형 [3]지점명 [4]카테고리 [5]금액 [6]메모 |
| **공과금** | [0]ID [1]지점명 [2]연도 [3]월 [4]전기 [5]가스 [6]수도 [7]인터넷 [8]정수기 [9]메모 [10]청소 [11]기타 [12]합계메모 [13]입력일 |
| **당번** | [0]당번ID [1]지점명 [2]주차시작일 [3]방코드 [4]입주자명 [5]당번유형 [6]완료여부 [7]완료일시 [8]완료처리자 [9]면제여부 [10]면제사유 [11]메모 |
| **투자자** | [0]투자자ID [1]투자자명 [2]연락처 [3]계좌정보 [4]생년월일 [5]링크토큰 [6]메모 |
| **투자지점** | [0]투자ID [1]투자자ID [2]투자자명 [3]지점명 [4]투자자비율 [5]유재훈비율 [6]공동여부 [7]메모 |

### 신청 5종 시트 (컬럼 구조 각각 다름)

| 시트 | name 위치 | status 위치 | createdAt 위치 |
|---|---|---|---|
| 투어신청 | [1] | [13] | [14] |
| 방청소신청 | [1] | [7] | [8] |
| 에어컨신청 | [1] | [9] | [10] |
| 퇴실신청 | [1] | [6] | [7] |
| 비품신청 | [2] tenantName | [7] | [8] |

## 4. 디자인 규칙 (엄수)

### 절대 규칙
- **inline `style={{}}` only** — Tailwind `className` 절대 금지
- **이모지 금지** — 모든 아이콘은 SVG (인라인 또는 lucide-react)
- **Mobile 파일 수정 금지** (Desktop 작업 시 데이터 로직 복붙만 허용)

### 디자인 토큰 T
```typescript
const T = {
  bg: '#F2F4F6',       // 배경
  card: '#FFFFFF',      // 카드 배경
  text: '#191F28',      // 메인 텍스트
  textSub: '#4E5968',   // 서브 텍스트
  textMute: '#8B95A1',  // 음소거 텍스트
  blue: '#3182F6',      // 프라이머리
  blueLight: '#E6F0FE', // 프라이머리 배경
  blueDark: '#1B64DA',  // 프라이머리 진한
  blueVeryLight: '#F0F7FF',
  blueGrad: 'linear-gradient(135deg, #3182F6 0%, #2772E3 100%)',
  green: '#00B493',     greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825',    orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  purple: '#8B5CF6',    purpleLight: '#EDE4FF', purpleDark: '#6D28D9',
  red: '#F04438',       redLight: '#FFE5E5',   redDark: '#B42318',
  line: '#EAEDF0',      // 구분선
  divider: '#F2F4F6',   // 얇은 구분선
};
```

### PC Desktop 공통
- `position: fixed` + `zIndex: 51` (BottomNav `zIndex: 50` 덮기)
- 좌측 SideNav 240px (ShareHub 브랜드 + 6개 메뉴)
- `useIsMobile()` 훅 — 1024px breakpoint
- 토스 스타일: 흰 카드, 얇은 구분선, 큰 숫자, 색상 최소화

### 모바일 공통
- maxWidth 430px, margin: '0 auto'
- BottomNav: 홈/입주자/청소수리/관리

## 5. 비즈니스 규칙
- **플랫폼 태깅**: 이름에 (우주)→우주, (앤코)/(엔코)→앤코, (맘스테이)→맘스테이
- **당번 스킵**: 정기청소 주(당번유형='청소주') + 공실(당번유형='공실')
- **수익 계산**: 월세 수익 = 입주자 월세 합계 - 집 월세
- **투자자 정산**: 월세 수익 × 투자자비율/100
- **수납 상태**: 납부완료 / 부분납부 / 미납
- **입주자 상태**: 입주중 / 계약중 / 공실 / 공실예정 / 퇴실예정 / 퇴실확정 / 퇴실완료 / 계약취소

## 6. 작업 원칙 (Claude Code용)
- **Mobile 파일 수정 금지** (Desktop에서 데이터 로직 복붙만 허용)
- **Phase 쪼개기 금지** (단일 작업 = 단일 커밋)
- 신규 기능 전 유사 기능 존재 여부 체크
- 변경 후 `npm run build` 통과 확인 필수
- 커밋 메시지: Conventional Commits (`feat`/`fix`/`refactor`/`docs`)
- 임의 판단 금지 — 막히면 보고

## 7. 환경 변수
- `GOOGLE_SHEETS_ID`: 스프레드시트 ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: 서비스 계정 이메일
- `GOOGLE_PRIVATE_KEY`: `\\n` → `\n` 변환 필수

## 8. 알려진 이슈·제약
- `/apply/*` 신청서 5종에 하드코딩된 계좌·가격·안내문구 ~121개
- 비품신청 시트는 이름이 row[2]에 있음 (다른 시트는 row[1])
- 은행명 표기 불일치: 투어="카카오뱅크", 방청소="K BANK", 에어컨="케이뱅크"
- 투어 지점 목록 하드코딩 (5개 구, 13개 지점) — 실제 48개 지점과 불일치
- 신청 5종 시트별 컬럼 구조 상이 (위 스키마 참조)

## 9. PC SideNav 메뉴 구조
```
대시보드    → /
입주자      → /tenants
지점        → /houses
일정/이슈   → /issues
수납/정산   → /payments
관리        → /manage
```

## 10. 파일 업데이트 이력
- 최종 업데이트: 2026-04-21
