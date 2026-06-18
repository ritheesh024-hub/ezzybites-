'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Zap,
  Package,
  Loader2,
  Users,
  Target,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  History,
  Activity,
  Calendar
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  format,
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval
} from 'date-fns';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const usersQuery = useMemo(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: allUsers = [] } = useCollection<any>(usersQuery);

  const eventsQuery = useMemo(() => db ? query(collection(db, 'login_events'), orderBy('timestamp', 'desc'), limit(100)) : null, [db]);
  const { data: loginEvents = [], loading: eventsLoading } = useCollection<any>(eventsQuery);

  const metrics = useMemo(() => {
    // All-time analysis from Firestore
    const completed = (orders || []).filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = (orders || []).filter(o => ['Pending', 'Preparing', 'Confirmed'].includes(o.status));
    
    // Top items logic
    const itemMap: Record<string, { name: string, quantity: number, revenue: number }> = {};
    completed.forEach(order => {
      order.items?.forEach((item: any) => {
        const id = item.id || item.name;
        if (!itemMap[id]) itemMap[id] = { name: item.name, quantity: 0, revenue: 0 };
        const qty = Number(item.quantity) || 1;
        itemMap[id].quantity += qty;
        itemMap[id].revenue += (qty * (Number(item.price) || 0));
      });
    });

    const itemStats = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

    // Chart Data (Last 7 Days Activity)
    const chartMap: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse();
    last7Days.forEach(date => chartMap[date] = 0);

    orders.forEach(order => {
      if (!order.createdAt?.toDate) return;
      const dateLabel = format(order.createdAt.toDate(), 'MMM dd');
      if (chartMap[dateLabel] !== undefined) {
        chartMap[dateLabel] += (Number(order.total) || 0);
      }
    });

    const chartData = Object.entries(chartMap).map(([name, val]) => ({ name, val }));

    return { 
      total: orders.length, 
      revenue, 
      pending: pending.length,
      itemStats,
      totalRegisteredUsers: allUsers.length,
      chartData
    };
  }, [orders, allUsers]);

  if (!mounted) return <div className="h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border">
        <div className="space-y-1">
           <h3 className="text-xl font-black font-headline uppercase tracking-tighter">Firestore <span className="text-primary italic">Live Analysis</span></h3>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Telemetry • All Time History</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-100 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest">
              <Activity className="w-3 h-3 animate-pulse" />
              Sync Active
           </div>
           <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="rounded-full h-10 w-10 border-muted">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
           </Button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
           <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6"><IndianRupee className="w-6 h-6" /></div>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gross Revenue</p>
           <h3 className="text-4xl font-black font-headline tracking-tighter italic">₹{metrics.revenue}</h3>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
           <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6"><ShoppingBag className="w-6 h-6" /></div>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Orders</p>
           <h3 className="text-4xl font-black font-headline tracking-tighter italic">{metrics.total}</h3>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
           <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6"><Clock className="w-6 h-6" /></div>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Kitchen Load</p>
           <h3 className="text-4xl font-black font-headline tracking-tighter italic">{metrics.pending}</h3>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
           <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6"><Users className="w-6 h-6" /></div>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Customer Base</p>
           <h3 className="text-4xl font-black font-headline tracking-tighter italic">{metrics.totalRegisteredUsers}</h3>
        </Card>
      </div>

      {/* Main Charts & Logs */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 overflow-hidden">
          <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter">Business Velocity</CardTitle>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Revenue trends (last 7 days)</p>
            </div>
            <Calendar className="w-5 h-5 text-muted-foreground opacity-20" />
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y2="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: 10}}
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={3} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Security / Login Logs */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b bg-muted/5 flex flex-row items-center justify-between">
             <div className="flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-primary" />
               <CardTitle className="text-sm font-black uppercase tracking-widest">Security Logs</CardTitle>
             </div>
             <History className="w-5 h-5 text-muted-foreground opacity-20" />
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {eventsLoading ? (
              <div className="h-full flex items-center justify-center opacity-20"><Loader2 className="animate-spin" /></div>
            ) : loginEvents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] font-black uppercase opacity-20">No logs found</div>
            ) : (
              loginEvents.map((event: any, i: number) => (
                <div key={i} className="flex gap-4 p-3 bg-secondary/20 rounded-2xl border border-border/10">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                     event.role === 'admin' ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-600"
                   )}>
                     <ShieldCheck className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase truncate">{event.name}</p>
                      <p className="text-[8px] font-bold opacity-50 uppercase truncate">{event.email}</p>
                      <div className="flex items-center justify-between mt-1">
                         <span className="text-[7px] font-black uppercase bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border">{event.role}</span>
                         <span className="text-[7px] font-bold opacity-40 uppercase">
                           {event.timestamp?.toDate ? format(event.timestamp.toDate(), 'hh:mm a') : 'Recently'}
                         </span>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Top Products Summary */}
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
         <h4 className="text-[11px] font-black uppercase mb-6 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Top Performers (Firestore)</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {metrics.itemStats.slice(0, 4).map((item: any, i: number) => (
             <div key={i} className="p-5 bg-secondary/20 dark:bg-zinc-800 rounded-3xl space-y-3">
                <div className="flex justify-between items-start">
                   <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 py-0">#{i+1}</Badge>
                   <span className="font-black text-primary italic">₹{item.revenue}</span>
                </div>
                <h5 className="font-black text-[11px] uppercase truncate">{item.name}</h5>
                <p className="text-[9px] font-bold opacity-40 uppercase">{item.quantity} units sold</p>
             </div>
           ))}
         </div>
      </Card>
    </div>
  );
};
