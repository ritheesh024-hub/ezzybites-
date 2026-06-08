
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
  Sun,
  MapPin,
  TicketPercent,
  Wallet,
  Info,
  Settings,
  Gift,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { useStore } from '@/app/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Logo } from './Logo';
import { EditProfileModal } from './EditProfileModal';
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
import { Badge } from '@/components/ui/badge';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
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
    return () => handleScroll();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/');
    }
  };

  const updateFoodPreference = async (pref: string) => {
    if (!user || !db) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { foodPreference: pref });
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu', href: '/menu', icon: Utensils },
    { label: 'My Orders', href: '/orders', icon: History },
    { label: 'Favorites', href: '#', icon: Heart },
    { label: 'Saved Addresses', href: '#', icon: MapPin },
    { label: 'Coupons & Offers', href: '#', icon: TicketPercent },
    { label: 'Reward Points', href: '#', icon: Wallet, badge: customerProfile?.rewardCoins || 0 },
    { label: 'Contact Us', href: 'https://wa.me/918639366800', icon: Phone, isExternal: true },
    { label: 'About EzzyBites', href: '#', icon: Info },
    { label: 'Settings', href: '#', icon: Settings },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
      scrolled 
        ? "bg-white/90 dark:bg-black/90 backdrop-blur-3xl border-b py-2 shadow-xl" 
        : "bg-white/5 dark:bg-black/5 backdrop-blur-sm py-3"
    )}>
      <div className="container mx-auto px-4">
        <div className="h-10 md:h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <Logo variant={scrolled ? 'dark' : 'light'} size="sm" className="shrink-0 scale-90 md:scale-100 origin-left" />
          </Link>

          {/* Search Bar - Tablet & Desktop Only */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <form onSubmit={(e) => { e.preventDefault(); router.push(`/menu?q=${navSearch}`); }} className="relative group">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10",
                scrolled ? "text-muted-foreground" : "text-white/40"
              )} />
              <Input 
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search premium bites..." 
                className={cn(
                  "w-full h-10 pl-11 pr-4 rounded-full border-none transition-all font-medium text-xs focus:ring-2 focus:ring-primary/20",
                  scrolled 
                    ? "bg-secondary/50 focus:bg-white dark:bg-zinc-900 !text-foreground" 
                    : "bg-white/10 !text-white placeholder:text-white/40 focus:bg-white/20 backdrop-blur-xl"
                )}
              />
            </form>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <ThemeToggle className="hidden md:flex" />
            
            {/* Desktop Only Actions */}
            <div className="hidden md:flex items-center gap-3">
              {!userLoading && (
                user ? (
                  isStaff && !customerProfile ? (
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
                            <AvatarImage src={customerProfile?.photoUrl || user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback className="bg-orange-gradient text-white font-black text-[10px]">
                              {(customerProfile?.name || user.displayName || 'EB').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 border-none shadow-3xl bg-white dark:bg-zinc-900 mt-2">
                        <DropdownMenuLabel className="px-4 py-4">
                          <p className="text-sm font-black uppercase tracking-tight truncate">{customerProfile?.name || user.displayName || user.email?.split('@')[0]}</p>
                          <p className="text-[10px] font-medium opacity-50 truncate">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-primary/5">
                          <Link href="/orders" className="flex items-center gap-3">
                            <History className="w-5 h-5 text-primary" /> My History
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)} className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-primary/5 gap-3">
                          <User className="w-5 h-5 text-blue-500" /> Edit Profile
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
                <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 border-none bg-background flex flex-col z-[60]">
                  <SheetHeader className="p-4 sm:p-6 text-left border-b bg-secondary/10">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                    {user ? (
                      <div 
                        onClick={() => { setIsMenuOpen(false); setIsEditProfileOpen(true); }}
                        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all"
                      >
                        <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
                          <AvatarImage src={customerProfile?.photoUrl || user.photoURL || ''} />
                          <AvatarFallback className="bg-orange-gradient text-white font-black">
                            {(customerProfile?.name || user.displayName || 'EB').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-base uppercase tracking-tight truncate">
                            {customerProfile?.name?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Member'}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground truncate opacity-70">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-primary">
                            <span className="text-[8px] font-black uppercase tracking-widest">View Profile</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Logo variant="color" size="sm" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Join the Ezzy Ritual</p>
                      </div>
                    )}
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-hide">
                    {/* Reward Card */}
                    {user && (
                      <div className="px-4 mb-6">
                        <div className="bg-orange-gradient p-4 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                           <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                           <div className="relative z-10 flex justify-between items-center">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-1">Your Wallet</p>
                                <h4 className="text-xl font-black italic">{customerProfile?.rewardCoins || 0} Coins</h4>
                              </div>
                              <Link href="#" className="h-10 px-4 bg-white/20 backdrop-blur-md rounded-xl flex items-center gap-2 border border-white/20 hover:bg-white/30 transition-all">
                                <Gift className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase">Redeem</span>
                              </Link>
                           </div>
                           <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                              <p className="text-[8px] font-medium opacity-70 italic">10 Coins = ₹1.00</p>
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                                <span className="text-orange-200">Refer & Earn 50</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Items */}
                    {menuItems.map((item) => (
                      <Link 
                        key={item.label} 
                        href={item.href}
                        target={item.isExternal ? '_blank' : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <item.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-widest text-foreground/80 group-hover:text-primary">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           {item.badge !== undefined && (
                             <Badge className="bg-primary/10 text-primary border-none text-[8px] h-5 px-2 font-black">{item.badge}</Badge>
                           )}
                           <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}

                    <div className="h-px bg-border my-4 mx-4" />

                    {/* Food Preferences */}
                    {user && (
                      <div className="px-4 py-2 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Food Preferences</p>
                        <div className="flex gap-2">
                          {[
                            { id: 'Veg', color: 'bg-green-500' },
                            { id: 'Non Veg', color: 'bg-red-500' },
                            { id: 'Egg', color: 'bg-yellow-500' }
                          ].map((pref) => (
                            <button
                              key={pref.id}
                              onClick={() => updateFoodPreference(pref.id)}
                              className={cn(
                                "flex-1 h-10 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                                customerProfile?.foodPreference === pref.id 
                                  ? "border-primary bg-primary/5" 
                                  : "border-muted opacity-60"
                              )}
                            >
                              <div className={cn("w-2 h-2 rounded-full", pref.color)} />
                              <span className="text-[9px] font-black uppercase">{pref.id}</span>
                              {customerProfile?.foodPreference === pref.id && <CheckCircle2 className="w-3 h-3 text-primary" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="px-4 pt-6 pb-2">
                       <button 
                        onClick={toggleDarkMode}
                        className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all group"
                       >
                         <div className="flex items-center gap-4">
                           <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center border shadow-sm">
                             {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                           </div>
                           <span className="font-black text-[10px] uppercase tracking-widest">
                             {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                           </span>
                         </div>
                         <div className={cn(
                           "w-8 h-4 rounded-full relative transition-colors duration-300",
                           isDarkMode ? "bg-primary" : "bg-zinc-300"
                         )}>
                           <div className={cn(
                             "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                             isDarkMode ? "left-4.5" : "left-0.5"
                           )} />
                         </div>
                       </button>
                    </div>
                  </div>

                  <div className="p-6 border-t shrink-0">
                    {user ? (
                      <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/5 gap-3"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full h-14 rounded-full bg-orange-gradient font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 text-white"
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

      <EditProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </nav>
  );
};
