"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PromoBanner } from '@/components/PromoBanner';
import { SavorTool } from '@/components/SavorTool';
import { 
  ShoppingBag, ChefHat, Truck, Award, 
  HelpCircle, Instagram, Twitter, Facebook,
  ArrowRight, History, Utensils, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FoodCard } from '@/components/FoodCard';
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
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
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="flex-1 relative">
        {/* HERO SECTION */}
        <section className="relative h-[70vh] md:h-[80vh] flex items-center overflow-hidden">
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
          <div className="container mx-auto px-4 relative z-20 pt-12">
            <div className="max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 animate-in slide-in-from-bottom duration-700">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-white/90">Premium Fast Food Redefined</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-headline font-black mb-2 leading-[0.9] text-white animate-in fade-in slide-in-from-bottom duration-1000">
                Flavor that <br />
                <span className="text-primary italic text-glow">Commands</span> Respect.
              </h1>
              <p className="text-base md:text-xl text-white/70 max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-200 font-medium">
                Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary. Fresh ingredients, lightning speed.
              </p>
              <div className="flex pt-4 animate-in fade-in duration-1000 delay-500">
                <Link href="/menu" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-16 md:h-20 px-12 text-lg font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all group bg-primary text-white">
                    Start Your Order
                    <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SIGNATURE HIGHLIGHTS - Using Compact Cards */}
        <section className="py-12 md:py-16 bg-zinc-50 dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
               <div className="space-y-3">
                 <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">The Favorites</Badge>
                 <h2 className="text-3xl md:text-5xl font-headline font-black">Signature <span className="text-primary italic">Highlights.</span></h2>
               </div>
               <Link href="/menu">
                 <Button variant="link" className="font-black uppercase text-[11px] tracking-widest gap-2 text-primary">
                   View Entire Menu <ArrowRight className="w-4 h-4" />
                 </Button>
               </Link>
            </div>
            
            {menuLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Syncing live kitchen...</p>
              </div>
            ) : menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                {menuItems.map((item) => (
                  <FoodCard key={item.id} item={item} forceViewMode="small" />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed">
                <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold opacity-40">Menu is being updated. Check back in a moment!</p>
              </div>
            )}
          </div>
        </section>

        {/* PROMO OFFERS - Positioned after menu for better flow */}
        <section className="py-12 bg-background relative z-10">
          <PromoBanner />
        </section>

        {/* SAVOR TOOL AI SECTION */}
        <section className="py-12 md:py-16 container mx-auto px-4">
          <SavorTool />
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 bg-zinc-50 dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1 space-y-4">
                 <h2 className="text-4xl font-headline font-black leading-tight">What sets us <br /><span className="text-primary italic">Apart?</span></h2>
                 <p className="text-muted-foreground font-medium text-sm leading-relaxed">Every recipe is a result of obsessive testing and local sourcing. We deliver culinary experiences, not just food.</p>
              </div>
              <div className="lg:col-span-3 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { icon: ChefHat, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique and flavor above all else." },
                  { icon: Truck, title: "Hyper-Local", desc: "A 25-minute delivery promise for all local orders and campus sanctuaries." },
                  { icon: Award, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives, just pure, unadulterated taste." }
                ].map((f, i) => (
                  <div key={i} className="bg-card p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group border border-border/40">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
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

        {/* FAQ SECTION */}
        <section className="py-16 container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-headline font-black">Got Questions? <br /><span className="text-primary italic">We have answers.</span></h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "What is your delivery range?", a: "We currently serve a 3km radius around Pocharam and the Anurag University campus. We focus on hyper-local delivery to maintain temperature and taste." },
              { q: "Is there a student special?", a: "Yes! Students get 10% OFF on all orders above ₹200. Use code STUDENT10 at checkout." },
              { q: "How do you handle bulk orders?", a: "For event catering or campus club bulk orders, please contact our hotline via WhatsApp for a dedicated logistics plan." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-secondary/20 rounded-[2rem] px-8 transition-all hover:bg-secondary/40">
                <AccordionTrigger className="font-black text-lg hover:no-underline py-6 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base font-medium leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-background border-t pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-3xl font-headline font-black tracking-tight">
                  Ezzy<span className="text-primary">Bites</span>
                </span>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                Culinary art and lightning-fast logistics. Redefining campus life and home sanctuaries, one bite at a time.
              </p>
              <div className="flex gap-3">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="w-11 h-11 rounded-2xl text-muted-foreground hover:text-primary transition-all">
                    <Icon className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
            <div className="lg:col-start-3 space-y-6">
              <h4 className="font-black text-xl uppercase tracking-widest">Explore</h4>
              <ul className="space-y-3 text-muted-foreground font-bold text-sm">
                <li><Link href="/menu" className="hover:text-primary transition-colors flex items-center gap-2"><Utensils className="w-4 h-4" /> Menu</Link></li>
                <li><Link href="/orders" className="hover:text-primary transition-colors flex items-center gap-2"><History className="w-4 h-4" /> Order History</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-xl uppercase tracking-widest">Support</h4>
              <ul className="space-y-3 text-muted-foreground font-bold text-sm">
                <li><Link href="/admin/login" className="hover:text-primary transition-colors">Staff Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-50">
              © {currentYear || 2025} Ezzy Bites Premium Cafe. All flavor reserved.
            </p>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
