'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Chip from '@/components/ui/Chip';
import { branchDetails, formatWon, type UtilityAccount } from '@/lib/mockData';
import { AlertTriangle, Bell, CalendarPlus, FileText, X } from 'lucide-react';

type RoomFilter = 'all' | 'vacant' | 'unpaid';
const BLUE = '#3182f6', GRAY = '#8b95a1';

export default function HouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const branch = branchDetails[id];
  const [tab, setTab] = useState(0); // 0=방목록, 1=공과금계정
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
  const [accounts, setAccounts] = useState<UtilityAccount[]>([]);
  const [editingAccount, setEditingAccount] = useState<UtilityAccount | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (branch) setAccounts(branch.utilityAccounts || []);
  }, [branch]);

  useEffect(() => {
    document.body.style.overflow = showEditSheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showEditSheet]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  if (!branch) {
    return (
      <>
        <PageHeader title="지점 상세" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: '#BBBBBB' }}>지점을 찾을 수 없어요</p>
        </div>
      </>
    );
  }

  const filteredRooms = branch.rooms.filter((r) => {
    if (roomFilter === 'vacant') return r.status === 'vacant';
    if (roomFilter === 'unpaid') return r.status === 'unpaid';
    return true;
  });

  const quickActions = [
    { icon: AlertTriangle, label: '이슈등록', bg: '#FFF0F0', color: '#F04452' },
    { icon: Bell, label: '공지발송', bg: '#EEF3FF', color: '#3182F6' },
    { icon: CalendarPlus, label: '일정추가', bg: '#E8FBF5', color: '#00B493' },
    { icon: FileText, label: '임대계약서', bg: '#F3EEFF', color: '#7C3AED' },
  ];

  const filters: { key: RoomFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'vacant', label: '공실' },
    { key: 'unpaid', label: '미납' },
  ];

  const openEdit = (acc: UtilityAccount) => {
    setEditingAccount(acc);
    setEditCompany(acc.company);
    setEditNumber(acc.number);
    setEditMemo(acc.memo);
    setShowEditSheet(true);
  };

  const handleSave = () => {
    if (!editingAccount) return;
    setAccounts(prev => prev.map(a =>
      a.type === editingAccount.type
        ? { ...a, company: editCompany, number: editNumber, memo: editMemo }
        : a
    ));
    setShowEditSheet(false);
    setEditingAccount(null);
    showToast('저장됐어요!');
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    showToast('번호 복사됨!');
  };

  const tabLabels = ['방 목록', '공과금계정'];

  return (
    <div style={{ paddingBottom: 16, background: '#F7F8FA', minHeight: '100vh' }}>
      <PageHeader title={branch.name} rightButton={<button style={{ fontSize: 14, color: '#3182F6', fontWeight: 500 }}>편집</button>} />

      {/* 히어로 */}
      <div style={{ background: '#fff', padding: '20px 16px', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: branch.districtColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {branch.name.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{branch.name}</h2>
            <p style={{ fontSize: 13, color: '#888888' }}>{branch.address}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center', padding: 12, background: '#F7F8FA', borderRadius: 12 }}>
            <p style={{ fontSize: 11, color: '#888888' }}>입주중</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#00B493' }}>{branch.tenants}</p>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#F7F8FA', borderRadius: 12 }}>
            <p style={{ fontSize: 11, color: '#888888' }}>공실</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#D97706' }}>{branch.vacant}</p>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: '#F7F8FA', borderRadius: 12 }}>
            <p style={{ fontSize: 11, color: '#888888' }}>월수입</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191919' }}>{(branch.monthlyRent / 10000).toFixed(0)}만</p>
          </div>
        </div>
      </div>

      {/* 퀵액션 */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 0, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={action.color} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#191919' }}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {tabLabels.map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab 0: 방 목록 */}
      {tab === 0 && (
        <div style={{ background: '#fff', padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>방 목록 ({branch.rooms.length}실)</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {filters.map((f) => (
                <button key={f.key}
                  style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: roomFilter === f.key ? 600 : 400, background: roomFilter === f.key ? '#191919' : '#F5F5F5', color: roomFilter === f.key ? '#fff' : '#888888' }}
                  onClick={() => setRoomFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredRooms.map((room, i) => {
              const isVacant = room.status === 'vacant';
              const badgeColor = isVacant ? '#F5F5F5' : room.status === 'unpaid' ? '#FEE2E2' : room.status === 'checkout' ? '#FFF8E8' : '#E8FBF5';
              const badgeTextColor = isVacant ? '#BBBBBB' : room.status === 'unpaid' ? '#F04452' : room.status === 'checkout' ? '#D97706' : '#00B493';
              return (
                <div key={room.id}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                  {room.tenantId ? (
                    <Link href={`/tenants/${room.tenantId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: badgeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: badgeTextColor, flexShrink: 0 }}>
                        {room.name.replace('호', '')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{room.name}</p>
                        <p style={{ fontSize: 12, color: '#888888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.tenantName} · {room.contractEnd}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{formatWon(room.rent)}</p>
                        <Chip type={room.status} />
                      </div>
                    </Link>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#BBBBBB', flexShrink: 0 }}>
                        {room.name.replace('호', '')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#BBBBBB' }}>{room.name}</p>
                        <p style={{ fontSize: 12, color: '#BBBBBB' }}>공실 · 입실 가능</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#BBBBBB' }}>{formatWon(room.rent)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: 공과금계정 */}
      {tab === 1 && (
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: GRAY, marginBottom: 12 }}>고지서 납부 시 필요한 계정 정보</p>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f2f4f6', overflow: 'hidden' }}>
            {accounts.map((acc, i) => (
              <div key={acc.type}>
                {i > 0 && <div style={{ height: 1, background: '#f2f4f6' }} />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28', marginBottom: 3 }}>
                      {acc.icon} {acc.type}
                    </div>
                    <div style={{ fontSize: 12, color: GRAY }}>
                      {acc.company}{acc.memo ? ` · ${acc.memo}` : ''}
                    </div>
                  </div>
                  <button onClick={() => copyNumber(acc.number)}
                    style={{ fontSize: 13, fontWeight: 600, color: '#191f28', marginRight: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {acc.number}
                  </button>
                  <button onClick={() => openEdit(acc)}
                    style={{ border: 'none', background: 'none', color: GRAY, fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                    수정
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: GRAY }}>등록된 계정이 없어요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Bottom Sheet */}
      {showEditSheet && editingAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => { setShowEditSheet(false); setEditingAccount(null); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{editingAccount.icon} {editingAccount.type} 계정 수정</span>
              <button onClick={() => { setShowEditSheet(false); setEditingAccount(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            {[
              { label: '업체명', val: editCompany, set: setEditCompany, ph: '업체명 입력' },
              { label: '고객번호', val: editNumber, set: setEditNumber, ph: '고객번호 입력' },
              { label: '메모 (선택)', val: editMemo, set: setEditMemo, ph: '메모 입력' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <button onClick={handleSave}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
              저장
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
