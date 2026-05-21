
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { SavorTool } from '@/components/SavorTool';
import { FoodCard } from '@/components/FoodCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { CATEGORIES } from '@/app/lib/menu-data';
import { 
  ShoppingBag, ArrowRight, Star, MapPin, 
  Phone, Instagram, Twitter, Facebook, Lock, 
  Clock, HelpCircle, Loader2, Sparkles, 
  ChefHat, Truck, Award, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const db = useFirestore();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    // Simple query to avoid index requirements initially
    return query(collection(db, 'products'), limit(12));
  }, [db]);

  const { data: trendingItems, loading, error } = useCollection<FoodItem>(menuQuery);

  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1">
        <section className="relative min-h-[85vh] md:h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={getImg('hero-bg')} 
              alt="Hero Food" 
              fill 
              className="object-cover scale-105"
              priority
              data-ai-hint="luxury restaurant"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="absolute top-1/4 -left-20 w-64 h-64 md:w-96 md:h-96 bg-primary/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 md:w-96 md:h-96 bg-accent/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse delay-1000" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-20 pt-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-2xl px-4 py-2 md:px-6 md:py-2.5 rounded-full border border-white/20 mb-6 md:mb-10 animate-in slide-in-from-bottom duration-700">
                <div className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary animate-ping" />
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-white/90">Experience Culinary Excellence</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-[100px] font-headline font-black mb-6 md:mb-8 leading-[1] md:leading-[0.9] text-white animate-in fade-in slide-in-from-bottom duration-1000">
                Premium Taste, <br />
                <span className="text-primary italic text-glow">Lightning</span> Speed.
              </h1>
              
              <p className="text-base md:text-xl lg:text-2xl text-white/70 mb-8 md:mb-12 max-w-xl md:max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-200 font-medium">
                Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary. Fresh ingredients, redefined.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-in fade-in duration-1000 delay-500">
                <Link href="/menu" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-14 md:h-18 px-8 md:px-12 text-lg md:text-xl font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all group relative overflow-hidden">
                    <span className="relative z-10">Order Now</span>
                    <ArrowRight className="ml-2 w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
                <Link href="/menu" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 md:h-18 px-8 md:px-12 text-lg md:text-xl font-black bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all">
                    Explore Menu
                  </Button>
                </Link>
              </div>

              <div className="mt-12 md:mt-20 flex flex-wrap gap-8 md:gap-12 border-l border-white/20 pl-6 md:pl-12 animate-in fade-in duration-1000 delay-700">
                {[
                  { label: "Delivery Time", val: "25m" },
                  { label: "Happy Bites", val: "10k+" },
                  { label: "Top Rated", val: "4.9/5" }
                ].map((s, i) => (
                  <div key={i} className="min-w-[80px]">
                    <p className="text-2xl md:text-3xl font-black text-white">{s.val}</p>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-32 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
              <div>
                <Badge variant="outline" className="mb-4 px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black tracking-widest uppercase border-primary/30 text-primary">Week's Favorites</Badge>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-headline font-black tracking-tight leading-[1.1] md:leading-[1]">Trending <span className="text-primary italic">Now</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="link" className="text-primary font-black text-base md:text-lg p-0 h-auto gap-2 group">
                  Full Menu <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-destructive/5 rounded-[40px] border border-destructive/20 border-dashed">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-bold">Failed to load trending items.</p>
                <p className="text-xs text-muted-foreground mt-2">Check console or security rules.</p>
              </div>
            ) : trendingItems.length > 0 ? (
              <Carousel 
                opts={{ align: "start", loop: true }}
                className="w-full"
              >
                <CarouselContent className="-ml-4 md:-ml-8">
                  {trendingItems.map((item) => (
                    <CarouselItem key={item.id} className="pl-4 md:pl-8 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="hover:scale-[1.02] transition-transform duration-500">
                        <FoodCard item={item} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end gap-3 md:gap-4 mt-8 md:mt-12">
                  <CarouselPrevious className="static translate-y-0 h-10 w-10 md:h-14 md:w-14 rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all" />
                  <CarouselNext className="static translate-y-0 h-10 w-10 md:h-14 md:w-14 rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all" />
                </div>
              </Carousel>
            ) : (
              <div className="text-center py-16 md:py-20 bg-muted/20 rounded-3xl md:rounded-[40px] border border-dashed border-muted mx-2">
                <p className="text-muted-foreground font-bold text-sm md:text-base px-4">Chef is prepping the favorites. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 md:py-32 bg-secondary/30 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-4 gap-12 lg:gap-8">
              <div className="lg:col-span-1">
                 <h2 className="text-3xl md:text-4xl font-headline font-black mb-6">Why <span className="text-primary">Ezzy Bites?</span></h2>
                 <p className="text-muted-foreground font-medium leading-relaxed text-sm md:text-base">We've spent thousands of hours perfecting every bite and every delivery mile to ensure your experience is nothing short of legendary.</p>
              </div>
              <div className="lg:col-span-3 grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {[
                  { icon: ChefHat, title: "Master Chefs", desc: "Crafted by professionals who breathe flavor." },
                  { icon: Truck, title: "Hyper-Local", desc: "30-minute delivery guarantee across your campus." },
                  { icon: Award, title: "Premium Grade", desc: "Only the freshest, highest quality ingredients used." }
                ].map((f, i) => (
                  <div key={i} className="bg-card p-8 md:p-10 rounded-3xl md:rounded-[40px] shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-2 transition-all group">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 md:mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                      <f.icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <h4 className="text-xl md:text-2xl font-black mb-3 md:mb-4">{f.title}</h4>
                    <p className="text-muted-foreground font-medium text-xs md:text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <SavorTool />
          </div>
        </section>

        <section className="py-16 md:py-32 container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12 md:mb-20">
            <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4 md:mb-6" />
            <h2 className="text-3xl md:text-5xl font-headline font-black">Curious? <span className="text-primary italic">Answers here.</span></h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4 md:space-y-6">
            {[
              { q: "What is the delivery promise?", a: "We guarantee delivery within 20-30 minutes for locations within our 2km radius around Pocharam and Anurag University campus." },
              { q: "Are there any student discounts?", a: "Absolutely! AU students get a special 10% discount on all orders above ₹199. Use code STUDENT10." },
              { q: "Do you cater for campus events?", a: "Yes, we handle bulk orders and campus events. Contact our hotline for customized menus." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-secondary/20 rounded-2xl md:rounded-[32px] px-6 md:px-8">
                <AccordionTrigger className="font-black text-lg md:text-xl hover:no-underline py-6 md:py-8 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 md:pb-8 text-base md:text-lg font-medium leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-background border-t pt-20 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16 md:mb-24">
            <div className="space-y-8 md:space-y-10">
              <Link href="/" className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
                  <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                </div>
                <span className="text-3xl md:text-4xl font-headline font-black tracking-tight">
                  Ezzy<span className="text-primary">Bites</span>
                </span>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg font-medium">
                Redefining the fast-food experience with premium ingredients and unparalleled campus service. Your sanctuary for flavor.
              </p>
              <div className="flex gap-4">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-muted text-muted-foreground hover:text-primary hover:border-primary transition-all">
                    <Icon className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-8 md:space-y-10">
              <h4 className="font-black text-xl md:text-2xl uppercase tracking-widest">Explore</h4>
              <ul className="space-y-4 md:space-y-5 text-muted-foreground font-bold text-sm md:text-base">
                <li><Link href="/menu" className="hover:text-primary transition-colors">Menu</Link></li>
                <li><Link href="/admin/login" className="hover:text-primary transition-colors">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-12 md:pt-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <p className="text-[10px] md:text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-50 text-center md:text-left">
              © {currentYear || 2025} Ezzy Bites Cafe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
