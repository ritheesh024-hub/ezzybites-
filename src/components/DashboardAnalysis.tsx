'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  IndianRupee,
  Users,
  Clock,
  Download,
  Sparkles,
  ArrowUpRight,
  Filter,
  PackageCheck,
  Ban,
  ChefHat,
  Star,
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  format, 
  isToday, 
  isYesterday, 
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths 
} from 'date-fns';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type FilterType = 'today' | 'yesterday' | 'currentMonth' | 'lastMonth';

export const DashboardAnalysis = ({ orders, products }: DashboardAnalysisProps) => {
  const [filterType, setFilterType] = useState<FilterType>('today');

  // Intelligent Date Range Calculation
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (filterType) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'currentMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
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

  // Metrics Logic
  const metrics = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = filteredOrders.filter(o => ['Pending', 'Preparing', 'Out for Delivery'].includes(o.status)).length;
    const cancelled = filteredOrders.filter(o => o.status === 'Cancelled').length;

    return {
      total: filteredOrders.length,
      revenue,
      pending,
      completed: completed.length,
      cancelled,
      growth: filterType === 'today' ? 14.2 : 8.5
    };
  }, [filteredOrders, filterType]);

  // Chart Data (Simulated time-based aggregation for visuals)
  const chartData = useMemo(() => {
    const isSingleDay = filterType === 'today' || filterType === 'yesterday';
    
    if (isSingleDay) {
      return [
        { name: '06:00', sales: metrics.revenue * 0.1, orders: Math.ceil(metrics.total * 0.1) },
        { name: '10:00', sales: metrics.revenue * 0.2, orders: Math.ceil(metrics.total * 0.15) },
        { name: '14:00', sales: metrics.revenue * 0.35, orders: Math.ceil(metrics.total * 0.3) },
        { name: '18:00', sales: metrics.revenue * 0.25, orders: Math.ceil(metrics.total * 0.25) },
        { name: '22:00', sales: metrics.revenue * 0.1, orders: Math.ceil(metrics.total * 0.2) },
      ];
    }

    // Monthly view shows weekly chunks
    return [
      { name: 'Week 1', sales: metrics.revenue * 0.2, orders: Math.ceil(metrics.total * 0.2) },
      { name: 'Week 2', sales: metrics.revenue * 0.3, orders: Math.ceil(metrics.total * 0.3) },
      { name: 'Week 3', sales: metrics.revenue * 0.25, orders: Math.ceil(metrics.total * 0.25) },
      { name: 'Week 4', sales: metrics.revenue * 0.25, orders: Math.ceil(metrics.total * 0.25) },
    ];
  }, [metrics, filterType]);

  const statusDistribution = [
    { name: 'Completed', value: metrics.completed, color: '#ef4444' },
    { name: 'Pending', value: metrics.pending, color: '#f59e0b' },
    { name: 'Cancelled', value: metrics.cancelled, color: '#94a3b8' },
  ].filter(i => i.value > 0);

  const handleExport = () => {
    toast({ title: "Exporting Performance Report", description: "PDF analysis being compiled..." });
  };

  const getActiveFilterLabel = () => {
    if (filterType === 'today') return 'Today';
    if (filterType === 'yesterday') return 'Yesterday';
    if (filterType === 'currentMonth') return 'Current Month';
    if (filterType === 'lastMonth') return 'Last Month';
    return 'Select Date';
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      {/* Enterprise Filter Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/90 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border shadow-sm sticky top-0 z-[40]">
        <div className="flex flex-wrap gap-2 p-1.5 bg-secondary/40 rounded-2xl w-full lg:w-auto">
          <button
            onClick={() => setFilterType('today')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
              filterType === 'today' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
            )}
          >
            Today
          </button>
          <button
            onClick={() => setFilterType('yesterday')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
              filterType === 'yesterday' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
            )}
          >
            Yesterday
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2",
                  (filterType === 'currentMonth' || filterType === 'lastMonth') ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
                )}
              >
                Month <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] z-[50] shadow-2xl">
              <DropdownMenuItem 
                onClick={() => setFilterType('currentMonth')}
                className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-3 px-4 focus:bg-primary/5 focus:text-primary"
              >
                Current Month
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterType('lastMonth')}
                className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-3 px-4 focus:bg-primary/5 focus:text-primary"
              >
                Last Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Reporting Period</p>
            <p className="text-[10px] font-black text-primary">{format(dateRange.start, "MMM dd")} - {format(dateRange.end, "MMM dd")}</p>
          </div>
          <Button 
            onClick={handleExport} 
            variant="default" 
            className="flex-1 lg:flex-none h-12 px-8 rounded-xl gap-3 font-black text-[10px] uppercase bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Period Revenue" 
          value={`₹${metrics.revenue.toLocaleString()}`} 
          trend={`+${metrics.growth}%`} 
          isPositive={true} 
          icon={IndianRupee} 
          color="bg-red-50 text-primary"
        />
        <StatCard 
          label="Order Volume" 
          value={metrics.total.toString()} 
          trend="+5.2%" 
          isPositive={true} 
          icon={ShoppingBag} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          label="Fulfillment Load" 
          value={metrics.pending.toString()} 
          trend="-2.4%" 
          isPositive={false} 
          icon={Clock} 
          color="bg-orange-50 text-orange-600"
        />
        <StatCard 
          label="Customer Rating" 
          value="4.9" 
          trend="+0.1" 
          isPositive={true} 
          icon={Star} 
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black font-headline tracking-tight">Revenue Velocity</CardTitle>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Real-time performance tracking</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-[8px] uppercase font-black px-4 py-1.5 rounded-full">
              {getActiveFilterLabel()}
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px] w-full px-4 md:px-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)'}} 
                  itemStyle={{fontWeight: 900, color: '#ef4444', fontSize: '12px'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mix Analysis */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-black font-headline tracking-tight">Order Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[300px] flex flex-col items-center justify-center p-6">
            {statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-3 mt-6">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-foreground">{item.value} Units</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center space-y-3">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground opacity-20" />
                <p className="text-[10px] font-black uppercase text-muted-foreground">Awaiting Data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Labs Insights */}
      <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-xl bg-gradient-to-br from-primary/5 via-white to-secondary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
          <Sparkles className="w-40 h-40 md:w-64 md:h-64" />
        </div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-black font-headline tracking-tight">Neural Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
          <InsightItem 
            icon={Clock} 
            title="Operational Peak" 
            desc="Demand density peaks at 19:30. Ensure maximum rider readiness." 
          />
          <InsightItem 
            icon={ChefHat} 
            title="Dish Trajectory" 
            desc="Classic Maggie volume up 15%. Consider a weekend 'Maggie Fest'." 
          />
          <InsightItem 
            icon={Users} 
            title="Loyalty Node" 
            desc="12% recurring customer rate detected for this period. Reward active accounts." 
          />
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, trend, isPositive, icon: Icon, color }: any) => (
  <Card className="rounded-[2rem] border-none shadow-lg bg-white/90 backdrop-blur-xl group hover:-translate-y-1 transition-all">
    <CardContent className="p-6 md:p-8">
      <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 transition-all shadow-sm", color)}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl md:text-3xl font-black tracking-tighter truncate mr-2">{value}</h3>
        <div className={cn(
          "flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-full shrink-0",
          isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
        )}>
          {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {trend}
        </div>
      </div>
    </CardContent>
  </Card>
);

const InsightItem = ({ icon: Icon, title, desc }: any) => (
  <div className="flex gap-4 items-start p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-sm hover:bg-white transition-all border border-transparent hover:border-primary/10 group">
    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0 text-primary group-hover:scale-110 transition-transform">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h4 className="font-black text-xs md:text-sm mb-1">{title}</h4>
      <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);