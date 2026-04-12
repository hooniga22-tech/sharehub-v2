'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, X, Link2 } from 'lucide-react';
import { mockInvestors as initialData, calcShare, calcTotalShare, fmt, type Investor, type InvestorHouse } from '@/../data/mockInvestors';

const BLUE = '#3182f6', GRAY = '#8b95a1';

export default function InvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<Investor[]>(initialData);
  const [selId, setSelId] = useState<number | null>(null);
  const [addSheet, setAddSheet] = useState(false);
  const [editInv, setEditInv] = useState<Investor | null>(null);
  const [ratioSheet, setRatioSheet] = useState<{ inv: Investor; house: InvestorHouse } | null>(null);
  const [toast, setToast] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [ratioVal, setRatioVal] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const anySheet = addSheet || editInv || ratioSheet;
  useEffect(() => {
    document.body.style.overflow = anySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anySheet]);

  const totalAllShare = investors.reduce((a, inv) => a + calcTotalShare(inv), 0);
  const sel = selId !== null ? investors.find(i => i.id === selId) : null;

  const openAdd = () => { setFormName(''); setFormPhone(''); setAddSheet(true); };
  const openEdit = (inv: Investor) => { setFormName(inv.name); setFormPhone(inv.phone); setEditInv(inv); };
  const openRatio = (inv: Investor, house: InvestorHouse) => { setRatioVal(String(Math.round(house.ratio * 100))); setRatioSheet({ inv, house }); };

  const saveAdd = () => {
    if (!formName) return;
    const newInv: Investor = { id: Date.now(), name: formName, phone: formPhone, token: `inv-${formName}-${Date.now()}`, houses: [] };
    setInvestors(prev => [...prev, newInv]);
    setAddSheet(false);
    showToast('투자자가 추가됐어요!');
  };

  const saveEdit = () => {
    if (!editInv || !formName) return;
    setInvestors(prev => prev.map(inv => inv.id === editInv.id ? { ...inv, name: formName, phone: formPhone } : inv));
    setEditInv(null);
    showToast('수정됐어요!');
  };

  const saveRatio = () => {
    if (!ratioSheet) return;
    const r = Number(ratioVal) / 100;
    if (isNaN(r) || r < 0 || r > 1) return;
    setInvestors(prev => prev.map(inv =>
      inv.id === ratioSheet.inv.id
        ? { ...inv, houses: inv.houses.map(h => h.houseId === ratioSheet.house.houseId ? { ...h, ratio: r } : h) }
        : inv
    ));
    setRatioSheet(null);
    showToast('비율이 수정됐어요!');
  };

  // ===== List View =====
  if (!sel) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>투자자 관리</span>
          </div>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
            <Plus size={14} /> 추가
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: GRAY, marginBottom: 12 }}>총 {investors.length}명 · 이달 배분 합계 {fmt(totalAllShare)}</div>

          {investors.map(inv => {
            const total = calcTotalShare(inv);
            return (
              <button key={inv.id} onClick={() => setSelId(inv.id)}
                style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#191f28', marginBottom: 2 }}>{inv.name}</div>
                <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>{inv.phone} · {inv.houses.length}개 지점</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {inv.houses.map(h => (
                    <span key={h.houseId} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, background: '#f2f4f6', color: GRAY }}>{h.houseName} {Math.round(h.ratio * 100)}%</span>
                  ))}
                </div>
                <div style={{ height: 1, background: '#f2f4f6', marginBottom: 10 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: GRAY }}>이달 배분금</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28' }}>{fmt(total)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Sheet */}
        {addSheet && (
          <Sheet title="투자자 추가" onClose={() => setAddSheet(false)}>
            <FormFields name={formName} setName={setFormName} phone={formPhone} setPhone={setFormPhone} />
            <button onClick={saveAdd} disabled={!formName}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: formName ? BLUE : '#e5e8eb', color: formName ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: formName ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>
              추가 완료
            </button>
          </Sheet>
        )}

        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // ===== Detail View =====
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSelId(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{sel.name}</span>
        </div>
        <button onClick={() => openEdit(sel)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
          <Pencil size={13} /> 수정
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Basic Info */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { l: '이름', v: sel.name },
            { l: '연락처', v: sel.phone },
            { l: '이달 배분금', v: fmt(calcTotalShare(sel)) },
          ].map((row, i) => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < 2 ? '1px solid #f2f4f6' : 'none' }}>
              <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{row.v}</span>
            </div>
          ))}
        </div>

        {/* Houses */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>투자 지점</div>
        {sel.houses.map(h => {
          const share = calcShare(h);
          const ownerRatio = 1 - h.ratio;
          return (
            <div key={h.houseId} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f2f4f6', padding: '16px 18px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{h.houseName}</div>
                  <div style={{ fontSize: 12, color: GRAY }}>{h.gu} · {Math.round(h.ratio * 100)}% 배분</div>
                </div>
                <button onClick={() => openRatio(sel, h)}
                  style={{ border: 'none', background: 'none', fontSize: 12, color: BLUE, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  비율 수정
                </button>
              </div>
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>
                순이익 {fmt(h.monthlyProfit)} → 배분 {fmt(share)}
              </div>
              <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${h.ratio * 100}%`, background: '#c4b5fd' }} />
                <div style={{ flex: 1, background: BLUE }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#7c3aed' }}>투자자 {Math.round(h.ratio * 100)}%</span>
                <span style={{ fontSize: 11, color: BLUE }}>운영자 {Math.round(ownerRatio * 100)}%</span>
              </div>
            </div>
          );
        })}

        {/* Link Card */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Link2 size={14} color={BLUE} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>개인 페이지 링크</span>
          </div>
          <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>투자자가 직접 확인할 수 있는 전용 링크예요</div>
          <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', marginBottom: 10, wordBreak: 'break-all', fontSize: 12, color: GRAY }}>
            {typeof window !== 'undefined' ? window.location.origin : ''}/investor/{sel.token}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/investor/${sel.token}`); showToast('링크가 복사됐어요!'); }}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            링크 복사
          </button>
        </div>

        {/* Settlement */}
        <button onClick={() => showToast('정산서 발송 기능은 준비 중이에요')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#f2f4f6', color: '#191f28', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          📄 정산서 발송
        </button>
      </div>

      {/* Edit Sheet */}
      {editInv && (
        <Sheet title="투자자 수정" onClose={() => setEditInv(null)}>
          <FormFields name={formName} setName={setFormName} phone={formPhone} setPhone={setFormPhone} />
          <button onClick={saveEdit} disabled={!formName}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: formName ? BLUE : '#e5e8eb', color: formName ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: formName ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>
            수정 완료
          </button>
        </Sheet>
      )}

      {/* Ratio Sheet */}
      {ratioSheet && (
        <Sheet title="배분 비율 수정" sub={ratioSheet.house.houseName} onClose={() => setRatioSheet(null)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>투자자 비율</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={ratioVal} onChange={e => setRatioVal(e.target.value)} type="number" min="0" max="100"
                style={{ flex: 1, padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>%</span>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>운영자 비율 (자동 계산)</label>
            <div style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{100 - (Number(ratioVal) || 0)}%</div>
          </div>
          <button onClick={saveRatio}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            저장
          </button>
        </Sheet>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ===== Sub Components =====

function Sheet({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sub ? 4 : 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
        </div>
        {sub && <div style={{ fontSize: 13, color: '#8b95a1', marginBottom: 20 }}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}

function FormFields({ name, setName, phone, setPhone }: { name: string; setName: (v: string) => void; phone: string; setPhone: (v: string) => void }) {
  return (
    <>
      {[
        { label: '이름', val: name, set: setName, ph: '이름 입력', type: 'text' },
        { label: '연락처', val: phone, set: setPhone, ph: '010-0000-0000', type: 'tel' },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>{f.label}</label>
          <input value={f.val} onChange={e => f.set(e.target.value)} type={f.type} placeholder={f.ph}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #E8E8E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
        </div>
      ))}
    </>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{msg}</div>
  );
}
