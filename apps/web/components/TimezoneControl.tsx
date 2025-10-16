"use client";
import { useState } from 'react';
import TimezoneSelector from './TimezoneSelector';

export default function TimezoneControl({ initial }: { initial: string }) {
  const [tz, setTz] = useState(initial);
  return <TimezoneSelector value={tz} onChange={setTz} />;
}

