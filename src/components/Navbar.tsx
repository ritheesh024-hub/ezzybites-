'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  LogOut, 
  History, 
  ShieldCheck, 
  LayoutDashboard, 
  Search,
  User,
  Heart,
  Phone,
  Home,
  Utensils,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { useStore } from '@/app/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Logo } from './Logo';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { cart, isDarkMode, toggleDarkMode } = useStore();
  const router = useRouter();

  const userDocRef = useMemo(() => user && db ? doc(db, 'users', user.uid) : null, [user, db]);
  const adminDocRef = useMemo(() => user && db ? doc(db, 'admins', user.uid) : null, [user, db]);
  
  const { data: customerProfile } = useDoc(userDocRef);
  const { data: adminProfile } = useDoc(adminDocRef);

  const isCustomer = !!customerProfile;
  const isStaff = !!adminProfile;

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
      router.push('/');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/menu?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setIsMenuOpen(false);
    }
  };

  const menuItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu', href: '/menu', icon: Utensils },
    { label: 'My Orders', href: '/orders', icon: History },
    { label: 'Favorites', href: '#', icon: Heart },
    { label: 'Contact Us', href: 'https://wa.me/918639366800', icon: Phone, isExternal: true },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-40 transition-all duration-500 px-4",
      scrolled 
        ? "bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-b border-white/10 py-1.5 shadow-xl" 
        : "bg-white/5 dark:bg-black/5 backdrop-blur-sm py-3"
    )}>
      <div className="container mx-auto">
        <div className="h-12 md:h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <Logo variant={scrolled ? 'dark' : 'light'} size="sm" className="shrink-0 scale-90 md:scale-100 origin-left" />
          </Link>

          {/* Search Bar - Tablet & Desktop Only */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                scrolled ? "text-muted-foreground" : "text-white/40",
                "group-focus-within:text-primary"
              )} />
              <Input 
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search premium bites..." 
                className={cn(
                  "w-full h-10 pl-11 pr-4 rounded-full border-none transition-all font-medium text-xs focus:ring-2 focus:ring-primary/20",
                  scrolled 
                    ? "bg-secondary/50 focus:bg-white dark:bg-zinc-900" 
                    : "bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20 backdrop-blur-xl"
                )}
              />
            </form>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Desktop Only Actions */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              
              {!userLoading && (
                user ? (
                  isStaff && !isCustomer ? (
                    <Link href="/admin/dashboard">
                      <Button variant="outline" className="rounded-xl h-10 px-4 gap-2 font-black uppercase text-[9px] tracking-widest border-primary/20 bg-primary/5 text-primary">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dash
                      </Button>
                    </Link>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="outline-none rounded-full ring-offset-background focus:ring-2 focus:ring-primary/20 transition-transform active:scale-95">
                          <Avatar className="h-9 w-9 border border-background shadow-md">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback className="bg-orange-gradient text-white font-black text-[10px]">
                              {user.displayName?.slice(0, 2).toUpperCase() || 'EB'}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 border-none shadow-3xl bg-white dark:bg-zinc-900 mt-2">
                        <DropdownMenuLabel className="px-4 py-4">
                          <p className="text-sm font-black uppercase tracking-tight truncate">{user.displayName || user.email?.split('@')[0]}</p>
                          <p className="text-[10px] font-medium opacity-50 truncate">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-primary/5">
                          <Link href="/orders" className="flex items-center gap-3">
                            <History className="w-5 h-5 text-primary" /> My History
                          </Link>
                        </DropdownMenuItem>
                        {isStaff && (
                          <DropdownMenuItem asChild className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-orange-50">
                            <Link href="/admin/dashboard" className="flex items-center gap-3 text-orange-600">
                              <ShieldCheck className="w-5 h-5" /> Staff Console
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="rounded-2xl py-3 font-bold text-destructive cursor-pointer hover:bg-destructive/5 flex items-center gap-3">
                          <LogOut className="w-5 h-5" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                ) : (
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="rounded-full px-5 h-10 font-black uppercase text-[10px] tracking-widest bg-orange-gradient text-white shadow-lg"
                  >
                    Login
                  </Button>
                )
              )}
            </div>

            {/* Always Visible: Cart */}
            <CartDrawer>
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full w-9 h-9 md:w-10 md:h-10 transition-all relative",
                scrolled ? "hover:bg-primary/5 text-foreground" : "hover:bg-white/10 text-white"
              )}>
                <ShoppingBag className="w-4.5 h-4.5 md:w-5 md:h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-sm animate-in zoom-in">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            </CartDrawer>

            {/* Mobile/Tablet: Hamburger Side Menu */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(
                    "rounded-full w-9 h-9",
                    scrolled ? "text-foreground" : "text-white"
                  )}>
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 border-none bg-background flex flex-col z-50">
                  <SheetHeader className="p-6 text-left border-b bg-secondary/10">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                    {user ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
                          <AvatarImage src={user.photoURL || ''} />
                          <AvatarFallback className="bg-orange-gradient text-white font-black">
                            {user.displayName?.slice(0, 2).toUpperCase() || 'EB'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-base uppercase tracking-tight truncate">
                            {user.displayName?.split(' ')[0] || 'Member'}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground truncate opacity-70">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Logo variant="color" size="sm" />
                        <p className="text-xs font-medium text-muted-foreground">Sign in for the best experience.</p>
                      </div>
                    )}
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {menuItems.map((item) => (
                      <Link 
                        key={item.label} 
                        href={item.href}
                        target={item.isExternal ? '_blank' : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-black text-[11px] uppercase tracking-widest text-foreground/80 group-hover:text-primary">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </Link>
                    ))}

                    <div className="h-px bg-border my-4 mx-4" />

                    <div className="px-4 py-2">
                       <button 
                        onClick={toggleDarkMode}
                        className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all group"
                       >
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                             {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                           </div>
                           <span className="font-black text-[11px] uppercase tracking-widest">
                             {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                           </span>
                         </div>
                       </button>
                    </div>
                  </div>

                  <div className="p-6 border-t">
                    {user ? (
                      <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest text-destructive hover:bg-destructive/5 gap-3"
                      >
                        <LogOut className="w-5 h-5" /> Sign Out
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full h-14 rounded-full bg-orange-gradient font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 text-white"
                      >
                        Sign Up / Login
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
};
