
'use client';

import { useCallback } from 'react';
import { useStore } from '@/app/lib/store';

const SOUNDS = {
  ping: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // New order notification
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Status updated
  pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Menu/Inventory updated
  warning: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Action failed
};

export type SoundType = keyof typeof SOUNDS;

export function useSound() {
  const { isAdminMuted, toggleAdminMute } = useStore();

  const playSound = useCallback((type: SoundType) => {
    if (typeof window === 'undefined' || isAdminMuted) return;

    try {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Handle blocked autoplay
      });
    } catch (e) {
      console.warn('Audio initialization failed', e);
    }
  }, [isAdminMuted]);

  return { playSound, isAdminMuted, toggleAdminMute };
}
