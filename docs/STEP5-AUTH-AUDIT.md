# Step 5 인증 구조 조사 보고서

## 결론 한 줄 요약

현재 ShareHub v2는 **인증이 사실상 없다** — 관리자 페이지는 완전 공개이고, 포털(투자자/담당자/입주자)만 URL에 포함된 랜덤 토큰으로 접근을 제한하며, 모든 API는 Service Role Key(RLS 바이패스)로 실행된다.

---

## 1. Supabase 클라이언트

### 파일 경로

| 파일 | 키 종류 | 용도 |
|---|---|---|
| `src/lib/supabase/client.ts` | **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) | 브라우저 클라이언트 (현재 미사용) |
| `src/lib/supabase/server.ts` | **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) | 서버 전용 관리자 클라이언트 |
| `src/lib/supabase/helpers.ts` | — | `getOrThrow`, `listOrEmpty` 등 쿼리 헬퍼 |

### API Route 사용 현황 (샘플 5개)

| API Route | import | 클라이언트 |
|---|---|---|
| `api/investor-portal/[token]/route.ts` | `createAdminClient()` | Service Role |
| `api/tenant-portal/[token]/route.ts` | `createAdminClient()` | Service Role |
| `api/workers/by-token/[token]/route.ts` | `createAdminClient()` | Service Role |
| `api/tenants/route.ts` | `createAdminClient()` | Service Role |
| `api/payments/route.ts` | `createAdminClient()` | Service Role |

### 판정

- **모든 API route가 Service Role Key를 사용** → RLS가 켜져 있어도 완전 바이패스됨
- `client.ts`(Anon Key)는 존재하지만 어디에서도 import하지 않음
- **RLS는 현재 사실상 무의미** (적용하려면 Anon Key + 사용자 JWT 기반 클라이언트로 전환 필요)

---

## 2. 환경변수

### `.env.local` 내 Supabase 관련 키

| 변수명 | NEXT_PUBLIC_ | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | O | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | O | 공개 Anon Key (브라우저 노출 가능) |
| `SUPABASE_SERVICE_ROLE_KEY` | **X** | 비공개 Service Role Key |

### Service Role Key 노출 여부

- `src/` 전체 grep 결과: `src/lib/supabase/server.ts` **1곳에서만** 참조
- 클라이언트 컴포넌트(`'use client'`)에서의 import: **없음**
- `.env.example` 파일: **존재하지 않음** (신규 개발자 온보딩 시 문제)

### 판정

- Service Role Key는 서버 코드에만 격리되어 **클라이언트 노출 없음** ✓
- `.env.example` 부재로 환경변수 관리 가이드 부족

---

## 3. 인증/로그인 페이지

### 로그인 페이지

- `src/app/` 전체에서 `login`, `signin`, `auth` 관련 페이지: **없음**
- Supabase Auth (이메일/비밀번호, OAuth 등) 사용: **없음**
- 관리자 인증: **없음** — 모든 관리자 페이지(`/`, `/tenants`, `/issues`, `/payments` 등)는 **누구나 접근 가능**

### 포털 페이지

| 포털 | 경로 | 식별 방식 |
|---|---|---|
| 투자자 | `src/app/investor-portal/[token]/page.tsx` | URL 파라미터 `[token]` |
| 입주자 | `src/app/tenant/[token]/page.tsx` | URL 파라미터 `[token]` |
| 담당자 | `src/app/worker/[token]/page.tsx` | URL 파라미터 `[token]` |

### 식별 메커니즘

- **3개 포털 모두 동일한 방식**: URL에 포함된 랜덤 토큰(`useParams<{ token: string }>()`)
- 쿠키: 미사용
- localStorage: 미사용
- Supabase Auth 세션: 미사용
- 토큰을 API 호출 시 URL에 포함하여 전달 (예: `/api/workers/by-token/${token}`)

---

## 4. 토큰 기반 접근 API

### 토큰 API 경로 목록

| API 경로 | 토큰 위치 | 검증 테이블 |
|---|---|---|
| `api/investor-portal/[token]/route.ts` | URL param `[token]` | `investors.access_token` |
| `api/tenant-portal/[token]/route.ts` | URL param `[token]` | `tenants.access_token` |
| `api/workers/by-token/[token]/route.ts` | URL param `[token]` | `workers.access_token` |
| `api/tenants/route.ts` GET | query `?token=` | `tenants.access_token` |
| `api/workers/route.ts` GET | query `?token=` | `workers.access_token` |
| `api/investors/route.ts` GET | query `?token=` | `investors.access_token` |
| `api/tenant-portal/issue/route.ts` POST | body `token` | `tenants.link_token` |
| `api/tenant-portal/supplies/route.ts` POST | body `token` | `tenants.link_token` |

### 토큰 검증 로직

- 모든 API에서 동일한 패턴: `.eq('access_token', token).single()`
- `createAdminClient()` (Service Role)로 RLS 바이패스하여 직접 조회
- 토큰이 틀리면 `.single()`이 에러 → 404 응답
- **별도 토큰 검증 미들웨어나 유틸리티 함수 없음** — 각 route에서 개별 구현

### 토큰 생성 방식

| 대상 | 접두사 | 생성 코드 |
|---|---|---|
| 투자자 | `i_` | `i_${Math.random().toString(36).slice(2, 10)}` (8자) |
| 담당자 | `w_` | `w_${Math.random().toString(36).slice(2, 10)}` (8자) |
| 입주자 | `t_` | `t_${Math.random().toString(36).slice(2, 10)}` (8자) |

### 토큰 보안 평가

- **엔트로피 부족**: `Math.random()` 기반 8자 (약 41비트) — 브루트포스에 취약
- **만료 없음**: 토큰에 유효기간이 없어 한 번 유출되면 영구 접근 가능
- **재발급 메커니즘 없음**: 토큰 갱신/폐기 API 없음

---

## 5. 미들웨어

### 파일 존재 여부

| 파일 | 존재 |
|---|---|
| `middleware.ts` (프로젝트 루트) | **없음** |
| `src/middleware.ts` | **없음** |
| `proxy.ts` (Next.js 16) | **없음** |

### 판정

- **미들웨어 레이어가 전혀 없음**
- 경로 보호, 인증 체크, 리다이렉트 등 모든 보안 로직이 부재
- 관리자 페이지(`/tenants`, `/payments`, `/issues` 등)에 대한 접근 제어 없음

---

## 6. API Route에서 사용자 식별

### 샘플 5개 확인

| API Route | 사용자 식별 | 방법 |
|---|---|---|
| `api/dashboard/route.ts` | **없음** | query param만 사용 (year, month) |
| `api/issues/route.ts` | **없음** | query param만 (house, room) |
| `api/payments/route.ts` | **없음** | query param만 (tenantId, year, month) |
| `api/expenses/route.ts` | **없음** | query param만 (year, month) |
| `api/houses/route.ts` | **없음** | query param만 (id, gu) |

### 요청 헤더 확인

- `request.headers` 읽기: **없음** (전체 API 중 어디에서도 확인 안 함)
- `cookies()` 사용: **없음**
- `Authorization` 헤더: **없음**
- 모든 API는 요청자 구분 없이 **누구든 호출 가능**

### 판정

- 관리자 API 65+ 엔드포인트가 **완전 공개** 상태
- 입주자 데이터, 수납 정보, 투자자 정보를 누구나 조회/수정/삭제 가능
- CRUD 전 엔드포인트에 인증 없음

---

## 7. investors, workers 테이블 구조

### investors 테이블

| 컬럼 | 타입 | 로그인 관련 |
|---|---|---|
| `id` | string (PK) | |
| `name` | string | |
| `phone` | string \| null | 잠재적 로그인 수단 |
| `birth_date` | string \| null | |
| `access_token` | string \| null | **현재 유일한 인증 수단** |
| `account_info` | string \| null | |
| `is_active` | boolean | |
| `memo` | string \| null | |

### workers 테이블

| 컬럼 | 타입 | 로그인 관련 |
|---|---|---|
| `id` | string (PK) | |
| `name` | string | |
| `phone` | string \| null | 잠재적 로그인 수단 |
| `category` | string \| null | |
| `access_token` | string \| null | **현재 유일한 인증 수단** |
| `default_rate` | number \| null | |
| `is_active` | boolean | |
| `memo` | string \| null | |

### tenants 테이블

| 컬럼 | 타입 | 로그인 관련 |
|---|---|---|
| `id` | string (PK) | |
| `name` | string | |
| `phone` | string \| null | 잠재적 로그인 수단 |
| `email` | string \| null | 잠재적 로그인 수단 |
| `access_token` | string \| null | **현재 유일한 인증 수단** |
| `status` | enum | |
| … (계약/금액 필드 생략) | | |

### 판정

- **email 필드**: tenants에만 존재, 로그인용으로 사용하지 않음
- **password_hash 필드**: 3개 테이블 모두 **없음**
- **Supabase Auth (auth.users) 연동**: **없음**
- 인증 수단은 오직 `access_token` (약 41비트 엔트로피 랜덤 문자열)

---

## 종합 판정

### RLS 적용 가능 여부

| 항목 | 현재 상태 | RLS 적용 전제조건 |
|---|---|---|
| Supabase Auth 사용 | X | 필수 (JWT에 user_id 포함되어야 RLS policy 작성 가능) |
| Anon Key 클라이언트 사용 | X (미사용) | 필수 (Service Role은 RLS 바이패스) |
| auth.users 테이블 연동 | X | 필수 |
| 미들웨어 세션 관리 | X | 권장 |

**결론: 현재 상태에서 RLS 적용 불가.** Supabase Auth 도입이 선행되어야 한다.

### 추가로 필요한 작업

1. **관리자 인증 도입** (최우선)
   - Supabase Auth 이메일/비밀번호 또는 카카오 OAuth
   - `middleware.ts`에서 관리자 페이지 보호
   - API route에서 세션 검증

2. **포털 토큰 체계 강화**
   - `Math.random()` → `crypto.randomUUID()` 또는 더 긴 랜덤 문자열
   - 토큰 만료/재발급 메커니즘
   - 토큰 접근 로그 기록

3. **API 접근 제어**
   - 관리자 API: 세션 인증 필수
   - 포털 API: 토큰 검증 유지하되 rate limiting 추가
   - 공개 API (apply/* 신청 폼): CSRF 보호

4. **환경변수 관리**
   - `.env.example` 파일 생성
   - Service Role Key 로테이션 계획

### 가장 큰 리스크

**관리자 페이지 65+ API 엔드포인트가 인증 없이 완전 공개 상태.**
URL(`sharehub-v2.vercel.app`)을 아는 사람이면 누구든 입주자 정보 조회, 수납 데이터 수정, 투자자 정보 열람, 지출 삭제 등 모든 작업이 가능하다. 포털 토큰은 약한 보안이나마 존재하지만, 관리자 영역은 아무 보호도 없다.

---

## 부록: Step 5 구현 전 사전 조사 결과

### A. API Route 전체 분류 (61개)

#### 관리자 API (42개) - requireAdmin 적용
```
ai-assistant, dashboard, duty/[id], duty/generate, duty,
expenses, finance/summary, houses/[id], houses/districts, houses,
investors, issues/[id], issues/quick-add, issues/register, issues,
issues/work/[id], management/workers/[id]/jobs, management/workers/[id],
management/workers, opex/[id], opex, payments/[id], payments/bulk-confirm,
payments/confirm, payments/generate, payments, payments/summary,
payments/upload, platform-transfers, revenue, rooms, tenants/[id],
tenants, utilities, utility/[id], utility, vacancies, workers/[id],
workers/list, workers, workers/schedule/[id], workers/staff
```

#### 포털 API (8개) - 토큰 검증
```
investor-portal/[token], tenant-portal/[token], tenant-portal/issue,
tenant-portal/supplies, workers/by-token/[token], workers/portal/[id],
tenants/portal/supply, tenant-duty
```

#### 공개 API (8개) - 인증 없음 (apply 계열)
```
apply/aircon, apply/checkout, apply/cleaning, apply/manage,
apply/supplies/[id], apply/supplies, apply/tour/[id], apply/tour
```

#### 기타 공개 (2개)
```
house-guide/[slug], channeltalk/tag-tenant
```

### B. 포털 페이지 기존 경로

| 포털 | 기존 경로 | 새 경로 |
|---|---|---|
| 투자자 | /investor-portal/[token] | /portal/investor/[token] |
| 입주자 | /tenant/[token] | /portal/tenant/[token] |
| 담당자 | /worker/[token] | /portal/worker/[token] |

### C. access_token 컬럼 현황

| 테이블 | 컬럼 존재 | 기존 토큰 길이 | 강화 후 길이 |
|---|---|---|---|
| investors | O | ~10자 (i_xxxxxxxx) | 66자 (i_+64hex) |
| workers | O | ~10자 (w_xxxxxxxx) | 66자 (w_+64hex) |
| tenants | O | ~10자 (t_xxxxxxxx) | 66자 (t_+64hex) |
