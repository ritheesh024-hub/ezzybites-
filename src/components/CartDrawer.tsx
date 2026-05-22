
"use client"
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useStore } from '@/app/lib/store';
import { ShoppingBag, Minus, Plus, X, ChevronRight, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from './ui/separator';

export const CartDrawer = ({ children }: { children: React.ReactNode }) => {
  const { cart, updateQuantity, removeFromCart, getTotal } = useStore();
  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal + deliveryFee;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 rounded-l-[3rem] border-none shadow-3xl bg-background">
        <SheetHeader className="p-8 border-b bg-card">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black font-headline tracking-tight">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <ShoppingBag className="w-5 h-5" />
              </div>
              Your Tray
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-32 h-32 bg-secondary rounded-[3rem] flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2">Empty Tray?</h3>
                <p className="text-sm text-muted-foreground font-medium">Add some premium bites or a refreshing tea to get started.</p>
              </div>
              <SheetTrigger asChild>
                <Button className="rounded-full px-10 h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary">Explore Menu</Button>
              </SheetTrigger>
            </div>
          ) : (
            <div className="space-y-8">
              {cart.map((item) => (
                <div key={item.cartId} className="flex gap-6 group">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-secondary shadow-lg">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                      unoptimized={item.imageUrl.startsWith('http')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-lg truncate pr-2 tracking-tight">{item.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {item.customization && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary px-2 py-0.5 rounded-full">{item.customization.temp}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{item.customization.size}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Sugar: {item.customization.sugar}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xl font-black text-primary italic">₹{item.price}</p>
                      <div className="flex items-center bg-secondary/80 rounded-xl px-2 h-10 gap-1">
                        <button 
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-8 space-y-6 bg-card/80 backdrop-blur-xl">
            {subtotal < 149 && (
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Add <span className="text-primary italic">₹{149 - subtotal}</span> more for <span className="text-primary italic">FREE</span> delivery!
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                <span>Delivery Charge</span>
                <span className={deliveryFee === 0 ? "text-green-600 italic" : "text-foreground"}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              <Separator className="my-4 opacity-50" />
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Amount</span>
                <span className="text-4xl font-black font-headline text-primary italic">₹{total}</span>
              </div>
            </div>

            <Link href="/checkout" passHref>
              <Button className="w-full h-18 rounded-[1.5rem] text-lg font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30 group">
                Place Order
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
