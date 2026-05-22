
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  X, 
  CheckCircle2, 
  Ban, 
  ExternalLink, 
  Clock, 
  MapPin, 
  IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

interface NewOrderPopupsProps {
  pendingOrders: any[];
  onViewDetails: (order: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const NewOrderPopups = ({ pendingOrders, onViewDetails, onUpdateStatus }: NewOrderPopupsProps) => {
  const { playSound } = useSound();
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const shownOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  // Monitor pending orders for new arrivals
  useEffect(() => {
    if (!pendingOrders) return;

    // On initial load, mark existing pending orders as "shown" so we don't spam the UI
    if (isInitialLoad.current) {
      pendingOrders.forEach(order => shownOrderIds.current.add(order.id));
      isInitialLoad.current = false;
      return;
    }

    const newOrders = pendingOrders.filter(order => !shownOrderIds.current.has(order.id));

    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        shownOrderIds.current.add(order.id);
        setActiveNotifications(prev => [order, ...prev]);
        playSound('ping');
      });
    }
  }, [pendingOrders, playSound]);

  const removeNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] w-full max-w-[360px] space-y-4 pointer-events-none">
      {activeNotifications.map((order, index) => (
        <Card 
          key={order.id} 
          className={cn(
            "pointer-events-auto rounded-[1.8rem] border-none shadow-3xl bg-white overflow-hidden animate-in slide-in-from-right duration-500",
            index > 2 && "hidden"
          )}
        >
          <div className="bg-primary p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">New Live Order</p>
                <h4 className="font-black text-sm">#{order.orderId}</h4>
              </div>
            </div>
            <button 
              onClick={() => removeNotification(order.id)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-foreground line-clamp-2">
                {order.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-[8px] font-black uppercase bg-secondary px-2">
                  <IndianRupee className="w-3 h-3 mr-1" /> ₹{order.total}
                </Badge>
                <Badge variant="outline" className="text-[8px] font-black uppercase px-2">
                  <Clock className="w-3 h-3 mr-1" /> Just Now
                </Badge>
              </div>
            </div>

            {order.address && (
              <div className="flex items-start gap-2 p-2.5 bg-secondary/30 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                  {order.address}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  onUpdateStatus(order.id, 'Preparing');
                  removeNotification(order.id);
                }}
                className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase bg-primary"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Accept
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  onUpdateStatus(order.id, 'Cancelled');
                  removeNotification(order.id);
                }}
                className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase border-2"
              >
                <Ban className="w-3.5 h-3.5 mr-2" /> Reject
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-[9px] font-black uppercase tracking-widest h-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                onViewDetails(order);
                removeNotification(order.id);
              }}
            >
              <ExternalLink className="w-3 h-3 mr-2" /> View Full Order
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
