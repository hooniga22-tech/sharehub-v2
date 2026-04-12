'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Phone, Link2, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';
import { mockWorkers, mockTasks as initialTasks, mockIssues as initialIssues, TYPE_COLOR, STATUS_COLOR, fmt, type Worker, type WorkTask, type WorkIssue } from '@/../data/mockWorkers';

const BLUE = '#3182f6', RED = '#f04452', GREEN = '#00c471', GRAY = '#8b95a1', ORANGE = '#f59f00';

export default function WorkersPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<WorkTask[]>(initialTasks);
  const [issues, setIssues] = useState<WorkIssue[]>(initialIssues);
  const [tab, setTab] = useState(0);
  const [workerDetail, setWorkerDetail] = useState<string | null>(null);
  const [selIssue, setSelIssue] = useState<WorkIssue | null>(null);
  const [assignWorkerId, setAssignWorkerId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const pendingIssueCount = issues.filter(i => i.status === '접수' && i.type === '수리').length;
  const fixedWorkers = mockWorkers.filter(w => w.type === '고정');
  const externalWorkers = mockWorkers.filter(w => w.type === '외부');

  const juneTasks = tasks.filter(t => t.month === 6 && t.year === 2025);
  const inProgress = juneTasks.filter(t => t.status === '진행중');
  const upcoming = juneTasks.filter(t => t.status === '예정');
  const completed = juneTasks.filter(t => t.status === '완료');

  const needAssign = issues.filter(i => i.type === '수리' && i.status === '접수');
  const processing = issues.filter(i => i.status === '처리중');
  const otherIssues = issues.filter(i => i.type !== '수리' && i.status === '접수');

  const totalPay = mockWorkers.reduce((s, w) => s + w.pay, 0);

  const assignIssue = () => {
    if (!selIssue || !assignWorkerId) return;
    const worker = mockWorkers.find(w => w.id === assignWorkerId);
    if (!worker) return;
    setIssues(prev => prev.map(i => i.id === selIssue.id ? { ...i, status: '처리중' as const, assignedId: assignWorkerId } : i));
    const newTask: WorkTask = {
      id: Date.now(), workerId: assignWorkerId, worker: worker.name, type: '수리',
      loc: selIssue.loc, room: selIssue.room, date: '6월 15일', day: 15, month: 6, year: 2025,
      status: '예정', memo: selIssue.title, amount: 60000, issueId: selIssue.id,
    };
    setTasks(prev => [...prev, newTask]);
    setSelIssue(null); setAssignWorkerId(null);
    showToast(`${worker.name}에게 배정 완료!`);
  };

  const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: bg, color }}>{label}</span>
  );

  const Avatar = ({ ch, bg, color, size = 38 }: { ch: string; bg: string; color: string; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color, flexShrink: 0 }}>{ch}</div>
  );

  const renderWorkerRow = (w: Worker) => {
    const isOpen = workerDetail === w.id;
    const tc = TYPE_COLOR[w.role];
    const wTasks = tasks.filter(t => t.workerId === w.id && t.month === 6);
    const wCompleted = wTasks.filter(t => t.status === '완료').length;
    return (
      <div key={w.id}>
        <button onClick={() => setWorkerDetail(isOpen ? null : w.id)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <Avatar ch={w.initial} bg={tc.bg} color={tc.color} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{w.name}</span>
              <Badge label={w.role} bg={tc.bg} color={tc.color} />
            </div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{w.phone} · {fmt(w.pay)}</div>
          </div>
          {isOpen ? <ChevronUp size={16} color="#999" /> : <ChevronDown size={16} color="#999" />}
        </button>
        {isOpen && (
          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: GRAY }}>이달 작업 {wTasks.length}건 · 완료 {wCompleted}건</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { navigator.clipboard.writeText(w.phone); showToast('전화번호 복사됨!'); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Phone size={13} /> 연락
              </button>
              {w.token && (
                <>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/worker/${w.token}`); showToast('링크 복사됨!'); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Link2 size={13} /> 링크 공유
                  </button>
                  <button onClick={() => router.push(`/worker/${w.token}`)}
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

  const renderTaskCard = (t: WorkTask) => {
    const tc = TYPE_COLOR[t.type]; const sc = STATUS_COLOR[t.status];
    return (
      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', opacity: t.status === '완료' ? 0.75 : 1 }}>
        <Avatar ch={t.worker[0]} bg={tc.bg} color={tc.color} size={34} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.worker}</span>
            <Badge label={t.type} bg={tc.bg} color={tc.color} />
            <Badge label={t.status} bg={sc.bg} color={sc.color} />
          </div>
          <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>
            {t.loc} {t.room} · {t.date}
            {t.issueId != null && <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 3, fontSize: 10, background: '#fff8e1', color: ORANGE }}>이슈연동</span>}
          </div>
        </div>
      </div>
    );
  };

  const tabLabels = ['직원·업체', '이달 일정', '이슈·수리', '정산'];

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
            style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
            {label}
            {i === 2 && pendingIssueCount > 0 && (
              <span style={{ position: 'absolute', top: 6, right: '15%', width: 16, height: 16, borderRadius: '50%', background: RED, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingIssueCount}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {tab === 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>👤 고정 용역 {fixedWorkers.length}명</div>
            <div style={{ background: '#fff', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
              {fixedWorkers.map((w, i) => (<div key={w.id}>{i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}{renderWorkerRow(w)}</div>))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 8 }}>🏢 외부 업체 {externalWorkers.length}곳</div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
              {externalWorkers.map((w, i) => (<div key={w.id}>{i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}{renderWorkerRow(w)}</div>))}
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            {[{ label: '진행중', list: inProgress, dot: ORANGE }, { label: '예정', list: upcoming, dot: GRAY }, { label: '완료', list: completed, dot: GREEN }].map(group => group.list.length > 0 && (
              <div key={group.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.dot }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: group.dot }}>{group.label} {group.list.length}건</span>
                </div>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                  {group.list.map((t, i) => (<div key={t.id}>{i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}{renderTaskCard(t)}</div>))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 2 && (
          <>
            {needAssign.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>배정 필요 {needAssign.length}건</span>
                </div>
                {needAssign.map(issue => (
                  <div key={issue.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: issue.urgent ? `1px solid ${RED}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {issue.urgent && <Badge label="긴급" bg="#FFF0F0" color={RED} />}
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{issue.title}</span>
                      </div>
                      <span style={{ fontSize: 11, color: RED, fontWeight: 600 }}>미배정</span>
                    </div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>{issue.loc} {issue.room} · {issue.date}</div>
                    <button onClick={() => { setSelIssue(issue); setAssignWorkerId(null); }}
                      style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1px solid ${BLUE}`, background: '#EBF4FF', fontSize: 13, fontWeight: 600, color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>
                      👤 수리 담당 배정 → 일정 자동 등록
                    </button>
                  </div>
                ))}
              </div>
            )}
            {processing.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>처리중 {processing.length}건</span>
                </div>
                {processing.map(issue => {
                  const assigned = mockWorkers.find(w => w.id === issue.assignedId);
                  return (
                    <div key={issue.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {issue.urgent && <Badge label="긴급" bg="#FFF0F0" color={RED} />}
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{issue.title}</span>
                        <Badge label="처리중" bg="#fff8e1" color={ORANGE} />
                      </div>
                      <div style={{ fontSize: 12, color: GRAY }}>{issue.loc} {issue.room} · 담당: {assigned?.name || '-'}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {otherIssues.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: GRAY }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: GRAY }}>기타 이슈 {otherIssues.length}건</span>
                </div>
                {otherIssues.map(issue => (
                  <div key={issue.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{issue.title}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{issue.loc} {issue.room} · {issue.date}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 3 && (
          <>
            <div style={{ background: BLUE, borderRadius: 14, padding: 20, marginBottom: 16, color: '#fff' }}>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>2025년 6월 총 용역비</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{fmt(totalPay)}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>고정 {fixedWorkers.length}명 + 외부 {externalWorkers.length}곳</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 60px', padding: '12px 20px', borderBottom: '1px solid #F0F0F0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: GRAY }}>이름</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: GRAY }}>구분</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: GRAY, textAlign: 'right' }}>금액</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: GRAY, textAlign: 'center' }}>상태</span>
              </div>
              {mockWorkers.map((w, i) => (
                <div key={w.id}>
                  {i > 0 && <div style={{ height: 1, background: '#F5F5F5', margin: '0 20px' }} />}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 60px', padding: '12px 20px', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</span>
                    <span style={{ fontSize: 12, color: GRAY }}>{w.type}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{fmt(w.pay)}</span>
                    <span style={{ textAlign: 'center' }}><Badge label="확정" bg="#e8faf2" color={GREEN} /></span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 60px', padding: '14px 20px', borderTop: '2px solid #E8E8E8', background: '#FAFAFA' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>합계</span><span />
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right', color: BLUE }}>{fmt(totalPay)}</span><span />
              </div>
            </div>
            <button style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>
              📊 정산 내보내기
            </button>
          </>
        )}
      </div>

      {selIssue && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setSelIssue(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ position: 'relative', width: '90%', maxWidth: 360, background: '#fff', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>담당자 배정</span>
              <button onClick={() => setSelIssue(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{selIssue.title}</div>
              <div style={{ fontSize: 12, color: GRAY }}>{selIssue.loc} {selIssue.room}</div>
            </div>
            {fixedWorkers.map(w => {
              const wTasks = tasks.filter(t => t.workerId === w.id && t.month === 6);
              const selected = assignWorkerId === w.id;
              return (
                <button key={w.id} onClick={() => setAssignWorkerId(w.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${selected ? BLUE : '#E8E8E8'}`, background: selected ? '#EBF4FF' : '#fff', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <Avatar ch={w.initial} bg={TYPE_COLOR[w.role].bg} color={TYPE_COLOR[w.role].color} size={32} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</span>
                    <span style={{ fontSize: 11, color: GRAY, marginLeft: 6 }}>이달 {wTasks.length}건</span>
                  </div>
                  {selected && <span style={{ color: BLUE, fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
            <button onClick={assignIssue} disabled={!assignWorkerId}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: assignWorkerId ? BLUE : '#E8E8E8', color: assignWorkerId ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: assignWorkerId ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>
              배정 완료
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
