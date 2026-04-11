const avatarColors = ['#3182F6', '#7C3AED', '#00B493', '#D97706', '#F04452', '#0D9488', '#EC4899'];

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

export default function Avatar({ name, size = 40, color }: AvatarProps) {
  const initial = name.charAt(0);
  const bg = color || avatarColors[name.charCodeAt(0) % avatarColors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
