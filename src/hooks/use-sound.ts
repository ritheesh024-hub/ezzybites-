
'use client';

import { useCallback, useRef } from 'react';
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
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const playSound = useCallback((type: SoundType) => {
    // Prevent playback on server or if muted
    if (typeof window === 'undefined' || isAdminMuted) return;

    try {
      // Lazy initialize audio elements
      if (!audioRefs.current[type]) {
        audioRefs.current[type] = new Audio(SOUNDS[type]);
      }

      const audio = audioRefs.current[type];
      audio.volume = 0.5;
      
      // Reset to start in case it's already playing
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play prevented. User interaction needed.
          console.warn(`Sound playback for "${type}" was blocked. Click anywhere on the dashboard to enable audio.`, error);
        });
      }
    } catch (e) {
      console.warn(`Failed to initialize audio for "${type}":`, e);
    }
  }, [isAdminMuted]);

  return { playSound, isAdminMuted, toggleAdminMute };
}
