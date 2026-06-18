"use client"
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Menu, 
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
  MapPin,
  TicketPercent,
  Wallet,
  Settings,
  Gift,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { NotificationCenter } from './NotificationCenter';
import { useStore } from '@/app/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Logo } from './Logo';
import { EditProfileModal } from './EditProfileModal';
import { useNotifications } from '@/hooks/use-notifications';
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
import { toast } from '@/hooks/use-toast';

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
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemo(() => user && db ? doc(db, 'users', user.uid) : null, [user, db]);
  const adminDocRef = useMemo(() => user && db ? doc(db, 'admins', user.uid) : null, [user, db]);
  
  const { data: customerProfile } = useDoc(userDocRef);
  const { data: adminProfile } = useDoc(adminDocRef);

  const isStaff = !!adminProfile;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      toast({ title: "Logged Out", description: "Identity session terminated. Come back soon!" });
      router.push('/');
      setIsMenuOpen(false);
    }
  };

  const menuItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu Selection', href: '/menu', icon: Utensils },
    { label: 'Live History', href: '/orders', icon: History, authRequired: true },
    { label: 'Favorites', href: '/favorites', icon: Heart, authRequired: true },
    { label: 'Saved Addresses', href: '/addresses', icon: MapPin, authRequired: true },
    { label: 'Coupons & Offers', href: '/coupons', icon: TicketPercent },
    { label: 'Reward Points', href: '/rewards', icon: Wallet, badge: customerProfile?.rewardCoins || 0, authRequired: true },
    { label: 'Contact Us', href: 'https://wa.me/918639366800', icon: Phone, isExternal: true },
    { label: 'Operational Control', href: '/admin/dashboard', icon: LayoutDashboard, authRequired: true, staffOnly: true },
    { label: 'Settings', href: '/settings', icon: Settings, authRequired: true },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
      scrolled 
        ? "bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-b py-1 shadow-2xl" 
        : "bg-white/5 dark:bg-black/5 backdrop-blur-sm py-2"
    )}>
      <div className="container mx-auto px-4">
        <div className="h-10 md:h-12 flex items-center justify-between gap-4">
          <Link href="/" className="transition-transform active:scale-95">
            <Logo variant={scrolled ? 'dark' : (isDarkMode ? 'dark' : 'light')} size="sm" className="shrink-0 scale-90 md:scale-100 origin-left" />
          </Link>

          <div className="flex-1 max-w-md hidden md:block">
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
                  "w-full h-9 pl-10 pr-4 rounded-xl border-none transition-all font-black text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-primary/20",
                  scrolled 
                    ? "bg-secondary/60 focus:bg-white dark:bg-zinc-900 !text-foreground" 
                    : "bg-white/10 !text-white placeholder:text-white/40 focus:bg-white/20 backdrop-blur-xl"
                )}
              />
            </form>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user && (
              <NotificationCenter>
                <Button variant="ghost" size="icon" className={cn(
                  "rounded-full w-9 h-9 transition-all relative",
                  scrolled ? "hover:bg-primary/5 text-foreground" : "hover:bg-white/10 text-white"
                )}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary text-white text-[7px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-xl animate-in zoom-in">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </NotificationCenter>
            )}

            <ThemeToggle className="hidden md:flex h-8 w-8" />
            
            <div className="hidden md:flex items-center gap-4">
              {!userLoading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="outline-none rounded-xl ring-offset-background focus:ring-4 focus:ring-primary/20 transition-all active:scale-90 overflow-hidden shadow-lg">
                        <Avatar className="h-8 w-8 rounded-xl border-2 border-background">
                          <AvatarImage src={customerProfile?.photoUrl || user.photoURL || ''} alt={user.displayName || 'Member'} />
                          <AvatarFallback className="bg-orange-gradient text-white font-black text-[10px] rounded-xl">
                            {(customerProfile?.name || user.displayName || 'EB').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 rounded-[2.5rem] p-4 border-none shadow-3xl bg-white dark:bg-zinc-950 mt-4 animate-in slide-in-from-top-2">
                      <DropdownMenuLabel className="px-5 py-6">
                        <p className="text-sm font-black uppercase tracking-widest truncate mb-1">{customerProfile?.name || user.displayName || 'Member'}</p>
                        <p className="text-[10px] font-black uppercase opacity-40 truncate tracking-[0.1em]">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="opacity-10" />
                      <DropdownMenuItem asChild className="rounded-[1.5rem] py-4 px-5 font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-primary/5 transition-all">
                        <Link href="/orders" className="flex items-center gap-4">
                          <History className="w-5 h-5 text-primary" /> Tracking History
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)} className="rounded-[1.5rem] py-4 px-5 font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-primary/5 transition-all gap-4">
                        <User className="w-5 h-5 text-blue-500" /> Edit Profile
                      </DropdownMenuItem>
                      {isStaff && (
                        <DropdownMenuItem asChild className="rounded-[1.5rem] py-4 px-5 font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600 transition-all">
                          <Link href="/admin/dashboard" className="flex items-center gap-4">
                            <ShieldCheck className="w-5 h-5" /> Staff console
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="opacity-10" />
                      <DropdownMenuItem onClick={handleLogout} className="rounded-[1.5rem] py-4 px-5 font-black uppercase text-[10px] tracking-widest text-destructive cursor-pointer hover:bg-destructive/5 transition-all flex items-center gap-4">
                        <LogOut className="w-5 h-5" /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="rounded-full px-5 h-9 font-black uppercase text-[9px] tracking-widest bg-orange-gradient text-white shadow-xl shadow-primary/20 transform hover:scale-105 transition-all"
                  >
                    Login
                  </Button>
                )
              )}
            </div>

            <CartDrawer>
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full w-9 h-9 transition-all relative",
                scrolled ? "hover:bg-primary/5 text-foreground" : "hover:bg-white/10 text-white"
              )}>
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-xl animate-in zoom-in">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            </CartDrawer>

            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(
                    "rounded-full w-9 h-9 transition-transform active:scale-90",
                    scrolled ? "text-foreground" : (isDarkMode ? "text-foreground" : "text-white")
                  )}>
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] p-0 border-none bg-background flex flex-col z-[60] shadow-3xl">
                  <SheetHeader className="p-6 text-left border-b bg-secondary/20">
                    <SheetTitle className="sr-only">User Menu</SheetTitle>
                    {user ? (
                      <div 
                        onClick={() => { setIsMenuOpen(false); setIsEditProfileOpen(true); }}
                        className="flex items-center gap-5 cursor-pointer group"
                      >
                        <Avatar className="h-16 w-16 rounded-[1.5rem] border-4 border-primary/10 shadow-xl transition-transform group-hover:scale-105">
                          <AvatarImage src={customerProfile?.photoUrl || user.photoURL || ''} />
                          <AvatarFallback className="bg-orange-gradient text-white font-black text-lg uppercase">
                            {(customerProfile?.name || user.displayName || 'EB').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-xl uppercase tracking-tighter truncate group-hover:text-primary transition-colors">
                            {customerProfile?.name?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Member'}
                          </p>
                          <div className="flex items-center gap-1.5 text-primary/60">
                            <span className="text-[8px] font-black uppercase tracking-widest">Edit Profile</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Logo variant="color" size="sm" className="scale-110 origin-left" />
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Authorized Hub Only</p>
                      </div>
                    )}
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
                    {user && (
                      <div className="mb-8">
                        <div className="bg-orange-gradient p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-transform duration-1000 group-hover:scale-150" />
                           <div className="relative z-10 flex justify-between items-center">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-1">Coin Reserve</p>
                                <h4 className="text-3xl font-black italic">{customerProfile?.rewardCoins || 0} <span className="text-[10px] non-italic opacity-60 ml-1">Coins</span></h4>
                              </div>
                              <Link href="/rewards" onClick={() => setIsMenuOpen(false)} className="h-12 px-5 bg-white/20 backdrop-blur-md rounded-2xl flex items-center gap-2 border border-white/20 active:scale-95 transition-all">
                                <Gift className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase">Redeem</span>
                              </Link>
                           </div>
                        </div>
                      </div>
                    )}

                    {menuItems.map((item) => {
                      if (item.authRequired && !user) return null;
                      if (item.staffOnly && !isStaff) return null;
                      
                      return (
                        <Link 
                          key={item.label} 
                          href={item.href}
                          target={item.isExternal ? '_blank' : undefined}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all active:bg-primary/10 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="font-black text-[10px] uppercase tracking-widest text-foreground/80 group-hover:text-primary">
                              {item.label}
                            </span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge className="bg-primary/10 text-primary border-none text-[8px] h-6 px-3 font-black rounded-full">{item.badge}</Badge>
                          )}
                        </Link>
                      );
                    })}

                    <div className="h-px bg-border my-6 mx-4 opacity-50" />

                    <div className="px-2">
                       <button 
                        onClick={toggleDarkMode}
                        className="flex items-center justify-between w-full p-5 rounded-[1.5rem] bg-secondary/40 hover:bg-secondary/60 transition-all group outline-none border border-border/20"
                       >
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border shadow-sm group-active:scale-90 transition-all">
                             {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                           </div>
                           <span className="font-black text-[10px] uppercase tracking-widest">
                             Appearance: {isDarkMode ? 'Light' : 'Dark'}
                           </span>
                         </div>
                         <div className={cn(
                           "w-12 h-6 rounded-full relative transition-colors duration-500",
                           isDarkMode ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                         )}>
                           <div className={cn(
                             "absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-500",
                             isDarkMode ? "translate-x-7" : "translate-x-1"
                           )} />
                         </div>
                       </button>
                    </div>
                  </div>

                  <div className="p-8 border-t shrink-0">
                    {user ? (
                      <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="w-full h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/5 gap-4 border-2 border-destructive/10"
                      >
                        <LogOut className="w-5 h-5" /> Log out
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full h-16 rounded-2xl bg-orange-gradient font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 text-white"
                      >
                        Login
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </nav>
  );
};
