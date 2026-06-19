'use client';

import React, { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Clock, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp,
  Filter,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { FoodItem, useStore } from '@/app/lib/store';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface ProductDetailsProps {
  item: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
}

export const ProductDetails = ({ item, isOpen, onClose, onAddToCart }: ProductDetailsProps) => {
  const db = useFirestore();
  const [filter, setFilter] = useState<'latest' | 'top'>('latest');

  const reviewsQuery = useMemo(() => {
    if (!db || !item.id) return null;
    return query(
      collection(db, 'reviews'),
      where('productId', '==', item.id),
      where('isHidden', '==', false),
      orderBy(filter === 'latest' ? 'createdAt' : 'rating', 'desc'),
      limit(20)
    );
  }, [db, item.id, filter]);

  const { data: reviews, loading } = useCollection<any>(reviewsQuery);

  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return null;

    const counts = [0, 0, 0, 0, 0, 0]; // index 1-5
    reviews.forEach(r => counts[r.rating]++);
    
    return {
      total,
      breakdown: counts.map(c => Math.round((c / total) * 100)).slice(1).reverse() // 5 to 1
    };
  }, [reviews]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 flex flex-col md:flex-row">
        {/* LEFT: IMAGE & PRIMARY INFO */}
        <div className="w-full md:w-[40%] bg-zinc-900 relative flex flex-col h-[300px] md:h-auto">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover opacity-70"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
          
          <div className="relative z-10 mt-auto p-8 space-y-4">
             <div className="flex items-center gap-2">
               <Badge className={cn("border-none px-2 py-0.5 rounded font-black text-[7px] uppercase tracking-widest", item.isVeg ? "bg-green-500" : "bg-red-500")}>
                 {item.isVeg ? 'VEG' : 'NON-VEG'}
               </Badge>
               {item.isFeatured && <Badge className="bg-primary border-none font-black text-[7px] uppercase tracking-widest">Bestseller</Badge>}
             </div>
             <h2 className="text-3xl md:text-5xl font-black font-headline text-white uppercase tracking-tighter leading-none italic">{item.name}</h2>
             <p className="text-white/60 text-sm font-medium line-clamp-3 leading-relaxed">
               {item.description}
             </p>
             <div className="pt-4 flex items-center justify-between">
                <span className="text-4xl font-black text-primary italic leading-none">₹{item.price}</span>
                <Button 
                  onClick={onAddToCart}
                  className="rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest bg-white text-black hover:bg-primary hover:text-white transition-all gap-2"
                >
                  <Plus className="w-4 h-4" /> Add to Tray
                </Button>
             </div>
          </div>
        </div>

        {/* RIGHT: REVIEWS & ANALYSIS */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
          <div className="p-8 border-b dark:border-zinc-800 shrink-0">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Star className="w-5 h-5 fill-current" /></div>
                   <h3 className="text-xl font-black font-headline uppercase tracking-tight italic">Pulse & Reviews</h3>
                </div>
                <div className="flex gap-1">
                   {['latest', 'top'].map((f) => (
                     <Button 
                        key={f} 
                        onClick={() => setFilter(f as any)}
                        variant={filter === f ? 'default' : 'ghost'}
                        className={cn("h-8 rounded-full font-black uppercase text-[8px] tracking-widest", filter === f ? "bg-primary" : "text-muted-foreground")}
                     >
                       {f}
                     </Button>
                   ))}
                </div>
             </div>

             {/* RATING BREAKDOWN */}
             {stats && (
               <div className="grid grid-cols-2 gap-10 items-center">
                  <div className="text-center md:text-left space-y-1">
                     <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-6xl font-black font-headline text-primary italic leading-none">{item.rating || '4.5'}</span>
                        <div className="flex flex-col items-start">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-3 h-3", s <= Math.round(item.rating || 4) ? "fill-primary text-primary" : "text-muted")} />)}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{stats.total} Ratings</span>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     {stats.breakdown.map((percent, idx) => (
                       <div key={idx} className="flex items-center gap-3">
                          <span className="text-[8px] font-black w-3">{5 - idx}</span>
                          <div className="h-1.5 flex-1 bg-secondary dark:bg-zinc-800 rounded-full overflow-hidden">
                             <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[8px] font-bold opacity-30 w-6">{percent}%</span>
                       </div>
                     ))}
                  </div>
               </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                 <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Syncing Feed...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-20">
                 <MessageSquare className="w-12 h-12 mx-auto" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No reviews yet for this dish</p>
              </div>
            ) : (
              reviews.map((rev: any, i: number) => (
                <div key={i} className="space-y-4 pb-6 border-b border-dashed dark:border-zinc-800 last:border-0 group">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10 rounded-xl border-2 border-primary/10">
                            <AvatarImage src={rev.userPhoto} />
                            <AvatarFallback className="bg-secondary text-[10px] font-black">{(rev.userName || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="text-xs font-black uppercase tracking-tight">{rev.userName}</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">{rev.createdAt?.toDate ? format(rev.createdAt.toDate(), 'MMM dd, yyyy') : 'Recent'}</p>
                         </div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 rounded-lg flex items-center gap-1 font-black text-[9px]">
                         {rev.rating} <Star className="w-2 h-2 fill-current" />
                      </Badge>
                   </div>
                   <p className="text-sm font-medium leading-relaxed italic text-muted-foreground group-hover:text-foreground transition-colors">
                     "{rev.comment}"
                   </p>
                   {rev.isFeatured && (
                     <div className="inline-flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase">Featured Review</span>
                     </div>
                   )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
