'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Logo } from './Logo';

export const PWAInlinePromo = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 2. Check "Maybe Later" persistence (7 days)
    const dismissedUntil = localStorage.getItem('eb_pwa_inline_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      return;
    }

    // 3. Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
      toast({ title: "EzzyBites Installing...", description: "Launch from your home screen shortly." });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Hide for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('eb_pwa_inline_dismissed_until', nextWeek.toString());
  };

  if (isInstalled || !isVisible) return null;

  return (
    <section className="container mx-auto px-4 py-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-primary/10 overflow-hidden relative group">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Smartphone className="w-32 h-32 rotate-12 text-primary" />
        </div>
        
        <div className="p-8 md:p-10 space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-gradient rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20 transform group-hover:rotate-6 transition-transform">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <h3 className="text-xl font-black font-headline uppercase tracking-tighter">Install <span className="text-primary italic">EzzyBites</span> App</h3>
              </div>
              <p className="text-[11px] md:text-xs font-medium text-muted-foreground leading-relaxed uppercase tracking-wide">
                Get faster access, better performance and a full-screen app experience.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button 
              onClick={handleInstall}
              className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-white shadow-xl shadow-primary/20 gap-3 group/btn"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              Install App
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-2 border-muted hover:bg-secondary/50"
            >
              Maybe Later
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 opacity-40">
             <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[7px] font-black uppercase tracking-widest">Verified Secure</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-border" />
             <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[7px] font-black uppercase tracking-widest">High Speed Hub</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
