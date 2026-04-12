'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, X, Link2 } from 'lucide-react';

const BLUE = '#3182f6', GRAY = '#8b95a1';
const fmt = (n: number) => n.toLocaleString() + '원';

type Inv = { 투자자ID: string; 투자자명: string; 연락처: string; 지점명: string; 배분비율: string; 링크토큰: string; 메모: string };

export default function InvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [addSheet, setAddSheet] = useState(false);
  const [editInv, setEditInv] = useState<Inv | null>(null);
  const [toast, setToast] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    fetch('/api/investors').then(r => r.json()).then(data => {
      setInvestors(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const anySheet = addSheet || editInv;
  useEffect(() => {
    document.body.style.overflow = anySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anySheet]);

  // Group investors by name
  const grouped = investors.reduce((map, inv) => {
    const name = inv.투자자명;
    if (!map[name]) map[name] = [];
    map[name].push(inv);
    return map;
  }, {} as Record<string, Inv[]>);

  const sel = selId ? grouped[selId] : null;
  const selFirst = sel?.[0];

  const openAdd = () => { setFormName(''); setFormPhone(''); setAddSheet(true); };
  const openEdit = (inv: Inv) => { setFormName(inv.투자자명); setFormPhone(inv.연락처); setEditInv(inv); };

  const saveAdd = async () => {
    if (!formName) return;
    await fetch('/api/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 투자자명: formName, 연락처: formPhone }),
    });
    const data = await fetch('/api/investors').then(r => r.json());
    setInvestors(Array.isArray(data) ? data : []);
    setAddSheet(false);
    showToast('투자자가 추가됐어요!');
  };

  const saveEdit = async () => {
    if (!editInv || !formName) return;
    await fetch('/api/investors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editInv.투자자ID, 투자자명: formName, 연락처: formPhone }),
    });
    setInvestors(prev => prev.map(i => i.투자자ID === editInv.투자자ID ? { ...i, 투자자명: formName, 연락처: formPhone } : i));
    setEditInv(null);
    showToast('수정됐어요!');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>투자자 관리</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY }}><div style={{ fontSize: 13 }}>불러오는 중...</div></div>
      </div>
    );
  }

  // List view
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
          <div style={{ fontSize: 12, color: GRAY, marginBottom: 12 }}>총 {Object.keys(grouped).length}명</div>
          {Object.entries(grouped).map(([name, invs]) => (
            <button key={name} onClick={() => setSelId(name)}
              style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#191f28', marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>{invs[0].연락처} · {invs.length}개 지점</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {invs.map(inv => (
                  <span key={inv.투자자ID} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, background: '#f2f4f6', color: GRAY }}>
                    {inv.지점명} {inv.배분비율}%
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        {addSheet && <Sheet title="투자자 추가" onClose={() => setAddSheet(false)}>
          <FormFields name={formName} setName={setFormName} phone={formPhone} setPhone={setFormPhone} />
          <button onClick={saveAdd} disabled={!formName} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: formName ? BLUE : '#e5e8eb', color: formName ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: formName ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>추가 완료</button>
        </Sheet>}
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // Detail view
  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSelId(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{selId}</span>
        </div>
        <button onClick={() => selFirst && openEdit(selFirst)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
          <Pencil size={13} /> 수정
        </button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { l: '이름', v: selFirst?.투자자명 || '' },
            { l: '연락처', v: selFirst?.연락처 || '' },
          ].map((row, i) => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < 1 ? '1px solid #f2f4f6' : 'none' }}>
              <span style={{ fontSize: 13, color: GRAY }}>{row.l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{row.v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>투자 지점</div>
        {sel.map(inv => (
          <div key={inv.투자자ID} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f2f4f6', padding: '16px 18px', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{inv.지점명}</div>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>배분 비율: {inv.배분비율}%</div>
            <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: `${Number(inv.배분비율)}%`, background: '#c4b5fd' }} />
              <div style={{ flex: 1, background: BLUE }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#7c3aed' }}>투자자 {inv.배분비율}%</span>
              <span style={{ fontSize: 11, color: BLUE }}>운영자 {100 - Number(inv.배분비율)}%</span>
            </div>
          </div>
        ))}
        {selFirst?.링크토큰 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Link2 size={14} color={BLUE} /><span style={{ fontSize: 14, fontWeight: 700 }}>개인 페이지 링크</span></div>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>투자자가 직접 확인할 수 있는 전용 링크예요</div>
            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', marginBottom: 10, wordBreak: 'break-all', fontSize: 12, color: GRAY }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/investor/{selFirst.링크토큰}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/investor/${selFirst!.링크토큰}`); showToast('링크가 복사됐어요!'); }}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>링크 복사</button>
          </div>
        )}
      </div>
      {editInv && <Sheet title="투자자 수정" onClose={() => setEditInv(null)}>
        <FormFields name={formName} setName={setFormName} phone={formPhone} setPhone={setFormPhone} />
        <button onClick={saveEdit} disabled={!formName} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: formName ? BLUE : '#e5e8eb', color: formName ? '#fff' : '#999', fontSize: 14, fontWeight: 700, cursor: formName ? 'pointer' : 'default', fontFamily: 'inherit', marginTop: 8 }}>수정 완료</button>
      </Sheet>}
      {toast && <Toast msg={toast} />}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '20px 20px 0 0', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormFields({ name, setName, phone, setPhone }: { name: string; setName: (v: string) => void; phone: string; setPhone: (v: string) => void }) {
  return (
    <>
      {[{ label: '이름', val: name, set: setName, ph: '이름 입력', type: 'text' }, { label: '연락처', val: phone, set: setPhone, ph: '010-0000-0000', type: 'tel' }].map(f => (
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
  return <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{msg}</div>;
}
