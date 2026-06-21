'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if app is already installed/running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 2. Listen for the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay visibility so it doesn't pop up instantly
      const hasSeenPrompt = sessionStorage.getItem('eb_pwa_prompt_dismissed');
      if (!hasSeenPrompt) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detect installation success
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsInstalled(true);
      toast({ title: "EzzyBites Installed! 🚀", description: "Launch it anytime from your home screen." });
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    sessionStorage.setItem('eb_pwa_prompt_dismissed', 'true');
  };

  if (isInstalled || !isVisible || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-[100] md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-3xl border border-primary/10 overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-gradient rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-black text-sm uppercase tracking-tight">Install <span className="text-primary italic">EzzyBites</span></h4>
                <div className="flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-md">
                   <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                   <span className="text-[6px] font-black uppercase text-primary tracking-widest">Safe Node</span>
                </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-tight">Add to home screen for the premium app experience.</p>
            </div>
            <button onClick={dismissPrompt} className="text-muted-foreground hover:text-primary transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 pb-5 flex gap-3">
             <Button variant="outline" onClick={dismissPrompt} className="flex-1 h-11 rounded-xl font-black uppercase text-[8px] tracking-widest border-2">Later</Button>
             <Button onClick={handleInstall} className="flex-[2] h-11 rounded-xl font-black uppercase text-[8px] tracking-widest bg-primary text-white shadow-lg shadow-primary/20 gap-2">
               <Download className="w-3 h-3" /> Install Now
             </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
