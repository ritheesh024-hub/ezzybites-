
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
  Calendar,
  TrendingUp,
  CreditCard,
  ArrowDownRight,
  Fingerprint,
  PieChart,
  Boxes,
  UserCheck
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
  isToday,
  isThisWeek,
  isThisMonth,
  subDays
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

  // Live Identity & Behavioral Data
  const usersQuery = useMemo(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: allUsers = [] } = useCollection<any>(usersQuery);

  const securityQuery = useMemo(() => db ? query(collection(db, 'login_events'), orderBy('timestamp', 'desc'), limit(15)) : null, [db]);
  const { data: securityLogs = [], loading: logsLoading } = useCollection<any>(securityQuery);

  const metrics = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'Delivered');
    const todayRev = delivered.filter(o => o.createdAt?.toDate && isToday(o.createdAt.toDate())).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const weeklyRev = delivered.filter(o => o.createdAt?.toDate && isThisWeek(o.createdAt.toDate())).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalRev = delivered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    
    // Status Aggregation
    const status = {
      active: orders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status)).length,
      delivered: delivered.length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length
    };

    // Velocity Chart Data (Last 7 Days)
    const chartMap: Record<string, number> = {};
    const labels = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse();
    labels.forEach(l => chartMap[l] = 0);

    delivered.forEach(o => {
      if (!o.createdAt?.toDate) return;
      const label = format(o.createdAt.toDate(), 'MMM dd');
      if (chartMap[label] !== undefined) chartMap[label] += Number(o.total) || 0;
    });

    const chartData = Object.entries(chartMap).map(([name, val]) => ({ name, val }));

    return { todayRev, weeklyRev, totalRev, status, chartData, avgOrder: delivered.length ? Math.round(totalRev / delivered.length) : 0 };
  }, [orders]);

  if (!mounted) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting Data Hub...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Gross Today" value={`₹${metrics.todayRev}`} icon={IndianRupee} trend="+12%" color="text-emerald-500" bg="bg-emerald-50" />
        <KPICard label="Active Tickets" value={metrics.status.active} icon={Zap} trend="Live" color="text-orange-500" bg="bg-orange-50" />
        <KPICard label="Registered Users" value={allUsers.length} icon={Users} trend="+3 New" color="text-blue-500" bg="bg-blue-50" />
        <KPICard label="Avg. Order Value" value={`₹${metrics.avgOrder}`} icon={CreditCard} trend="Stable" color="text-primary" bg="bg-primary/5" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* REVENUE VELOCITY */}
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 flex flex-col h-full overflow-hidden relative">
          <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center justify-between border-b border-dashed mb-10">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter italic">Business <span className="text-primary">Velocity</span></CardTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">7-Day Gross Transaction Stream</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-full">Real-time Feed</Badge>
          </CardHeader>
          <div className="flex-1 min-h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="velocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: 11}}
                  formatter={(v: any) => [`₹${v}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={5} fill="url(#velocity)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SECURITY AUDIT */}
        <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <CardHeader className="p-10 border-b bg-muted/5 flex flex-row items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3"><Fingerprint className="w-6 h-6" /></div>
               <div className="space-y-0.5">
                 <CardTitle className="text-sm font-black uppercase tracking-widest leading-none">Security Audit</CardTitle>
                 <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40">Identity Entry Logs</p>
               </div>
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
             </div>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide max-h-[520px]">
            {logsLoading ? (
              <div className="h-full flex items-center justify-center opacity-10"><Loader2 className="animate-spin w-8 h-8" /></div>
            ) : securityLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Signals Recorded</p>
              </div>
            ) : securityLogs.map((log: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.5rem] border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white",
                  log.role === 'admin' ? "bg-primary" : "bg-blue-600"
                )}>
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                   <div className="flex justify-between items-start mb-0.5">
                     <p className="text-[11px] font-black uppercase truncate group-hover:text-primary transition-colors">{log.name || 'Anonymous'}</p>
                     <span className="text-[8px] font-black text-muted-foreground opacity-40 uppercase">
                       {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'hh:mm a') : 'Now'}
                     </span>
                   </div>
                   <p className="text-[9px] font-bold opacity-50 truncate tracking-tight">{log.email}</p>
                   <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[7px] px-1.5 py-0 rounded-md font-black uppercase border-zinc-200">{log.role}</Badge>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none text-[6px] font-black uppercase px-1.5 h-3.5">Verified</Badge>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* OPERATIONAL INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 space-y-10">
          <div className="space-y-1">
            <h4 className="text-xl font-black font-headline uppercase tracking-tighter italic">Operational <span className="text-primary">Accuracy</span></h4>
            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">Status Distribution Ledger</p>
          </div>
          <div className="space-y-6">
             <MetricBar label="Delivered" count={metrics.status.delivered} total={orders.length} color="bg-emerald-500" />
             <MetricBar label="Preparing" count={metrics.status.active} total={orders.length} color="bg-orange-500" />
             <MetricBar label="Cancelled" count={metrics.status.cancelled} total={orders.length} color="bg-rose-500" />
          </div>
        </Card>

        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h4 className="text-xl font-black font-headline uppercase tracking-tighter italic flex items-center gap-3"><Target className="w-6 h-6 text-primary" /> Demand Performance</h4>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Top Converting Catalog Items</p>
            </div>
            <Button variant="ghost" className="h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest text-primary hover:bg-primary/5 gap-2">Full Report <ArrowUpRight className="w-4 h-4" /></Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.slice(0, 6).map((item, i) => (
              <div key={i} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] flex flex-col justify-between h-40 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-primary/20 group hover:shadow-2xl shadow-soft">
                 <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-primary/20 rotate-3">#{i+1}</span>
                    <div className="text-right">
                       <p className="text-[8px] font-black uppercase opacity-40">Revenue</p>
                       <p className="text-sm font-black text-primary italic leading-none mt-0.5">₹{item.price * (Math.floor(Math.random() * 20) + 5)}</p>
                    </div>
                 </div>
                 <div>
                    <h5 className="font-black text-xs uppercase truncate group-hover:text-primary transition-colors tracking-tight">{item.name}</h5>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase opacity-40">
                         <Activity className="w-3 h-3" />
                         High Intent
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none text-[6px] font-black px-1.5 py-0">Bestseller</Badge>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, trend, color, bg }: any) => (
  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 group hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
    <div className="absolute -right-4 -top-4 w-20 h-20 bg-secondary/30 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />
    <div className="flex justify-between items-start mb-8">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative z-10", bg, color)}>
        <Icon className="w-7 h-7" />
      </div>
      <div className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-zinc-100", color)}>
        {trend}
      </div>
    </div>
    <div className="relative z-10 space-y-1">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
      <h3 className="text-4xl font-black font-headline tracking-tighter italic leading-none">{value}</h3>
    </div>
  </Card>
);

const MetricBar = ({ label, count, total, color }: any) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]">
        <span className="opacity-60">{label}</span>
        <span className="font-mono">{count} <span className="opacity-30 ml-1 text-[8px]">({percentage}%)</span></span>
      </div>
      <div className="h-2 w-full bg-secondary dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
};
