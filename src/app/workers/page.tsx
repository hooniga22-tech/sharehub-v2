'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Phone, Link2, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1', ORANGE = '#f59f00';
const fmt = (n: number) => n.toLocaleString() + '원';

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  청소: { bg: '#ebf3ff', color: BLUE }, 수리: { bg: '#fff8e1', color: ORANGE },
  에어컨: { bg: '#f0fdf4', color: GREEN }, 방역: { bg: '#f5f3ff', color: '#7c3aed' },
  정기청소: { bg: '#ebf3ff', color: BLUE },
};

type Staff = { 담당자ID: string; 이름: string; 연락처: string; 분야: string; 구분: string; 링크토큰: string; 기본금액: string };
type Work = { 용역ID: string; 예정일: string; 지점명: string; 담당자명: string; 작업종류: string; 정산금액: string; 메모: string; 완료여부: string };

export default function WorkersPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [workerDetail, setWorkerDetail] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    Promise.all([
      fetch('/api/workers').then(r => r.json()),
      fetch('/api/workers/staff').then(r => r.json()),
    ]).then(([workData, staffData]) => {
      setSchedules(Array.isArray(workData) ? workData : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markDone = async (id: string) => {
    await fetch('/api/workers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: 'Y' }) });
    setSchedules(prev => prev.map(s => s.용역ID === id ? { ...s, 완료여부: 'Y' } : s));
    showToast('완료 처리됐어요!');
  };

  const markUndone = async (id: string) => {
    await fetch('/api/workers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, 완료여부: 'N' }) });
    setSchedules(prev => prev.map(s => s.용역ID === id ? { ...s, 완료여부: 'N' } : s));
    showToast('되돌렸어요');
  };

  const fixedStaff = staffList.filter(s => s.구분 === '고정' || s.구분 === '정규');
  const externalStaff = staffList.filter(s => s.구분 === '외부' || s.구분 === '프리랜서' || (!s.구분 && !fixedStaff.find(f => f.담당자ID === s.담당자ID)));
  const inProgress = schedules.filter(s => s.완료여부 !== 'Y');
  const completed = schedules.filter(s => s.완료여부 === 'Y');
  const totalPay = staffList.reduce((s, w) => s + (Number(w.기본금액) || 0), 0);

  const tabLabels = ['직원·업체', '이달 일정', '정산'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>용역 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  const renderStaffRow = (s: Staff) => {
    const isOpen = workerDetail === s.담당자ID;
    const tc = TYPE_COLOR[s.분야] || TYPE_COLOR['청소'];
    const sTasks = schedules.filter(w => w.담당자명 === s.이름);
    const sDone = sTasks.filter(w => w.완료여부 === 'Y').length;
    return (
      <div key={s.담당자ID}>
        <button onClick={() => setWorkerDetail(isOpen ? null : s.담당자ID)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: tc.color, flexShrink: 0 }}>{(s.이름 || '?')[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{s.이름}</span>
              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: tc.bg, color: tc.color }}>{s.분야}</span>
            </div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{s.연락처} · {s.기본금액 ? fmt(Number(s.기본금액)) : '-'}</div>
          </div>
          {isOpen ? <ChevronUp size={16} color="#999" /> : <ChevronDown size={16} color="#999" />}
        </button>
        {isOpen && (
          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: GRAY }}>이달 작업 {sTasks.length}건 · 완료 {sDone}건</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { navigator.clipboard.writeText(s.연락처); showToast('전화번호 복사됨!'); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Phone size={13} /> 연락
              </button>
              {s.링크토큰 && (
                <>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/worker/${s.링크토큰}`); showToast('링크 복사됨!'); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Link2 size={13} /> 링크 공유
                  </button>
                  <button onClick={() => router.push(`/worker/${s.링크토큰}`)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <ExternalLink size={13} /> 개인 페이지
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>용역 관리</span>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
          <Plus size={14} /> 추가
        </button>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        {tabLabels.map((label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {tab === 0 && (
          <>
            {fixedStaff.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>👤 고정 용역 {fixedStaff.length}명</div>
                <div style={{ background: '#fff', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
                  {fixedStaff.map((s, i) => (<div key={s.담당자ID}>{i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}{renderStaffRow(s)}</div>))}
                </div>
              </>
            )}
            {externalStaff.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>🏢 외부 업체 {externalStaff.length}곳</div>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  {externalStaff.map((s, i) => (<div key={s.담당자ID}>{i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}{renderStaffRow(s)}</div>))}
                </div>
              </>
            )}
            {staffList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}>등록된 용역이 없어요</div>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            {inProgress.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>진행중/예정 {inProgress.length}건</span>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  {inProgress.map((w, i) => {
                    const tc = TYPE_COLOR[w.작업종류] || TYPE_COLOR['청소'];
                    return (
                      <div key={w.용역ID}>
                        {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: tc.color, flexShrink: 0 }}>{(w.담당자명 || '?')[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{w.담당자명}</span>
                              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: tc.bg, color: tc.color }}>{w.작업종류}</span>
                            </div>
                            <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{w.지점명} · {w.예정일}</div>
                          </div>
                          <button onClick={() => markDone(w.용역ID)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: GREEN, fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>완료</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>완료 {completed.length}건</span>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  {completed.map((w, i) => {
                    const tc = TYPE_COLOR[w.작업종류] || TYPE_COLOR['청소'];
                    return (
                      <div key={w.용역ID}>
                        {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', opacity: 0.65 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: tc.color, flexShrink: 0 }}>{(w.담당자명 || '?')[0]}</div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{w.담당자명}</span>
                            <div style={{ fontSize: 11, color: GRAY }}>{w.지점명} · {w.예정일} · {fmt(Number(w.정산금액) || 0)}</div>
                          </div>
                          <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#e8faf2', color: GREEN }}>완료</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {schedules.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY }}>이달 일정이 없어요</div>
            )}
          </>
        )}

        {tab === 2 && (
          <>
            <div style={{ background: BLUE, borderRadius: 14, padding: 20, marginBottom: 16, color: '#fff' }}>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>이달 총 용역비</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{fmt(totalPay)}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{staffList.length}명</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
              {staffList.map((s, i) => (
                <div key={s.담당자ID}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{s.이름}</span>
                      <span style={{ fontSize: 12, color: GRAY, marginLeft: 8 }}>{s.구분}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s.기본금액 ? fmt(Number(s.기본금액)) : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
