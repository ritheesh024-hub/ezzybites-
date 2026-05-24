"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { SavorTool } from '@/components/SavorTool';
import { FoodCard } from '@/components/FoodCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PromoBanner } from '@/components/PromoBanner';
import { 
  ShoppingBag, ArrowRight, Star, 
  Loader2, ChefHat, Truck, Award, 
  HelpCircle, Instagram, Twitter, Facebook,
  Zap, TicketPercent, GraduationCap, Smartphone, Download
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
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-14 md:h-16 px-10 text-base font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all group" style={{ background: 'hsl(var(--primary))' }}>
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

        {/* PROMO BANNER SECTION */}
        <section className="bg-background">
           <PromoBanner />
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
                <CarouselContent className="-ml-4">
                  {trendingItems.map((item) => (
                    <CarouselItem key={item.id} className="pl-4 basis-[48%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/6">
                      <FoodCard item={item} forceViewMode="small" />
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

        {/* APP INSTALL SECTION */}
        <section className="py-20 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-card rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl border">
              <div className="md:w-1/2 relative">
                <div className="w-full aspect-[9/16] max-w-[280px] mx-auto bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden relative">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-3xl z-20" />
                   <Image 
                     src={getImg('hero-bg')} 
                     alt="Mobile App View" 
                     fill 
                     className="object-cover opacity-50"
                   />
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                     <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                       <ShoppingBag className="w-10 h-10 text-white" />
                     </div>
                     <h4 className="text-white font-black text-xl leading-tight">Ezzy Bites <br />on your screen</h4>
                   </div>
                </div>
                <div className="absolute -bottom-6 -right-6 md:-bottom-10 md:-right-10 w-24 h-24 md:w-40 md:h-40 bg-primary/20 rounded-full blur-3xl" />
              </div>
              
              <div className="md:w-1/2 space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">
                    No Store Required
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-headline font-black leading-none">Get the <span className="text-primary italic">Full Experience.</span></h2>
                  <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                    Install Ezzy Bites as an app on your mobile device for faster ordering, offline tracking, and a premium full-screen interface.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 font-black">1</div>
                    <p className="text-sm font-bold pt-2">Open this site in Chrome or Safari on your phone.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 font-black">2</div>
                    <p className="text-sm font-bold pt-2">Tap <span className="text-primary">"Add to Home Screen"</span> in your browser menu.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                   <div className="flex items-center gap-3 bg-secondary/50 px-6 py-4 rounded-2xl border">
                      <Smartphone className="w-6 h-6 text-primary" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase opacity-50">Available for</p>
                        <p className="text-sm font-black uppercase">iOS & Android</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED OFFERS SECTION */}
        <section className="py-20 md:py-32 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
               <div className="inline-flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.4em]">
                 <Zap className="w-4 h-4 fill-primary" /> Hot Deals
               </div>
               <h2 className="text-4xl md:text-6xl font-headline font-black">Featured <span className="text-primary italic">Offers</span></h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Offer Card 1 */}
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border group hover:scale-[1.01] transition-all">
                <div className="md:w-1/2 relative min-h-[250px]">
                  <Image src="https://picsum.photos/seed/student-burger/800/600" alt="Student Offer" fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Student Feast</h4>
                    <p className="text-muted-foreground text-sm font-medium">Use code <span className="text-primary font-black">STUDENT10</span> for an instant 10% discount.</p>
                  </div>
                  <Link href="/menu">
                    <Button className="rounded-full px-8 h-12 font-black uppercase text-[9px] tracking-widest gap-2">Apply Offer <ArrowRight className="w-3.5 h-3.5" /></Button>
                  </Link>
                </div>
              </div>

              {/* Offer Card 2 */}
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border group hover:scale-[1.01] transition-all">
                <div className="md:w-1/2 relative min-h-[250px]">
                  <Image src="https://picsum.photos/seed/first-order/800/600" alt="First Order" fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-6">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <TicketPercent className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-headline">Free Delivery</h4>
                    <p className="text-muted-foreground text-sm font-medium">Enjoy <span className="text-green-600 font-black">ZERO Fees</span> on your very first order above ₹149.</p>
                  </div>
                  <Link href="/menu">
                    <Button variant="outline" className="rounded-full px-8 h-12 font-black uppercase text-[9px] tracking-widest gap-2 border-2">Unlock Now <ArrowRight className="w-3.5 h-3.5" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 md:py-24 bg-background relative overflow-hidden">
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
                  <div key={i} className="bg-card p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group border">
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
        <section className="py-16 md:py-24 bg-secondary/20">
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
              { q: "Is there a student special?", a: "Yes! Students with a valid AU ID get a 10% discount on all orders above ₹200. Use code STUDENT10 at checkout." },
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
