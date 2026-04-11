interface KpiCardProps {
  label: string;
  value: string | number;
  color?: string;
  suffix?: string;
}

export default function KpiCard({ label, value, color = '#191919', suffix }: KpiCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        border: '1px solid #F0F0F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: '#888888' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: -0.5, lineHeight: 1 }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: 14, fontWeight: 500, color: '#888888', marginBottom: 2 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
