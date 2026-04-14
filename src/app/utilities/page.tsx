'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const BLUE = '#3182f6', GRAY = '#8b95a1', RED = '#E24B4A', GREEN = '#00B493';
const fmt = (n: number) => n.toLocaleString() + '원';
const fmtK = (n: number) => (n >= 10000 ? Math.round(n / 1000) + 'k' : n.toLocaleString());

type HouseData = {
  houseName: string;
  hasData: boolean;
  전기?: number; 가스?: number; 수도?: number;
  인터넷?: number; 정수기?: number; 기타?: number;
  total?: number;
};
type District = {
  name: string;
  houses: HouseData[];
  totalAmount: number;
  completedCount: number;
  missingCount: number;
};
type Summary = { totalAmount: number; completedCount: number; missingCount: number };

const FIELDS = ['전기', '가스', '수도', '인터넷', '정수기', '기타'] as const;

export default function UtilitiesPage() {
  const router = useRouter();
  const [districts, setDistricts] = useState<District[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalAmount: 0, completedCount: 0, missingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const isFuture = year > nowYear || (year === nowYear && month >= nowMonth);

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
    fetch(`/api/utilities?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => {
        setDistricts(d.districts || []);
        setSummary(d.summary || { totalAmount: 0, completedCount: 0, missingCount: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (key: string) => {
    if (editing === key) return;
    setExpanded(p => ({ ...p, [key]: !p[key] }));
  };

  const startEdit = (h: HouseData) => {
    const key = h.houseName;
    setEditing(key);
    setExpanded(p => ({ ...p, [key]: true }));
    setForm({
      전기: h.전기 || 0, 가스: h.가스 || 0, 수도: h.수도 || 0,
      인터넷: h.인터넷 || 0, 정수기: h.정수기 || 0, 기타: h.기타 || 0,
    });
  };

  const startNew = (houseName: string) => {
    setEditing(houseName);
    setExpanded(p => ({ ...p, [houseName]: true }));
    setForm({ 전기: 0, 가스: 0, 수도: 0, 인터넷: 0, 정수기: 0, 기타: 0 });
  };

  const save = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseName: editing, year, month, ...form }),
      });
      setEditing(null);
      fetchData();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (editing) {
      setExpanded(p => ({ ...p, [editing]: false }));
      setEditing(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', maxWidth: 430, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/manage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 8 }}>공과금 관리</span>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer', padding: '0 8px' }}>◀</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#191f28' }}>{year}년 {month}월</span>
        <button onClick={nextMonth} disabled={isFuture} style={{ background: 'none', border: 'none', fontSize: 18, color: isFuture ? '#ddd' : '#888', cursor: isFuture ? 'default' : 'pointer', padding: '0 8px' }}>▶</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>이달 합계</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: BLUE }}>{fmt(summary.totalAmount)}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>완료</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: GREEN }}>{summary.completedCount}개</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #f2f3f5', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>미입력</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: RED }}>{summary.missingCount}개</div>
              </div>
            </div>
          </div>

          {/* District Cards */}
          <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {districts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY, fontSize: 13 }}>데이터가 없어요</div>
            ) : districts.map(dist => (
              <div key={dist.name} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f2f3f5', overflow: 'hidden' }}>
                {/* District Header */}
                <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28' }}>{dist.name}</span>
                  <span style={{ fontSize: 12, color: dist.missingCount > 0 ? RED : GRAY }}>
                    {dist.houses.length}개 지점{dist.missingCount > 0 ? ` · ${dist.missingCount}개 미입력` : ''}
                  </span>
                </div>

                {/* House Rows */}
                {dist.houses.map((h) => {
                  const key = h.houseName;
                  const isOpen = !!expanded[key];
                  const isEditing = editing === key;

                  if (!h.hasData) {
                    // 미입력 지점
                    return (
                      <div key={key} style={{ borderTop: '1px solid #f2f4f6' }}>
                        <button onClick={() => startNew(key)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 18px', background: '#FEF2F2', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{h.houseName}</div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>미입력 — 탭하여 입력</div>
                          </div>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#FEE2E2', color: RED }}>미입력</span>
                        </button>
                        {isEditing && renderForm()}
                      </div>
                    );
                  }

                  // 완료 지점
                  return (
                    <div key={key} style={{ borderTop: '1px solid #f2f4f6' }}>
                      <button onClick={() => toggle(key)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 18px', background: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#191f28' }}>{h.houseName}</div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            전기 {fmtK(h.전기 || 0)} · 가스 {fmtK(h.가스 || 0)} · 수도 {fmtK(h.수도 || 0)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>{fmt(h.total || 0)}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#D1FAE5', color: GREEN }}>완료</span>
                        </div>
                      </button>

                      {isOpen && !isEditing && (
                        <div style={{ padding: '0 18px 14px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {FIELDS.map(f => (
                              <div key={f} style={{ background: '#f8f9fa', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: GRAY, marginBottom: 4 }}>{f}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{fmt(h[f] || 0)}</div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => startEdit(h)} style={{
                            width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid #e5e8eb',
                            background: '#fff', color: '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}>수정</button>
                        </div>
                      )}
                      {isEditing && renderForm()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  function renderForm() {
    return (
      <div style={{ padding: '14px 18px', borderTop: '1px solid #f2f4f6', background: '#fafafa' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {FIELDS.map(f => (
            <div key={f}>
              <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>{f}</div>
              <input
                type="number"
                value={form[f] || ''}
                onChange={e => setForm(p => ({ ...p, [f]: Number(e.target.value) || 0 }))}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e8eb',
                  fontSize: 14, fontWeight: 500, textAlign: 'right', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="0"
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={cancel} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e5e8eb',
            background: '#fff', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>취소</button>
          <button onClick={save} disabled={saving} style={{
            flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
            background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
          }}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    );
  }
}
