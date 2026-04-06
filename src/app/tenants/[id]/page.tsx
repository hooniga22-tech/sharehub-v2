'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Edit2, UserMinus, FileText, Phone, Calendar, CreditCard, Save, X } from 'lucide-react'
import { calcContractProgress, calcProrated, calcBalance, won } from '@/lib/contract'

// 목업 데이터 (추후 API 연동)
const tenantsData: Record<string, {
  id: string; name: string; phone: string; house: string; room: string;
  rent: number; maintenance: number; deposit: number; contractDeposit: number;
  discount: number; regularPrice: number;
  startDate: string; endDate: string; moveIn: string;
  status: '입주중' | '퇴실예정' | '퇴실'; paid: boolean;
  birthDate: string; homeAddress: string;
  guardianName: string; guardianRelation: string; guardianPhone: string;
  rentBankInfo: string; maintBankInfo: string; memo: string;
}> = {
  '1': { id: '1', name: '김민수', phone: '010-1234-5678', house: '역삼하우스', room: '302호', rent: 650000, maintenance: 100000, deposit: 3000000, contractDeposit: 500000, discount: 50000, regularPrice: 700000, startDate: '2024-01-15', endDate: '2024-12-14', moveIn: '2024-01-15', status: '입주중', paid: true, birthDate: '1998-03-15', homeAddress: '서울시 강남구 역삼동', guardianName: '김영수', guardianRelation: '부', guardianPhone: '010-9999-8888', rentBankInfo: '국민은행 123-456-789012', maintBankInfo: 'K BANK 100-166-670094', memo: '조용한 성격, 청소 잘함' },
  '2': { id: '2', name: '박서연', phone: '010-2345-6789', house: '역삼하우스', room: '201호', rent: 550000, maintenance: 100000, deposit: 2000000, contractDeposit: 500000, discount: 0, regularPrice: 550000, startDate: '2024-03-01', endDate: '2025-02-28', moveIn: '2024-03-01', status: '입주중', paid: true, birthDate: '2000-07-22', homeAddress: '경기도 수원시 영통구', guardianName: '박정미', guardianRelation: '모', guardianPhone: '010-8888-7777', rentBankInfo: '국민은행 123-456-789012', maintBankInfo: 'K BANK 100-166-670094', memo: '' },
  '3': { id: '3', name: '이지현', phone: '010-3456-7890', house: '강남하우스', room: '105호', rent: 700000, maintenance: 120000, deposit: 3000000, contractDeposit: 500000, discount: 0, regularPrice: 700000, startDate: '2024-02-01', endDate: '2024-04-30', moveIn: '2024-02-01', status: '퇴실예정', paid: false, birthDate: '1999-11-05', homeAddress: '부산시 해운대구', guardianName: '이상호', guardianRelation: '부', guardianPhone: '010-7777-6666', rentBankInfo: '신한은행 110-123-456789', maintBankInfo: 'K BANK 100-166-670094', memo: '4월 말 퇴실 확정' },
  '4': { id: '4', name: '최동혁', phone: '010-4567-8901', house: '강남하우스', room: '203호', rent: 600000, maintenance: 120000, deposit: 2500000, contractDeposit: 500000, discount: 0, regularPrice: 600000, startDate: '2024-01-01', endDate: '2024-12-31', moveIn: '2024-01-01', status: '입주중', paid: true, birthDate: '1997-05-18', homeAddress: '서울시 서초구 반포동', guardianName: '최진수', guardianRelation: '부', guardianPhone: '010-6666-5555', rentBankInfo: '신한은행 110-123-456789', maintBankInfo: 'K BANK 100-166-670094', memo: '' },
  '5': { id: '5', name: '정하윤', phone: '010-5678-9012', house: '서초하우스', room: '101호', rent: 720000, maintenance: 100000, deposit: 3000000, contractDeposit: 500000, discount: 30000, regularPrice: 750000, startDate: '2023-12-01', endDate: '2024-11-30', moveIn: '2023-12-01', status: '입주중', paid: false, birthDate: '2001-01-10', homeAddress: '대전시 유성구', guardianName: '정민호', guardianRelation: '부', guardianPhone: '010-5555-4444', rentBankInfo: '우리은행 1002-123-456789', maintBankInfo: 'K BANK 100-166-670094', memo: '이달 월세 미납 - 연락 필요' },
  '6': { id: '6', name: '오승우', phone: '010-6789-0123', house: '서초하우스', room: '304호', rent: 580000, maintenance: 100000, deposit: 2000000, contractDeposit: 500000, discount: 0, regularPrice: 580000, startDate: '2024-01-01', endDate: '2024-06-30', moveIn: '2024-01-01', status: '퇴실예정', paid: true, birthDate: '1999-09-20', homeAddress: '인천시 남동구', guardianName: '오재원', guardianRelation: '부', guardianPhone: '010-4444-3333', rentBankInfo: '우리은행 1002-123-456789', maintBankInfo: 'K BANK 100-166-670094', memo: '6월 말 퇴실, 보증금 반환 예정' },
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = tenantsData[params.id as string]
  const [editingMemo, setEditingMemo] = useState(false)
  const [memo, setMemo] = useState(t?.memo || '')

  if (!t) return <div className="flex items-center justify-center min-h-screen text-[var(--sub)]">입주자를 찾을 수 없습니다</div>

  const progress = calcContractProgress(t.startDate, t.endDate)
  const prorated = calcProrated(t.startDate, t.rent, t.maintenance)
  const balance = calcBalance(t.deposit, t.contractDeposit, prorated.proratedRent, prorated.proratedMaint, t.discount)
  const isActive = t.status === '입주중'

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="입주자 상세"
        right={
          <div className="flex gap-2">
            <button className="text-[13px] font-semibold text-[var(--blue)] flex items-center gap-1">
              <Edit2 size={14} /> 수정
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Profile Header */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-[var(--blue)]" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--blue)] flex items-center justify-center shrink-0">
                  <span className="text-[18px] font-bold text-white">{t.name[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[17px] font-bold">{t.name}</h3>
                    <Chip label={t.status} variant={t.status === '입주중' ? 'green' : t.status === '퇴실예정' ? 'amber' : 'gray'} />
                    {isActive && !t.paid && <Chip label="이달 미납" variant="red" />}
                  </div>
                  <p className="text-[13px] text-[var(--sub)] mt-0.5">
                    {t.house} · {t.room}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone size={12} color="var(--sub)" />
                    <span className="text-[12px] text-[var(--sub)]">{t.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        {isActive && (
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center gap-1.5">
              <FileText size={14} /> 계약서 출력
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-[var(--red-light)] text-[var(--red)] flex items-center justify-center gap-1.5">
              <UserMinus size={14} /> 퇴실 처리
            </button>
          </div>
        )}

        {/* Contract Period Card — v1의 ContractPeriodCard 재현 */}
        <Card className="mt-3 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar size={14} color="var(--blue)" />
            <span className="text-[12px] font-bold text-[var(--sub)]">계약기간</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold">{t.startDate}</span>
            <span className="text-[13px] font-semibold">{t.endDate}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: progress.daysLeft <= 60 ? 'var(--amber)' : 'var(--blue)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[var(--sub)]">{progress.percent}% 경과</span>
            <span className={`text-[11px] font-semibold ${progress.daysLeft <= 60 ? 'text-[var(--amber)]' : 'text-[var(--blue)]'}`}>
              {progress.daysLeft > 0 ? `D-${progress.daysLeft}` : '만료'}
            </span>
          </div>
        </Card>

        {/* Amount Grid — v1의 4칸 그리드 */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: '보증금', value: won(t.deposit), color: 'text-[var(--text)]' },
            { label: '월세', value: won(t.rent), color: 'text-[var(--blue)]' },
            { label: '관리비', value: won(t.maintenance), color: 'text-[var(--text)]' },
            { label: '이달', value: isActive && t.paid ? '완납' : isActive ? '미납' : '-', color: isActive && t.paid ? 'text-[var(--green)]' : isActive ? 'text-[var(--red)]' : 'text-[var(--sub)]' },
          ].map(item => (
            <Card key={item.label} className="p-3 text-center">
              <p className={`text-[14px] font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-[var(--sub)] mt-1">{item.label}</p>
            </Card>
          ))}
        </div>

        {/* Admin Memo — v1의 관리자 메모 */}
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-[var(--sub)] flex items-center gap-1">
              <FileText size={12} /> 관리자 메모
            </span>
            {editingMemo ? (
              <div className="flex gap-1.5">
                <button onClick={() => { /* TODO: save */ setEditingMemo(false) }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--green-light)]">
                  <Save size={14} color="var(--green)" />
                </button>
                <button onClick={() => { setMemo(t.memo); setEditingMemo(false) }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--border)]">
                  <X size={14} color="var(--sub)" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingMemo(true)} className="text-[12px] font-semibold text-[var(--blue)]">편집</button>
            )}
          </div>
          {editingMemo ? (
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="w-full text-[13px] bg-transparent outline-none resize-none min-h-[60px]"
              autoFocus
            />
          ) : (
            <p className="text-[13px] min-h-[24px]">{t.memo || <span className="text-[var(--sub)]">메모 없음</span>}</p>
          )}
        </Card>

        {/* Contract Detail Info — v1의 상세 계약 정보 */}
        <Card className="mt-3 p-4">
          <span className="text-[12px] font-bold text-[var(--sub)] flex items-center gap-1 mb-3">
            <CreditCard size={12} /> 상세 계약 정보
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow label="입주일" value={t.moveIn} />
            <InfoRow label="생년월일" value={t.birthDate} />
            <InfoRow label="본가주소" value={t.homeAddress} full />
            <InfoRow label="보호자" value={`${t.guardianName} (${t.guardianRelation})`} />
            <InfoRow label="보호자 연락처" value={t.guardianPhone} />
            <InfoRow label="정가" value={won(t.regularPrice)} />
            <InfoRow label="할인" value={t.discount ? won(t.discount) : '없음'} />
            <InfoRow label="계약금" value={won(t.contractDeposit)} />
            <InfoRow label="임대료 계좌" value={t.rentBankInfo} full />
            <InfoRow label="관리비 계좌" value={t.maintBankInfo} full />
          </div>
        </Card>

        {/* 첫달 일할계산 — v1의 일할계산 미리보기 */}
        {prorated.remainDays < prorated.totalDays && prorated.remainDays > 0 && (
          <Card className="mt-3 p-4 bg-[var(--blue-light)]">
            <p className="text-[12px] font-bold text-[var(--blue)] mb-2">
              첫달 일할계산 ({prorated.remainDays}/{prorated.totalDays}일)
            </p>
            <div className="grid grid-cols-2 gap-1 text-[12px]">
              <span className="text-[var(--sub)]">첫달 월세</span>
              <span className="font-semibold text-right">{won(prorated.proratedRent)}</span>
              <span className="text-[var(--sub)]">첫달 관리비</span>
              <span className="font-semibold text-right">{won(prorated.proratedMaint)}</span>
              <span className="text-[var(--sub)]">잔금</span>
              <span className="font-bold text-[var(--blue)] text-right">{won(balance)}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold text-[var(--sub)] mb-0.5">{label}</p>
      <p className="text-[13px] font-medium">{value || '-'}</p>
    </div>
  )
}
