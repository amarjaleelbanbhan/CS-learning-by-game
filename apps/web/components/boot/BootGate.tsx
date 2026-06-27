'use client';

import { useEffect } from 'react';
import { BOOTED_KEY, useUiStore } from '@/components/state/uiStore';
import { BootSequence } from './BootSequence';
import { useCompanionStore } from '@/components/companion/companionStore';

/** Mounted once in the root layout; decides whether to play the boot cinematic. */
export function BootGate() {
  const bootActive = useUiStore((s) => s.bootActive);
  const setBootActive = useUiStore((s) => s.setBootActive);
  const say = useCompanionStore((s) => s.say);

  useEffect(() => {
    const alreadyBooted = window.localStorage.getItem(BOOTED_KEY) === '1';
    if (!alreadyBooted) setBootActive(true);
  }, [setBootActive]);

  if (!bootActive) return null;

  return (
    <BootSequence
      onDone={() => {
        window.localStorage.setItem(BOOTED_KEY, '1');
        setBootActive(false);
        setTimeout(() => say('welcome'), 400);
      }}
    />
  );
}
