const chipStyles: Record<string, { bg: string; color: string }> = {
  urgent: { bg: '#FEE2E2', color: '#F04452' },
  payment: { bg: '#FFF8E8', color: '#D97706' },
  checkout: { bg: '#EEF3FF', color: '#3182F6' },
  contract: { bg: '#E8FBF5', color: '#00B493' },
  paid: { bg: '#E8FBF5', color: '#00B493' },
  unpaid: { bg: '#FEE2E2', color: '#F04452' },
  late: { bg: '#FFF8E8', color: '#D97706' },
  inprogress: { bg: '#EEF3FF', color: '#3182F6' },
  waiting: { bg: '#F5F5F5', color: '#888888' },
  done: { bg: '#E8FBF5', color: '#00B493' },
  '수리': { bg: '#FEE2E2', color: '#F04452' },
  '청소': { bg: '#E8FBF5', color: '#00B493' },
  '민원': { bg: '#FFF8E8', color: '#D97706' },
  '교체': { bg: '#F3EEFF', color: '#7C3AED' },
  '기타': { bg: '#F5F5F5', color: '#888888' },
  '신청': { bg: '#EEF3FF', color: '#3182F6' },
  '완료': { bg: '#E8FBF5', color: '#00B493' },
  '처리중': { bg: '#FFF8E8', color: '#D97706' },
  '계약': { bg: '#F3EEFF', color: '#7C3AED' },
  '퇴실': { bg: '#FFF8E8', color: '#D97706' },
  purple: { bg: '#F3EEFF', color: '#7C3AED' },
  blue: { bg: '#EEF3FF', color: '#3182F6' },
  green: { bg: '#E8FBF5', color: '#00B493' },
  red: { bg: '#FEE2E2', color: '#F04452' },
  amber: { bg: '#FFF8E8', color: '#D97706' },
  gray: { bg: '#F5F5F5', color: '#888888' },
};

const labelMap: Record<string, string> = {
  urgent: '긴급',
  payment: '수납',
  checkout: '퇴실',
  contract: '계약',
  paid: '납부완료',
  unpaid: '미납',
  late: '연체',
  inprogress: '처리중',
  waiting: '대기',
  done: '완료',
};

interface ChipProps {
  type?: string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: string;
}

function Chip({ type, label, size = 'sm', variant }: ChipProps) {
  const style = variant
    ? (chipStyles[variant] || chipStyles.gray)
    : (chipStyles[type || ''] || chipStyles['기타']);
  const text = label || (type ? (labelMap[type] || type) : '');
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 99,
        fontWeight: 600,
        padding,
        fontSize,
        background: style.bg,
        color: style.color,
      }}
    >
      {text}
    </span>
  );
}

export { Chip };
export default Chip;
