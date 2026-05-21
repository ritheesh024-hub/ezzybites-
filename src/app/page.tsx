
"use client"
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { SavorTool } from '@/components/SavorTool';
import { FoodCard } from '@/components/FoodCard';
import { MENU_ITEMS, CATEGORIES } from '@/app/lib/menu-data';
import { ShoppingBag, ArrowRight, Zap, Star, MapPin, Phone, Instagram, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={getImg('hero-bg')} 
              alt="Hero Food" 
              fill 
              className="object-cover brightness-[0.6]"
              priority
              data-ai-hint="restaurant food"
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl text-white">
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-full border border-primary/30 mb-6 animate-in slide-in-from-left duration-700">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold tracking-wide">30 MINS DELIVERY GUARANTEED</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-black mb-6 leading-[1.1] animate-in slide-in-from-left duration-1000">
                The Food You <br />
                <span className="text-primary italic">Love,</span> Delivered <br />
                With <span className="underline decoration-primary underline-offset-8">Speed.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg leading-relaxed animate-in slide-in-from-left duration-1000 delay-200">
                Premium ingredients, professional chefs, and lightning-fast delivery. Your neighborhood's favorite cafe is now just a tap away.
              </p>
              <div className="flex flex-wrap gap-4 animate-in fade-in duration-1000 delay-500">
                <Link href="/menu">
                  <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold shadow-2xl shadow-primary/20">
                    Order Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-bold bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20">
                    View Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Scroller */}
        <section className="py-12 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-headline font-bold">Quick Categories</h2>
              <Link href="/menu" className="text-primary font-bold text-sm flex items-center hover:underline">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
              {CATEGORIES.filter(c => c !== 'All').map((cat, idx) => {
                const catImgId = `cat-${cat.toLowerCase().replace(' ', '-')}`;
                const catImg = getImg(catImgId);
                return (
                  <Link href={`/menu?category=${cat}`} key={idx} className="flex-shrink-0 group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-secondary border border-transparent group-hover:border-primary group-hover:shadow-lg transition-all overflow-hidden mb-3">
                      {catImg && (
                        <Image 
                          src={catImg} 
                          alt={cat} 
                          width={200} 
                          height={200}
                          className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                          data-ai-hint={cat.toLowerCase()}
                        />
                      )}
                    </div>
                    <span className="text-sm font-bold text-center block group-hover:text-primary transition-colors">{cat}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* AI Tool Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <SavorTool />
          </div>
        </section>

        {/* Popular Dishes */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2">Our Popular Dishes</h2>
                <p className="text-muted-foreground">The most loved picks from our premium kitchen.</p>
              </div>
              <Link href="/menu">
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold">
                  View Full Menu
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {MENU_ITEMS.slice(0, 6).map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* Features / Why Us */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Quality Ingredients</h3>
                <p className="text-white/70 leading-relaxed">We source only the freshest and premium ingredients for our culinary creations.</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Chef's Special</h3>
                <p className="text-white/70 leading-relaxed">Our chefs craft each dish with passion, ensuring an explosion of flavors in every bite.</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Super Fast Delivery</h3>
                <p className="text-white/70 leading-relaxed">Get your food piping hot at your doorstep within 30 minutes. No excuses.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-2xl font-headline font-bold text-foreground">
                  Easy<span className="text-primary">Bites</span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Experience premium fast food redefined. Quality, speed, and taste unified in one perfect bite.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="rounded-full border-muted text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                  <Instagram className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-muted text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-muted text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                  <Facebook className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-bold text-lg">Quick Links</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="/menu" className="hover:text-primary transition-colors">Menu Catalog</Link></li>
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/tracking" className="hover:text-primary transition-colors">Track Order</Link></li>
                <li><Link href="/offers" className="hover:text-primary transition-colors">Latest Offers</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Support</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Reach Us</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <span>Anurag University Road, Hyderabad, Telangana 500088</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <span>+91 8639366800</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-10 text-center">
            <p className="text-xs text-muted-foreground">
              © {currentYear || 2025} Easy Bites Cafe. All rights reserved. 
              <br className="md:hidden" /> Crafted for a premium dining experience.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
