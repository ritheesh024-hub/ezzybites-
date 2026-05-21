
"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, User, Heart } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CartDrawer } from './CartDrawer';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cart = useStore((state) => state.cart);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <ShoppingBag className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-headline font-bold text-foreground">
            Ezzy<span className="text-primary">Bites</span>
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search your cravings..." 
              className="w-full bg-secondary h-10 pl-10 pr-4 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/favorites">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-5 h-5" />
            </Button>
          </Link>
          
          <CartDrawer>
            <Button variant="default" className="rounded-full gap-2 px-5">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-semibold">{cartCount}</span>
            </Button>
          </CartDrawer>

          <Button variant="ghost" size="icon" className="rounded-full border border-border">
            <User className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center gap-2">
          <CartDrawer>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full bg-primary text-white text-[10px]">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </CartDrawer>
          
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search food..." 
                className="w-full bg-secondary h-12 pl-10 pr-4 rounded-xl focus:outline-none"
              />
            </div>
            <Link href="/" className="px-4 py-2 font-medium hover:text-primary transition-colors">Home</Link>
            <Link href="/menu" className="px-4 py-2 font-medium hover:text-primary transition-colors">Menu</Link>
            <Link href="/favorites" className="px-4 py-2 font-medium hover:text-primary transition-colors">Favorites</Link>
            <Link href="/orders" className="px-4 py-2 font-medium hover:text-primary transition-colors">My Orders</Link>
          </div>
        </div>
      )}
    </nav>
  );
};
