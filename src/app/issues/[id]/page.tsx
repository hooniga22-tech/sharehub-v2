'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { issues } from '@/lib/mockData';
import { ChevronLeft, MoreVertical, ClipboardList, Sun, CheckCircle2 } from 'lucide-react';

type IssueStatus = 'waiting' | 'inprogress' | 'done';

const statusSteps: { key: IssueStatus; label: string; icon: typeof ClipboardList }[] = [
  { key: 'waiting', label: '접수', icon: ClipboardList },
  { key: 'inprogress', label: '처리중', icon: Sun },
  { key: 'done', label: '완료', icon: CheckCircle2 },
];

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const issue = issues.find((i) => i.id === Number(id));

  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'waiting');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!issue) {
    return (
      <div style={{ background: '#F7F8FA', minHeight: '100vh' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/issues')}><ChevronLeft size={24} color="#191919" /></button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>이슈 상세</span>
          <div style={{ width: 24 }} />
        </header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBBBBB', fontSize: 14 }}>이슈를 찾을 수 없어요</p>
        </div>
      </div>
    );
  }

  const isDone = status === 'done';
  const elapsedColor = issue.elapsed >= 3 ? '#F04452' : issue.elapsed >= 1 ? '#F59E0B' : '#888888';

  const infoRows = [
    { label: '지점', value: issue.place, link: `/houses/${issue.houseId}`, color: '#3182F6' },
    { label: '유형', value: issue.type },
    { label: '접수일', value: issue.date },
    { label: '경과일', value: `${issue.elapsed}일`, color: elapsedColor },
    { label: '담당자', value: issue.manager },
  ];

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh', paddingBottom: 100 }}>
      {/* 상단 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #F0F0F0',
      }}>
        <button onClick={() => router.push('/issues')} style={{ padding: 4, marginLeft: -4 }}>
          <ChevronLeft size={24} color="#191919" />
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: '#191919' }}>
          이슈 상세
        </span>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ padding: 4 }}>
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
                  style={{ display: 'block', width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#191919', textAlign: 'left' }}
                  onClick={() => setShowMenu(false)}
                >
                  수정
                </button>
                <div style={{ height: 1, background: '#F5F5F5' }} />
                <button
                  style={{ display: 'block', width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#F04452', textAlign: 'left' }}
                  onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                >
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 히어로 */}
      <div style={{ background: '#fff', padding: '20px 16px', borderBottom: '8px solid #F7F8FA' }}>
        {/* 긴급 배지 */}
        {issue.urgent && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8, marginBottom: 10,
            background: '#FFF0F0', color: '#F04452', fontSize: 12, fontWeight: 600,
          }}>
            긴급 · {issue.elapsed}일 경과
          </div>
        )}

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#191919', marginBottom: 4 }}>{issue.title}</h2>
        <p style={{ fontSize: 13, color: '#888888' }}>{issue.place} · {issue.date}</p>

        {/* 상태 버튼 3개 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {statusSteps.map((step) => {
            const Icon = step.icon;
            const isSelected = status === step.key;
            return (
              <button
                key={step.key}
                onClick={() => setStatus(step.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  border: isSelected ? '1.5px solid #3182F6' : '1.5px solid #E5E5E5',
                  background: isSelected ? '#EEF3FF' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <Icon size={18} color={isSelected ? '#3182F6' : '#BBBBBB'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#3182F6' : '#BBBBBB' }}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 이슈 정보 리스트 */}
      <div style={{ background: '#fff', marginBottom: 8 }}>
        {infoRows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 16px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
              <span style={{ fontSize: 12, color: '#888888' }}>{row.label}</span>
              {row.link ? (
                <Link href={row.link} style={{ fontSize: 13, fontWeight: 500, color: row.color || '#191919' }}>
                  {row.value}
                </Link>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: row.color || '#191919' }}>{row.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 처리 메모 카드 */}
      <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>처리 메모</span>
          <button style={{ fontSize: 12, fontWeight: 500, color: '#3182F6' }}>편집</button>
        </div>
        {issue.memo ? (
          <>
            <p style={{ fontSize: 14, color: '#191919', lineHeight: 1.6 }}>{issue.memo}</p>
            {issue.memoDate && (
              <p style={{ fontSize: 10, color: '#BBBBBB', marginTop: 8 }}>마지막 수정 {issue.memoDate}</p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 14, color: '#BBBBBB' }}>처리 내용을 입력해주세요</p>
        )}
      </div>

      {/* 하단 버튼 2개 */}
      <div style={{ margin: '0 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            border: '1.5px solid #FEE2E2', background: '#fff',
            fontSize: 15, fontWeight: 700, color: '#F04452',
            cursor: 'pointer',
          }}
        >
          삭제
        </button>
        <button
          onClick={() => { if (!isDone) setStatus('done'); }}
          disabled={isDone}
          style={{
            flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
            background: isDone ? '#F5F5F5' : '#3182F6',
            color: isDone ? '#BBBBBB' : '#fff',
            fontSize: 15, fontWeight: 700,
            cursor: isDone ? 'default' : 'pointer',
          }}
        >
          {isDone ? '처리 완료됨' : '처리 완료'}
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ width: '100%', maxWidth: 430, background: '#fff', padding: '24px 16px 32px', borderRadius: '20px 20px 0 0' }}>
            <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>이슈를 삭제할까요?</p>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#888888', marginBottom: 24 }}>삭제된 이슈는 복구할 수 없습니다</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, padding: 14, borderRadius: 12, background: '#F5F5F5', fontSize: 15, fontWeight: 600, color: '#191919', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </button>
              <button
                style={{ flex: 1, padding: 14, borderRadius: 12, background: '#F04452', fontSize: 15, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}
                onClick={() => { setShowDeleteModal(false); router.push('/issues'); }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
