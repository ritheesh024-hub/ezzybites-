
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PromoBanner } from '@/components/PromoBanner';
import { SavorTool } from '@/components/SavorTool';
import { 
  ShoppingBag, ChefHat, Truck, Award, 
  HelpCircle, Instagram, Twitter, Facebook,
  ArrowRight, History, Utensils, Loader2,
  Search, Star, Sparkles, Clock, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FoodCard } from '@/components/FoodCard';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const db = useFirestore();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const highlightsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isAvailable', '==', true),
      limit(6)
    );
  }, [db]);

  const { data: menuItems, loading: menuLoading } = useCollection<FoodItem>(highlightsQuery);

  const heroBg = placeholderData.placeholderImages.find(img => img.id === 'hero-bg-main')?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION - PREMIUM MINIMALIST WITH BACKGROUND */}
        <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 overflow-hidden">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroBg}
              alt="Premium Background"
              fill
              className="object-cover"
              priority
              data-ai-hint="food background"
            />
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[2px]" />
          </div>

          <div className="container mx-auto px-4 relative z-20 max-w-4xl text-center">
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-2.5 rounded-full border border-primary/20 mx-auto shadow-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black tracking-widest uppercase text-primary">Premium Fast Food Experience</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-6xl md:text-[7rem] font-headline font-black leading-[0.9] tracking-tighter text-[#2D2D2D] dark:text-white uppercase">
                  Flavor that <br />
                  <span className="text-primary italic">Commands</span> <br />
                  Respect.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                  Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary. Fresh ingredients, lightning speed, and taste unified in one perfect bite.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-6">
                <Link href="/menu" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-3xl h-18 md:h-24 px-20 text-xl font-black shadow-2xl shadow-primary/20 bg-orange-gradient text-white border-none transform transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter">
                    Start Your Order
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-10 justify-center pt-14 border-t border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 shadow-sm border border-green-100 dark:border-green-800">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none text-green-600 mb-1">Free</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100 dark:border-orange-800">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none text-orange-600 mb-1">25 Min</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Guarantee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 dark:border-blue-800">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none text-blue-600 mb-1">FSSAI</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Certified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH BAR (MOBILE) */}
        <div className="container mx-auto px-4 -mt-8 mb-12 relative z-30 lg:hidden">
          <div className="glass p-4 rounded-3xl shadow-3xl flex items-center border border-white/50">
             <Search className="w-6 h-6 text-muted-foreground ml-3" />
             <Input 
               placeholder="What are you craving today?" 
               className="border-none bg-transparent h-14 text-lg focus-visible:ring-0 placeholder:font-bold"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        {/* MENU HIGHLIGHTS */}
        <section className="py-20 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <Badge variant="outline" className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 mb-4">Live Selection</Badge>
                <h2 className="text-5xl md:text-7xl font-black font-headline uppercase tracking-tighter">Signature <span className="text-primary italic">Highlights.</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="ghost" className="font-black text-[12px] uppercase tracking-widest gap-2 text-primary hover:bg-primary/5 h-14 px-8 rounded-2xl">
                  Full Menu <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-[2.5rem]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8">
                {menuItems?.map((item) => (
                  <FoodCard key={item.id} item={item} forceViewMode="small" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* OFFERS SECTION */}
        <section className="py-20 bg-secondary/10 dark:bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-12">
               <div className="h-px bg-border flex-1" />
               <h2 className="text-3xl font-black uppercase tracking-tighter whitespace-nowrap">Limited <span className="text-primary italic">Offers</span></h2>
               <div className="h-px bg-border flex-1" />
            </div>
            <PromoBanner />
          </div>
        </section>

        {/* AI SAVOR TOOL */}
        <section className="py-24 container mx-auto px-4">
          <SavorTool />
        </section>

        {/* FEATURES */}
        <section className="py-24 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: ChefHat, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique and flavor." },
                { icon: Truck, title: "Hyper-Local", desc: "A 25-minute delivery promise for all local sanctuary orders." },
                { icon: Award, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives, just pure taste." }
              ].map((f, i) => (
                <div key={i} className="bg-secondary/20 dark:bg-zinc-900/50 p-10 rounded-[3rem] shadow-soft hover:shadow-2xl transition-all border border-border/40 group">
                  <div className="w-16 h-16 bg-orange-gradient rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <f.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black mb-3 uppercase tracking-tight">{f.title}</h4>
                  <p className="text-muted-foreground font-medium text-base leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <HelpCircle className="w-14 h-14 text-primary mx-auto mb-6" />
            <h2 className="text-5xl font-headline font-black uppercase tracking-tighter">Common Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-5">
            {[
              { q: "What is your delivery range?", a: "We serve a 3km radius around Pocharam and Anurag University campus for peak freshness." },
              { q: "Is there a student special?", a: "Yes! Use code STUDENT10 at checkout for 10% OFF on all orders above ₹200." },
              { q: "How do you handle bulk orders?", a: "For event catering, contact our hotline via WhatsApp for a custom logistics plan." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-secondary/20 dark:bg-zinc-900/50 rounded-[2rem] px-10 shadow-sm overflow-hidden">
                <AccordionTrigger className="font-black text-xl hover:no-underline py-8 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-8 text-lg font-medium leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-white dark:bg-zinc-950 border-t pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-gradient rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-headline font-black tracking-tighter">Ezzy<span className="text-primary">Bites</span></span>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-base font-medium">Culinary art and lightning-fast logistics. Redefining campus life one bite at a time.</p>
              <div className="flex gap-4">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="w-12 h-12 rounded-2xl text-muted-foreground hover:text-primary border-2 transition-all"><Icon className="w-6 h-6" /></Button>
                ))}
              </div>
            </div>
            <div className="lg:col-start-3 space-y-8">
              <h4 className="font-black text-xl uppercase tracking-widest">Explore</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-base">
                <li><Link href="/menu" className="hover:text-primary flex items-center gap-3 transition-colors"><Utensils className="w-5 h-5" /> Menu</Link></li>
                <li><Link href="/orders" className="hover:text-primary flex items-center gap-3 transition-colors"><History className="w-5 h-5" /> Order History</Link></li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="font-black text-xl uppercase tracking-widest">Support</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-base">
                <li><Link href="/admin/login" className="hover:text-primary transition-colors">Staff Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-12 text-center">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50">© {currentYear || 2025} Ezzy Bites Premium Cafe. All flavor reserved.</p>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
