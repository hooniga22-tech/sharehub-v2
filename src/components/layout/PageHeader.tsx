'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  rightButton?: React.ReactNode;
}

export default function PageHeader({ title, rightButton }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 52,
        background: '#fff',
        borderBottom: '1px solid #F0F0F0',
      }}
    >
      <button onClick={() => router.back()} style={{ marginLeft: -4, padding: 4 }}>
        <ChevronLeft size={24} color="#191919" />
      </button>
      <h1
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '60%',
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 700,
          color: '#191919',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{rightButton}</div>
    </header>
  );
}
