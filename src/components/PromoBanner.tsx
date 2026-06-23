'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

/**
 * PROMO BANNER COMPONENT
 * Redesigned for full-width single-slide logic (Zepto/Blinkit style)
 */
export const PromoBanner = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const offers = [
    {
      id: 'student',
      code: 'STUDENT10',
      codeLabel: 'STUDENT10',
      title: 'Academic Special',
      description: 'FLAT 10 % OFF on all orders.',
      gradient: 'from-[#FF6B00] to-[#FF8A00]'
    },
    {
      id: 'new-user',
      code: 'EZZYBITES15',
      codeLabel: 'EZZYBITES15',
      title: 'Midnight Cravings',
      description: '15 % OFF late-night meals.',
      gradient: 'from-[#6366F1] to-[#4F46E5]'
    },
    {
      id: 'weekend',
      code: 'WEEKEND20',
      codeLabel: 'WEEKEND20',
      title: 'Weekend Bonanza',
      description: 'FLAT 20 % OFF this Sunday.',
      gradient: 'from-[#F43F5E] to-[#E11D48]'
    }
  ];

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopied(code);
      toast({
        title: "Code Copied! 🚀",
        description: `Use ${code} at checkout.`,
      });
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="w-full relative py-2">
      <Carousel
        opts={{ align: "center", loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {offers.map((offer) => (
            <CarouselItem key={offer.id} className="pl-0 basis-full">
              <div className="px-0 md:px-0">
                <div className={cn(
                  "relative w-full h-[100px] md:h-[120px] overflow-hidden rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 shadow-lg border border-white/10 group",
                  "bg-gradient-to-br", offer.gradient
                )}>
                  {/* Glassmorphism Background Elements */}
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-50 animate-pulse" />
                  <div className="absolute -left-4 -top-4 w-24 h-24 bg-black/5 rounded-full blur-xl opacity-30" />
                  
                  <div className="relative h-full flex flex-col justify-center p-4 md:p-6 z-10 text-center items-center">
                    <div className="space-y-1.5 md:space-y-2 w-full max-w-sm">
                      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-2xl px-3 py-0.5 rounded-full border border-white/10 shadow-sm">
                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-white">{offer.title}</span>
                      </div>
                      
                      <h3 className="text-[12px] md:text-lg font-black text-white leading-tight uppercase tracking-tighter line-clamp-1 drop-shadow-md">
                        {offer.description}
                      </h3>
                      
                      <div className="flex justify-center pt-1">
                        <button 
                          className="bg-black/20 backdrop-blur-3xl px-4 py-1.5 rounded-2xl border border-white/10 flex items-center gap-3 group/code cursor-pointer transition-all hover:bg-black/40 active:scale-95 shadow-md" 
                          onClick={() => handleCopy(offer.code)}
                        >
                           <span className="text-[10px] md:text-sm font-black font-mono text-white tracking-widest">{offer.codeLabel}</span>
                           <div className="w-5 h-5 md:w-6 md:h-6 bg-white/20 rounded-lg flex items-center justify-center transition-colors group-hover/code:bg-white/30">
                             {copied === offer.code ? <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" /> : <Copy className="w-3 h-3 md:w-4 md:h-4 text-white/80" />}
                           </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
