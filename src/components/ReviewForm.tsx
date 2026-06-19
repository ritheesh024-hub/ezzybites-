'use client';

import React, { useState } from 'react';
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
import { Star, Loader2, Send, Camera } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    if (!db || !user || !order) return;
    
    setLoading(true);
    const items = order.items || [];
    
    // Process reviews for each item
    items.forEach((item: any) => {
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
        comment,
        isHidden: false,
        isFeatured: false,
        createdAt: serverTimestamp()
      };

      setDoc(reviewRef, reviewData)
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: reviewRef.path,
            operation: 'create',
            requestResourceData: reviewData
          } satisfies SecurityRuleContext));
        });

      const productRef = doc(db, 'products', item.id);
      updateDoc(productRef, {
        reviewCount: increment(1),
        ratingSum: increment(rating) 
      }).catch(async () => {
        setDoc(productRef, { ratingSum: rating, reviewCount: 1 }, { merge: true })
          .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: productRef.path,
              operation: 'update'
            } satisfies SecurityRuleContext));
          });
      });
    });

    const orderRef = doc(db, 'orders', order.orderId);
    updateDoc(orderRef, { isReviewed: true })
      .then(() => {
        toast({ title: "Review Published!", description: "Thank you for supporting Ezzy Bites." });
        onSuccess();
        onClose();
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { isReviewed: true }
        } satisfies SecurityRuleContext));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
        <div className="p-8 bg-primary text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter italic relative z-10">
              Rate your <span className="opacity-80">Meal</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-widest relative z-10 mt-1">
              Order #{order?.orderId}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Your Satisfaction Score</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-all transform active:scale-90"
                >
                  <Star 
                    className={cn(
                      "w-10 h-10 transition-colors",
                      (hoveredRating || rating) >= star 
                        ? "fill-primary text-primary" 
                        : "text-muted dark:text-zinc-800"
                    )} 
                  />
                </button>
              ))}
            </div>
            <p className="font-black text-xl text-primary italic uppercase">
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Awful'}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Write a short review</Label>
            <Textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the taste, packaging, and delivery?" 
              className="min-h-[120px] rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-medium px-6 py-4"
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
             <Camera className="w-5 h-5 text-primary shrink-0" />
             <p className="text-[9px] font-bold leading-relaxed opacity-60 uppercase">
               Photo uploads coming soon. Your text review helps our chefs improve daily.
             </p>
          </div>
        </div>

        <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border-t">
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-16 rounded-[1.5rem] font-black text-lg bg-primary text-white shadow-2xl shadow-primary/20 gap-3 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Publish Review</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
