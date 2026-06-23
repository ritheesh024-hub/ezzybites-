'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MessageSquare, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  ShoppingBag,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export const ReviewManager = () => {
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const reviewsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'), limit(200));
  }, [db]);

  const { data: rawReviews, loading, error: reviewsError } = useCollection<any>(reviewsQuery);

  // GROUP BY ORDER ID
  const groupedReviews = useMemo(() => {
    if (!rawReviews) return [];
    
    const groups: Record<string, any> = {};
    
    rawReviews.forEach(rev => {
      if (!groups[rev.orderId]) {
        groups[rev.orderId] = {
          orderId: rev.orderId,
          userName: rev.userName,
          userPhoto: rev.userPhoto,
          createdAt: rev.createdAt,
          comment: rev.comment,
          items: [],
          avgRating: 0,
          isHidden: rev.isHidden
        };
      }
      groups[rev.orderId].items.push({
        id: rev.id,
        productId: rev.productId,
        productName: rev.productName,
        rating: rev.rating,
        isFeatured: rev.isFeatured
      });
    });

    return Object.values(groups)
      .filter((g: any) => 
        g.userName?.toLowerCase().includes(search.toLowerCase()) || 
        g.orderId?.toLowerCase().includes(search.toLowerCase()) ||
        g.items.some((i: any) => i.productName?.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      })
      .map((g: any) => {
        const sum = g.items.reduce((acc: number, curr: any) => acc + curr.rating, 0);
        g.avgRating = (sum / g.items.length).toFixed(1);
        return g;
      });
  }, [rawReviews, search]);

  const toggleHideOrderReviews = async (orderId: string, reviews: any[], currentHidden: boolean) => {
    if (!db) return;
    try {
      const promises = reviews.map(r => updateDoc(doc(db, 'reviews', r.id), { isHidden: !currentHidden }));
      await Promise.all(promises);
      toast({ title: currentHidden ? "Order Visible" : "Order Hidden" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const deleteOrderReviews = async (reviews: any[]) => {
    if (!db || !window.confirm("Permanently purge this order's feedback node?")) return;
    try {
      const promises = reviews.map(r => deleteDoc(doc(db, 'reviews', r.id)));
      await Promise.all(promises);
      toast({ title: "Feedback Purged" });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Sentiment <span className="text-primary">Ledger</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Audit grouped order feedback and monitor flavor satisfaction.</p>
        </div>
      </div>

      <div className="flex bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border shadow-sm items-center gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
            <Input 
               placeholder="Search by customer, ticket ID or item..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="h-12 pl-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-sm"
            />
         </div>
         <Badge variant="outline" className="hidden md:flex h-12 px-6 rounded-xl bg-secondary/50 border-none font-black uppercase text-[10px] tracking-widest gap-3">
            <ShoppingBag className="w-4 h-4 text-primary" /> {groupedReviews.length} Groups
         </Badge>
      </div>

      {loading ? (
        <div className="py-40 text-center space-y-4">
           <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20 mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Syncing Feedback Hub...</p>
        </div>
      ) : (reviewsError || groupedReviews.length === 0) ? (
        <div className="py-32 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 opacity-30">
           <MessageSquare className="w-16 h-16" />
           <h3 className="text-xl font-black uppercase tracking-widest">No Feedback Recorded</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupedReviews.map((group: any) => (
            <Card key={group.orderId} className={cn(
              "rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden transition-all group relative border",
              group.isHidden && "opacity-50 grayscale"
            )}>
              <div className="p-6 border-b border-dashed flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
                 <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-xl shadow-md border-2 border-white dark:border-zinc-700">
                       <AvatarImage src={group.userPhoto} />
                       <AvatarFallback className="bg-primary text-white font-black text-[10px] uppercase">{group.userName?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                       <h4 className="font-black text-[11px] uppercase tracking-tight truncate max-w-[120px]">{group.userName}</h4>
                       <p className="text-[7px] font-black uppercase text-primary italic">#{group.orderId}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-2 rounded-md gap-1">
                       <Star className="w-3 h-3 fill-current" /> {group.avgRating}
                    </Badge>
                 </div>
              </div>

              <CardContent className="p-6 space-y-6">
                 <div className="space-y-2.5">
                    {group.items.map((item: any, i: number) => (
                       <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-zinc-50 dark:border-zinc-800">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground truncate flex-1 pr-4">{item.productName}</span>
                          <div className="flex gap-0.5">
                             {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={cn("w-2.5 h-2.5", s <= item.rating ? "fill-primary text-primary" : "text-muted-foreground/20")} />
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>

                 {group.comment && (
                    <div className="p-4 bg-primary/[0.03] rounded-2xl border border-dashed border-primary/10">
                       <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground line-clamp-3">"{group.comment}"</p>
                    </div>
                 )}

                 <div className="flex justify-between items-center pt-2">
                    <span className="text-[7px] font-black uppercase opacity-30">{group.createdAt?.toDate ? format(group.createdAt.toDate(), 'MMM dd, p') : 'Live'}</span>
                    <div className="flex gap-2">
                       <button onClick={() => toggleHideOrderReviews(group.orderId, group.items, group.isHidden)} className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-zinc-950 hover:text-white transition-all">
                          {group.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                       </button>
                       <button onClick={() => deleteOrderReviews(group.items)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};