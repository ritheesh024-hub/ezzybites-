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

export const PromoBanner = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const offers = [
    {
      id: 'student',
      code: 'STUDENT10',
      title: 'Academic Special',
      description: 'FLAT 10 % OFF on every order.',
      gradient: 'from-[#FF6B00] to-[#FF8A00]'
    },
    {
      id: 'new-user',
      code: 'EZZYBITES15',
      title: 'Midnight Cravings',
      description: '15 % OFF first late-night meal.',
      gradient: 'from-[#6366F1] to-[#4F46E5]'
    },
    {
      id: 'weekend',
      code: 'WEEKEND20',
      title: 'Weekend Bonanza',
      description: 'FLAT 20 % OFF this Sunday only.',
      gradient: 'from-[#F43F5E] to-[#E11D48]'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast({
      title: "Code Copied! 🚀",
      description: `Use ${code} at checkout.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full relative md:py-4 py-1">
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {offers.map((offer) => (
            <CarouselItem key={offer.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className={cn(
                "relative w-full h-[125px] md:h-[140px] overflow-hidden rounded-[2rem] transition-all duration-300 shadow-lg hover:shadow-2xl border border-white/10 group perspective-1000",
                "bg-gradient-to-br", offer.gradient
              )}>
                <div className="relative h-full flex flex-col justify-center p-4 md:p-6 z-10 text-center items-center transform transition-transform group-hover:scale-[1.02]">
                  <div className="space-y-2 md:space-y-3 w-full">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-2xl px-3 py-1 rounded-full border border-white/20">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">{offer.title}</span>
                    </div>
                    
                    <h3 className="text-sm md:text-lg font-black text-white leading-tight uppercase tracking-tighter line-clamp-1">
                      {offer.description}
                    </h3>
                    
                    <div className="flex justify-center pt-0.5">
                      <button 
                        className="bg-black/20 backdrop-blur-3xl px-4 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 group/code cursor-pointer transition-all hover:bg-black/30 shadow-2xl active:scale-95" 
                        onClick={() => handleCopy(offer.code)}
                      >
                         <span className="text-xs md:text-sm font-black font-mono text-white tracking-tighter">{offer.code}</span>
                         <div className="w-6 h-6 md:w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center transition-colors group-hover/code:bg-white/20">
                           {copied === offer.code ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/70" />}
                         </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow" />
                <div className="absolute -left-6 -top-6 w-24 h-24 bg-black/5 rounded-full blur-xl animate-float" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
