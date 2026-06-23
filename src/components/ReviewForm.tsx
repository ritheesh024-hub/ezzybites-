'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2, Send, ChevronRight } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewForm = ({ order, isOpen, onClose, onSuccess }: ReviewFormProps) => {
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (order?.items && isOpen) {
      const initial: Record<string, number> = {};
      order.items.forEach((item: any) => {
        initial[item.id] = 5; // Default to 5 stars
      });
      setItemRatings(initial);
    }
  }, [order, isOpen]);

  const handleSetRating = (productId: string, rating: number) => {
    setItemRatings(prev => ({ ...prev, [productId]: rating }));
  };

  const handleSubmit = async () => {
    if (!db || !user || !order) return;
    
    setLoading(true);
    try {
      const items = order.items || [];
      const promises = items.map(async (item: any) => {
        const rating = itemRatings[item.id] || 5;
        const reviewId = `${order.orderId}_${item.id}`;
        const reviewRef = doc(db, 'reviews', reviewId);
        
        const reviewData = {
          orderId: order.orderId,
          productId: item.id,
          productName: item.name,
          userId: user.uid,
          userName: user.displayName || 'Guest',
          userPhoto: user.photoURL || '',
          rating,
          comment, // Global comment shared across items in this order
          isHidden: false,
          isFeatured: false,
          createdAt: serverTimestamp()
        };

        // Write review
        await setDoc(reviewRef, reviewData);

        // Update product stats
        const productRef = doc(db, 'products', item.id);
        return updateDoc(productRef, {
          reviewCount: increment(1),
          ratingSum: increment(rating) 
        }).catch(() => {
          // Fallback if product doc doesn't have metrics yet
          return setDoc(productRef, { ratingSum: rating, reviewCount: 1 }, { merge: true });
        });
      });

      await Promise.all(promises);

      // Mark order as reviewed
      await updateDoc(doc(db, 'orders', order.orderId), { isReviewed: true });

      toast({ title: "Review Published!", description: "Thank you for the premium feedback." });
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Connection interrupted." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 bg-primary text-white relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter italic relative z-10">
              Rate Your <span className="opacity-80">Bites</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-widest relative z-10 mt-1">
              Ticket #{order?.orderId}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
              <Star className="w-3 h-3 fill-primary text-primary" /> Item Metrics
            </h4>
            
            <div className="space-y-5">
              {order?.items?.map((item: any) => (
                <div key={item.id} className="bg-secondary/20 dark:bg-zinc-900/50 p-4 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-xs uppercase tracking-tight truncate max-w-[180px]">{item.name}</span>
                    <span className="text-[9px] font-black opacity-30">x{item.quantity}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleSetRating(item.id, star)}
                        className="transition-transform active:scale-75"
                      >
                        <Star 
                          className={cn(
                            "w-7 h-7 transition-colors",
                            (itemRatings[item.id] || 0) >= star 
                              ? "fill-primary text-primary" 
                              : "text-muted dark:text-zinc-800"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Overall Experience</Label>
            <Textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the flavor, speed and service..." 
              className="min-h-[100px] rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-medium px-6 py-4 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border-t shrink-0">
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 md:h-16 rounded-[1.5rem] font-black text-base bg-primary text-white shadow-2xl shadow-primary/20 gap-3 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Ratings</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};