'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { Pizza, Coffee, GlassWater, Utensils, Beef } from 'lucide-react';

/**
 * CONFIGURATION
 * Set to false to disable the opening animation.
 */
const ENABLE_BRAND_INTRO = true;

export const BrandIntro = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState(0); // 0: Start, 1: Floating, 2: Logo/Text, 3: Orbit, 4: FadeOut

  useEffect(() => {
    // 1. Checks
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const hasSeenIntro = sessionStorage.getItem('eb_intro_shown');

    if (!ENABLE_BRAND_INTRO || !isMobile || hasSeenIntro) {
      setIsVisible(false);
      return;
    }

    // 2. Animation sequence (Total ~2.1s lifecycle)
    const timers = [
      setTimeout(() => setStage(1), 50),     // Start floating in
      setTimeout(() => setStage(2), 600),    // Logo & Brand Text appears
      setTimeout(() => setStage(3), 1200),   // Icons start orbiting
      setTimeout(() => setStage(4), 1800),   // Entire overlay fades
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('eb_intro_shown', 'true');
      }, 2300), // Cleanup from DOM
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out overflow-hidden motion-reduce:hidden",
        stage === 4 ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      {/* Dynamic Background Glow */}
      <div className={cn(
        "absolute w-80 h-80 bg-primary/20 rounded-full blur-[100px] transition-all duration-1000 delay-500",
        stage >= 2 ? "scale-150 opacity-100" : "scale-50 opacity-0"
      )} />

      {/* Floating Orbital Icons */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <FloatingIcon Icon={Beef} stage={stage} index={0} initialPos="top-1/4 left-1/4" />
        <FloatingIcon Icon={Pizza} stage={stage} index={1} initialPos="top-1/3 right-1/4" />
        <FloatingIcon Icon={Coffee} stage={stage} index={2} initialPos="bottom-1/4 left-1/3" />
        <FloatingIcon Icon={GlassWater} stage={stage} index={3} initialPos="bottom-1/3 right-1/3" />
        <FloatingIcon Icon={Utensils} stage={stage} index={4} initialPos="top-1/2 left-0 -translate-x-20" />
      </div>

      {/* Logo & Brand Identity */}
      <div className={cn(
        "relative z-10 flex flex-col items-center transition-all duration-700 ease-out transform",
        stage >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-90 translate-y-4"
      )}>
        <Logo size="lg" hideText variant="light" />
        
        <div className={cn(
          "mt-6 text-center transition-all duration-700 delay-300 transform",
          stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-white uppercase">
            Ezzy<span className="text-primary italic">Bites</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">
              Fast • Fresh • Delicious
            </p>
            <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn(
          "h-full bg-primary transition-all duration-[1800ms] ease-linear",
          stage > 0 ? "w-full" : "w-0"
        )} />
      </div>
    </div>
  );
};

interface FloatingIconProps {
  Icon: any;
  stage: number;
  index: number;
  initialPos: string;
}

const FloatingIcon = ({ Icon, stage, index, initialPos }: FloatingIconProps) => {
  // Logic: 
  // Stage 0-1: Move from initialPos to center
  // Stage 3+: Start orbit animation
  const orbitClass = stage === 3 ? `animate-orbit-${index}` : "";
  
  return (
    <div className={cn(
      "absolute transition-all duration-1000 ease-in-out transform",
      stage === 0 ? initialPos : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      stage >= 1 ? "opacity-20 scale-100" : "opacity-0 scale-50",
      orbitClass
    )}>
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <Icon className="w-5 h-5 text-white/40" />
      </div>
    </div>
  );
};
