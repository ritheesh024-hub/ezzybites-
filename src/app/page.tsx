"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { SavorTool } from '@/components/SavorTool';
import { FoodCard } from '@/components/FoodCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { CATEGORIES } from '@/app/lib/menu-data';
import { 
  ShoppingBag, ArrowRight, Zap, Star, MapPin, 
  Phone, Instagram, Twitter, Facebook, Lock, 
  Clock, HelpCircle, Loader2, Sparkles, 
  ChefHat, Truck, Award
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

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const db = useFirestore();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), limit(10));
  }, [db]);

  const { data: trendingItems, loading } = useCollection<any>(menuQuery);

  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Cinematic Hero Section */}
        <section className="relative min-h-[85vh] md:h-screen flex items-center overflow-hidden">
          {/* Animated Background Layers */}
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
            {/* Animated Glow Elements */}
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

              {/* Stats Bar */}
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

        {/* Categories Bar - Floating Style */}
        <section className="relative -mt-8 md:-mt-10 z-30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="glass rounded-3xl md:rounded-[40px] p-2 md:p-4 shadow-2xl shadow-black/10 border border-white/20">
              <div className="flex overflow-x-auto gap-2 md:gap-3 pb-2 md:pb-0 scrollbar-hide items-center lg:justify-center">
                {CATEGORIES.map((cat, idx) => (
                  <Link href={`/menu?category=${cat}`} key={idx} className="flex-shrink-0 group">
                    <div className="px-5 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-[28px] border border-transparent hover:bg-primary/10 hover:border-primary/20 transition-all text-center">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary whitespace-nowrap">{cat}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trending Section with Carousel */}
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

        {/* Why Choose Us - Features Section */}
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

        {/* AI Savor Tool - Cinematic Style */}
        <section className="py-16 md:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <SavorTool />
          </div>
        </section>

        {/* Special Offer Banner */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative h-[200px] md:h-[300px] rounded-[32px] md:rounded-[50px] overflow-hidden group">
              <Image 
                src="https://picsum.photos/seed/food-offer/1600/400" 
                alt="Offer" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                data-ai-hint="spicy food"
              />
              <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 md:p-8">
                <h3 className="text-3xl md:text-7xl font-headline font-black text-white mb-4 md:mb-6 animate-pulse">FLAT 20% OFF</h3>
                <p className="text-xs md:text-xl text-white/90 font-bold mb-6 md:mb-8 uppercase tracking-[0.2em] md:tracking-[0.4em]">On your first order above ₹299</p>
                <Link href="/menu">
                  <Button className="bg-white text-primary hover:bg-white/90 rounded-full h-11 md:h-14 px-8 md:px-10 font-black text-sm md:text-lg">Claim Now</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="text-3xl md:text-5xl font-headline font-black mb-4">Loved by <span className="text-primary italic">Foodies</span></h2>
              <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">Join thousands of students and locals who've found their flavor sanctuary.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-10">
              {[
                { name: "Rahul S.", role: "AU Student", text: "The Maggie here is just different. The spices are authentic and the delivery is always under 20 mins. Life saver during exams!" },
                { name: "Ananya M.", role: "Local Guide", text: "Best Biryani in the Pocharam area. Period. The quality of rice and the tenderness of chicken is top notch." },
                { name: "Vikram K.", role: "Techie", text: "Ezzy Bites is my go-to for late night cravings. The AI Savor tool actually suggested a Maggie I love!" }
              ].map((t, i) => (
                <div key={i} className="p-8 md:p-10 rounded-[32px] md:rounded-[40px] bg-secondary/30 relative">
                   <Star className="w-6 h-6 md:w-8 md:h-8 text-primary absolute -top-3 md:-top-4 left-8 md:left-10 fill-primary" />
                   <p className="text-base md:text-lg font-medium leading-relaxed italic mb-6 md:mb-8">"{t.text}"</p>
                   <div>
                     <p className="font-black text-base md:text-lg">{t.name}</p>
                     <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary/60">{t.role}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info & Map Section */}
        <section className="py-16 md:py-32 bg-card border-y relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="space-y-10 md:space-y-12">
                <div>
                   <h2 className="text-4xl md:text-6xl font-headline font-black mb-4 md:mb-6">Find Your <span className="text-primary">Spot.</span></h2>
                   <p className="text-muted-foreground text-base md:text-xl">Located at the heart of the educational hub, ready to serve the brightest minds.</p>
                </div>
                <div className="space-y-6 md:space-y-8">
                  {[
                    { icon: MapPin, title: "Location", val: "Anurag University Road, Pocharam, Hyderabad" },
                    { icon: Clock, title: "Timings", val: "Daily: 10:00 AM - 10:00 PM" },
                    { icon: Phone, title: "Hotline", val: "+91 8639366800" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 md:gap-6 items-start">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg md:text-xl mb-1">{item.title}</h4>
                        <p className="text-sm md:text-muted-foreground font-medium">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="h-14 md:h-16 px-8 md:px-10 rounded-full font-black uppercase tracking-widest text-[10px] gap-3 border-2 w-full sm:w-auto" onClick={() => window.open('https://maps.app.goo.gl/FxiaeZmqrcevTR459', '_blank')}>
                   Open in Maps <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="rounded-3xl md:rounded-[60px] overflow-hidden h-[350px] md:h-[600px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] md:shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-4 md:border-8 border-white group relative mx-2">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.827222661053!2d78.6475753!3d17.4199147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9f7833a69719%3A0xc660d2b51351119b!2sAnurag%20University!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-1000"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
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

      {/* Premium Footer */}
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
                <li><Link href="/orders/tracking" className="hover:text-primary transition-colors">Track Order</Link></li>
                <li><Link href="/offers" className="hover:text-primary transition-colors">Exclusive Offers</Link></li>
                <li><Link href="/favorites" className="hover:text-primary transition-colors">My Favorites</Link></li>
              </ul>
            </div>

            <div className="space-y-8 md:space-y-10">
              <h4 className="font-black text-xl md:text-2xl uppercase tracking-widest">Support</h4>
              <ul className="space-y-4 md:space-y-5 text-muted-foreground font-bold text-sm md:text-base">
                <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li className="pt-4 md:pt-6">
                  <Link href="/admin/login" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground/30 hover:text-primary transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-8 md:space-y-10">
              <h4 className="font-black text-xl md:text-2xl uppercase tracking-widest">Vibe Check</h4>
              <div className="p-8 md:p-10 bg-primary/5 rounded-3xl md:rounded-[40px] border border-primary/10 relative overflow-hidden group">
                <Sparkles className="absolute -right-4 -top-4 w-16 h-16 md:w-20 md:h-20 text-primary opacity-5 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black mb-4 md:mb-6 uppercase tracking-widest">Join the Newsletter</p>
                <div className="flex flex-col gap-3 md:gap-4">
                  <input type="text" placeholder="Email" className="bg-background border rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <Button className="rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] md:text-xs">Subscribe</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-12 md:pt-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <p className="text-[10px] md:text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-50 text-center md:text-left">
              © {currentYear || 2025} Ezzy Bites Cafe. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 grayscale opacity-30">
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Razorpay Secure</div>
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">PCI DSS Compliant</div>
            </div>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
