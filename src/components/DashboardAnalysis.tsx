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
import { Calendar } from '@/components/ui/calendar';
import {
  IndianRupee,
  Zap,
  Loader2,
  Users,
  Calendar as CalendarIcon,
  Download,
  Printer,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingBag,
  PieChart,
  Activity,
  X,
  ChefHat,
  BellRing,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell as ReCell
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  format,
  isWithinInterval,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  subMonths,
  subWeeks,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isSameHour,
  endOfMonth
} from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type RangeType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const [mounted, setMounted] = useState(false);
  const [rangeType, setRangeType] = useState<RangeType>('today');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  // Individual popover states for From/To fields
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [isMainPopoverOpen, setIsMainPopoverOpen] = useState(false);

  // Staged state for individual date selection
  const [tempFrom, setTempFrom] = useState<Date | undefined>(undefined);
  const [tempTo, setTempTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const intervals = useMemo(() => {
    const now = new Date();
    let current = { from: startOfDay(now), to: endOfDay(now) };
    let previous = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };

    switch (rangeType) {
      case 'yesterday':
        current = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
        previous = { from: startOfDay(subDays(now, 2)), to: endOfDay(subDays(now, 2)) };
        break;
      case 'week':
        current = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
        previous = { from: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), to: endOfDay(subWeeks(now, 1)) };
        break;
      case 'month':
        current = { from: startOfMonth(now), to: endOfDay(now) };
        previous = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
        break;
      case 'last_month':
        current = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
        previous = { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(subMonths(now, 2)) };
        break;
      case 'custom':
        current = { from: startOfDay(dateRange.from), to: endOfDay(dateRange.to) };
        const duration = current.to.getTime() - current.from.getTime();
        previous = { 
          from: new Date(current.from.getTime() - duration - 1000), 
          to: new Date(current.from.getTime() - 1000) 
        };
        break;
    }
    return { current, previous };
  }, [rangeType, dateRange]);

  const metrics = useMemo(() => {
    const filterOrders = (start: Date, end: Date) => 
      orders.filter(o => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return isWithinInterval(d, { start, end });
      });

    const currOrders = filterOrders(intervals.current.from, intervals.current.to);
    const prevOrders = filterOrders(intervals.previous.from, intervals.previous.to);

    const calculateStats = (data: any[]) => {
      const delivered = data.filter(o => o.status === 'delivered');
      const revenue = delivered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      const customers = new Set(data.map(o => o.userId || o.customerPhone)).size;
      return {
        revenue,
        total: data.length,
        delivered: delivered.length,
        pending: data.filter(o => o.status === 'pending').length,
        preparing: data.filter(o => o.status === 'preparing').length,
        cancelled: data.filter(o => o.status === 'Cancelled').length,
        customers,
        aov: delivered.length ? Math.round(revenue / delivered.length) : 0
      };
    };

    const currStats = calculateStats(currOrders);
    const prevStats = calculateStats(prevOrders);

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    let chartData: any[] = [];
    const diffInDays = Math.round((intervals.current.to.getTime() - intervals.current.from.getTime()) / (1000 * 3600 * 24));

    if (diffInDays <= 1) {
      const hours = eachHourOfInterval({ start: intervals.current.from, end: intervals.current.to });
      chartData = hours.map(h => {
        const val = currOrders
          .filter(o => {
             const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
             return isSameHour(d, h) && o.status === 'delivered';
          })
          .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        return { name: format(h, 'hh a'), val };
      });
    } else {
      const days = eachDayOfInterval({ start: intervals.current.from, end: intervals.current.to });
      chartData = days.map(d => {
        const val = currOrders
          .filter(o => {
             const ordDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
             return isSameDay(ordDate, d) && o.status === 'delivered';
          })
          .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        return { name: format(d, 'MMM dd'), val };
      });
    }

    const pieData = [
      { name: 'Delivered', value: currStats.delivered, color: '#10b981' },
      { name: 'Cancelled', value: currStats.cancelled, color: '#f43f5e' },
      { name: 'Active Flow', value: currStats.pending + currStats.preparing, color: '#f97316' }
    ].filter(d => d.value > 0);

    return {
      current: currStats,
      previous: prevStats,
      recent: currOrders.slice(0, 5),
      trends: {
        revenue: calcTrend(currStats.revenue, prevStats.revenue),
        orders: calcTrend(currStats.total, prevStats.total),
        customers: calcTrend(currStats.customers, prevStats.customers),
        aov: calcTrend(currStats.aov, prevStats.aov)
      },
      chartData,
      pieData
    };
  }, [orders, intervals]);

  const handleApplyCustomRange = () => {
    if (!tempFrom || !tempTo) {
      toast({ variant: "destructive", title: "Incomplete Range", description: "Select both From and To dates." });
      return;
    }

    if (tempFrom > tempTo) {
      toast({ variant: "destructive", title: "Invalid Logic", description: "End date must be after start date." });
      return;
    }

    setDateRange({ from: tempFrom, to: tempTo });
    setRangeType('custom');
    setIsMainPopoverOpen(false);
    toast({ title: "Temporal Filter Applied", description: `Active: ${format(tempFrom, 'dd MMM')} to ${format(tempTo, 'dd MMM')}` });
  };

  const handleClearCustomRange = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
  };

  const handleExport = () => {
    const headers = ["OrderID", "Customer", "Amount", "Status", "Date"];
    const rows = metrics.recent.map(o => [
      o.orderId,
      o.customerName,
      o.total,
      o.status,
      o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `EzzyBites_Analytics_${rangeType}.csv`);
    link.click();
  };

  if (!mounted) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20 no-print">
      {/* COMPACT FILTER BAR */}
      <div className="bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-3xl lg:static -mx-4 md:-mx-10 px-4 md:px-10 py-4 border-b lg:border-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide pb-1 w-full md:w-auto">
            {(['today', 'yesterday', 'week', 'month', 'last_month'] as RangeType[]).map((r) => (
              <Button
                key={r}
                onClick={() => setRangeType(r)}
                variant={rangeType === r ? 'default' : 'outline'}
                className={cn(
                  "h-9 px-4 rounded-full font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all shrink-0",
                  rangeType === r ? "bg-primary text-white shadow-lg shadow-primary/20 border-none" : "bg-white dark:bg-zinc-900"
                )}
              >
                {r.replace('_', ' ')}
              </Button>
            ))}
            
            <Popover open={isMainPopoverOpen} onOpenChange={setIsMainPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={rangeType === 'custom' ? 'default' : 'outline'}
                  className={cn(
                    "h-9 px-4 rounded-full font-black uppercase text-[8px] md:text-[9px] tracking-widest gap-2 shrink-0",
                    rangeType === 'custom' ? "bg-primary text-white border-none" : "bg-white dark:bg-zinc-900"
                  )}
                >
                  <CalendarIcon className="w-3 h-3" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-[2.5rem] border-none shadow-3xl z-[150] overflow-hidden" align="start">
                <div className="p-8 bg-white dark:bg-zinc-950 space-y-8">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-0.5">
                      <h4 className="font-black uppercase text-xs tracking-widest text-primary italic leading-none">Custom Filter</h4>
                      <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Select From and To nodes</p>
                    </div>
                    <button onClick={() => setIsMainPopoverOpen(false)} className="text-muted-foreground hover:text-primary transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {/* FROM DATE FIELD */}
                    <div className="space-y-2">
                       <p className="text-[8px] font-black uppercase opacity-40 ml-1">From Epoch</p>
                       <Popover open={fromOpen} onOpenChange={setFromOpen}>
                          <PopoverTrigger asChild>
                             <button className={cn(
                               "w-full h-14 rounded-2xl border-2 flex items-center px-6 gap-3 transition-all",
                               tempFrom ? "border-primary/20 bg-primary/5" : "border-muted bg-zinc-50 dark:bg-zinc-900"
                             )}>
                                <CalendarIcon className="w-4 h-4 text-primary" />
                                <span className="font-black text-xs uppercase tracking-tight">
                                  {tempFrom ? format(tempFrom, 'dd MMM yyyy') : 'Select Start'}
                                </span>
                             </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-4xl z-[200]">
                             <Calendar
                               mode="single"
                               selected={tempFrom}
                               onSelect={(date) => { setTempFrom(date); setFromOpen(false); }}
                               initialFocus
                               className="bg-white dark:bg-zinc-900 rounded-3xl"
                             />
                          </PopoverContent>
                       </Popover>
                    </div>

                    {/* TO DATE FIELD */}
                    <div className="space-y-2">
                       <p className="text-[8px] font-black uppercase opacity-40 ml-1">To Epoch</p>
                       <Popover open={toOpen} onOpenChange={setToOpen}>
                          <PopoverTrigger asChild>
                             <button className={cn(
                               "w-full h-14 rounded-2xl border-2 flex items-center px-6 gap-3 transition-all",
                               tempTo ? "border-primary/20 bg-primary/5" : "border-muted bg-zinc-50 dark:bg-zinc-900"
                             )}>
                                <CalendarIcon className="w-4 h-4 text-primary" />
                                <span className="font-black text-xs uppercase tracking-tight">
                                  {tempTo ? format(tempTo, 'dd MMM yyyy') : 'Select End'}
                                </span>
                             </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-4xl z-[200]">
                             <Calendar
                               mode="single"
                               selected={tempTo}
                               onSelect={(date) => { setTempTo(date); setToOpen(false); }}
                               initialFocus
                               className="bg-white dark:bg-zinc-900 rounded-3xl"
                             />
                          </PopoverContent>
                       </Popover>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button 
                      onClick={handleApplyCustomRange} 
                      disabled={!tempFrom || !tempTo}
                      className="w-full h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] bg-primary shadow-2xl shadow-primary/30 gap-3"
                    >
                      Apply Date Range <ArrowRight className="w-4 h-4" />
                    </Button>
                    <button 
                      onClick={handleClearCustomRange}
                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear Selection
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <Button variant="outline" className="h-10 flex-1 md:flex-none rounded-xl font-black uppercase text-[8px] border-2 bg-white dark:bg-zinc-900" onClick={handleExport}>
                <Download className="w-3.5 h-3.5 mr-2" /> Export
             </Button>
             <Button variant="outline" className="h-10 flex-1 md:flex-none rounded-xl font-black uppercase text-[8px] border-2 bg-white dark:bg-zinc-900" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-2" /> Print
             </Button>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[7px] font-black uppercase tracking-widest opacity-40 italic">
                {rangeType === 'custom' ? 'CUSTOM AUDIT SPAN' : `REPORTING NODE: ${rangeType.toUpperCase()}`}
              </span>
           </div>
           <div className="text-[7px] font-black uppercase tracking-[0.2em] opacity-30">
              {format(intervals.current.from, 'dd MMM')} — {format(intervals.current.to, 'dd MMM yyyy')}
           </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard label="Gross Revenue" value={`₹${metrics.current.revenue.toLocaleString()}`} trend={metrics.trends.revenue} icon={IndianRupee} color="text-emerald-500" bg="bg-emerald-50" period={rangeType} />
        <KPICard label="Total Tickets" value={metrics.current.total} trend={metrics.trends.orders} icon={Zap} color="text-primary" bg="bg-primary/5" period={rangeType} />
        <KPICard label="Active Entities" value={metrics.current.customers} trend={metrics.trends.customers} icon={Users} color="text-blue-500" bg="bg-blue-50" period={rangeType} />
        <KPICard label="Avg. Order Den." value={`₹${metrics.current.aov}`} trend={metrics.trends.aov} icon={Target} color="text-orange-500" bg="bg-orange-50" period={rangeType} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden relative border">
          <CardHeader className="p-6 md:p-8 border-b border-dashed flex flex-row items-center justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-primary">
                 <Activity className="w-4 h-4" />
                 <CardTitle className="text-lg md:text-xl font-black font-headline uppercase tracking-tighter italic">Revenue Velocity</CardTitle>
               </div>
               <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">Performance Heatmap</p>
            </div>
            <Badge className="bg-primary/5 text-primary border-none px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest hidden sm:flex">LIVE SIGNALS</Badge>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" x1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: 10}}
                    formatter={(v: any) => [`₹${v}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="val" stroke="#f97316" strokeWidth={3} fill="url(#colorVal)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-6 md:p-8 flex flex-col h-full border">
          <div className="space-y-1 mb-6 md:mb-8">
            <h4 className="text-lg md:text-xl font-black font-headline uppercase tracking-tighter italic">Status <span className="text-primary">Ledger</span></h4>
            <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">Node Distribution</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {metrics.pieData.length > 0 ? (
              <>
                <div className="h-[180px] md:h-[200px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                         <Pie data={metrics.pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                            {metrics.pieData.map((entry, index) => <ReCell key={`cell-${index}`} fill={entry.color} />)}
                         </Pie>
                         <Tooltip />
                      </RePieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 w-full gap-2 mt-4 md:mt-6">
                   {metrics.pieData.map((d, i) => (
                     <div key={i} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-xl">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-black">{d.value}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
               <div className="py-12 md:py-20 text-center opacity-20"><PieChart className="w-10 h-10 mx-auto mb-3" /><p className="text-[8px] font-black uppercase">No Flow Recorded</p></div>
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden border">
        <CardHeader className="p-6 md:p-8 border-b border-dashed flex flex-row items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ShoppingBag className="w-5 h-5" /></div>
              <CardTitle className="text-lg md:text-xl font-black font-headline uppercase tracking-tighter italic">Recent <span className="text-primary">Transactions</span></CardTitle>
           </div>
           <Button variant="ghost" className="text-[8px] font-black uppercase tracking-widest text-primary gap-2">View Full Ledger <ChevronRight className="w-3 h-3" /></Button>
        </CardHeader>
        <div className="overflow-x-auto scrollbar-hide">
           <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                 <tr className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Entity Identity</th>
                    <th className="px-6 py-4">Gross Sum</th>
                    <th className="px-6 py-4">Operational State</th>
                    <th className="px-6 py-4 text-right">Node</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                 {metrics.recent.map((ord, i) => (
                    <tr key={i} className="hover:bg-primary/[0.02] transition-colors">
                       <td className="px-6 py-4 font-black text-[9px] text-primary italic">#{ord.orderId}</td>
                       <td className="px-6 py-4 font-black text-[9px] uppercase truncate max-w-[100px]">{ord.customerName}</td>
                       <td className="px-6 py-4 font-black text-[10px] italic">₹{ord.total}</td>
                       <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[6px] font-black uppercase border-none bg-secondary/50 px-2 py-0.5 rounded-md">
                             {ord.status}
                          </Badge>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground opacity-30" />
                       </td>
                    </tr>
                 ))}
                 {metrics.recent.length === 0 && (
                   <tr><td colSpan={5} className="py-8 text-center text-[8px] font-black uppercase opacity-20">No data signals in this temporal span</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </Card>
      
      <div className="pt-10 text-center">
         <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">Ezzy Bites • Quantum Analytics Engine v3.5</p>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, trend, color, bg, period }: any) => {
  const isPositive = trend >= 0;
  return (
    <Card className="rounded-[1.8rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-5 md:p-6 group transition-all duration-500 overflow-hidden relative border hover:shadow-2xl">
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary/30 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-inner relative z-10", bg, color)}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border text-[7px] md:text-[9px] font-black uppercase tracking-tight",
          isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
        )}>
          {isPositive ? <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 md:w-3 md:h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="relative z-10 space-y-0.5 md:space-y-1">
        <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
        <h3 className="text-2xl md:text-3xl font-black font-headline tracking-tighter italic leading-none">{value}</h3>
        <p className="text-[6px] md:text-[7px] font-black uppercase opacity-30 tracking-widest pt-1">vs Prior {period.replace('_', ' ')}</p>
      </div>
    </Card>
  );
};