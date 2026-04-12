'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Avatar from '@/components/ui/Avatar';
import { Phone, MessageSquare, FileText, ChevronRight } from 'lucide-react';

const GRAY = '#8b95a1';
const fmtWon = (n: number) => n.toLocaleString() + '원';

function getDday(dateStr: string) {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  '입주중': { bg: '#E8FBF5', color: '#00B493', label: '입주중' },
  '계약중': { bg: '#E8FBF5', color: '#00B493', label: '계약중' },
  '퇴실예정': { bg: '#FFF8E8', color: '#D97706', label: '퇴실예정' },
  '퇴실완료': { bg: '#F2F4F6', color: GRAY, label: '퇴실완료' },
};

type Tenant = Record<string, string>;

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [editMemo, setEditMemo] = useState(false);
  const [memoText, setMemoText] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    fetch(`/api/tenants?id=${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(data => {
        setTenant(data);
        setMemoText(data['메모'] || '');
        setLoading(false);
      })
      .catch(() => { setTenant(null); setLoading(false); });
  }, [id]);

  const handleSaveMemo = async () => {
    if (!tenant) return;
    setSaving(true);
    await fetch('/api/tenants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenant['입주자ID'], '메모': memoText }),
    });
    setTenant(prev => prev ? { ...prev, '메모': memoText } : prev);
    setSaving(false);
    setEditMemo(false);
    showToast('저장됐어요!');
  };

  if (loading) {
    return (
      <>
        <PageHeader title="입주자 상세" />
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </>
    );
  }

  if (!tenant) {
    return (
      <>
        <PageHeader title="입주자 상세" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBBBBB' }}>입주자를 찾을 수 없어요</p>
        </div>
      </>
    );
  }

  const status = tenant['상태'] || '입주중';
  const badge = statusBadge[status] || statusBadge['입주중'];
  const dday = getDday(tenant['퇴실일']);
  const rent = Number(tenant['월세']) || 0;
  const mgmt = Number(tenant['관리비']) || 0;
  const deposit = Number(tenant['보증금']) || 0;

  const contractInfo = [
    { label: '지점·호실', value: `${tenant['지점명']} ${tenant['방코드']}` },
    { label: '입주일', value: tenant['입주일'] || '-' },
    { label: '계약만료', value: tenant['퇴실일'] || '-' },
    { label: '잔여기간', value: dday > 0 ? `D-${dday}` : '만료', valueColor: dday > 30 ? '#00B493' : '#D97706' },
    { label: '월세', value: fmtWon(rent) },
    { label: '관리비', value: fmtWon(mgmt) },
    { label: '보증금', value: fmtWon(deposit) },
    { label: '국적', value: tenant['국적'] || '-' },
  ];

  return (
    <div style={{ paddingBottom: 16, background: '#F7F8FA', minHeight: '100vh' }}>
      <PageHeader title="입주자 상세" />

      {/* 프로필 히어로 */}
      <div style={{ background: '#fff', padding: '20px 16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <Avatar name={tenant['이름']} size={56} />
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, marginTop: 8 }}>{tenant['이름']}</h2>
          <p style={{ fontSize: 13, color: '#888888' }}>{tenant['지점명']} · {tenant['방코드']}</p>
          <span style={{ marginTop: 8, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        {tenant['연락처'] && (
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`tel:${tenant['연락처']}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, border: '1px solid #F0F0F0', fontSize: 14, fontWeight: 500, color: '#191919', textDecoration: 'none' }}>
              <Phone size={16} /> 전화
            </a>
            <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, background: '#3182F6', fontSize: 14, fontWeight: 500, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <MessageSquare size={16} /> 알림톡
            </button>
          </div>
        )}
      </div>

      {/* 계약 정보 */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>계약 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 0' }}>
          {contractInfo.map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: 12, color: '#888888' }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: (item as { valueColor?: string }).valueColor || '#191919' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 관리자 메모 */}
      <div style={{ background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>관리자 메모</h3>
          {editMemo ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditMemo(false)} style={{ fontSize: 12, color: GRAY, background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSaveMemo} disabled={saving} style={{ fontSize: 12, color: '#3182F6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                {saving ? '저장중...' : '저장'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMemo(true)} style={{ fontSize: 12, color: '#3182F6', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>편집</button>
          )}
        </div>
        {editMemo ? (
          <textarea value={memoText} onChange={e => setMemoText(e.target.value)}
            style={{ width: '100%', minHeight: 80, padding: '10px 12px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none' }} />
        ) : (
          <p style={{ fontSize: 14, color: tenant['메모'] ? '#191919' : '#BBBBBB', lineHeight: 1.6 }}>
            {tenant['메모'] || '메모가 없어요'}
          </p>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
