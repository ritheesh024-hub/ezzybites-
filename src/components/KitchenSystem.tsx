"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Timer,
  Package,
  Utensils,
  BellRing,
  Truck,
  Flame,
  Activity,
  CheckCircle2,
  Clock,
  Home,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface KitchenSystemProps {
  orders: any[];
  onUpdateStatus: (id: string, status: string) => void;
  activeView?: string;
}

export const KitchenSystem = ({ orders, onUpdateStatus, activeView }: KitchenSystemProps) => {
  const [now, setNow] = useState(new Date());

  // Update "time ago" every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const kitchenOrders = (orders || []).filter(o => 
    ['pending', 'accepted', 'preparing'].includes(o.status)
  ).sort((a, b) => {
    // Sort by priority then by time
    const orderPriority = ['preparing', 'accepted', 'pending'];
    const pA = orderPriority.indexOf(a.status);
    const pB = orderPriority.indexOf(b.status);
    if (pA !== pB) return pA - pB;
    
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeA - timeB;
  });

  const inCooking = kitchenOrders.filter(o => o.status === 'preparing').length;
  const awaitingPrep = kitchenOrders.filter(o => ['pending', 'accepted'].includes(o.status)).length;
  const totalActive = kitchenOrders.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* KITCHEN OVERVIEW - HORIZONTAL SCROLL ON MOBILE */}
      <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
        <MetricCard 
          label="In Cooking" 
          value={inCooking} 
          icon={Utensils} 
          color="bg-orange-500" 
          description="Active Station"
        />
        <MetricCard 
          label="Awaiting Prep" 
          value={awaitingPrep} 
          icon={Timer} 
          color="bg-blue-600" 
          description="In Queue"
        />
        <MetricCard 
          label="Total Active" 
          value={totalActive} 
          icon={Flame} 
          color="bg-zinc-900" 
          description="Live Workload"
        />
      </div>

      {/* ORDERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black font-headline uppercase tracking-tighter italic">Live <span className="text-primary">Orders</span></h2>
          <Badge variant="secondary" className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest">{totalActive} Tickets</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {kitchenOrders.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-dashed border-muted flex flex-col items-center justify-center gap-4">
              <ChefHat className="w-10 h-10 text-muted-foreground opacity-10" />
              <p className="font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground opacity-40">All stations clear</p>
            </div>
          ) : (
            kitchenOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={onUpdateStatus}
                now={now}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color, description }: any) => (
  <Card className={cn("min-w-[140px] md:min-w-0 md:flex-1 h-[110px] rounded-2xl border-none shadow-lg overflow-hidden snap-start shrink-0 text-white relative", color)}>
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <Icon className="w-12 h-12 rotate-12" />
    </div>
    <CardContent className="p-4 flex flex-col h-full justify-between relative z-10">
      <div className="flex items-center gap-1.5 opacity-80">
        <Icon className="w-3 h-3" />
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <h3 className="text-3xl font-black font-headline italic leading-none">{value}</h3>
        <p className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const OrderCard = ({ order, onUpdateStatus, now }: any) => {
  const timeAgo = order.createdAt?.toDate 
    ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: false })
    : 'Now';

  const statusConfig = {
    pending: { label: 'NEW', color: 'bg-yellow-400 text-black', action: 'Accept', next: 'accepted', icon: BellRing },
    accepted: { label: 'HUB SYNC', color: 'bg-blue-600 text-white', action: 'Start Prep', next: 'preparing', icon: CheckCircle2 },
    preparing: { label: 'COOKING', color: 'bg-orange-500 text-white', action: 'Ready', next: 'out_for_delivery', icon: Flame }
  };

  const config = (statusConfig as any)[order.status] || statusConfig.pending;

  return (
    <Card className={cn(
      "rounded-2xl border-none shadow-md overflow-hidden flex flex-col h-full transition-all group",
      order.status === 'pending' ? 'ring-2 ring-yellow-400/20' : ''
    )}>
      {/* Header */}
      <div className={cn("p-2.5 flex justify-between items-center", config.color)}>
        <span className="font-black text-[9px] italic">#{order.orderId}</span>
        <config.icon className="w-3 h-3" />
      </div>

      <CardContent className="p-3 flex-1 flex flex-col gap-2 bg-white dark:bg-zinc-900">
        <div className="min-w-0">
          <h4 className="font-black text-xs uppercase truncate leading-none mb-1">{order.customerName}</h4>
          <div className="flex items-center gap-1 opacity-50">
             {order.orderType === 'Dine-In' ? <Utensils className="w-2.5 h-2.5" /> : order.orderType === 'Take Away' ? <Package className="w-2.5 h-2.5" /> : <Home className="w-2.5 h-2.5" />}
             <span className="text-[7px] font-bold uppercase tracking-widest">{order.orderType}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-auto">
          <Badge variant="secondary" className="bg-secondary/60 text-[7px] font-black uppercase px-1.5 h-4">
            {order.items?.length || 0} Items
          </Badge>
          <Badge variant="outline" className="border-none bg-zinc-100 dark:bg-zinc-800 text-[7px] font-black uppercase px-1.5 h-4 gap-1">
            <Clock className="w-2 h-2" /> {timeAgo}
          </Badge>
        </div>
      </CardContent>

      {/* Action Footer */}
      <div className="p-2 pt-0 bg-white dark:bg-zinc-900">
        <Button 
          onClick={() => onUpdateStatus(order.id, config.next)}
          className={cn(
            "w-full h-10 rounded-xl font-black uppercase text-[8px] tracking-widest gap-2 shadow-sm transition-transform active:scale-95",
            config.color
          )}
        >
          {config.action}
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};
