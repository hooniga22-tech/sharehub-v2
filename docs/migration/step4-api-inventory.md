# Step 4 API 마이그레이션 인벤토리

작성일: 2026-04-22
총 엔드포인트: 67개

## 요약
- Sheets 기반: 65개
- Supabase 기반: 1개 (supabase-test, 이미 마이그레이션됨)
- 기타/미확정: 1개 (channeltalk)

---

## Step 4.1 - 마스터 데이터 읽기 (낮은 위험도)

지점, 방, 투자자, 워커, 플랫폼 등 변경이 거의 없는 마스터 데이터의 GET 메서드.

- [x] `/api/houses` GET - Supabase branches - `src/app/api/houses/route.ts`
- [x] `/api/houses/:id` GET - Supabase branches - `src/app/api/houses/[id]/route.ts`
- [x] `/api/houses/districts` GET - Supabase branches - `src/app/api/houses/districts/route.ts`
- [x] `/api/rooms` GET - Supabase rooms+branches - `src/app/api/rooms/route.ts`
- [x] `/api/investors` GET - Supabase investors+branches (investor_id FK) - `src/app/api/investors/route.ts`
- [x] `/api/workers` GET - Supabase issues+branches+workers (token: workers) - `src/app/api/workers/route.ts`
- [x] `/api/workers/list` GET - Supabase workers+issues - `src/app/api/workers/list/route.ts`
- [x] `/api/workers/staff` GET - Supabase workers - `src/app/api/workers/staff/route.ts`
- [x] `/api/workers/by-token/:token` GET - Supabase workers+branches (스케줄은 Sheets 유지) - `src/app/api/workers/by-token/[token]/route.ts`
- [x] `/api/management/workers` GET - Supabase workers (월간 실적은 Sheets 유지) - `src/app/api/management/workers/route.ts`
- [x] `/api/management/workers/:id` GET - Supabase workers (월간 실적은 Sheets 유지) - `src/app/api/management/workers/[id]/route.ts`
- [x] `/api/management/workers/:id/jobs` GET - Supabase workers (작업 목록은 Sheets 유지) - `src/app/api/management/workers/[id]/jobs/route.ts`

## Step 4.2 - 입주자 + 수납 읽기 (중간 위험도)

- [x] `/api/tenants` GET - Supabase tenants+rooms+branches - `src/app/api/tenants/route.ts`
- [x] `/api/tenants/:id` GET - Supabase tenants+rooms+branches - `src/app/api/tenants/[id]/route.ts`
- [x] `/api/payments` GET - Supabase monthly_payments+tenants - `src/app/api/payments/route.ts`
- [x] `/api/payments/summary` GET - Supabase tenants+monthly_payments - `src/app/api/payments/summary/route.ts`
- [x] `/api/platform-transfers` GET - Supabase tenants+platforms+monthly_payments - `src/app/api/platform-transfers/route.ts`
- [x] `/api/tenant-portal/:token` GET - Supabase tenants+rooms+branches+issues - `src/app/api/tenant-portal/[token]/route.ts`
- [x] `/api/investor-portal/:token` GET - Supabase investors+branches+tenants - `src/app/api/investor-portal/[token]/route.ts`
- [ ] `/api/tenant-duty` GET - Sheets - 건너뜀: duty_schedules 테이블 스키마 불일치
- [ ] `/api/vacancies` GET - Sheets - 건너뜀: Supabase에 vacancies 테이블 없음
- [x] `/api/dashboard` GET - Supabase tenants+branches+issues+expenses - `src/app/api/dashboard/route.ts`
- [x] `/api/revenue` GET - Supabase tenants+branches+expenses+investors - `src/app/api/revenue/route.ts`
- [x] `/api/finance/summary` GET - Supabase tenants+branches+expenses - `src/app/api/finance/summary/route.ts`

## Step 4.3 - 이슈 + 신청서 5종 + 지출 읽기 (중간 위험도)

- [x] `/api/issues` GET - Supabase issues+branches+rooms+workers - `src/app/api/issues/route.ts`
- [x] `/api/issues/:id` GET - Supabase issues+branches+rooms+workers - `src/app/api/issues/[id]/route.ts`
- [ ] `/api/issues/work/:id` GET - Sheets - 건너뜀: 용역 시트 특화 필드 구조, issues 테이블과 불일치
- [ ] `/api/issues/quick-add` GET - Sheets - 건너뜀: GET이 데이터 생성하는 특수 엔드포인트
- [x] `/api/expenses` GET - Supabase expenses+branches+expense_categories - `src/app/api/expenses/route.ts`
- [ ] `/api/utilities` GET - Sheets - 건너뜀: Supabase에 공과금 전용 테이블 없음
- [ ] `/api/utility` GET - Sheets - 건너뜀: 위와 동일
- [ ] `/api/duty` GET - Sheets - 건너뜀: duty_schedules 스키마 불일치
- [ ] `/api/duty/exchange` GET - Sheets - 건너뜀: 당번교환 테이블 없음
- [ ] `/api/tasks/active` GET - Sheets - 건너뜀: tasks 테이블 없음
- [ ] `/api/tasks/inventory` GET - Sheets - 건너뜀: tasks 테이블 없음
- [x] `/api/apply/tour` GET - Supabase tour_applications - `src/app/api/apply/tour/route.ts`
- [x] `/api/apply/cleaning` GET - Supabase cleaning_applications - `src/app/api/apply/cleaning/route.ts`
- [x] `/api/apply/aircon` GET - Supabase aircon_applications - `src/app/api/apply/aircon/route.ts`
- [x] `/api/apply/checkout` GET - Supabase checkout_applications - `src/app/api/apply/checkout/route.ts`
- [x] `/api/apply/supplies` GET - Supabase supplies_applications - `src/app/api/apply/supplies/route.ts`
- [ ] `/api/opex` GET - Sheets - 건너뜀: 운영지출 한국어 필드 구조
- [x] `/api/house-guide/:slug` GET - Supabase branches+tenants - `src/app/api/house-guide/[slug]/route.ts`

## Step 4.4 - 마스터 + 입주자/수납 쓰기 (높은 위험도)

- [ ] `/api/houses` PUT - Sheets - `src/app/api/houses/route.ts`
- [ ] `/api/houses/:id` PUT - Sheets - `src/app/api/houses/[id]/route.ts`
- [ ] `/api/investors` POST, PUT - Sheets - `src/app/api/investors/route.ts`
- [ ] `/api/workers` POST, PUT - Sheets - `src/app/api/workers/route.ts`
- [ ] `/api/workers/:id` PUT - Sheets - `src/app/api/workers/[id]/route.ts`
- [ ] `/api/workers/staff` POST - Sheets - `src/app/api/workers/staff/route.ts`
- [ ] `/api/workers/portal/:id` PUT - Sheets - `src/app/api/workers/portal/[id]/route.ts`
- [ ] `/api/workers/schedule/:id` PUT - Sheets - `src/app/api/workers/schedule/[id]/route.ts`
- [ ] `/api/management/workers` POST - Sheets - `src/app/api/management/workers/route.ts`
- [ ] `/api/management/workers/:id` PATCH - Sheets - `src/app/api/management/workers/[id]/route.ts`
- [ ] `/api/tenants` POST, PUT - Sheets - `src/app/api/tenants/route.ts`
- [ ] `/api/tenants/:id` PUT - Sheets - `src/app/api/tenants/[id]/route.ts`
- [ ] `/api/tenants/portal/supply` POST - Sheets - `src/app/api/tenants/portal/supply/route.ts`
- [ ] `/api/payments` POST, PUT - Sheets - `src/app/api/payments/route.ts`
- [ ] `/api/payments/:id` PUT - Sheets - `src/app/api/payments/[id]/route.ts`
- [ ] `/api/payments/generate` POST - Sheets - `src/app/api/payments/generate/route.ts`
- [ ] `/api/payments/confirm` POST - Sheets - `src/app/api/payments/confirm/route.ts`
- [ ] `/api/payments/bulk-confirm` POST - Sheets - `src/app/api/payments/bulk-confirm/route.ts`
- [ ] `/api/payments/upload` POST - Sheets - `src/app/api/payments/upload/route.ts`
- [ ] `/api/platform-transfers` PATCH - Sheets - `src/app/api/platform-transfers/route.ts`
- [ ] `/api/vacancies` POST, PUT - Sheets - `src/app/api/vacancies/route.ts`
- [ ] `/api/sheets` GET, POST, PUT - Sheets - `src/app/api/sheets/route.ts`

## Step 4.5 - 이슈/신청서/지출 쓰기 (높은 위험도)

- [ ] `/api/issues` POST - Sheets - `src/app/api/issues/route.ts`
- [ ] `/api/issues/:id` PUT, DELETE - Sheets - `src/app/api/issues/[id]/route.ts`
- [ ] `/api/issues/register` POST - Sheets - `src/app/api/issues/register/route.ts`
- [ ] `/api/issues/work/:id` PATCH, DELETE - Sheets - `src/app/api/issues/work/[id]/route.ts`
- [ ] `/api/expenses` POST, DELETE - Sheets - `src/app/api/expenses/route.ts`
- [ ] `/api/utilities` POST - Sheets - `src/app/api/utilities/route.ts`
- [ ] `/api/utility` POST, PUT - Sheets - `src/app/api/utility/route.ts`
- [ ] `/api/utility/:id` PUT - Sheets - `src/app/api/utility/[id]/route.ts`
- [ ] `/api/duty` POST, PUT - Sheets - `src/app/api/duty/route.ts`
- [ ] `/api/duty/:id` PUT - Sheets - `src/app/api/duty/[id]/route.ts`
- [ ] `/api/duty/generate` POST - Sheets - `src/app/api/duty/generate/route.ts`
- [ ] `/api/duty/exchange` POST, PUT - Sheets - `src/app/api/duty/exchange/route.ts`
- [ ] `/api/tasks/schedule` PUT - Sheets - `src/app/api/tasks/schedule/route.ts`
- [ ] `/api/tasks/update` PUT - Sheets - `src/app/api/tasks/update/route.ts`
- [ ] `/api/tasks/delete` DELETE - Sheets - `src/app/api/tasks/delete/route.ts`
- [ ] `/api/apply/tour` POST - Sheets - `src/app/api/apply/tour/route.ts`
- [ ] `/api/apply/tour/:id` PUT - Sheets - `src/app/api/apply/tour/[id]/route.ts`
- [ ] `/api/apply/cleaning` POST - Sheets - `src/app/api/apply/cleaning/route.ts`
- [ ] `/api/apply/aircon` POST - Sheets - `src/app/api/apply/aircon/route.ts`
- [ ] `/api/apply/checkout` POST, PUT - Sheets - `src/app/api/apply/checkout/route.ts`
- [ ] `/api/apply/supplies` POST - Sheets - `src/app/api/apply/supplies/route.ts`
- [ ] `/api/apply/supplies/:id` PUT - Sheets - `src/app/api/apply/supplies/[id]/route.ts`
- [ ] `/api/apply/manage` PUT, DELETE - Sheets - `src/app/api/apply/manage/route.ts`
- [ ] `/api/opex` POST, DELETE - Sheets - `src/app/api/opex/route.ts`
- [ ] `/api/opex/:id` DELETE - Sheets - `src/app/api/opex/[id]/route.ts`
- [ ] `/api/tenant-portal/issue` POST - Sheets - `src/app/api/tenant-portal/issue/route.ts`
- [ ] `/api/tenant-portal/supplies` POST - Sheets - `src/app/api/tenant-portal/supplies/route.ts`

## 분류 미확정 - 수동 검토 필요

- [x] `/api/supabase-test` GET - Supabase - 이미 마이그레이션됨. 테스트 전용 엔드포인트.
- [ ] `/api/channeltalk/tag-tenant` POST - Other - Sheets 미사용. 외부 서비스 연동.
- [ ] `/api/ai-assistant` POST - Sheets - AI 기능. Sheets를 context로 읽지만 분류 애매.

---

## 통계

| Step | 읽기/쓰기 | 엔드포인트 수 | 위험도 |
|------|-----------|--------------|--------|
| 4.1 | 마스터 읽기 | 12 | 낮음 |
| 4.2 | 입주자+수납 읽기 | 12 | 중간 |
| 4.3 | 이슈+신청서+지출 읽기 | 17 | 중간 |
| 4.4 | 마스터+입주자/수납 쓰기 | 22 | 높음 |
| 4.5 | 이슈/신청서/지출 쓰기 | 27 | 높음 |
| 미확정 | - | 3 | - |
| **합계** | | **93** (중복 포함, 한 파일에 GET+POST면 양쪽 기재) |
