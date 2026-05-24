'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Timer,
  Package,
  Utensils,
  BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitchenSystemProps {
  orders: any[];
  onUpdateStatus: (id: string, status: string) => void;
}

export const KitchenSystem = ({ orders, onUpdateStatus }: KitchenSystemProps) => {
  // Filter for orders that need kitchen attention
  const kitchenOrders = orders.filter(o => 
    o.status === 'Pending' || o.status === 'Preparing'
  ).sort((a, b) => {
    // Show Pending orders first, then by time
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-none shadow-xl bg-orange-500 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Cooking</p>
              <h3 className="text-4xl font-black font-headline">{kitchenOrders.filter(o => o.status === 'Preparing').length}</h3>
            </div>
            <ChefHat className="w-8 h-8 opacity-20" />
          </div>
        </Card>
        <Card className="rounded-3xl border-none shadow-xl bg-primary text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">New Tickets</p>
              <h3 className="text-4xl font-black font-headline">{kitchenOrders.filter(o => o.status === 'Pending').length}</h3>
            </div>
            <BellRing className="w-8 h-8 opacity-20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {kitchenOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-30">
            <ChefHat className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-widest">Kitchen Queue is Clear</p>
          </div>
        ) : (
          kitchenOrders.map((order) => (
            <Card 
              key={order.id} 
              className={cn(
                "rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-zinc-900",
                order.status === 'Pending' ? "ring-4 ring-primary ring-inset" : ""
              )}
            >
              <div className={cn(
                "p-4 flex justify-between items-center",
                order.status === 'Pending' ? "bg-primary text-white" : "bg-orange-500 text-white"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {order.orderType === 'Dine-In' ? <Utensils className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  </div>
                  <h4 className="font-black text-sm">#{order.orderId}</h4>
                </div>
                <Badge className="bg-white/20 border-none font-black text-[9px] uppercase px-3">
                  {order.orderType || 'Online'}
                </Badge>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-secondary/30 dark:bg-zinc-800 p-3 rounded-xl">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{item.name}</span>
                        {item.customization && (
                          <span className="text-[9px] font-black uppercase text-primary">
                            {item.customization.size} • {item.customization.temp}
                          </span>
                        )}
                      </div>
                      <span className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center font-black text-sm">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {order.instructions && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Chef Instructions</p>
                    <p className="text-xs font-medium italic">"{order.instructions}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-dashed">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">
                    <Timer className="w-3.5 h-3.5" />
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </div>
                  
                  {order.status === 'Pending' ? (
                    <Button 
                      onClick={() => onUpdateStatus(order.id, 'Preparing')}
                      className="rounded-xl h-12 bg-primary font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <ChefHat className="w-4 h-4" /> Start Cooking
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => onUpdateStatus(order.id, 'Delivered')}
                      className="rounded-xl h-12 bg-green-500 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Ready for Pickup
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
