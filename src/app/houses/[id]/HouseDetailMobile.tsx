'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, Copy, X } from 'lucide-react';
import Link from 'next/link';

const BLUE = '#3182f6', GRAY = '#8b95a1', GREEN = '#00c471', RED = '#f04452', ORANGE = '#d97706';
const TABS = ['기본정보', '방현황', '운영정보', '공과금계정'];
const fmt = (n: number) => n.toLocaleString() + '원';

export default function HouseDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [house, setHouse] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [investor, setInvestor] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');

  // Basic info edit fields
  const [addr, setAddr] = useState('');
  const [doorPw, setDoorPw] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPw, setWifiPw] = useState('');
  const [memo, setMemo] = useState('');

  // Utility accounts (stored in memo as JSON)
  const [utilAccounts, setUtilAccounts] = useState<Record<string, { vendor: string; account: string }>>({});
  const [editUtil, setEditUtil] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };
  const copyText = (text: string) => { navigator.clipboard?.writeText(text); showToast('복사됐어요!'); };

  useEffect(() => {
    Promise.all([
      fetch(`/api/houses?id=${id}`).then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([houseData, tenantData]) => {
      setHouse(houseData);
      setAddr(houseData['주소'] || '');
      setDoorPw(houseData['현관비번'] || '');
      setWifiSsid(houseData['와이파이SSID'] || '');
      setWifiPw(houseData['와이파이PW'] || '');
      setMemo(houseData['메모'] || '');

      // Parse utility accounts from memo JSON
      try {
        const m = houseData['메모'] || '';
        const jsonMatch = m.match(/\{\"전기.*\}/);
        if (jsonMatch) setUtilAccounts(JSON.parse(jsonMatch[0]));
      } catch { /* not JSON */ }

      const ts = Array.isArray(tenantData) ? tenantData : [];
      setTenants(ts.filter((t: any) => t['지점명'] === houseData['지점명'] && t.status !== 'moved_out'));

      // Load investor
      if (houseData['투자자토큰']) {
        fetch(`/api/investors?token=${houseData['투자자토큰']}`).then(r => r.json()).then(d => {
          if (!d.error) setInvestor(d);
        }).catch(() => {});
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const saveBasic = async () => {
    await fetch('/api/houses', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, 주소: addr, 현관비번: doorPw, 와이파이SSID: wifiSsid, 와이파이PW: wifiPw, 메모: memo }),
    });
    setHouse((prev: any) => ({ ...prev, 주소: addr, 현관비번: doorPw, 와이파이SSID: wifiSsid, 와이파이PW: wifiPw, 메모: memo }));
    setEditing(false);
    showToast('저장됐어요!');
  };

  const saveUtil = async () => {
    const jsonStr = JSON.stringify(utilAccounts);
    const baseMemo = (memo || '').replace(/\{\"전기.*\}/, '').trim();
    const newMemo = baseMemo ? `${baseMemo}\n${jsonStr}` : jsonStr;
    await fetch('/api/houses', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, 메모: newMemo }),
    });
    setMemo(newMemo);
    setEditUtil(false);
    showToast('저장됐어요!');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: GRAY, fontSize: 13 }}>불러오는 중...</div>;
  if (!house) return <div style={{ textAlign: 'center', padding: '80px 0', color: RED, fontSize: 13 }}>지점을 찾을 수 없어요</div>;

  const houseName = house['지점명'] || '';
  const active = tenants.filter(t => t.status === 'active').length;
  const leaving = tenants.filter(t => {
    if (t.status !== 'active' || !t['퇴실일']) return false;
    const dd = Math.ceil((new Date(t['퇴실일']).getTime() - Date.now()) / 86400000);
    return dd >= 0 && dd <= 90;
  }).length;
  const totalRooms = Number(house['총방수']) || tenants.length || 1;
  const vacancy = Math.max(0, totalRooms - active - leaving);

  const getDday = (dateStr: string) => {
    if (!dateStr) return 0;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  };

  const InfoRow = ({ label, value, canCopy }: { label: string; value: string; canCopy?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f2f4f6' }}>
      <span style={{ fontSize: 13, color: GRAY }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>{value || '-'}</span>
        {canCopy && value && <button onClick={() => copyText(value)} style={{ background: '#f2f4f6', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Copy size={12} color={GRAY} /></button>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <button onClick={() => router.push('/houses')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4, color: '#191919' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{houseName}</span>
          <span style={{ fontSize: 12, color: GRAY, marginLeft: 4 }}>{house['구']}</span>
        </div>
        <div style={{ display: 'flex' }}>
          {TABS.map((label, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ flex: 1, padding: '11px 0', border: 'none', borderBottom: tab === i ? `2px solid ${BLUE}` : '2px solid transparent', background: 'none', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? BLUE : GRAY, cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Tab 0: 기본정보 */}
        {tab === 0 && (
          <>
            <div style={{ background: '#fff', borderRadius: 14, padding: '4px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, padding: '10px 0 4px' }}>접근 정보</div>
              {editing ? (
                <>
                  {[{ l: '주소', v: addr, s: setAddr }, { l: '현관 비번', v: doorPw, s: setDoorPw }, { l: '와이파이 SSID', v: wifiSsid, s: setWifiSsid }, { l: '와이파이 PW', v: wifiPw, s: setWifiPw }].map(f => (
                    <div key={f.l} style={{ padding: '8px 0', borderBottom: '1px solid #f2f4f6' }}>
                      <label style={{ fontSize: 12, color: GRAY, display: 'block', marginBottom: 4 }}>{f.l}</label>
                      <input value={f.v} onChange={e => f.s(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <InfoRow label="주소" value={addr} canCopy />
                  <InfoRow label="현관 비번" value={doorPw} canCopy />
                  <InfoRow label="와이파이 SSID" value={wifiSsid} canCopy />
                  <InfoRow label="와이파이 PW" value={wifiPw} canCopy />
                </>
              )}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '4px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, padding: '10px 0 4px' }}>임대차 정보</div>
              <InfoRow label="건물주명" value={house['건물주명']} />
              <InfoRow label="건물주 연락처" value={house['건물주연락처']} canCopy />
              <InfoRow label="집 월세" value={house['집월세'] ? fmt(Number(house['집월세'])) : '-'} />
              <InfoRow label="총 방수" value={house['총방수'] ? `${house['총방수']}개` : '-'} />
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '4px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, padding: '10px 0 4px' }}>메모</div>
              {editing ? (
                <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none', marginBottom: 8 }} />
              ) : (
                <p style={{ fontSize: 13, color: memo ? '#191f28' : '#bbb', padding: '8px 0', lineHeight: 1.5 }}>{memo?.replace(/\{\"전기.*\}/, '').trim() || '메모 없음'}</p>
              )}
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                <button onClick={saveBasic} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: BLUE, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ 정보 수정</button>
            )}
          </>
        )}

        {/* Tab 1: 방현황 */}
        {tab === 1 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[{ l: '입주중', v: active, c: GREEN }, { l: '공실', v: vacancy, c: vacancy > 0 ? RED : GRAY }, { l: '공실예정', v: leaving, c: leaving > 0 ? ORANGE : GRAY }].map(k => (
                <div key={k.l} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>{k.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.c }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
              {tenants.length > 0 ? tenants.map((t, i) => {
                const status = t.status || 'active';
                const dday = getDday(t['퇴실일']);
                const isSoon = status === 'active' && t['퇴실일'] && dday >= 0 && dday <= 90;
                const statusCfg: Record<string, { bg: string; color: string; label: string }> = {
                  active: { bg: '#e8faf2', color: GREEN, label: '입주중' },
                };
                const sc = isSoon
                  ? { bg: '#fff8e1', color: ORANGE, label: '공실예정' }
                  : (statusCfg[status] || statusCfg['active']);
                return (
                  <div key={t['입주자ID']}>
                    {i > 0 && <div style={{ height: 1, background: '#f2f4f6' }} />}
                    <Link href={`/tenants/${t['입주자ID']}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f2f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: GRAY, flexShrink: 0 }}>{t['방코드']?.slice(0, 3)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t['이름'] || '공실'}</div>
                        <div style={{ fontSize: 11, color: GRAY }}>{t['방코드']}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                        {dday > 0 && <div style={{ fontSize: 11, color: dday <= 30 ? RED : GRAY, marginTop: 2 }}>D-{dday}</div>}
                      </div>
                    </Link>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: GRAY }}>입주자가 없어요</div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: 운영정보 */}
        {tab === 2 && (
          <>
            {investor ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '4px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, padding: '10px 0 4px' }}>투자자 정보</div>
                <InfoRow label="투자자명" value={investor.investor?.['투자자명'] || '-'} />
                <InfoRow label="연락처" value={investor.investor?.['연락처'] || '-'} canCopy />
                {investor.houses?.map((h: any) => (
                  <div key={h.houseName}>
                    <InfoRow label="배분 비율" value={`투자자 ${Math.round(h.ratio * 100)}% · 운영자 ${Math.round((1 - h.ratio) * 100)}%`} />
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ width: `${h.ratio * 100}%`, background: '#c4b5fd' }} />
                        <div style={{ flex: 1, background: BLUE }} />
                      </div>
                    </div>
                    <InfoRow label="순이익" value={fmt(h.profit)} />
                    <InfoRow label="투자자 배분" value={fmt(h.myShare)} />
                    <InfoRow label="운영자 몫" value={fmt(h.profit - h.myShare)} />
                  </div>
                ))}
                {investor.investor?.['링크토큰'] && (
                  <div style={{ padding: '8px 0' }}>
                    <button onClick={() => { copyText(`${window.location.origin}/portal/investor/${investor.investor['링크토큰']}`); }}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e8eb', background: '#fff', fontSize: 12, fontWeight: 600, color: BLUE, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🔗 투자자 링크 복사
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, textAlign: 'center', color: GRAY }}>
                <p style={{ fontSize: 14 }}>직영 지점 (투자자 없음)</p>
              </div>
            )}
          </>
        )}

        {/* Tab 3: 공과금계정 */}
        {tab === 3 && (
          <>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 12 }}>고지서 납부 시 필요한 계정 정보</div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              {[
                { icon: '⚡', type: '전기', key: '전기' },
                { icon: '🔥', type: '가스', key: '가스' },
                { icon: '💧', type: '수도', key: '수도' },
                { icon: '🌐', type: '인터넷', key: '인터넷' },
                { icon: '🚿', type: '정수기', key: '정수기' },
              ].map((item, i) => {
                const acc = utilAccounts[item.key] || { vendor: '', account: '' };
                return (
                  <div key={item.key}>
                    {i > 0 && <div style={{ height: 1, background: '#f2f4f6' }} />}
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#191f28', marginBottom: 3 }}>{item.icon} {item.type}</div>
                      {editUtil ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input value={acc.vendor} onChange={e => setUtilAccounts(prev => ({ ...prev, [item.key]: { ...prev[item.key], vendor: e.target.value } }))} placeholder="업체명"
                            style={{ flex: 1, padding: '6px 8px', border: '1px solid #E8E8E8', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                          <input value={acc.account} onChange={e => setUtilAccounts(prev => ({ ...prev, [item.key]: { ...prev[item.key], account: e.target.value } }))} placeholder="고객번호"
                            style={{ flex: 1, padding: '6px 8px', border: '1px solid #E8E8E8', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: GRAY }}>{acc.vendor || '-'} · {acc.account || '-'}</span>
                          {acc.account && <button onClick={() => copyText(acc.account)} style={{ background: '#f2f4f6', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Copy size={12} color={GRAY} /></button>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {editUtil ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditUtil(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                <button onClick={saveUtil} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: BLUE, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
              </div>
            ) : (
              <button onClick={() => setEditUtil(true)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e5e8eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ 계정 정보 수정</button>
            )}
          </>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#191f28', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  );
}
