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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  ChevronDown,
  Download,
  Zap,
  Package,
  Loader2,
  Users,
  Target,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Eye,
  History,
  Activity
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
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  format 
} from 'date-fns';
import { useFirestore, useCollection, useAnalyticsInstance } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type FilterType = 'today' | 'yesterday' | 'currentMonth' | 'lastMonth';
type DetailType = 'revenue' | 'orders' | 'kitchen' | 'customers' | 'activity' | null;

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const db = useFirestore();
  const analytics = useAnalyticsInstance();
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const usersQuery = useMemo(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: allUsers = [] } = useCollection<any>(usersQuery);

  const eventsQuery = useMemo(() => db ? query(collection(db, 'login_events'), orderBy('timestamp', 'desc'), limit(50)) : null, [db]);
  const { data: loginEvents = [], loading: eventsLoading } = useCollection<any>(eventsQuery);

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

    return { 
      total: filteredOrders.length, 
      revenue, 
      pending: pending.length,
      itemStats,
      totalRegisteredUsers: allUsers.length,
      completed: completed.length
    };
  }, [filteredOrders, allUsers]);

  const handleDownloadReport = (type: string) => {
    const reportDate = format(new Date(), 'yyyy-MM-dd');
    let rows = [["Metric", "Value"]];
    rows.push([type.toUpperCase(), metrics[type as keyof typeof metrics]?.toString() || "0"]);
    
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EB_${type}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Report Exported" });
  };

  if (!mounted) return <div className="h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] shadow-sm border">
        <div className="flex bg-secondary/30 dark:bg-zinc-800 p-1 rounded-full w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {['today', 'yesterday'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as FilterType)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                filterType === type ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
              )}
            >
              {type}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0",
                filterType.includes('Month') ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-muted-foreground"
              )}>
                History <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl p-2 shadow-3xl">
              <DropdownMenuItem onClick={() => setFilterType('currentMonth')} className="rounded-xl font-black uppercase text-[8px] py-2.5">Current Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('lastMonth')} className="rounded-xl font-black uppercase text-[8px] py-2.5">Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest",
            analytics ? "border-green-100 bg-green-50 text-green-600" : "border-red-100 bg-red-50 text-red-600"
          )}>
            <Activity className={cn("w-3 h-3", analytics && "animate-pulse")} />
            {analytics ? "Telemetry Active" : "Analytics Idle"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="rounded-full h-10 w-10 border-muted">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button onClick={() => handleDownloadReport('revenue')} className="lg:w-auto h-10 px-8 rounded-full font-black text-[9px] uppercase bg-primary text-white shadow-lg shadow-primary/20">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Gross Revenue" value={`₹${metrics.revenue}`} icon={IndianRupee} color="text-primary bg-primary/10" onClick={() => setActiveDetail('revenue')} />
        <MetricCard label="Total Orders" value={metrics.total} icon={ShoppingBag} color="text-blue-600 bg-blue-50" onClick={() => setActiveDetail('orders')} />
        <MetricCard label="Kitchen Load" value={metrics.pending} icon={Clock} color="text-orange-500 bg-orange-50" onClick={() => setActiveDetail('kitchen')} />
        <MetricCard label="Customers Base" value={metrics.totalRegisteredUsers} icon={Users} color="text-purple-600 bg-purple-50" onClick={() => setActiveDetail('customers')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 overflow-hidden">
          <CardHeader className="px-0 pb-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black font-headline uppercase tracking-tighter">Business Velocity</CardTitle>
            <Badge variant="outline" className="text-[8px] font-black uppercase text-primary border-primary/20 px-3 py-1">Live</Badge>
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: '08:00', val: Math.round(metrics.revenue * 0.1) },
                { name: '12:00', val: Math.round(metrics.revenue * 0.4) },
                { name: '16:00', val: Math.round(metrics.revenue * 0.2) },
                { name: '20:00', val: Math.round(metrics.revenue * 0.3) },
              ]}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y2="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900}} />
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)'}} />
                <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={3} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b bg-muted/5 flex flex-row items-center justify-between">
             <div className="flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-primary" />
               <CardTitle className="text-sm font-black uppercase tracking-widest">Security Logs</CardTitle>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setActiveDetail('activity')} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {eventsLoading ? (
              <div className="h-full flex items-center justify-center opacity-20"><Loader2 className="animate-spin" /></div>
            ) : loginEvents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] font-black uppercase opacity-20">No logs found</div>
            ) : (
              loginEvents.slice(0, 10).map((event: any, i: number) => (
                <div key={i} className="flex gap-4 p-3 bg-secondary/20 rounded-2xl border border-border/10">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                     event.role === 'admin' ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-600"
                   )}>
                     <ShieldCheck className="w-5 h-5" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase truncate">{event.name}</p>
                      <p className="text-[8px] font-bold opacity-50 uppercase truncate">{event.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[7px] font-black uppercase bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border">{event.role}</span>
                         <span className="text-[7px] font-medium opacity-40 uppercase">
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

      <Dialog open={!!activeDetail} onOpenChange={() => setActiveDetail(null)}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 max-h-[85vh] flex flex-col">
          <div className="p-8 border-b bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg"><BarChart3 className="w-5 h-5" /></div>
                <DialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter">{activeDetail?.toUpperCase()} BREAKDOWN</DialogTitle>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setActiveDetail(null)} className="rounded-full hover:bg-secondary"><XCircle className="w-6 h-6 text-muted-foreground" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            {activeDetail === 'revenue' && <RevenueDetail metrics={metrics} onExport={() => handleDownloadReport('revenue')} />}
            {activeDetail === 'orders' && <OrdersDetail orders={orders} onExport={() => handleDownloadReport('orders')} />}
            {activeDetail === 'kitchen' && <KitchenDetail orders={orders} />}
            {activeDetail === 'customers' && <CustomersDetail users={allUsers} onExport={() => handleDownloadReport('customers')} />}
            {activeDetail === 'activity' && <ActivityDetail events={loginEvents} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color, onClick }: any) => (
  <Card onClick={onClick} className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 hover:scale-[1.02] transition-all cursor-pointer group active:scale-95 border-b-4 border-b-transparent hover:border-b-primary">
    <div className="flex justify-between items-start mb-6">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm", color)}><Icon className="w-7 h-7" /></div>
      <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all" />
    </div>
    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-4xl font-black font-headline tracking-tighter italic">{value}</h3>
  </Card>
);

const RevenueDetail = ({ metrics, onExport }: any) => (
  <div className="space-y-8">
    <Card className="rounded-[2rem] p-8 border-none bg-secondary/20 dark:bg-zinc-900 shadow-inner">
       <h4 className="text-[11px] font-black uppercase mb-6 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Top Performers</h4>
       <div className="space-y-3">
         {metrics.itemStats.slice(0, 5).map((item: any, i: number) => (
           <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm">
             <span className="font-black text-[11px] uppercase truncate flex-1 pr-4">{item.name}</span>
             <span className="font-black text-primary italic whitespace-nowrap">₹{item.revenue}</span>
           </div>
         ))}
       </div>
    </Card>
    <div className="flex justify-end pt-4"><Button className="rounded-xl h-12 px-6 font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20" onClick={onExport}><Download className="w-4 h-4 mr-2" /> Download Log</Button></div>
  </div>
);

const ActivityDetail = ({ events }: { events: any[] }) => (
  <div className="space-y-6">
    <h4 className="text-[11px] font-black uppercase flex items-center gap-2 mb-6"><History className="w-4 h-4 text-primary" /> Comprehensive Audit Feed</h4>
    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border overflow-hidden shadow-xl">
       <table className="w-full">
         <thead className="bg-secondary/20 border-b"><tr className="text-[9px] font-black uppercase text-left"><th className="p-6">Entity</th><th className="p-6">Role</th><th className="p-6">Access Point</th><th className="p-6 text-right">Timestamp</th></tr></thead>
         <tbody className="divide-y">
           {events.map((e: any, i: number) => (
             <tr key={i} className="hover:bg-secondary/5 transition-colors">
               <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-black text-xs uppercase">{e.name}</span>
                    <span className="text-[9px] font-medium opacity-40">{e.email}</span>
                  </div>
               </td>
               <td className="p-6"><Badge className="bg-primary/10 text-primary border-none text-[8px] uppercase font-black">{e.role}</Badge></td>
               <td className="p-6 text-[10px] font-bold opacity-60 uppercase">{e.platform || 'Web App'}</td>
               <td className="p-6 text-right font-black text-[9px] italic">
                 {e.timestamp?.toDate ? format(e.timestamp.toDate(), 'MMM d, hh:mm a') : 'Recently'}
               </td>
             </tr>
           ))}
         </tbody>
       </table>
    </div>
  </div>
);

const OrdersDetail = ({ orders, onExport }: any) => {
  const counts = useMemo(() => {
    const c: any = { Pending: 0, Confirmed: 0, Preparing: 0, Delivered: 0 };
    orders.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(counts).map(([label, val]: any) => (
          <div key={label} className="p-6 rounded-[2rem] bg-secondary/20 dark:bg-zinc-900 text-center shadow-inner">
             <p className="text-[9px] font-black uppercase opacity-50 mb-1">{label}</p>
             <p className="text-2xl font-black">{val}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4"><Button className="rounded-xl h-12 px-6 font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20" onClick={onExport}><Download className="w-4 h-4 mr-2" /> Export History</Button></div>
    </div>
  );
};

const KitchenDetail = ({ orders }: any) => (
  <div className="space-y-6">
    <h4 className="text-[11px] font-black uppercase flex items-center gap-2 mb-6"><Zap className="w-4 h-4 text-orange-500" /> Active Operational Feed</h4>
    <div className="space-y-3">
      {orders.filter((o: any) => ['Pending', 'Confirmed', 'Preparing'].includes(o.status)).slice(0, 10).map((o: any) => (
        <div key={o.id} className="flex items-center justify-between p-4 bg-secondary/20 dark:bg-zinc-900 rounded-2xl shadow-inner border border-white/5">
          <div className="flex-1 truncate pr-4">
             <p className="font-black text-[11px] uppercase truncate">{o.items?.map((i: any) => i.name).join(', ')}</p>
             <p className="text-[8px] font-bold opacity-40 uppercase">Ticket #{o.orderId}</p>
          </div>
          <Badge className="font-black text-[8px] uppercase bg-primary text-white border-none shadow-sm px-3">{o.status}</Badge>
        </div>
      ))}
    </div>
  </div>
);

const CustomersDetail = ({ users, onExport }: any) => (
  <div className="space-y-8">
    <Card className="rounded-[2.5rem] p-0 border-none bg-white dark:bg-zinc-900 shadow-xl overflow-hidden border border-border/40">
       <table className="w-full">
         <thead className="bg-secondary/20 border-b"><tr className="text-[9px] font-black uppercase text-left"><th className="p-6">Customer</th><th className="p-6 text-right">Engagement</th></tr></thead>
         <tbody className="divide-y">
           {(users || []).slice(0, 8).map((u: any, i: number) => (
             <tr key={i} className="hover:bg-secondary/5 transition-colors">
               <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-black text-xs uppercase">{u.name || 'Anonymous'}</span>
                    <span className="text-[9px] font-medium opacity-40">{u.email}</span>
                  </div>
               </td>
               <td className="p-6 text-right font-black text-[10px] text-primary italic">{u.orderCount || 0} Orders</td>
             </tr>
           ))}
         </tbody>
       </table>
    </Card>
    <div className="flex justify-end pt-4"><Button className="rounded-xl h-12 px-6 font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20" onClick={onExport}><Download className="w-4 h-4 mr-2" /> Export Audit</Button></div>
  </div>
);
