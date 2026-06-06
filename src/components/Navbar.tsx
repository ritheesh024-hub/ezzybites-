'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, User, LogOut, History, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { useStore } from '@/app/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const { cart } = useStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
      scrolled ? "glass border-b border-border/50 py-2 shadow-soft" : "bg-white/90 dark:bg-zinc-950/90 py-4"
    )}>
      <div className="container mx-auto px-4">
        <div className="h-14 md:h-16 flex items-center justify-between px-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-headline font-black tracking-tight">
              Ezzy<span className="text-primary italic">Bites</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Home</Link>
            <Link href="/menu" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Menu</Link>
            <Link href="/orders" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Orders</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            
            <CartDrawer>
              <Button variant="ghost" size="icon" className="rounded-full w-11 h-11 transition-all relative hover:bg-primary/5">
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center animate-in zoom-in border-2 border-background">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            </CartDrawer>

            {!userLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none rounded-full ring-offset-background focus:ring-2 focus:ring-primary/20 transition-transform active:scale-95">
                      <Avatar className="h-11 w-11 border-2 border-background shadow-lg">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback className="bg-orange-gradient text-white font-black text-xs">
                          {user.displayName?.slice(0, 2).toUpperCase() || 'EB'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 border-none shadow-3xl bg-white dark:bg-zinc-900 mt-2">
                    <DropdownMenuLabel className="px-4 py-4">
                      <p className="text-sm font-black uppercase tracking-tight truncate">{user.displayName}</p>
                      <p className="text-[10px] font-medium opacity-50 truncate">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-primary/5 transition-colors">
                      <Link href="/orders" className="flex items-center gap-3">
                        <History className="w-5 h-5 text-primary" /> My History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="rounded-2xl py-3 font-bold text-destructive cursor-pointer hover:bg-destructive/5 transition-colors flex items-center gap-3">
                      <LogOut className="w-5 h-5" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-2xl px-6 h-12 font-black uppercase text-[10px] tracking-widest transition-all bg-orange-gradient text-white shadow-lg shadow-primary/20 hidden md:flex"
                >
                  <User className="w-4 h-4 mr-2" /> Sign In
                </Button>
              )
            )}

            <Button variant="ghost" size="icon" className="md:hidden rounded-full w-11 h-11" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-zinc-950 border-t border-border animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex flex-col p-6 gap-2">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 rounded-2xl transition-all">Home</Link>
            <Link href="/menu" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 rounded-2xl transition-all">Menu</Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 rounded-2xl transition-all">Orders</Link>
            {!user ? (
              <Button 
                onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }} 
                className="mt-4 h-16 rounded-2xl bg-orange-gradient font-black uppercase text-[11px] tracking-widest"
              >
                Join the Family
              </Button>
            ) : (
              <button 
                onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                className="px-6 py-4 font-black uppercase tracking-widest text-[11px] text-destructive text-left hover:bg-destructive/5 rounded-2xl transition-all"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
};