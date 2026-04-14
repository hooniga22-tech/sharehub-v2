'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#E24B4A';
const fmt = (n: number) => n.toLocaleString() + '원';

type Item = { id: string; date: string; type: string; houseName: string; category: string; amount: number; memo: string };
type Summary = { houseTotal: number; opsTotal: number; total: number; count: number };

const HOUSE_CATS = ['수리', '소모품', '청소', '기타'];
const OPS_CATS = ['인건비', '교통비', '통신비', '기타'];

const catBadge: Record<string, { bg: string; color: string }> = {
  수리: { bg: '#FEF3C7', color: '#92400E' },
  소모품: { bg: '#EFF6FF', color: '#1E40AF' },
  청소: { bg: '#D1FAE5', color: '#065F46' },
  인건비: { bg: '#F2F4F6', color: '#555' },
  교통비: { bg: '#F2F4F6', color: '#555' },
  통신비: { bg: '#F2F4F6', color: '#555' },
  기타: { bg: '#F2F4F6', color: '#555' },
};

export default function ExpensesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<Summary>({ houseTotal: 0, opsTotal: 0, total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('전체');
  const [deleting, setDeleting] = useState<string | null>(null);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const isFuture = year > nowYear || (year === nowYear && month >= nowMonth);

  const todayStr = `${nowYear}-${String(nowMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Form state
  const [fType, setFType] = useState('지점별');
  const [fHouse, setFHouse] = useState('');
  const [fCat, setFCat] = useState('수리');
  const [fDate, setFDate] = useState(todayStr);
  const [fAmount, setFAmount] = useState('');
  const [fMemo, setFMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isFuture) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/expenses?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        setSummary(d.summary || { houseTotal: 0, opsTotal: 0, total: 0, count: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch('/api/houses')
      .then(r => r.json())
      .then(d => {
        const list = (Array.isArray(d) ? d : []).map((h: Record<string, string>) => h['지점명'] || h.name || '').filter(Boolean);
        setHouses(list);
        if (list.length > 0 && !fHouse) setFHouse(list[0]);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!fAmount || saving) return;
    setSaving(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: fDate,
          type: fType,
          houseName: fType === '지점별' ? fHouse : '',
          category: fCat,
          amount: Number(fAmount),
          memo: fMemo,
        }),
      });
      setShowForm(false);
      setFAmount('');
      setFMemo('');
      fetchData();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (deleting) return;
    setDeleting(id);
    try {
      await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      fetchData();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const filtered = items
    .filter(i => filter === '전체' || i.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const cats = fType === '지점별' ? HOUSE_CATS : OPS_CATS;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 8 }}>지출 관리</span>
        </div>
        <button onClick={() => setShowForm(p => !p)} style={{
          padding: '6px 14px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ 등록</button>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#191f28' }}>{year}년 {month}월</span>
        <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 18, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: '0 8px' }}>▶</button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          {/* Type */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>유형</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['지점별', '전체운영'].map(t => (
                <button key={t} onClick={() => { setFType(t); setFCat(t === '지점별' ? '수리' : '인건비'); }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: fType === t ? `1.5px solid ${BLUE}` : '1px solid #e5e8eb', background: fType === t ? '#EFF6FF' : '#fff', color: fType === t ? BLUE : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* House (only for 지점별) */}
          {fType === '지점별' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>지점</div>
              <select value={fHouse} onChange={e => setFHouse(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e8eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                {houses.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          {/* Category */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>카테고리</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFCat(c)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: fCat === c ? `1.5px solid ${BLUE}` : '1px solid #e5e8eb', background: fCat === c ? '#EFF6FF' : '#fff', color: fCat === c ? BLUE : '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Amount */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>날짜</div>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e8eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>금액</div>
              <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e8eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', textAlign: 'right', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Memo */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 6 }}>메모</div>
            <input type="text" value={fMemo} onChange={e => setFMemo(e.target.value)} placeholder="메모 입력"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e8eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving || !fAmount}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', opacity: saving || !fAmount ? 0.5 : 1 }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      ) : (
        <>
          {/* Summary KPI */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>지점별 지출</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: RED }}>{fmt(summary.houseTotal)}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>전체운영</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: RED }}>{fmt(summary.opsTotal)}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>이달 합계</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{fmt(summary.total)}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>건수</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{summary.count}건</div>
              </div>
            </div>
          </div>

          {/* Segment Filter */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 6 }}>
            {['전체', '지점별', '전체운영'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '7px 14px', borderRadius: 8, border: filter === f ? `1.5px solid ${BLUE}` : '1px solid #e5e8eb', background: filter === f ? '#EFF6FF' : '#fff', color: filter === f ? BLUE : '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {f}
              </button>
            ))}
          </div>

          {/* Expense List */}
          <div style={{ padding: '8px 16px 24px' }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f2f3f5', overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: GRAY, fontSize: 13 }}>등록된 지출이 없어요</div>
              ) : filtered.map((item, i) => {
                const badge = catBadge[item.category] || catBadge['기타'];
                const label = item.type === '지점별' ? item.houseName : item.category;
                const isDeleting = deleting === item.id;
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#191f28' }}>{label}</span>
                        <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color }}>{item.category}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {item.date.slice(5).replace('-', '/')}{item.memo ? ` · ${item.memo}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>{fmt(item.amount)}</span>
                      <button onClick={() => deleteItem(item.id)} disabled={isDeleting}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e8eb', background: '#fff', color: RED, fontSize: 10, fontWeight: 600, cursor: isDeleting ? 'default' : 'pointer', fontFamily: 'inherit', opacity: isDeleting ? 0.4 : 1 }}>
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
