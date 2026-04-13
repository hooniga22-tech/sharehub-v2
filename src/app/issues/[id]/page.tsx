'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MoreVertical, ClipboardList, Sun, CheckCircle2 } from 'lucide-react';

type IssueStatus = '접수' | '처리중' | '완료';
type Issue = {
  id: string; houseName: string; roomCode: string; title: string; content: string;
  category: string; status: string; assignee: string; createdAt: string;
  completedAt: string; cost: number; memo: string;
};

const statusSteps: { key: IssueStatus; label: string; icon: typeof ClipboardList }[] = [
  { key: '접수', label: '접수', icon: ClipboardList },
  { key: '처리중', label: '처리중', icon: Sun },
  { key: '완료', label: '완료', icon: CheckCircle2 },
];

const BLUE = '#3182F6', GRAY = '#888888', RED = '#F04452';

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<IssueStatus>('접수');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/issues/${id}`).then(r => r.json()).then(data => {
      if (data.error) { setLoading(false); return; }
      setIssue(data);
      setStatus((data.status as IssueStatus) || '접수');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: IssueStatus) => {
    setStatus(newStatus);
    await fetch(`/api/issues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/issues');
    } else {
      alert('삭제 실패');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#F7F8FA', minHeight: '100vh' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/issues')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ChevronLeft size={24} color="#191919" /></button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>이슈 상세</span>
          <div style={{ width: 24 }} />
        </header>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div style={{ background: '#F7F8FA', minHeight: '100vh' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/issues')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ChevronLeft size={24} color="#191919" /></button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>이슈 상세</span>
          <div style={{ width: 24 }} />
        </header>
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#BBBBBB', fontSize: 14 }}>이슈를 찾을 수 없어요</div>
      </div>
    );
  }

  const isDone = status === '완료';
  const elapsed = issue.createdAt ? Math.max(0, Math.ceil((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const elapsedColor = elapsed >= 3 ? RED : elapsed >= 1 ? '#F59E0B' : GRAY;

  const infoRows = [
    { label: '지점', value: `${issue.houseName} ${issue.roomCode}` },
    { label: '유형', value: issue.category },
    { label: '접수일', value: issue.createdAt },
    { label: '경과일', value: `${elapsed}일`, color: elapsedColor },
    { label: '담당자', value: issue.assignee || '-' },
  ];

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #F0F0F0',
      }}>
        <button onClick={() => router.push('/issues')} style={{ padding: 4, marginLeft: -4, background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={24} color="#191919" />
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: '#191919' }}>
          이슈 상세
        </span>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
            <MoreVertical size={20} color="#191919" />
          </button>
          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 32, zIndex: 11,
                background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                overflow: 'hidden', minWidth: 120,
              }}>
                <button
                  style={{ display: 'block', width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500, color: RED, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                >
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: '#fff', padding: '20px 16px', borderBottom: '8px solid #F7F8FA' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#191919', marginBottom: 4 }}>{issue.title}</h2>
        <p style={{ fontSize: 13, color: GRAY }}>{issue.houseName} {issue.roomCode} · {issue.createdAt}</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {statusSteps.map((step) => {
            const Icon = step.icon;
            const isSelected = status === step.key;
            return (
              <button
                key={step.key}
                onClick={() => handleStatusChange(step.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  border: isSelected ? `1.5px solid ${BLUE}` : '1.5px solid #E5E5E5',
                  background: isSelected ? '#EEF3FF' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Icon size={18} color={isSelected ? BLUE : '#BBBBBB'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? BLUE : '#BBBBBB' }}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div style={{ background: '#fff', marginBottom: 8 }}>
        {infoRows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 16px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
              <span style={{ fontSize: 12, color: GRAY }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: row.color || '#191919' }}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {issue.content && (
        <div style={{ margin: '0 16px 8px', background: '#fff', borderRadius: 14, padding: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#191919', display: 'block', marginBottom: 8 }}>내용</span>
          <p style={{ fontSize: 14, color: '#191919', lineHeight: 1.6 }}>{issue.content}</p>
        </div>
      )}

      {/* Memo */}
      <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 14, padding: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#191919', display: 'block', marginBottom: 8 }}>처리 메모</span>
        <p style={{ fontSize: 14, color: issue.memo ? '#191919' : '#BBBBBB', lineHeight: 1.6 }}>
          {issue.memo || '처리 내용을 입력해주세요'}
        </p>
      </div>

      {/* Bottom buttons */}
      <div style={{ margin: '0 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            border: '1.5px solid #FEE2E2', background: '#fff',
            fontSize: 15, fontWeight: 700, color: RED, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          삭제
        </button>
        <button
          onClick={() => { if (!isDone) handleStatusChange('완료'); }}
          disabled={isDone}
          style={{
            flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
            background: isDone ? '#F5F5F5' : BLUE,
            color: isDone ? '#BBBBBB' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: isDone ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {isDone ? '처리 완료됨' : '처리 완료'}
        </button>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ width: '100%', maxWidth: 430, background: '#fff', padding: '24px 16px 32px', borderRadius: '20px 20px 0 0' }}>
            <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>이슈를 삭제할까요?</p>
            <p style={{ textAlign: 'center', fontSize: 13, color: GRAY, marginBottom: 24 }}>삭제된 이슈는 복구할 수 없습니다</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, padding: 14, borderRadius: 12, background: '#F5F5F5', fontSize: 15, fontWeight: 600, color: '#191919', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </button>
              <button
                disabled={deleting}
                style={{ flex: 1, padding: 14, borderRadius: 12, background: RED, fontSize: 15, fontWeight: 600, color: '#fff', border: 'none', cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit' }}
                onClick={handleDelete}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
