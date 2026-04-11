'use client';

import { useState, useEffect } from 'react';

export default function DateDisplay() {
  const [today, setToday] = useState('');

  useEffect(() => {
    const d = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    setToday(`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`);
  }, []);

  return (
    <p style={{ fontSize: 13, color: '#888888', marginTop: 4, minHeight: 18 }}>
      {today}
    </p>
  );
}
