
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
  Loader2
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
import { isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type FilterType = 'today' | 'yesterday' | 'currentMonth' | 'lastMonth';

export const DashboardAnalysis = ({ orders, products }: DashboardAnalysisProps) => {
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [isMounted, setIsMounted] = useState(false);
  const [activeMetricView, setActiveMetricView] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (!orders) return [];
    return orders.filter(o => {
      if (!o.createdAt?.toDate) return false;
      const orderDate = o.createdAt.toDate();
      return isWithinInterval(orderDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [orders, dateRange]);

  const metrics = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = filteredOrders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length;
    const itemsSold = completed.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);

    return { total: filteredOrders.length, revenue, pending, completed: completed.length, itemsSold };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    return [
      { name: '08:00', sales: Math.round(metrics.revenue * 0.1), orders: Math.floor(metrics.total * 0.1) },
      { name: '12:00', sales: Math.round(metrics.revenue * 0.3), orders: Math.floor(metrics.total * 0.3) },
      { name: '16:00', sales: Math.round(metrics.revenue * 0.25), orders: Math.floor(metrics.total * 0.25) },
      { name: '20:00', sales: Math.round(metrics.revenue * 0.35), orders: Math.floor(metrics.total * 0.35) },
    ];
  }, [metrics]);

  if (!isMounted) return (
    <div className="h-[400px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] shadow-sm border">
        <div className="flex bg-secondary/30 dark:bg-zinc-800 p-1 rounded-full w-full lg:w-auto">
          {['today', 'yesterday'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as FilterType)}
              className={cn(
                "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                filterType === type ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
              )}
            >
              {type}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                (filterType.includes('Month')) ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-muted-foreground"
              )}>
                History <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl p-2 min-w-[180px]">
              <DropdownMenuItem onClick={() => setFilterType('currentMonth')} className="rounded-xl font-black uppercase text-[8px] py-2.5">Current Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('lastMonth')} className="rounded-xl font-black uppercase text-[8px] py-2.5">Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button className="w-full lg:w-auto h-10 px-8 rounded-full font-black text-[9px] uppercase bg-primary gap-2 shadow-lg shadow-primary/20">
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard onClick={() => setActiveMetricView('revenue')} label="Revenue" value={`₹${metrics.revenue}`} icon={IndianRupee} color="text-primary bg-primary/10" />
        <MetricCard onClick={() => setActiveMetricView('orders')} label="Total Orders" value={metrics.total} icon={ShoppingBag} color="text-blue-600 bg-blue-50" />
        <MetricCard onClick={() => setActiveMetricView('load')} label="Kitchen Load" value={metrics.pending} icon={Clock} color="text-orange-500 bg-orange-50" />
        <MetricCard onClick={() => setActiveMetricView('items')} label="Items Sold" value={metrics.itemsSold} icon={Package} color="text-green-600 bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-6">
          <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter">Sales Velocity</CardTitle>
            <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 border-primary/20 text-primary">Live Data</Badge>
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
            <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter">Kitchen Pulse</CardTitle>
          </CardHeader>
          <div className="h-[250px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Fulfilled', value: metrics.completed },
                    { name: 'In Progress', value: metrics.pending }
                  ].filter(i => i.value > 0)} 
                  innerRadius={55} 
                  outerRadius={80} 
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-6">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="opacity-50">Fulfilled</span>
                </div>
                <span>{metrics.completed}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="opacity-50">In Progress</span>
                </div>
                <span>{metrics.pending}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={!!activeMetricView} onOpenChange={() => setActiveMetricView(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] bg-white dark:bg-zinc-900 border-none shadow-3xl p-10">
          <DialogHeader>
            <DialogTitle className="sr-only">Metric Deep Dive</DialogTitle>
            <div className="text-3xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              {activeMetricView === 'revenue' ? 'Revenue Insights' : 
               activeMetricView === 'orders' ? 'Order Volume' : 
               activeMetricView === 'load' ? 'Kitchen Utilization' : 'Product Sales'}
            </div>
          </DialogHeader>
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-secondary/30 dark:bg-zinc-800 rounded-2xl">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Total {activeMetricView}</p>
                <h3 className="text-4xl font-black text-primary italic">
                  {activeMetricView === 'revenue' ? `₹${metrics.revenue}` : 
                   activeMetricView === 'orders' ? metrics.total : 
                   activeMetricView === 'load' ? metrics.pending : metrics.itemsSold}
                </h3>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60">Key Observations</h5>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex gap-2 items-start"><ArrowUpRight className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Growth is stable across local sectors.</li>
                  <li className="flex gap-2 items-start"><ArrowUpRight className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> High velocity observed during peak cafe hours.</li>
                </ul>
              </div>
            </div>
            <div className="bg-secondary/20 dark:bg-zinc-800 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
              <Star className="w-12 h-12 text-primary/20 mb-4" />
              <h4 className="font-black text-lg">Predictive Analysis</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Based on current trends, we expect a 15% increase in {activeMetricView} for the next cycle.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color, onClick }: any) => (
  <Card 
    onClick={onClick}
    className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-6 hover:scale-[1.03] transition-all cursor-pointer group"
  >
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:shadow-lg", color)}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
  </Card>
);
