
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, Zap, Loader2, Star,
  TrendingUp, TrendingDown, ShoppingBag
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  isWithinInterval, subDays, startOfDay, endOfDay, startOfWeek, 
  startOfMonth, subMonths, endOfMonth
} from 'date-fns';
import { useCollection, useFirestore } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type RangeType = 'today' | 'yesterday' | 'week' | 'month';

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const [mounted, setMounted] = useState(false);
  const [rangeType, setRangeType] = useState<RangeType>('today');
  const db = useFirestore();

  const reviewsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'), limit(500));
  }, [db]);
  const { data: reviews } = useCollection<any>(reviewsQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const intervals = useMemo(() => {
    const now = new Date();
    let current = { from: startOfDay(now), to: endOfDay(now) };
    let previous = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };

    if (rangeType === 'yesterday') {
      current = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
      previous = { from: startOfDay(subDays(now, 2)), to: endOfDay(subDays(now, 2)) };
    } else if (rangeType === 'week') {
      current = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
      previous = { from: startOfWeek(subDays(now, 7), { weekStartsOn: 1 }), to: endOfDay(subDays(now, 7)) };
    } else if (rangeType === 'month') {
      current = { from: startOfMonth(now), to: endOfDay(now) };
      previous = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
    }
    return { current, previous };
  }, [rangeType]);

  const metrics = useMemo(() => {
    const filterData = (data: any[], start: Date, end: Date) => 
      data.filter(o => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return isWithinInterval(d, { start, end });
      });

    const currOrders = filterData(orders, intervals.current.from, intervals.current.to);
    const prevOrders = filterData(orders, intervals.previous.from, intervals.previous.to);

    const calculateStats = (data: any[]) => {
      const delivered = data.filter(o => o.status === 'delivered');
      const revenue = delivered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      return { revenue, total: data.length, delivered: delivered.length, cancelled: data.filter(o => o.status === 'Cancelled').length };
    };

    const currStats = calculateStats(currOrders);
    const prevStats = calculateStats(prevOrders);

    // Sentiment Analytics
    const productSentiments: Record<string, any> = {};
    reviews?.forEach(rev => {
       if (!productSentiments[rev.productId]) {
         productSentiments[rev.productId] = { name: rev.productName, count: 0, sum: 0 };
       }
       productSentiments[rev.productId].count++;
       productSentiments[rev.productId].sum += rev.rating;
    });

    const sentimentList = Object.values(productSentiments).map((p: any) => ({
      ...p,
      avg: (p.sum / p.count).toFixed(1)
    }));

    return {
      revenue: currStats.revenue,
      totalOrders: currStats.total,
      revenueTrend: prevStats.revenue === 0 ? 100 : Math.round(((currStats.revenue - prevStats.revenue) / prevStats.revenue) * 100),
      orderTrend: prevStats.total === 0 ? 100 : Math.round(((currStats.total - prevStats.total) / prevStats.total) * 100),
      topRated: [...sentimentList].sort((a, b) => Number(b.avg) - Number(a.avg)).slice(0, 3),
      mostRated: [...sentimentList].sort((a, b) => b.count - a.count).slice(0, 3),
      chartData: currOrders.slice(-10).map(o => ({ name: o.orderId.slice(-4), val: o.total })),
      pieData: [
        { name: 'Delivered', value: currStats.delivered, color: '#10b981' },
        { name: 'Cancelled', value: currStats.cancelled, color: '#f43f5e' }
      ].filter(d => d.value > 0)
    };
  }, [orders, intervals, reviews]);

  if (!mounted) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {(['today', 'yesterday', 'week', 'month'] as RangeType[]).map((r) => (
          <button
            key={r}
            onClick={() => setRangeType(r)}
            className={cn(
              "h-8 px-6 rounded-full font-black uppercase text-[8px] tracking-widest border transition-all shrink-0",
              rangeType === r ? "bg-primary text-white border-primary" : "bg-white dark:bg-zinc-900 text-muted-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Gross Volume" val={`₹${metrics.revenue}`} trend={metrics.revenueTrend} icon={IndianRupee} color="text-emerald-500" />
        <StatCard label="Ticket Node" val={metrics.totalOrders} trend={metrics.orderTrend} icon={ShoppingBag} color="text-primary" />
        <StatCard label="Review Pulse" val={reviews?.length || 0} icon={Star} color="text-blue-500" />
        <StatCard label="Active Entities" val={products.length} icon={Zap} color="text-orange-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* SENTIMENT HUB */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-6 space-y-6">
           <div className="flex items-center justify-between border-b border-dashed pb-4">
              <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                 <Star className="w-4 h-4 text-primary" /> Sentiment Pulse
              </h3>
           </div>
           
           <div className="space-y-6">
              <div className="space-y-3">
                 <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Highest Potential</p>
                 {metrics.topRated.map((p, i) => (
                   <div key={i} className="flex justify-between items-center p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl">
                      <span className="text-[10px] font-bold uppercase truncate pr-4">{p.name}</span>
                      <Badge className="bg-emerald-100 text-emerald-600 border-none text-[8px] font-black px-1.5 h-4">{p.avg} ★</Badge>
                   </div>
                 ))}
              </div>
              <div className="space-y-3">
                 <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">High Velocity</p>
                 {metrics.mostRated.map((p, i) => (
                   <div key={i} className="flex justify-between items-center p-2.5 bg-primary/5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase truncate pr-4">{p.name}</span>
                      <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black px-1.5 h-4">{p.count} Rates</Badge>
                   </div>
                 ))}
              </div>
           </div>
        </Card>

        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-6">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="val" stroke="#f97316" strokeWidth={2} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center px-4">
             <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase">Revenue Velocity</p>
                <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Snapshot Node</p>
             </div>
             <Badge className="bg-primary text-white border-none text-[8px] font-black px-3 py-1 rounded-full uppercase">Real-time</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, trend, icon: Icon, color }: any) => (
  <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900 p-4 space-y-3">
    <div className="flex justify-between items-start">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-secondary/50", color)}><Icon className="w-5 h-5" /></div>
      {trend !== undefined && (
        <div className={cn("flex items-center text-[7px] font-black px-1.5 py-0.5 rounded-md", trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
           {trend >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-1" /> : <TrendingDown className="w-2.5 h-2.5 mr-1" />}
           {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-[8px] font-black uppercase opacity-40 tracking-widest mb-0.5">{label}</p>
      <h4 className="text-xl font-black font-headline italic leading-none">{val}</h4>
    </div>
  </Card>
);
