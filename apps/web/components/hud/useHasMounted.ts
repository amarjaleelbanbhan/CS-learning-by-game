'use client';

import { useEffect, useState } from 'react';

/** Avoids hydration mismatches for client-only persisted state (localStorage). */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
