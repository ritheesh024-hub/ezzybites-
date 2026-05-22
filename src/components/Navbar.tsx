
"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, User, Heart } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartDrawer } from './CartDrawer';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cart = useStore((state) => state.cart);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
      scrolled ? "py-2" : "py-4 md:py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className={cn(
          "h-14 md:h-16 flex items-center justify-between px-4 md:px-6 transition-all duration-500",
          scrolled 
            ? "glass rounded-full shadow-2xl shadow-black/5" 
            : "bg-transparent"
        )}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <span className={cn(
              "text-lg md:text-2xl font-headline font-black tracking-tight transition-colors",
              !scrolled ? "text-white" : "text-foreground"
            )}>
              Ezzy<span className="text-primary">Bites</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                !scrolled ? "text-white/60 group-hover:text-white" : "text-muted-foreground"
              )} />
              <input 
                type="text" 
                placeholder="Search your cravings..." 
                className={cn(
                  "w-full h-11 pl-11 pr-4 rounded-full text-sm outline-none transition-all",
                  !scrolled 
                    ? "bg-white/10 text-white placeholder:text-white/60 focus:bg-white/20 border border-white/10" 
                    : "bg-secondary text-foreground focus:ring-2 focus:ring-primary/20"
                )}
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/orders">
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full transition-colors",
                !scrolled ? "text-white hover:bg-white/10" : "text-foreground"
              )}>
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
            
            <CartDrawer>
              <Button variant="default" className="rounded-full gap-2 px-6 h-11 shadow-lg shadow-primary/20">
                <ShoppingBag className="w-4 h-4" />
                <span className="font-black">{cartCount}</span>
              </Button>
            </CartDrawer>

            <Link href="/orders">
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full border transition-all",
                !scrolled ? "text-white border-white/20 hover:bg-white/10" : "text-foreground border-border"
              )}>
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-1">
            <CartDrawer>
              <Button variant="ghost" size="icon" className={cn(
                "relative rounded-full w-10 h-10",
                !scrolled ? "text-white" : "text-foreground"
              )}>
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute top-1 right-1 px-1 py-0 min-w-[1rem] h-[1rem] flex items-center justify-center rounded-full bg-primary text-white text-[9px] border-2 border-background">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </CartDrawer>
            
            <Button variant="ghost" size="icon" className={cn(
              "rounded-full w-10 h-10 transition-colors",
              !scrolled ? "text-white" : "text-foreground"
            )} onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass border-t border-white/10 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 gap-2">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">Home</Link>
            <Link href="/menu" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">Menu</Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">My Orders</Link>
          </div>
        </div>
      )}
    </nav>
  );
};
