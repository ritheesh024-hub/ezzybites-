"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PromoBanner } from '@/components/PromoBanner';
import { SavorTool } from '@/components/SavorTool';
import { Categories } from '@/components/Categories';
import { 
  ShoppingBag, ChefHat, Truck, Award, 
  HelpCircle, Instagram, Twitter, Facebook,
  ArrowRight, History, Utensils, Loader2,
  Search, Star, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FoodCard } from '@/components/FoodCard';
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';

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

  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION - SWIGGY STYLE */}
        <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4 relative z-20">
            <div className="grid lg:grid-cols-2 items-center gap-12">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-500/10 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-500/20 animate-in slide-in-from-bottom duration-700">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-primary">Student Specials Live Now</span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-8xl font-headline font-black leading-[0.9] tracking-tighter">
                    Flavor that <br />
                    <span className="text-primary italic">Commands</span> <br />
                    Respect.
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                    Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary. Fresh ingredients, lightning speed.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link href="/menu" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto rounded-2xl h-16 md:h-20 px-12 text-lg font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-all bg-orange-gradient text-white border-none">
                      Order Now
                      <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 3D FOOD COMPOSITION */}
              <div className="relative h-[400px] md:h-[600px] animate-in fade-in zoom-in duration-1000 hidden lg:block">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative h-full preserve-3d">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[450px] aspect-square animate-float">
                    <Image src={getImg('hero-burger')} alt="Premium Burger" fill className="object-contain drop-shadow-[0_50px_50px_rgba(0,0,0,0.2)]" priority />
                  </div>
                  <div className="absolute top-0 right-0 w-48 h-48 animate-float-slow delay-500">
                    <Image src={getImg('hero-fries')} alt="Fries" fill className="object-contain drop-shadow-xl" />
                  </div>
                  <div className="absolute bottom-12 left-0 w-40 h-40 animate-float delay-1000">
                    <Image src={getImg('hero-drink')} alt="Drink" fill className="object-contain drop-shadow-xl" />
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute top-1/4 -right-4 glass p-4 rounded-2xl shadow-3xl rotate-12 flex items-center gap-3 animate-float-slow">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"><Star className="w-5 h-5 fill-current" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none">Rating</p>
                      <p className="text-lg font-black">4.9/5</p>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-1/4 -left-8 bg-orange-gradient p-5 rounded-[2rem] shadow-3xl -rotate-6 text-white animate-float delay-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Offer</p>
                    <p className="text-2xl font-black italic leading-none">50% OFF</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH BAR (BELOW HERO) */}
        <div className="container mx-auto px-4 -mt-8 relative z-30 lg:hidden">
          <div className="glass p-3 rounded-2xl shadow-3xl flex items-center border border-white/50">
             <Search className="w-5 h-5 text-muted-foreground ml-3" />
             <Input 
               placeholder="What are you craving today?" 
               className="border-none bg-transparent h-12 text-base focus-visible:ring-0 placeholder:font-bold"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        {/* CATEGORIES SECTION */}
        <section className="py-12 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">What's on your <span className="text-primary italic">Mind?</span></h2>
            <Categories />
          </div>
        </section>

        {/* MENU HIGHLIGHTS */}
        <section className="py-12 bg-[#F8F9FA] dark:bg-zinc-900/50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <Badge className="bg-primary/10 text-primary border-none mb-2 font-black uppercase text-[9px] px-3">Top Rated</Badge>
                <h2 className="text-3xl md:text-5xl font-black font-headline">Best <span className="text-primary italic">Sellers.</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="ghost" className="font-black text-[11px] uppercase tracking-widest gap-2 text-primary hover:bg-primary/5">
                  See Full Menu <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-[1.5rem]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                {menuItems?.map((item) => (
                  <FoodCard key={item.id} item={item} forceViewMode="small" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* OFFERS SECTION - COMPACT 3D CARDS */}
        <section className="py-12 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Best <span className="text-primary italic">Offers</span> For You</h2>
            <PromoBanner />
          </div>
        </section>

        {/* AI SAVOR TOOL */}
        <section className="py-12 container mx-auto px-4">
          <SavorTool />
        </section>

        {/* FEATURES */}
        <section className="py-16 bg-[#F8F9FA] dark:bg-zinc-900/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: ChefHat, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique and flavor." },
                { icon: Truck, title: "Hyper-Local", desc: "A 25-minute delivery promise for all local sanctuary orders." },
                { icon: Award, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives, just pure taste." }
              ].map((f, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-soft hover:shadow-xl transition-all border border-border/40">
                  <div className="w-14 h-14 bg-orange-gradient rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-primary/20">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black mb-2 uppercase tracking-tight">{f.title}</h4>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-headline font-black">Got Questions?</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "What is your delivery range?", a: "We serve a 3km radius around Pocharam and Anurag University campus for peak freshness." },
              { q: "Is there a student special?", a: "Yes! Use code STUDENT10 at checkout for 10% OFF on all orders above ₹200." },
              { q: "How do you handle bulk orders?", a: "For event catering, contact our hotline via WhatsApp for a custom logistics plan." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white dark:bg-zinc-900 rounded-[1.5rem] px-8 shadow-sm">
                <AccordionTrigger className="font-black text-lg hover:no-underline py-6 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base font-medium">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-white dark:bg-zinc-950 border-t pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-headline font-black">Ezzy<span className="text-primary">Bites</span></span>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-sm font-medium">Culinary art and lightning-fast logistics. Redefining campus life one bite at a time.</p>
              <div className="flex gap-3">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="w-11 h-11 rounded-xl text-muted-foreground hover:text-primary"><Icon className="w-5 h-5" /></Button>
                ))}
              </div>
            </div>
            <div className="lg:col-start-3 space-y-6">
              <h4 className="font-black text-lg uppercase tracking-widest">Explore</h4>
              <ul className="space-y-3 text-muted-foreground font-bold text-sm">
                <li><Link href="/menu" className="hover:text-primary flex items-center gap-2"><Utensils className="w-4 h-4" /> Menu</Link></li>
                <li><Link href="/orders" className="hover:text-primary flex items-center gap-2"><History className="w-4 h-4" /> Order History</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-lg uppercase tracking-widest">Support</h4>
              <ul className="space-y-3 text-muted-foreground font-bold text-sm">
                <li><Link href="/admin/login" className="hover:text-primary">Staff Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-10 text-center">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-50">© {currentYear || 2025} Ezzy Bites Premium Cafe. All flavor reserved.</p>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}