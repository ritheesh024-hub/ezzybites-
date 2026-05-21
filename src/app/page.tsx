
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { SavorTool } from '@/components/SavorTool';
import { FoodCard } from '@/components/FoodCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { CATEGORIES } from '@/app/lib/menu-data';
import { ShoppingBag, ArrowRight, Zap, Star, MapPin, Phone, Instagram, Twitter, Facebook, Lock, Clock, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    return query(collection(db, 'menu'), limit(6));
  }, [db]);

  const { data: trendingItems, loading } = useCollection<any>(menuQuery);

  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={getImg('hero-bg')} 
              alt="Hero Food" 
              fill 
              className="object-cover brightness-[0.5] scale-105"
              priority
              data-ai-hint="restaurant food"
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl text-white">
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-full border border-primary/30 mb-8 animate-in slide-in-from-left duration-700">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold tracking-widest uppercase">30 MINS FAST DELIVERY</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-headline font-black mb-6 leading-[1] animate-in slide-in-from-left duration-1000">
                Premium Taste, <br />
                <span className="text-primary italic">Lightning</span> Speed.
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-xl leading-relaxed animate-in slide-in-from-left duration-1000 delay-200 font-medium">
                Delicious cafe vibes delivered right to your door. Fresh ingredients, chef-crafted recipes, and a frictionless experience.
              </p>
              <div className="flex flex-wrap gap-5 animate-in fade-in duration-1000 delay-500">
                <Link href="/menu">
                  <Button size="lg" className="rounded-full h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
                    Order Now
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button size="lg" variant="outline" className="rounded-full h-16 px-10 text-xl font-bold bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20">
                    Explore Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="py-12 bg-background border-b sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto gap-6 pb-2 scrollbar-hide items-center justify-center">
              {CATEGORIES.map((cat, idx) => (
                <Link href={`/menu?category=${cat}`} key={idx} className="flex-shrink-0 group">
                  <div className="px-6 py-2.5 rounded-full border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <span className="text-sm font-black uppercase tracking-widest group-hover:text-primary">{cat}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-headline font-black mb-4">Trending <span className="text-primary">Dishes</span></h2>
                <p className="text-muted-foreground text-lg max-w-xl">Our community's favorite picks this week. Handcrafted with love.</p>
              </div>
              <Link href="/menu">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold px-8 h-12">
                  View Full Menu
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : trendingItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {trendingItems.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/20 rounded-3xl">
                <p className="text-muted-foreground font-medium">New dishes coming soon! Explore our full menu to see more.</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Savor Tool */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <SavorTool />
          </div>
        </section>

        {/* Info & Map Section */}
        <section className="py-24 bg-card border-y">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl font-headline font-black">Find Us at <span className="text-primary">Easy Bites</span></h2>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Address</h4>
                      <p className="text-muted-foreground">Anurag University Road, Arundhati Colony Rd No. 2, Pocharam, Hyderabad, 500088</p>
                      <a href="https://maps.app.goo.gl/FxiaeZmqrcevTR459?g_st=ac" target="_blank" className="text-primary font-bold text-sm hover:underline mt-2 inline-block">View on Google Maps</a>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Timings</h4>
                      <p className="text-muted-foreground">Open Daily: 10:00 AM - 10:00 PM</p>
                      <p className="text-xs text-green-600 font-bold mt-1 uppercase tracking-wider">Delivery Active Now</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Contact</h4>
                      <p className="text-muted-foreground">+91 8639366800</p>
                      <p className="text-muted-foreground">sunnyritheesh@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-[40px] overflow-hidden h-[450px] shadow-2xl border-8 border-white">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.827222661053!2d78.6475753!3d17.4199147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9f7833a69719%3A0xc660d2b51351119b!2sAnurag%20University!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-headline font-black">Got <span className="text-primary">Questions?</span></h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-none bg-secondary/30 rounded-2xl px-6 mb-4">
              <AccordionTrigger className="font-bold text-lg hover:no-underline py-6">What is the minimum order for free delivery?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Orders above ₹149 are eligible for FREE delivery. For orders below ₹149, a nominal delivery fee of ₹40 applies.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-none bg-secondary/30 rounded-2xl px-6 mb-4">
              <AccordionTrigger className="font-bold text-lg hover:no-underline py-6">How fast is the delivery?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                We guarantee delivery within 20-30 minutes for locations within our 2km radius around Pocharam.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-none bg-secondary/30 rounded-2xl px-6 mb-4">
              <AccordionTrigger className="font-bold text-lg hover:no-underline py-6">Do you support online payments?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Yes! We support UPI (PhonePe, Google Pay), Online Cards via Razorpay, and Cash on Delivery.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-3xl font-headline font-black tracking-tight">
                  Easy<span className="text-primary">Bites</span>
                </span>
              </Link>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Elevating the fast-food experience with premium ingredients and unparalleled service.
              </p>
              <div className="flex gap-4">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="rounded-2xl border-muted text-muted-foreground hover:text-primary hover:border-primary transition-all">
                    <Icon className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-8">
              <h4 className="font-black text-xl uppercase tracking-widest">Navigation</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/menu" className="hover:text-primary transition-colors">Menu</Link></li>
                <li><Link href="/orders/tracking" className="hover:text-primary transition-colors">Track Order</Link></li>
                <li><Link href="/offers" className="hover:text-primary transition-colors">Offers</Link></li>
                <li><Link href="/favorites" className="hover:text-primary transition-colors">My Favorites</Link></li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xl uppercase tracking-widest">Support</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/faq" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li className="pt-4 border-t border-muted">
                  <Link href="/admin/login" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    Admin Access
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xl uppercase tracking-widest">Connect</h4>
              <div className="p-6 bg-secondary/30 rounded-3xl border border-primary/10">
                <p className="text-sm font-bold mb-4">Join our newsletter for exclusive offers!</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Email" className="bg-background border rounded-xl px-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary/20 outline-none" />
                  <Button size="sm" className="rounded-xl px-4">Join</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted-foreground font-medium">
              © {currentYear || 2025} Easy Bites Cafe. All rights reserved.
            </p>
            <div className="flex items-center gap-8 grayscale opacity-50">
              <div className="text-[10px] font-black uppercase tracking-[0.3em]">Razorpay Secure</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em]">PCI DSS Compliant</div>
            </div>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
