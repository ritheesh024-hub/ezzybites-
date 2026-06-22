'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp,
  Loader2,
  Plus,
  Minus,
  X,
  Sparkles,
  Bot
} from 'lucide-react';
import { FoodItem, useStore } from '@/app/lib/store';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { reviewSummaryGenerator } from '@/ai/flows/review-summary-generator';

interface ProductDetailsProps {
  item: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
}

export const ProductDetails = ({ item, isOpen, onClose, onAddToCart }: ProductDetailsProps) => {
  const db = useFirestore();
  const { cart, addToCart, updateQuantity } = useStore();
  const [localQty, setLocalQty] = useState(1);
  const [filter, setFilter] = useState<'latest' | 'top'>('latest');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Sync local qty if item is already in cart
  const cartItem = useMemo(() => cart.find(i => i.id === item.id), [cart, item.id]);
  
  useEffect(() => {
    if (isOpen) {
      setLocalQty(cartItem?.quantity || 1);
      setAiSummary(null); // Reset summary on open
    }
  }, [isOpen, cartItem]);

  const reviewsQuery = useMemo(() => {
    if (!db || !item.id) return null;
    return query(
      collection(db, 'reviews'),
      where('productId', '==', item.id),
      where('isHidden', '==', false),
      orderBy(filter === 'latest' ? 'createdAt' : 'rating', 'desc'),
      limit(10)
    );
  }, [db, item.id, filter]);

  const { data: reviews, loading } = useCollection<any>(reviewsQuery);

  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return null;
    const counts = [0, 0, 0, 0, 0, 0];
    reviews.forEach(r => counts[r.rating]++);
    return {
      total,
      breakdown: counts.map(c => Math.round((c / total) * 100)).slice(1).reverse()
    };
  }, [reviews]);

  const handleGenerateAISummary = async () => {
    if (reviews.length < 2) return;
    setSummarizing(true);
    try {
      const reviewTexts = reviews.map((r: any) => r.comment).filter(Boolean);
      const result = await reviewSummaryGenerator({ reviews: reviewTexts });
      setAiSummary(result.summary);
    } catch (e) {
      console.error("AI Summary Error:", e);
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => {
    if (reviews.length >= 2 && !aiSummary && !summarizing) {
       handleGenerateAISummary();
    }
  }, [reviews, aiSummary]);

  const handleAddToCartFinal = () => {
    if (cartItem) {
      onClose();
    } else {
      for(let i = 0; i < localQty; i++) {
        addToCart(item);
      }
      toast({ title: "Added to Tray", description: `${localQty} x ${item.name}` });
      onClose();
    }
  };

  const adjustQty = (delta: number) => {
    if (cartItem) {
      updateQuantity(cartItem.cartId, delta);
    } else {
      setLocalQty(prev => Math.max(1, prev + delta));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] w-[95vw] md:w-full rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 flex flex-col animate-in zoom-in-95 duration-300">
        <DialogHeader className="sr-only">
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        
        <div className="relative aspect-video w-full overflow-hidden bg-secondary/30 shrink-0">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all z-20 shadow-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <Badge className={cn("border-none px-2 py-0.5 rounded font-black text-[7px] uppercase tracking-widest", item.isVeg ? "bg-green-500" : "bg-red-500")}>
                     {item.isVeg ? 'VEG' : 'NON-VEG'}
                   </Badge>
                   {item.isFeatured && <Badge className="bg-primary text-white border-none font-black text-[7px] uppercase px-2 py-0.5 rounded-md">Bestseller</Badge>}
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight">{item.name}</h2>
              </div>
              <p className="text-2xl md:text-3xl font-black text-primary italic shrink-0">₹{item.price}</p>
            </div>

            <p className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed">
              {item.description}
            </p>

            {(summarizing || aiSummary) && (
              <div className="p-5 bg-primary/5 rounded-[1.5rem] border border-dashed border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[8px] tracking-widest">
                       <Bot className="w-4 h-4" /> Ezzy AI Insight
                    </div>
                    {summarizing && <Loader2 className="w-3 h-3 animate-spin text-primary opacity-40" />}
                 </div>
                 {aiSummary ? (
                   <p className="text-[11px] font-medium italic text-muted-foreground leading-relaxed">
                     "{aiSummary}"
                   </p>
                 ) : (
                   <div className="space-y-2">
                      <div className="h-2 bg-primary/10 rounded-full w-full animate-pulse" />
                      <div className="h-2 bg-primary/10 rounded-full w-3/4 animate-pulse" />
                   </div>
                 )}
              </div>
            )}

            <div className="pt-6 border-t border-dashed space-y-6">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 fill-primary" /> Customer Pulse
                  </h4>
                  {stats && <span className="text-[9px] font-bold opacity-40 uppercase">{stats.total} Verified Ratings</span>}
               </div>

               {loading ? (
                 <div className="py-10 text-center opacity-20"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
               ) : reviews.length === 0 ? (
                 <p className="text-[10px] font-black uppercase opacity-20 text-center py-4">No reviews yet for this node</p>
               ) : (
                 <div className="space-y-4">
                    {reviews.slice(0, 3).map((rev: any, i: number) => (
                      <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-transparent hover:border-primary/5 transition-all">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 rounded-lg">
                                 <AvatarImage src={rev.userPhoto} />
                                 <AvatarFallback className="text-[8px] font-black">{(rev.userName || 'EB').slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] font-black uppercase">{rev.userName}</span>
                           </div>
                           <Badge variant="outline" className="border-none bg-emerald-50 text-emerald-600 text-[8px] font-black px-1.5 h-4">{rev.rating} ★</Badge>
                        </div>
                        <p className="text-[11px] font-medium italic text-muted-foreground line-clamp-2">"{rev.comment}"</p>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900/80 border-t flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-xl p-1.5 shadow-sm border border-border/40">
            <button 
              onClick={() => adjustQty(-1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-black text-sm">{cartItem?.quantity || localQty}</span>
            <button 
              onClick={() => adjustQty(1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button 
            onClick={handleAddToCartFinal}
            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-3"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItem ? 'Sync Selection' : `Add to Tray • ₹${item.price * (cartItem?.quantity || localQty)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
