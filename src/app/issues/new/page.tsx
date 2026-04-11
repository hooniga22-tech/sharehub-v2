'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { districts } from '@/lib/mockData';

const issueTypes = ['수리', '민원', '교체', '기타'];

export default function NewIssuePage() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [memo, setMemo] = useState('');

  const filteredBranches = useMemo(() => {
    if (!selectedDistrict) return districts.flatMap((d) => d.branches.map((b) => ({ ...b, district: d.name })));
    const dist = districts.find((d) => d.name === selectedDistrict);
    return dist ? dist.branches.map((b) => ({ ...b, district: dist.name })) : [];
  }, [selectedDistrict]);

  const canSubmit = title.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    router.push('/issues');
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#888888',
    letterSpacing: 0.3,
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #E5E5E5',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 14,
    color: '#191919',
    background: '#fff',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  };

  return (
    <div style={{ background: '#F7F8FA', minHeight: '100vh', paddingBottom: 80 }}>
      <PageHeader title="이슈 등록" />

      <div style={{ padding: '16px 16px' }}>
        {/* 구 / 지점 선택 */}
        <div style={cardStyle}>
          {/* 구 */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>구</label>
            <div style={{ position: 'relative' }}>
              <select
                style={{ ...inputStyle, paddingRight: 32 }}
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedBranch('');
                }}
              >
                <option value="">전체</option>
                {districts.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#BBBBBB' }}>▼</div>
            </div>
          </div>

          {/* 지점 */}
          <div>
            <label style={labelStyle}>지점</label>
            <div style={{ position: 'relative' }}>
              <select
                style={{ ...inputStyle, paddingRight: 32 }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">지점 선택</option>
                {filteredBranches.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#BBBBBB' }}>▼</div>
            </div>
          </div>
        </div>

        {/* 유형 */}
        <div style={cardStyle}>
          <label style={labelStyle}>유형</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {issueTypes.map((t) => (
              <button
                key={t}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: type === t ? 600 : 400,
                  background: type === t ? '#191919' : '#F5F5F5',
                  color: type === t ? '#fff' : '#888888',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div style={cardStyle}>
          <label style={labelStyle}>제목</label>
          <input
            style={inputStyle}
            placeholder="예: 수도 누수 발생"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 긴급 여부 */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>긴급 처리</label>
          <button
            onClick={() => setUrgent(!urgent)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              background: urgent ? '#F04452' : '#E5E5E5',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: urgent ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          </button>
        </div>

        {/* 메모 */}
        <div style={cardStyle}>
          <label style={labelStyle}>상세 내용 (선택)</label>
          <textarea
            style={{
              ...inputStyle,
              height: 100,
              resize: 'none',
              fontFamily: 'inherit',
            }}
            placeholder="상세 내용을 입력해주세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          padding: '12px 16px',
          paddingBottom: 20,
          background: '#fff',
          borderTop: '1px solid #F0F0F0',
          zIndex: 30,
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'default',
            background: canSubmit ? '#3182F6' : '#E5E5E5',
            color: canSubmit ? '#fff' : '#BBBBBB',
            transition: 'background 0.2s',
          }}
        >
          등록하기
        </button>
      </div>
    </div>
  );
}
