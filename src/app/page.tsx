'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { PromoBanner } from '@/components/PromoBanner';
import { SavorTool } from '@/components/SavorTool';
import { 
  ArrowRight, Utensils, Loader2,
  ShieldCheck, Clock, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FoodCard } from '@/components/FoodCard';
import { Categories } from '@/components/Categories';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { PWAInlinePromo } from '@/components/PWAInlinePromo';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const highlightsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isAvailable', '==', true),
      limit(10)
    );
  }, [db]);

  const { data: menuItems, loading: menuLoading } = useCollection<FoodItem>(highlightsQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/menu?q=${encodeURIComponent(search.trim())}`);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative md:min-h-[60vh] min-h-[40vh] flex items-center pt-20 pb-8 overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://picsum.photos/seed/ezzybites-dark-hero/1920/1080"
              alt="Premium Background"
              fill
              className="object-cover opacity-60"
              priority
              data-ai-hint="dark luxury food"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />
          </div>

          <div className="container mx-auto px-4 relative z-20 max-w-6xl">
            <div className="md:space-y-6 space-y-3 animate-in fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-white/80">Premium Fast Food Redefined</span>
              </div>
              
              <div className="md:space-y-2 space-y-1">
                <h1 className="text-3xl md:text-[5rem] font-headline font-black leading-tight md:leading-[0.85] tracking-tighter text-white uppercase">
                  Flavor that <br />
                  <span className="text-primary italic">Commands</span> <br />
                  Respect.
                </h1>
                <p className="text-[10px] md:text-base text-white/60 max-w-md leading-relaxed font-medium">
                  Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary.
                </p>
              </div>

              <div className="flex justify-start pt-2">
                <Link href="/menu">
                  <Button className="rounded-full h-14 px-8 text-sm font-black shadow-3xl bg-primary hover:bg-primary/90 text-white transform transition-all active:scale-95 uppercase tracking-tight gap-3">
                    Start Your Order
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE SEARCH & CATEGORIES */}
        <div className="sticky top-[52px] z-30 bg-white dark:bg-zinc-950 md:hidden pt-3 pb-1 border-b shadow-sm">
           <div className="container px-4 space-y-3">
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dishes, burgers, tea..." 
                  className="w-full h-10 pl-12 rounded-xl bg-secondary/50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 !text-foreground shadow-inner"
                  suppressHydrationWarning
                />
              </form>
              <Categories />
           </div>
        </div>

        {/* BOUNTIES */}
        <section className="py-4 bg-secondary/10 dark:bg-zinc-900/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center gap-3 mb-3">
               <h2 className="text-xs md:text-base font-black uppercase tracking-tighter whitespace-nowrap">Exclusive <span className="text-primary italic">Bounties</span></h2>
               <div className="h-px bg-border flex-1 opacity-50" />
            </div>
            <PromoBanner />
          </div>
        </section>

        {/* HIGHLIGHTS */}
        <section className="py-12 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex justify-between items-end mb-8 gap-4">
              <div className="space-y-1">
                <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-primary border-primary/20">Chef's Special</Badge>
                <h2 className="text-2xl md:text-4xl font-black font-headline uppercase tracking-tighter">Signature <span className="text-primary italic">Highlights.</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="ghost" className="font-black text-[9px] uppercase tracking-widest gap-2 text-primary hover:bg-primary/5 h-10 px-4 rounded-xl border-2 border-primary/10">
                  Full Menu <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {menuItems?.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI TOOL */}
        <section className="py-12 container mx-auto px-4 max-w-5xl">
          <SavorTool />
        </section>

        {/* TRUST */}
        <section className="py-12 bg-white dark:bg-zinc-950 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {[
                { icon: Utensils, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique." },
                { icon: Clock, title: "Hyper-Local", desc: "A strict 25-minute delivery promise for locals." },
                { icon: ShieldCheck, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives." }
              ].map((f, i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-[2.5rem] shadow-sm border border-border/20 group text-center">
                  <div className="w-12 h-12 bg-orange-gradient rounded-xl flex items-center justify-center mb-3 text-white shadow-2xl mx-auto group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-black mb-1 uppercase tracking-tight">{f.title}</h4>
                  <p className="text-muted-foreground font-medium text-[10px] md:text-xs leading-relaxed max-w-[200px] mx-auto">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8 space-y-1">
            <h2 className="text-2xl font-headline font-black uppercase tracking-tighter">Support Core</h2>
            <p className="text-muted-foreground font-medium text-xs">Resolving your inquiries with precision.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "What is your delivery range?", a: "We serve a 3km radius around Pocharam and Anurag University campus for peak freshness." },
              { q: "Is there a student special?", a: "Yes! Use code STUDENT10 at checkout for 10% OFF on all orders above ₹200." },
              { q: "How do you handle bulk orders?", a: "For event catering, contact our hotline via WhatsApp for a custom logistics plan." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-zinc-50 dark:bg-zinc-900/50 rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="font-bold text-sm md:text-base hover:no-underline py-5 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-[11px] md:text-sm font-medium leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* PWA DOWNLOAD SECTION */}
        <PWAInlinePromo />
      </main>

      <footer className="bg-white dark:bg-zinc-950 border-t pt-12 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
            <div className="space-y-4">
              <Logo size="sm" className="scale-110 origin-left" />
              <p className="text-muted-foreground leading-relaxed text-xs font-medium">Culinary art and lightning-fast logistics. Redefining campus life.</p>
            </div>
            <div className="lg:col-start-3 space-y-4">
              <h4 className="font-black text-[10px] uppercase tracking-widest opacity-40">Core Navigation</h4>
              <ul className="space-y-2.5 text-muted-foreground font-bold text-xs">
                <li><Link href="/menu" className="hover:text-primary">Menu selection</Link></li>
                <li><Link href="/orders" className="hover:text-primary">Order history</Link></li>
                <li><Link href="/admin/login" className="hover:text-primary">Staff console</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center">
            <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-40">© {new Date().getFullYear()} Ezzy Bites Premium Food-Tech</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
