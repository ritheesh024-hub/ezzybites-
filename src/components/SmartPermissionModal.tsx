'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Camera, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  X
} from 'lucide-react';
import { PermissionType } from '@/hooks/use-smart-permissions';
import { cn } from '@/lib/utils';

interface SmartPermissionModalProps {
  type: PermissionType | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const SmartPermissionModal = ({ type, onClose, onConfirm }: SmartPermissionModalProps) => {
  const content = {
    location: {
      title: "Precise Delivery",
      desc: "Help our riders find your sanctuary faster with high-accuracy location signals.",
      icon: MapPin,
      color: "bg-blue-600",
      action: "Share Location"
    },
    camera: {
      title: "Vision Access",
      desc: "Enable camera to capture profile photos or scan high-speed operational codes.",
      icon: Camera,
      color: "bg-emerald-600",
      action: "Grant Access"
    }
  };

  const active = type ? (content as any)[type] : null;

  return (
    <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
        <DialogHeader className="sr-only">
           <DialogTitle>{active?.title || 'Permission Request'}</DialogTitle>
           <DialogDescription>{active?.desc || 'Operational node access required'}</DialogDescription>
        </DialogHeader>
        {active && (
          <div className="flex flex-col">
            <div className={cn("p-10 text-white relative overflow-hidden", active.color)}>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-20"><X className="w-5 h-5" /></button>
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                 <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                    <active.icon className="w-10 h-10" />
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 bg-black/10 w-fit mx-auto px-3 py-1 rounded-full border border-white/10">
                       <ShieldCheck className="w-3 h-3 text-white" />
                       <span className="text-[8px] font-black uppercase tracking-[0.2em]">Secure Node Access</span>
                    </div>
                    <h2 className="text-3xl font-black font-headline uppercase tracking-tighter italic">
                      {active.title}
                    </h2>
                 </div>
              </div>
            </div>

            <div className="p-10 text-center space-y-8">
              <p className="text-base font-medium leading-relaxed text-muted-foreground italic">
                "{active.desc}"
              </p>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border-2"
                  onClick={onClose}
                >
                  Later
                </Button>
                <Button 
                  className={cn("flex-[2] h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest gap-3 shadow-2xl px-10 text-white", active.color)}
                  onClick={onConfirm}
                >
                  {active.action}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t flex justify-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30">Ezzy Bites • Identity Verified</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
