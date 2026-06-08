'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Star,
  ChevronDown,
  Download,
  Zap,
  TrendingUp,
  Package,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
  Timer,
  Globe,
  Utensils,
  Users,
  CalendarDays,
  Target
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, format, isAfter, subWeeks } from 'date-fns';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type FilterType = 'today' | 'yesterday' | 'currentMonth' | 'lastMonth';

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const db = useFirestore();
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const usersQuery = useMemo(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: allUsers = [] } = useCollection<any>(usersQuery);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (filterType) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': { const d = subDays(now, 1); return { start: startOfDay(d), end: endOfDay(d) }; }
      case 'currentMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth': { const d = subMonths(now, 1); return { start: startOfMonth(d), end: endOfMonth(d) }; }
      default: return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [filterType]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      if (!o.createdAt?.toDate) return false;
      const orderDate = o.createdAt.toDate();
      return isWithinInterval(orderDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [orders, dateRange]);

  const metrics = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = filteredOrders.filter(o => ['Pending', 'Preparing', 'Confirmed'].includes(o.status));
    const preparing = filteredOrders.filter(o => o.status === 'Preparing');
    const cancelled = filteredOrders.filter(o => o.status === 'Cancelled');
    
    const totalRegisteredUsers = (allUsers || []).length;
    const newUsersThisWeek = (allUsers || []).filter(u => {
      if (!u.createdAt?.toDate) return false;
      return isAfter(u.createdAt.toDate(), subWeeks(new Date(), 1));
    }).length;

    const itemMap: Record<string, { name: string, quantity: number, revenue: number }> = {};
    let totalItemsCount = 0;

    completed.forEach(order => {
      order.items?.forEach((item: any) => {
        const id = item.id || item.name;
        if (!itemMap[id]) {
          itemMap[id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        itemMap[id].quantity += qty;
        itemMap[id].revenue += (qty * price);
        totalItemsCount += qty;
      });
    });

    const itemStats = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    const avgOrderValue = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

    return { 
      total: filteredOrders.length, 
      revenue, 
      avgOrderValue,
      pending: pending.length,
      preparing: preparing.length,
      cancelled: cancelled.length,
      itemsSold: totalItemsCount,
      itemStats,
      totalRegisteredUsers,
      newUsersThisWeek
    };
  }, [filteredOrders, allUsers]);

  const handleDownloadReport = () => {
    const reportDate = format(dateRange.start, 'yyyy-MM-dd');
    const rows = [
      ["Metric", "Value"],
      ["Report Date", reportDate],
      ["Period", filterType.toUpperCase()],
      ["Total Revenue", `INR ${metrics.revenue}`],
      ["Total Orders", metrics.total],
      ["Completed Orders", metrics.total - metrics.pending - metrics.cancelled],
      ["Cancelled Orders", metrics.cancelled],
      ["Avg Order Value", `INR ${metrics.avgOrderValue}`],
      ["Items Sold", metrics.itemsSold],
      ["Total Registered Users", metrics.totalRegisteredUsers],
      ["", ""],
      ["Item Name", "Quantity Sold", "Revenue Generated (INR)"]
    ];

    metrics.itemStats.forEach(item => {
      rows.push([item.name, item.quantity.toString(), item.revenue.toString()]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EzzyBites_Audit_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Report Exported" });
  };

  const chartData = useMemo(() => {
    return [
      { name: '08:00', sales: Math.round(metrics.revenue * 0.1) },
      { name: '12:00', sales: Math.round(metrics.revenue * 0.3) },
      { name: '16:00', sales: Math.round(metrics.revenue * 0.25) },
      { name: '20:00', sales: Math.round(metrics.revenue * 0.35) },
    ];
  }, [metrics]);

  if (!isMounted) return (
    <div className="h-[400px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] shadow-sm border">
        <div className="flex bg-secondary/30 dark:bg-zinc-800 p-1 rounded-full w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {['today', 'yesterday'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as FilterType)}
              className={cn(
                "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                filterType === type ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
              )}
            >
              {type}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0",
                (filterType.includes('Month')) ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-muted-foreground"
              )}>
                History <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl p-2">
              <DropdownMenuItem onClick={() => setFilterType('currentMonth')} className="rounded-xl font-black uppercase text-[8px] py-2.5">Current Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('lastMonth')} className="rounded-xl font-black uppercase text-[8px] py-2.5">Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={handleDownloadReport} className="w-full lg:w-auto h-10 px-8 rounded-full font-black text-[9px] uppercase bg-primary gap-2 text-white">
          <Download className="w-4 h-4" /> Export Audit
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Gross Revenue" value={`₹${metrics.revenue}`} icon={IndianRupee} color="text-primary bg-primary/10" />
        <MetricCard label="Total Orders" value={metrics.total} icon={ShoppingBag} color="text-blue-600 bg-blue-50" />
        <MetricCard label="Kitchen Load" value={metrics.pending} icon={Clock} color="text-orange-500 bg-orange-50" />
        <MetricCard label="Customers" value={metrics.totalRegisteredUsers} icon={Users} color="text-purple-600 bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-6 overflow-hidden">
          <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter">Revenue Velocity</CardTitle>
            <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 border-primary/20 text-primary">Live</Badge>
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y2="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={4} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-6">
          <CardHeader className="px-0 pb-8">
            <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter">Engagement</CardTitle>
          </CardHeader>
          <div className="h-[250px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Active', value: metrics.total - metrics.cancelled },
                    { name: 'Cancelled', value: metrics.cancelled }
                  ].filter(i => i.value > 0)} 
                  innerRadius={55} 
                  outerRadius={80} 
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-6">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="opacity-50">Success Rate</span>
                </div>
                <span>{metrics.total > 0 ? Math.round(((metrics.total - metrics.cancelled) / metrics.total) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
            <CardHeader className="px-0 pb-6">
              <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                <Target className="w-6 h-6 text-primary" /> Top Products
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {metrics.itemStats.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-secondary/20 dark:bg-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center font-black text-xs text-primary shadow-sm">{i+1}</div>
                    <div>
                      <p className="font-black text-xs uppercase">{item.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">{item.quantity} units sold</p>
                    </div>
                  </div>
                  <p className="font-black text-sm italic text-primary">₹{item.revenue}</p>
                </div>
              ))}
            </div>
         </Card>

         <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8">
            <CardHeader className="px-0 pb-6">
              <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
                <Zap className="w-6 h-6 text-orange-500" /> System Health
              </CardTitle>
            </CardHeader>
            <div className="space-y-6">
              <InsightItem 
                icon={TrendingUp} 
                color="text-green-500 bg-green-50" 
                title="Revenue Velocity" 
                desc={metrics.avgOrderValue > 150 ? "Healthy performance." : "Upsell opportunity detected."} 
              />
              <InsightItem 
                icon={AlertCircle} 
                color="text-destructive bg-destructive/10" 
                title="Operational Load" 
                desc={metrics.pending > 10 ? "Kitchen at capacity." : "Optimal load."} 
              />
            </div>
         </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-6 hover:scale-[1.03] transition-all cursor-pointer group">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", color)}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
  </Card>
);

const InsightItem = ({ icon: Icon, color, title, desc }: any) => (
  <div className="flex gap-5 items-start">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h5 className="font-black text-sm uppercase mb-1">{title}</h5>
      <p className="text-xs font-medium text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);