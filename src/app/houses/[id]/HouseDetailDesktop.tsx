'use client';

import { useParams } from 'next/navigation';
import HousesPcLayout from '../HousesPcLayout';

export default function HouseDetailDesktop() {
  const params = useParams<{ id: string }>();
  return <HousesPcLayout selectedHouseId={params.id} />;
}
