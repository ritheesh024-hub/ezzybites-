
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { SavorTool } from '@/components/SavorTool';
import { FoodCard } from '@/components/FoodCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { 
  ShoppingBag, ArrowRight, Star, 
  Loader2, ChefHat, Truck, Award, 
  HelpCircle, Instagram, Twitter, Facebook
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
    return query(collection(db, 'products'), limit(12));
  }, [db]);

  const { data: trendingItems, loading } = useCollection<FoodItem>(menuQuery);

  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={getImg('hero-bg')} 
              alt="Hero Food" 
              fill 
              className="object-cover"
              priority
              data-ai-hint="luxury restaurant"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          </div>

          <div className="container mx-auto px-4 relative z-20 pt-16">
            <div className="max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 animate-in slide-in-from-bottom duration-700">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-white/90">Premium Fast Food Redefined</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-headline font-black mb-4 leading-[0.9] text-white animate-in fade-in slide-in-from-bottom duration-1000">
                Flavor that <br />
                <span className="text-primary italic text-glow">Commands</span> Respect.
              </h1>
              
              <p className="text-base md:text-xl text-white/70 max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-200 font-medium">
                Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary. Fresh ingredients, lightning speed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in duration-1000 delay-500">
                <Link href="/menu" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-14 md:h-16 px-10 text-base font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all group">
                    Start Your Order
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/menu" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 md:h-16 px-10 text-base font-black bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white/10 transition-all">
                    Explore Menu
                  </Button>
                </Link>
              </div>

              <div className="pt-8 flex flex-wrap gap-10 border-l border-white/20 pl-6 animate-in fade-in duration-1000 delay-700">
                {[
                  { label: "Swift Delivery", val: "25m" },
                  { label: "Happy Customers", val: "10k+" },
                  { label: "Rating", val: "4.9/5" }
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-2xl font-black text-white">{s.val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRENDING SECTION */}
        <section className="py-16 md:py-24 bg-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="space-y-3">
                <Badge variant="outline" className="px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border-primary/30 text-primary">Curated Favorites</Badge>
                <h2 className="text-4xl md:text-6xl font-headline font-black leading-[1]">Trending <span className="text-primary italic">Now</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="link" className="text-primary font-black text-base p-0 h-auto gap-2 group">
                  View Full Menu <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : trendingItems && trendingItems.length > 0 ? (
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-6">
                  {trendingItems.map((item) => (
                    <CarouselItem key={item.id} className="pl-6 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <FoodCard item={item} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end gap-3 mt-8">
                  <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white shadow-xl" />
                  <CarouselNext className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white shadow-xl" />
                </div>
              </Carousel>
            ) : null}
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 md:py-24 bg-secondary/30 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1 space-y-4">
                 <h2 className="text-3xl font-headline font-black leading-tight">What sets us <br /><span className="text-primary italic">Apart?</span></h2>
                 <p className="text-muted-foreground font-medium text-sm leading-relaxed">Every recipe is a result of obsessive testing and local sourcing. We don't just deliver food; we deliver experiences.</p>
              </div>
              <div className="lg:col-span-3 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { icon: ChefHat, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique and flavor." },
                  { icon: Truck, title: "Hyper-Local", desc: "A 25-minute delivery promise for all orders within our radius." },
                  { icon: Award, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives, just pure taste." }
                ].map((f, i) => (
                  <div key={i} className="bg-card p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-black mb-2">{f.title}</h4>
                    <p className="text-muted-foreground font-medium text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI TOOL SECTION */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SavorTool />
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 md:py-24 container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-headline font-black">Got Questions? <br /><span className="text-primary italic">We have answers.</span></h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "What is your delivery range?", a: "We currently serve a 3km radius around Pocharam and the Anurag University campus to ensure every order arrives piping hot." },
              { q: "Is there a student special?", a: "Yes! Students with a valid AU ID get a 10% discount on all orders above ₹200. Use code STUDENTPOWER at checkout." },
              { q: "How do you handle bulk orders?", a: "For event catering or bulk campus orders, please contact our hotline directly for customized options." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-secondary/20 rounded-[2rem] px-6 transition-all hover:bg-secondary/40">
                <AccordionTrigger className="font-black text-lg hover:no-underline py-6 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base font-medium leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-background border-t pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/20">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-3xl font-headline font-black tracking-tight">
                  Ezzy<span className="text-primary">Bites</span>
                </span>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-base font-medium">
                The intersection of culinary art and lightning-fast logistics. Redefining your campus experience.
              </p>
              <div className="flex gap-3">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground hover:text-primary transition-all">
                    <Icon className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="lg:col-start-3 space-y-6">
              <h4 className="font-black text-xl uppercase tracking-widest">Explore</h4>
              <ul className="space-y-3 text-muted-foreground font-bold text-base">
                <li><Link href="/menu" className="hover:text-primary transition-colors">Digital Menu</Link></li>
                <li><Link href="/orders" className="hover:text-primary transition-colors">Track Orders</Link></li>
                <li><Link href="/admin/login" className="hover:text-primary transition-colors">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-50">
              © {currentYear || 2025} Ezzy Bites Premium Cafe.
            </p>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
