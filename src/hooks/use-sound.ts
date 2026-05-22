
'use client';

import { useCallback, useRef } from 'react';
import { useStore } from '@/app/lib/store';

const SOUNDS = {
  // New order notification: Modern digital bell
  ping: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3', 
  // Status updated: Clean high-pitched tick
  success: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 
  // Menu/Inventory updated: Light interface pop
  pop: 'https://assets.mixkit.co/active_storage/sfx/1111/1111-preview.mp3', 
  // Action failed: Soft electronic alert
  warning: 'https://assets.mixkit.co/active_storage/sfx/2511/2511-preview.mp3', 
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
      audio.volume = 0.4; // Slightly lower volume for a more premium feel
      
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
