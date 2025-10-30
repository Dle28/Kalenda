'use client';
import { useEffect, useState } from 'react';
import { slots } from './mock';
import type { Slot } from './mock';

export function useSlot(id: string) {
  const [slot, setSlot] = useState<Slot | null>(null);
  
  useEffect(() => {
    // Client-side: use mock data directly to avoid serverStore imports
    const decoded = decodeURIComponent(id);
    const found = slots.find((s) => s.id === decoded);
    setSlot(found || null);
  }, [id]);
  
  return slot;
}
