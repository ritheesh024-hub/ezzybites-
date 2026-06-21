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
        <section className="relative md:min-h-[70vh] min-h-[50vh] flex items-center pt-24 pb-12 overflow-hidden bg-black">
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

          <div className="container mx-auto px-6 relative z-20 max-w-5xl">
            <div className="md:space-y-8 space-y-4 animate-in fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-2xl px-5 py-2 rounded-full border border-white/10 shadow-2xl">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-white/80">Premium Fast Food Redefined</span>
              </div>
              
              <div className="md:space-y-4 space-y-1">
                <h1 className="text-4xl md:text-[6rem] font-headline font-black leading-tight md:leading-[0.85] tracking-tighter text-white uppercase">
                  Flavor that <br />
                  <span className="text-primary italic">Commands</span> <br />
                  Respect.
                </h1>
                <p className="text-xs md:text-lg text-white/60 max-w-lg leading-relaxed font-medium">
                  Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary.
                </p>
              </div>

              <div className="flex justify-start pt-4">
                <Link href="/menu">
                  <Button className="rounded-full h-16 px-12 text-lg font-black shadow-3xl bg-primary hover:bg-primary/90 text-white transform transition-all active:scale-95 uppercase tracking-tight gap-4">
                    Start Your Order
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE SEARCH & CATEGORIES */}
        <div className="sticky top-12 z-30 bg-white dark:bg-zinc-950 md:hidden pt-4 pb-1 border-b shadow-sm">
           <div className="container px-4 space-y-4">
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dishes, burgers, momos..." 
                  className="w-full h-12 pl-14 rounded-2xl bg-secondary/50 border-none font-bold text-base focus:ring-2 focus:ring-primary/20 !text-foreground shadow-inner"
                  suppressHydrationWarning
                />
              </form>
              <Categories />
           </div>
        </div>

        {/* BOUNTIES */}
        <section className="py-4 bg-secondary/10 dark:bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
               <h2 className="text-sm md:text-lg font-black uppercase tracking-tighter whitespace-nowrap">Exclusive <span className="text-primary italic">Bounties</span></h2>
               <div className="h-px bg-border flex-1" />
            </div>
            <PromoBanner />
          </div>
        </section>

        {/* HIGHLIGHTS */}
        <section className="py-16 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-10 gap-6">
              <div className="space-y-1">
                <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-primary border-primary/20">Chef's Special</Badge>
                <h2 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter">Signature <span className="text-primary italic">Highlights.</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="ghost" className="font-black text-[11px] uppercase tracking-widest gap-2 text-primary hover:bg-primary/5 h-12 px-6 rounded-xl border-2 border-primary/10">
                  Full Menu <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-[1.5rem]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {menuItems?.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI TOOL */}
        <section className="py-16 container mx-auto px-4">
          <SavorTool />
        </section>

        {/* TRUST */}
        <section className="py-16 bg-white dark:bg-zinc-950 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { icon: Utensils, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique." },
                { icon: Clock, title: "Hyper-Local", desc: "A strict 25-minute delivery promise for locals." },
                { icon: ShieldCheck, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives." }
              ].map((f, i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 p-10 rounded-[3rem] shadow-sm border border-border/20 group text-center">
                  <div className="w-16 h-16 bg-orange-gradient rounded-[1.8rem] flex items-center justify-center mb-6 text-white shadow-2xl mx-auto group-hover:scale-110 transition-transform">
                    <f.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black mb-3 uppercase tracking-tight">{f.title}</h4>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-headline font-black uppercase tracking-tighter">Support Core</h2>
            <p className="text-muted-foreground font-medium text-sm">Resolving your inquiries with precision.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "What is your delivery range?", a: "We serve a 3km radius around Pocharam and Anurag University campus for peak freshness." },
              { q: "Is there a student special?", a: "Yes! Use code STUDENT10 at checkout for 10% OFF on all orders above ₹200." },
              { q: "How do you handle bulk orders?", a: "For event catering, contact our hotline via WhatsApp for a custom logistics plan." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl px-8 shadow-sm overflow-hidden">
                <AccordionTrigger className="font-bold text-base hover:no-underline py-6 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-sm font-medium leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-white dark:bg-zinc-950 border-t pt-16 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-12">
            <div className="space-y-6">
              <Logo size="sm" className="scale-110 origin-left" />
              <p className="text-muted-foreground leading-relaxed text-sm font-medium">Culinary art and lightning-fast logistics. Redefining campus life.</p>
            </div>
            <div className="lg:col-start-3 space-y-6">
              <h4 className="font-black text-xs uppercase tracking-widest opacity-40">Core Navigation</h4>
              <ul className="space-y-3 text-muted-foreground font-bold text-sm">
                <li><Link href="/menu" className="hover:text-primary">Menu selection</Link></li>
                <li><Link href="/orders" className="hover:text-primary">Order history</Link></li>
                <li><Link href="/admin/login" className="hover:text-primary">Staff console</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-10 text-center">
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-40">© {new Date().getFullYear()} Ezzy Bites Premium Food-Tech</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
