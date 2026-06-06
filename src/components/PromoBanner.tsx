'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, GraduationCap, ArrowRight, Sparkles, PartyPopper, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';

export const PromoBanner = () => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  const offers = [
    {
      id: 'student',
      code: 'STUDENT10',
      title: 'Academic Special',
      description: 'Get 10% OFF on every order.',
      icon: GraduationCap,
      image: getImg('hero-burger'),
      gradient: 'from-[#FF6B00] to-[#FF8A00]'
    },
    {
      id: 'new-user',
      code: 'EZZYBITES15',
      title: 'Midnight Cravings',
      description: '15% OFF your first meal.',
      icon: Zap,
      image: getImg('hero-fries'),
      gradient: 'from-[#6366F1] to-[#4F46E5]'
    },
    {
      id: 'weekend',
      code: 'WEEKEND20',
      title: 'Weekend Bonanza',
      description: 'FLAT 20% OFF this Sunday.',
      icon: PartyPopper,
      image: getImg('hero-drink'),
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
    <div className="w-full relative px-2">
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {offers.map((offer) => (
            <CarouselItem key={offer.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="perspective-1000 group">
                <div className={cn(
                  "relative w-full h-[180px] md:h-[220px] overflow-hidden rounded-[2rem] transition-all duration-700 preserve-3d shadow-xl group-hover:shadow-2xl",
                  "bg-gradient-to-br", offer.gradient
                )}>
                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between p-6 md:p-8 z-10">
                    <div className="flex-1 space-y-3">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20">
                        <offer.icon className="w-3 h-3 text-white" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{offer.title}</span>
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                        {offer.description}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-black/20 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                           <span className="text-sm md:text-base font-black font-mono text-white tracking-tighter">{offer.code}</span>
                           <button 
                             onClick={() => handleCopy(offer.code)}
                             className="text-white/60 hover:text-white transition-colors"
                           >
                             {copied === offer.code ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-1/2 h-full transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 -mr-6">
                      <Image 
                        src={offer.image} 
                        alt="Offer" 
                        fill 
                        className="object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)]" 
                        unoptimized
                      />
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute -left-8 -top-8 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};