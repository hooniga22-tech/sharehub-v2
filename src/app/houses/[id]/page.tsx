'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Chip from '@/components/ui/Chip';
import { branchDetails, formatWon } from '@/lib/mockData';
import { AlertTriangle, Bell, CalendarPlus, FileText } from 'lucide-react';

type RoomFilter = 'all' | 'vacant' | 'unpaid';

export default function HouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const branch = branchDetails[id];
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');

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

  return (
    <div style={{ paddingBottom: 16, background: '#F7F8FA', minHeight: '100vh' }}>
      <PageHeader title={branch.name} rightButton={<button style={{ fontSize: 14, color: '#3182F6', fontWeight: 500 }}>편집</button>} />

      {/* 히어로 */}
      <div style={{ background: '#fff', padding: '20px 16px', marginBottom: 8 }}>
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
      <div style={{ background: '#fff', padding: 16, marginBottom: 8 }}>
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

      {/* 방 목록 */}
      <div style={{ background: '#fff', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>방 목록 ({branch.rooms.length}실)</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {filters.map((f) => (
              <button
                key={f.key}
                style={{
                  padding: '4px 12px', borderRadius: 99,
                  fontSize: 12, fontWeight: roomFilter === f.key ? 600 : 400,
                  background: roomFilter === f.key ? '#191919' : '#F5F5F5',
                  color: roomFilter === f.key ? '#fff' : '#888888',
                }}
                onClick={() => setRoomFilter(f.key)}
              >
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
    </div>
  );
}
