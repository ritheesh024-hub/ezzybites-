'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [isMainPopoverOpen, setIsMainPopoverOpen] = useState(false);

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
      { name: 'Active', value: currStats.pending + currStats.preparing, color: '#f97316' }
    ].filter(d => d.value > 0);

    return {
      current: currStats,
      previous: prevStats,
      recent: currOrders.slice(0, 8),
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
    if (!tempFrom || !tempTo) return;
    setDateRange({ from: tempFrom, to: tempTo });
    setRangeType('custom');
    setIsMainPopoverOpen(false);
  };

  if (!mounted) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-hide pb-1 w-full md:w-auto">
          {(['today', 'yesterday', 'week', 'month'] as RangeType[]).map((r) => (
            <Button
              key={r}
              onClick={() => setRangeType(r)}
              variant={rangeType === r ? 'default' : 'secondary'}
              className={cn(
                "h-8 px-4 rounded-full font-black uppercase text-[8px] tracking-widest",
                rangeType === r ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 border"
              )}
            >
              {r}
            </Button>
          ))}
          
          <Popover open={isMainPopoverOpen} onOpenChange={setIsMainPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={rangeType === 'custom' ? 'default' : 'secondary'}
                className={cn("h-8 px-4 rounded-full font-black uppercase text-[8px] tracking-widest gap-2", rangeType === 'custom' ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 border")}
              >
                <CalendarIcon className="w-3 h-3" /> Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 rounded-2xl border-none shadow-3xl" align="start">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase opacity-40">Start Node</p>
                    <Input type="date" value={tempFrom ? format(tempFrom, 'yyyy-MM-dd') : ''} onChange={e => setTempFrom(new Date(e.target.value))} className="h-9 text-[10px] rounded-lg bg-secondary/50 border-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase opacity-40">End Node</p>
                    <Input type="date" value={tempTo ? format(tempTo, 'yyyy-MM-dd') : ''} onChange={e => setTempTo(new Date(e.target.value))} className="h-9 text-[10px] rounded-lg bg-secondary/50 border-none font-bold" />
                  </div>
                  <Button onClick={handleApplyCustomRange} className="w-full h-10 rounded-xl font-black text-[9px] uppercase tracking-widest bg-primary">Sync Epoch</Button>
               </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-1.5 w-full md:w-auto">
           <Button variant="outline" size="sm" className="h-8 rounded-lg font-black uppercase text-[7px] border-2 bg-white" onClick={() => window.print()}>
              <Printer className="w-3 h-3 mr-1.5" /> Print Audit
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard label="Gross Sum" value={`₹${metrics.current.revenue.toLocaleString()}`} trend={metrics.trends.revenue} icon={IndianRupee} color="text-emerald-500" bg="bg-emerald-50" />
        <KPICard label="Tickets" value={metrics.current.total} trend={metrics.trends.orders} icon={Zap} color="text-primary" bg="bg-primary/5" />
        <KPICard label="Entities" value={metrics.current.customers} trend={metrics.trends.customers} icon={Users} color="text-blue-500" bg="bg-blue-50" />
        <KPICard label="Avg. Order" value={`₹${metrics.current.aov}`} trend={metrics.trends.aov} icon={Target} color="text-orange-500" bg="bg-orange-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-dashed flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
               <Activity className="w-3.5 h-3.5 text-primary" />
               <CardTitle className="text-xs font-black uppercase tracking-widest">Velocity Ledger</CardTitle>
            </div>
            <Badge className="bg-primary/5 text-primary border-none text-[6px] font-black uppercase">Real-time Signals</Badge>
          </CardHeader>
          <div className="p-4 md:p-6">
            <div className="h-[200px] md:h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" x1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900, fill: '#94a3b8'}} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: 8}}
                    formatter={(v: any) => [`₹${v}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="val" stroke="#f97316" strokeWidth={2} fill="url(#colorVal)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex flex-col h-full">
          <div className="space-y-0.5 mb-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest">Status Hub</h4>
            <p className="text-[7px] font-black opacity-30 uppercase tracking-[0.2em]">Flow distribution</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {metrics.pieData.length > 0 ? (
              <>
                <div className="h-[140px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                         <Pie data={metrics.pieData} innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value">
                            {metrics.pieData.map((entry, index) => <ReCell key={`cell-${index}`} fill={entry.color} />)}
                         </Pie>
                      </RePieChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1.5 mt-4">
                   {metrics.pieData.map((d, i) => (
                     <div key={i} className="flex items-center justify-between p-2 bg-secondary/40 rounded-lg">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{d.name}</span>
                        </div>
                        <span className="text-[9px] font-black">{d.value}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
               <div className="text-center opacity-10 py-10"><PieChart className="w-8 h-8 mx-auto mb-2" /><p className="text-[7px] font-black uppercase">No Flow</p></div>
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-dashed flex items-center justify-between">
           <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">Temporal Log</span>
           </div>
           <span className="text-[7px] font-black uppercase opacity-30">{metrics.recent.length} Records</span>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
           <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b">
                 <tr className="text-[7px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">Sum</th>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3 text-right">Node</th>
                 </tr>
              </thead>
              <tbody className="divide-y">
                 {metrics.recent.map((ord, i) => (
                    <tr key={i} className="hover:bg-primary/[0.01]">
                       <td className="px-5 py-3 font-black text-[8px] text-primary italic">#{ord.orderId.slice(-6)}</td>
                       <td className="px-5 py-3 font-bold text-[9px] uppercase truncate max-w-[80px]">{ord.customerName}</td>
                       <td className="px-5 py-3 font-black text-[9px] italic">₹{ord.total}</td>
                       <td className="px-5 py-3">
                          <Badge variant="outline" className="text-[5px] font-black uppercase border-none bg-secondary/50 px-1.5 h-3.5">
                             {ord.status}
                          </Badge>
                       </td>
                       <td className="px-5 py-3 text-right"><ChevronRight className="w-2.5 h-2.5 ml-auto opacity-20" /></td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </Card>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, trend, color, bg }: any) => {
  const isPositive = trend >= 0;
  return (
    <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-900 p-3.5 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-3">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-inner", bg, color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase",
          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {isPositive ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
        <h3 className="text-lg md:text-xl font-black font-headline tracking-tighter italic leading-none">{value}</h3>
      </div>
    </Card>
  );
};