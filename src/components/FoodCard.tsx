
"use client"
import React from 'react';
import Image from 'next/image';
import { Star, Heart, Plus, Clock } from 'lucide-react';
import { FoodItem, useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import placeholderData from '@/app/lib/placeholder-images.json';

export const FoodCard = ({ item }: { item: FoodItem }) => {
  const addToCart = useStore((state) => state.addToCart);
  
  // Find the specific placeholder hint for this item's image
  const imgData = placeholderData.placeholderImages.find(img => img.imageUrl === item.image);
  const aiHint = imgData?.imageHint || item.category.toLowerCase();

  const handleAdd = () => {
    addToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} is ready for checkout.`,
    });
  };

  return (
    <div className="group bg-card rounded-2xl border overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image 
          src={item.image} 
          alt={item.name} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          data-ai-hint={aiHint}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isVeg ? (
            <div className="bg-white/90 backdrop-blur px-1.5 py-1.5 rounded-md border border-green-500 shadow-sm">
               <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-700" />
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur px-1.5 py-1.5 rounded-md border border-red-500 shadow-sm">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700" />
            </div>
          )}
        </div>
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-white/90 backdrop-blur text-foreground border shadow-sm font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {item.rating}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem] leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> 20-30 MINS
          </span>
          <span className="flex items-center gap-1">
             OFFER 10% OFF
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-headline font-bold text-primary">₹{item.price}</span>
            <span className="text-[10px] text-muted-foreground line-through">₹{Math.round(item.price * 1.1)}</span>
          </div>
          <Button 
            onClick={handleAdd}
            size="sm"
            className="rounded-xl px-5 h-9 font-bold hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-primary/20"
          >
            Add
            <Plus className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
