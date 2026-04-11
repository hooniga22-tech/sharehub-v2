'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { Construction } from 'lucide-react';

const nameMap: Record<string, string> = {
  vacancy: '공실 관리', worker: '용역 관리', duty: '당번 관리',
  applications: '신청 관리', investors: '투자자 관리',
  payment: '수납 관리', profit: '매출·순이익', expense: '지출 관리', utility: '공과금 관리',
};

export default function ManageSubPage() {
  const { slug } = useParams<{ slug: string }>();
  const title = nameMap[slug] || '관리';

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh' }}>
      <PageHeader title={title} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '128px 0', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Construction size={28} color="#BBBBBB" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#BBBBBB' }}>준비중입니다</p>
        <p style={{ fontSize: 13, color: '#BBBBBB' }}>빠른 시일 내에 오픈할게요!</p>
      </div>
    </div>
  );
}
