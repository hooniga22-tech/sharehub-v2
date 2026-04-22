'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLogout from '@/components/layout/SidebarLogout'

/* ─── Types ─── */
type Work = {
  rowIndex: number; 용역ID: string; 예정일: string; 지점명: string; 담당자명: string;
  작업종류: string; 정산금액: number; 메모: string; 요청사항: string; 완료여부: 'Y' | 'N'; 완료일: string;
};
type Staff = { 이름: string; 연락처: string; 분야: string };
type HouseRec = Record<string, string>;

/* ─── Design Tokens ─── */
const T = {
  bg: '#F2F4F6', card: '#FFFFFF',
  text: '#191F28', textSub: '#4E5968', textMute: '#8B95A1',
  blue: '#3182F6', blueLight: '#E6F0FE', blueDark: '#1B64DA',
  green: '#00B493', greenLight: '#D1F5EB', greenDark: '#00785C',
  orange: '#F9A825', orangeLight: '#FFF4DC', orangeDark: '#B26A00',
  red: '#F04438', redLight: '#FFE5E5', redDark: '#B42318',
  line: '#EAEDF0', divider: '#F2F4F6',
};

const WORK_TYPES = ['청소', '수리', '점검', '소독', '폐기물', '기타'];

const INPUT_STYLE: React.CSSProperties = {
  background: '#F9FAFB', border: '1px solid #E5E8EB', borderRadius: 8,
  padding: '10px 12px', fontSize: 14, color: T.text,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

/* ─── SVG Icons ─── */
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconBack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18L9 12L15 6" /></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconPhone = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconBuilding = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconMoney = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;

const MENU = [
  { label: '대시보드', href: '/', icon: IconHome },
  { label: '입주자', href: '/tenants', icon: IconUsers },
  { label: '지점', href: '/houses', icon: IconBuilding },
  { label: '일정/이슈', href: '/issues', icon: IconCalendar, active: true },
  { label: '수납/정산', href: '/payments', icon: IconMoney },
  { label: '관리', href: '/manage', icon: IconGrid },
];

/* ─── Helpers ─── */
function firstLabel(wt: string) { if (wt.includes('청소')) return '청소'; if (wt.includes('수리')) return '수리'; return '기타'; }
function badgeStyleFn(wt: string) {
  if (wt.includes('청소')) return { bg: T.greenLight, color: T.greenDark };
  if (wt.includes('수리')) return { bg: T.orangeLight, color: T.orangeDark };
  return { bg: T.divider, color: T.textMute };
}
function fmtDateKr(d: string) {
  if (!d) return '-';
  const dt = new Date(d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.slice(0, 10)} (${days[dt.getDay()]})`;
}

/* ─── Main ─── */
export default function IssueWorkDetailDesktop() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [house, setHouse] = useState<HouseRec | null>(null);

  // Dropdown options
  const [houseNames, setHouseNames] = useState<string[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Work & { 요청사항: string; 메모: string }>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then((d: any[]) => {
      setHouseNames((Array.isArray(d) ? d : []).map(h => h['지점명']).filter(Boolean).sort());
    }).catch(() => {});
    fetch('/api/workers/staff').then(r => r.json()).then((d: any[]) => {
      setStaffNames((Array.isArray(d) ? d : []).map(s => s['이름']).filter(Boolean).sort());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/issues/work/${id}`).then(r => r.json()).then(d => {
      if (d.error) { setLoading(false); return; }
      setWork(d);
      fetch('/api/workers/staff').then(r => r.json()).then((arr: any[]) => {
        const s = (Array.isArray(arr) ? arr : []).find(s => s.이름 === d.담당자명);
        if (s) setStaff(s);
      }).catch(() => {});
      fetch('/api/houses').then(r => r.json()).then((arr: any[]) => {
        const h = (Array.isArray(arr) ? arr : []).find(h => h['지점명'] === d.지점명);
        if (h) setHouse(h);
      }).catch(() => {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const startEdit = () => {
    if (!work) return;
    setDraft({
      예정일: work.예정일,
      지점명: work.지점명,
      담당자명: work.담당자명,
      작업종류: work.작업종류,
      정산금액: work.정산금액,
      요청사항: work.요청사항 || '',
      메모: work.메모 || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setDraft({}); };

  const saveEdit = async () => {
    if (!work || saving) return;
    setSaving(true);
    try {
      const body: any = {
        예정일: draft.예정일,
        지점명: draft.지점명,
        담당자명: draft.담당자명,
        작업종류: draft.작업종류,
        정산금액: Number(draft.정산금액) || 0,
        요청사항: draft.요청사항,
        메모: draft.메모,
      };
      const res = await fetch(`/api/issues/work/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { alert('저장 실패'); return; }
      const updated = await res.json();
      setWork(updated);
      setEditing(false);
      setDraft({});
      showToast('저장됐어요!');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 작업을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/issues/work/${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('삭제 실패'); return; }
    router.push('/issues');
  };

  const CARD: React.CSSProperties = { background: T.card, borderRadius: 14, border: `1px solid ${T.divider}`, padding: 24 };
  const CARD_TITLE: React.CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: -0.2, color: T.text, marginBottom: 18 };
  const ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.divider}` };

  const initials = work?.담당자명 ? work.담당자명.slice(0, 1) : '?';
  const displayName = editing ? (draft.담당자명 || '') : (work?.담당자명 || '-');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: T.bg, overflow: 'hidden', zIndex: 51, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: T.card, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 18px' }}><div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>ShareHub</div><div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>운영 관리자</div></div>
        <div style={{ padding: '0 16px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, borderRadius: 8, padding: '8px 10px' }}><IconSearch /><span style={{ fontSize: 12, color: T.textMute }}>검색</span></div></div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {MENU.map(m => (<Link key={m.label} href={m.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: m.active ? T.blueLight : 'transparent', color: m.active ? T.blueDark : T.textSub, fontWeight: m.active ? 600 : 400, fontSize: 13, textDecoration: 'none' }}><m.icon />{m.label}</Link>))}
        </nav>
        <SidebarLogout />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '14px 28px', background: T.card, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 8, background: T.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBack /></button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>작업 상세</div>
              <div style={{ fontSize: 12, color: T.textMute }}>일정/이슈 &rsaquo; {work?.지점명 || ''} &middot; {work?.작업종류 || ''}</div>
            </div>
          </div>
          {work && (
            <div style={{ display: 'flex', gap: 8 }}>
              {editing ? (
                <>
                  <button onClick={cancelEdit} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, color: T.textSub, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                  <button onClick={saveEdit} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: T.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>{saving ? '저장중...' : '저장'}</button>
                </>
              ) : (
                <>
                  <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.red}`, background: T.card, color: T.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                  <button onClick={startEdit} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: T.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}><IconEdit /> 편집</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMute, fontSize: 13 }}>불러오는 중...</div>
          ) : !work ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.red, fontSize: 13 }}>작업을 찾을 수 없어요</div>
          ) : (
            <div style={{ maxWidth: 1400, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Basic info */}
                <div style={CARD}>
                  <div style={CARD_TITLE}>기본 정보</div>

                  <div style={ROW}>
                    <span style={{ fontSize: 13, color: T.textMute }}>예정일</span>
                    {editing ? (
                      <input type="date" value={(draft.예정일 || '').slice(0, 10)} onChange={e => setDraft(d => ({ ...d, 예정일: e.target.value }))} style={{ ...INPUT_STYLE, width: 180, textAlign: 'right' }} />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{fmtDateKr(work.예정일)}</span>
                    )}
                  </div>

                  <div style={ROW}>
                    <span style={{ fontSize: 13, color: T.textMute }}>지점</span>
                    {editing ? (
                      <select value={draft.지점명 || ''} onChange={e => setDraft(d => ({ ...d, 지점명: e.target.value }))} style={{ ...INPUT_STYLE, width: 180, textAlign: 'right' }}>
                        {draft.지점명 && !houseNames.includes(draft.지점명) && <option value={draft.지점명}>{draft.지점명}</option>}
                        {houseNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{work.지점명 || '-'}</span>
                    )}
                  </div>

                  <div style={ROW}>
                    <span style={{ fontSize: 13, color: T.textMute }}>작업 구분</span>
                    {editing ? (
                      <select value={draft.작업종류 || ''} onChange={e => setDraft(d => ({ ...d, 작업종류: e.target.value }))} style={{ ...INPUT_STYLE, width: 180, textAlign: 'right' }}>
                        {!WORK_TYPES.includes(draft.작업종류 || '') && draft.작업종류 && <option value={draft.작업종류}>{draft.작업종류}</option>}
                        {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: badgeStyleFn(work.작업종류).bg, color: badgeStyleFn(work.작업종류).color }}>{firstLabel(work.작업종류)}</span>
                    )}
                  </div>

                  <div style={ROW}>
                    <span style={{ fontSize: 13, color: T.textMute }}>담당자</span>
                    {editing ? (
                      <select value={draft.담당자명 || ''} onChange={e => setDraft(d => ({ ...d, 담당자명: e.target.value }))} style={{ ...INPUT_STYLE, width: 180, textAlign: 'right' }}>
                        {draft.담당자명 && !staffNames.includes(draft.담당자명) && <option value={draft.담당자명}>{draft.담당자명}</option>}
                        {staffNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{work.담당자명 || '-'}</span>
                    )}
                  </div>

                  <div style={{ ...ROW, borderBottom: 'none' }}>
                    <span style={{ fontSize: 13, color: T.textMute }}>금액</span>
                    {editing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" inputMode="numeric" value={String(draft.정산금액 ?? 0)} onChange={e => setDraft(d => ({ ...d, 정산금액: Number(e.target.value) || 0 }))} style={{ ...INPUT_STYLE, width: 140, textAlign: 'right' }} />
                        <span style={{ fontSize: 14, color: T.textSub }}>원</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{(work.정산금액 || 0).toLocaleString()}원</span>
                    )}
                  </div>
                </div>

                {/* Request */}
                <div style={CARD}>
                  <div style={CARD_TITLE}>요청사항</div>
                  {editing ? (
                    <textarea value={draft.요청사항 ?? ''} onChange={e => setDraft(d => ({ ...d, 요청사항: e.target.value }))} placeholder="입주자 추가 요청이나 특이사항을 적어주세요" rows={5}
                      style={{ ...INPUT_STYLE, width: '100%', resize: 'vertical', lineHeight: 1.6 }} />
                  ) : (
                    <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, minHeight: 60 }}>
                      {work.요청사항 ? (
                        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{work.요청사항}</p>
                      ) : (
                        <p style={{ fontSize: 13, color: T.textMute, fontStyle: 'italic', margin: 0 }}>등록된 요청사항이 없습니다</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Memo */}
                {(editing || work.메모) && (
                  <div style={CARD}>
                    <div style={CARD_TITLE}>내부 메모</div>
                    {editing ? (
                      <textarea value={draft.메모 ?? ''} onChange={e => setDraft(d => ({ ...d, 메모: e.target.value }))} placeholder="내부 기록용 메모" rows={3}
                        style={{ ...INPUT_STYLE, width: '100%', resize: 'vertical', lineHeight: 1.6 }} />
                    ) : (
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16 }}>
                        <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{work.메모}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column (always readonly) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Staff card */}
                <div style={CARD}>
                  <div style={CARD_TITLE}>담당자</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #3182F6, #00B493)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{displayName}</div>
                      <div style={{ fontSize: 12, color: T.textMute }}>{staff?.분야 || '담당자'}</div>
                    </div>
                  </div>
                  {staff?.연락처 && (
                    <a href={`tel:${staff.연락처}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: T.blue, textDecoration: 'none' }}>
                      <IconPhone />
                      {staff.연락처}
                    </a>
                  )}
                </div>

                {/* House card */}
                <div style={CARD}>
                  <div style={CARD_TITLE}>지점 정보</div>
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{work.지점명}</div>
                    {house && (
                      <>
                        {house['주소'] && <div style={{ fontSize: 12, color: T.textMute, marginBottom: 2 }}>{house['주소']}</div>}
                        <div style={{ fontSize: 12, color: T.textMute }}>{house['구'] || ''}{house['총방수'] ? ` · ${house['총방수']}실` : ''}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status card (readonly) */}
                <div style={CARD}>
                  <div style={CARD_TITLE}>상태</div>
                  {(() => {
                    const isDone = work.완료여부 === 'Y';
                    const sBg = isDone ? T.greenLight : T.blueLight;
                    const sColor = isDone ? T.greenDark : T.blueDark;
                    const sLabel = isDone ? '완료' : '예정';
                    return <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6, background: sBg, color: sColor }}>{sLabel}</span>;
                  })()}
                  {work.완료여부 === 'Y' && work.완료일 && (
                    <div style={{ fontSize: 12, color: T.textMute, marginTop: 10 }}>완료일: {work.완료일}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
