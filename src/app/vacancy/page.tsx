'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, FileText, Check } from 'lucide-react';
import { mockVacancies, type Vacancy, type Prospect } from '@/../data/mockVacancies';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#d97706';

export default function VacancyPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [vacs, setVacs] = useState<Vacancy[]>(mockVacancies);
  const [prospectSheet, setProspectSheet] = useState<Vacancy | null>(null);
  const [memoSheet, setMemoSheet] = useState<Vacancy | null>(null);
  const [detailSheet, setDetailSheet] = useState<Vacancy | null>(null);
  const [toast, setToast] = useState('');

  // Prospect form
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pMoveIn, setPMoveIn] = useState('');
  const [pDeposit, setPDeposit] = useState<'대기' | '완료'>('대기');

  // Memo form
  const [memoText, setMemoText] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const anySheet = prospectSheet || memoSheet || detailSheet;
  useEffect(() => {
    document.body.style.overflow = anySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anySheet]);

  const vacantNow = vacs.filter(v => v.type === '현재공실');
  const vacantSoon = vacs.filter(v => v.type === '퇴실예정').sort((a, b) => (a.moveOut || '') > (b.moveOut || '') ? 1 : -1);
  const withProspect = vacs.filter(v => v.prospect);

  const openProspect = (v: Vacancy) => {
    setProspectSheet(v);
    setPName(''); setPPhone(''); setPMoveIn(''); setPDeposit('대기');
  };

  const saveProspect = () => {
    if (!prospectSheet || !pName || !pMoveIn) return;
    setVacs(prev => prev.map(v =>
      v.id === prospectSheet.id ? { ...v, prospect: { name: pName, phone: pPhone, moveIn: pMoveIn, deposit: pDeposit } } : v
    ));
    setProspectSheet(null);
    showToast('예정자 등록 완료!');
  };

  const openMemo = (v: Vacancy) => {
    setMemoSheet(v);
    setMemoText(v.memo);
  };

  const saveMemo = () => {
    if (!memoSheet) return;
    setVacs(prev => prev.map(v =>
      v.id === memoSheet.id ? { ...v, memo: memoText } : v
    ));
    setMemoSheet(null);
    showToast('메모 저장됐어요');
  };

  const confirmMoveIn = (vacId: number) => {
    setVacs(prev => prev.filter(v => v.id !== vacId));
    setDetailSheet(null);
    showToast('✅ 입주 확정 완료!');
  };

  const tabLabels = [`공실현황 ${vacantNow.length}`, `퇴실예정 ${vacantSoon.length}`, `입주예정 ${withProspect.length}`];

  const VacancyCard = ({ v, showDate }: { v: Vacancy; showDate?: string }) => (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${v.type === '현재공실' ? '#fcc' : '#fde68a'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>{v.house} {v.room}</div>
          <div style={{ fontSize: 12, color: GRAY }}>
            {v.gu} · {v.type === '현재공실' ? `공실 ${v.since}~` : `퇴실 ${v.moveOut}`}
          </div>
        </div>
        {v.prospect && (
          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: v.prospect.deposit === '완료' ? '#e8faf2' : '#fff8e1', color: v.prospect.deposit === '완료' ? '#0e6245' : '#b7791f' }}>
            예정자 {v.prospect.deposit === '완료' ? '✓' : '대기'}
          </span>
        )}
      </div>

      {v.prospect && (
        <button onClick={() => setDetailSheet(v)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{v.prospect.name}</div>
            <div style={{ fontSize: 11, color: GRAY }}>입주 {v.prospect.moveIn.slice(5)}</div>
          </div>
          <span style={{ fontSize: 12, color: BLUE, fontWeight: 600 }}>상세 ›</span>
        </button>
      )}

      {v.memo && (
        <div style={{ background: '#fffbeb', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#92400e' }}>📝 {v.memo}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => openMemo(v)}
          style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
          📝 {v.memo ? '메모 수정' : '메모'}
        </button>
        {!v.prospect && (
          <button onClick={() => openProspect(v)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            + 예정자 등록
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>공실 관리</span>
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

      <div style={{ padding: 16 }}>
        {/* Tab 0: 공실현황 */}
        {tab === 0 && (
          vacantNow.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 10 }}>현재 공실 {vacantNow.length}실</div>
              {vacantNow.map(v => <VacancyCard key={v.id} v={v} />)}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>현재 공실이 없어요</div>
              <div style={{ fontSize: 13, color: GRAY }}>모든 방이 입주 중이에요</div>
            </div>
          )
        )}

        {/* Tab 1: 퇴실예정 */}
        {tab === 1 && (
          vacantSoon.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE, marginBottom: 10 }}>퇴실 예정 {vacantSoon.length}실 · 날짜 순</div>
              {vacantSoon.map(v => <VacancyCard key={v.id} v={v} />)}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>퇴실 예정이 없어요</div>
            </div>
          )
        )}

        {/* Tab 2: 입주예정 */}
        {tab === 2 && (
          withProspect.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 10 }}>입주 예정 {withProspect.length}실</div>
              {withProspect.map(v => (
                <div key={v.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{v.house} {v.room}</div>
                      <div style={{ fontSize: 12, color: GRAY }}>{v.gu} · {v.type === '현재공실' ? '현재 공실' : `퇴실 ${v.moveOut}`}</div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: v.prospect!.deposit === '완료' ? '#e8faf2' : '#fff8e1', color: v.prospect!.deposit === '완료' ? '#0e6245' : '#b7791f' }}>
                      보증금 {v.prospect!.deposit}
                    </span>
                  </div>
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{v.prospect!.name}</div>
                        <div style={{ fontSize: 12, color: GRAY }}>{v.prospect!.phone}</div>
                      </div>
                      <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>입주 {v.prospect!.moveIn.slice(5)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <FileText size={14} /> 계약 진행
                    </button>
                    <button onClick={() => confirmMoveIn(v.id)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: BLUE, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Check size={14} /> 입주 확정
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>입주 예정자가 없어요</div>
              <div style={{ fontSize: 13, color: GRAY }}>공실/퇴실예정 탭에서 등록해보세요</div>
            </div>
          )
        )}
      </div>

      {/* ===== Prospect Registration Sheet ===== */}
      {prospectSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setProspectSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>예정자 등록</span>
              <button onClick={() => setProspectSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 20 }}>{prospectSheet.house} {prospectSheet.room}</div>
            {[
              { label: '이름', val: pName, set: setPName, ph: '이름 입력', type: 'text' },
              { label: '연락처', val: pPhone, set: setPPhone, ph: '010-0000-0000', type: 'tel' },
              { label: '입주 예정일', val: pMoveIn, set: setPMoveIn, ph: '', type: 'date' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} type={f.type} placeholder={f.ph}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>보증금</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['대기', '완료'] as const).map(d => (
                  <button key={d} onClick={() => setPDeposit(d)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${pDeposit === d ? BLUE : '#E8E8E8'}`, background: pDeposit === d ? '#EBF4FF' : '#fff', color: pDeposit === d ? BLUE : '#666', fontSize: 13, fontWeight: pDeposit === d ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveProspect} disabled={!pName || !pMoveIn}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: pName && pMoveIn ? BLUE : '#e5e8eb', color: pName && pMoveIn ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: pName && pMoveIn ? 'pointer' : 'default', fontFamily: 'inherit' }}>
              등록 완료
            </button>
          </div>
        </div>
      )}

      {/* ===== Memo Sheet ===== */}
      {memoSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setMemoSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>메모</span>
              <button onClick={() => setMemoSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 16 }}>{memoSheet.house} {memoSheet.room}</div>
            <textarea value={memoText} onChange={e => setMemoText(e.target.value)}
              placeholder={"공실 관련 메모를 입력하세요\n예: 도배 필요, 사진 촬영 완료..."}
              style={{ width: '100%', height: 140, padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none' }} />
            <button onClick={saveMemo}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>
              저장
            </button>
          </div>
        </div>
      )}

      {/* ===== Prospect Detail Sheet ===== */}
      {detailSheet && detailSheet.prospect && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setDetailSheet(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>입주 예정자</span>
              <button onClick={() => setDetailSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 16 }}>{detailSheet.house} {detailSheet.room}</div>
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              {[
                { l: '이름', v: detailSheet.prospect.name },
                { l: '연락처', v: detailSheet.prospect.phone },
                { l: '입주 예정일', v: detailSheet.prospect.moveIn },
                { l: '보증금', v: detailSheet.prospect.deposit },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <FileText size={14} /> 계약 진행
              </button>
              <button onClick={() => confirmMoveIn(detailSheet.id)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: BLUE, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Check size={14} /> 입주 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>
      )}
    </div>
  );
}
