'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

const issueTypes = ['수리', '청소', '민원', '교체', '기타'];
const BLUE = '#3182F6', GRAY = '#888888';

export default function NewIssuePage() {
  const router = useRouter();
  const [houses, setHouses] = useState<any[]>([]);
  const [guList, setGuList] = useState<string[]>([]);
  const [selectedGu, setSelectedGu] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(data => {
      const hs = Array.isArray(data) ? data : [];
      setHouses(hs);
      setGuList([...new Set(hs.map((h: any) => h['구']).filter(Boolean))] as string[]);
    });
  }, []);

  const filteredHouses = useMemo(() => {
    if (!selectedGu) return houses;
    return houses.filter(h => h['구'] === selectedGu);
  }, [houses, selectedGu]);

  const canSubmit = title.trim().length > 0 && selectedHouse;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        houseName: selectedHouse,
        roomCode,
        title,
        content,
        category: type || '기타',
      }),
    });
    if (res.ok) {
      router.push('/issues');
    } else {
      alert('등록 실패');
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: GRAY, letterSpacing: 0.3, marginBottom: 6, display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #E5E5E5', borderRadius: 12, padding: '10px 12px',
    fontSize: 14, color: '#191919', background: '#fff', appearance: 'none', WebkitAppearance: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
  };
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: 16, marginBottom: 8,
  };

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronLeft size={24} color="#191919" />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>이슈 등록</span>
        <div style={{ width: 24 }} />
      </header>

      <div style={{ padding: '16px 16px' }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>구</label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...inputStyle, paddingRight: 32 }} value={selectedGu}
                onChange={e => { setSelectedGu(e.target.value); setSelectedHouse(''); }}>
                <option value="">전체</option>
                {guList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#BBBBBB' }}>▼</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>지점</label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...inputStyle, paddingRight: 32 }} value={selectedHouse}
                onChange={e => setSelectedHouse(e.target.value)}>
                <option value="">지점 선택</option>
                {filteredHouses.map(h => <option key={h['지점ID']} value={h['지점명']}>{h['지점명']}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#BBBBBB' }}>▼</div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>방코드 (선택)</label>
            <input style={inputStyle} placeholder="예: A-1" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
          </div>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>유형</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {issueTypes.map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 99, fontSize: 13, fontWeight: type === t ? 600 : 400,
                  background: type === t ? '#191919' : '#F5F5F5', color: type === t ? '#fff' : GRAY,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>제목</label>
          <input style={inputStyle} placeholder="예: 수도 누수 발생" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>상세 내용 (선택)</label>
          <textarea style={{ ...inputStyle, height: 100, resize: 'none' }} placeholder="상세 내용을 입력해주세요"
            value={content} onChange={e => setContent(e.target.value)} />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        padding: '12px 16px 20px', background: '#fff', borderTop: '1px solid #F0F0F0', zIndex: 30 }}>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 16, fontWeight: 700, border: 'none',
            cursor: canSubmit && !submitting ? 'pointer' : 'default',
            background: canSubmit ? BLUE : '#E5E5E5', color: canSubmit ? '#fff' : '#BBBBBB', fontFamily: 'inherit' }}>
          {submitting ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  );
}
