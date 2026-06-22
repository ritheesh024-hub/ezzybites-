'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  History, 
  Search, 
  Eye, 
  Download, 
  ShoppingBag,
  Clock,
  User,
  Utensils,
  Package,
  Edit2,
  Save,
  Loader2,
  MapPin,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface ArchiveSystemProps {
  orders: any[];
  onViewDetails: (order: any) => void;
}

const ITEMS_PER_PAGE = 30;

export const ArchiveSystem = ({ orders, onViewDetails }: ArchiveSystemProps) => {
  const db = useFirestore();
  const { user: staffUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Edit State
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone?.includes(searchQuery);
      
      const status = (o.status || '').toLowerCase();
      const filterValue = statusFilter.toLowerCase();
      
      const matchesStatus = 
        statusFilter === 'all' || 
        status === filterValue;

      const matchesType = 
        typeFilter === 'all' || 
        (typeFilter === 'Online' && !o.isStoreBill) ||
        (typeFilter === 'Dine-In' && o.orderType === 'Dine-In') ||
        (typeFilter === 'Take Away' && o.orderType === 'Take Away');

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: { label: string, items: any[] } } = {};
    
    paginatedOrders.forEach(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        let label = format(date, 'dd MMMM yyyy');
        if (isToday(date)) label = 'Today';
        else if (isYesterday(date)) label = 'Yesterday';
        
        groups[dateKey] = { label, items: [] };
      }
      groups[dateKey].items.push(order);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [paginatedOrders]);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'orderplaced':
      case 'pending':
        return { label: 'PLACED', class: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400' };
      case 'confirmed':
      case 'accepted':
        return { label: 'CONFIRMED', class: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400' };
      case 'preparing':
        return { label: 'PREPARING', class: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400' };
      case 'outfordelivery':
      case 'out_for_delivery':
        return { label: 'OUT FOR DELIVERY', class: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400' };
      case 'delivered':
        return { label: 'DELIVERED', class: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' };
      case 'cancelled':
        return { label: 'CANCELLED', class: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400' };
      default:
        return { label: (status || 'UNKNOWN').toUpperCase(), class: 'bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400' };
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    setEditingOrder({ ...order });
    setIsEditProfileOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!db || !editingOrder || !editingOrder.id) return;
    setSaving(true);
    try {
      const orderRef = doc(db, 'orders', editingOrder.id);
      const statusChanged = orders.find(o => o.id === editingOrder.id)?.status !== editingOrder.status;

      await updateDoc(orderRef, {
        customerName: editingOrder.customerName,
        customerPhone: editingOrder.customerPhone,
        address: editingOrder.address,
        instructions: editingOrder.instructions,
        status: editingOrder.status,
        updatedAt: serverTimestamp()
      });

      if (statusChanged && editingOrder.userId) {
        const notifRef = collection(db, 'user_notifications', editingOrder.userId, 'items');
        await addDoc(notifRef, {
          title: `Order Updated: ${editingOrder.status}`,
          message: `Your ticket #${editingOrder.orderId} status has changed.`,
          type: 'order',
          orderId: editingOrder.orderId,
          ctaLink: `/orders/${editingOrder.orderId}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      toast({ title: "Order Synchronized" });
      setIsEditProfileOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = ["OrderID", "Customer", "Phone", "Type", "Status", "Amount", "Date"];
    const rows = filteredOrders.map(o => [
      o.orderId,
      o.customerName,
      o.customerPhone,
      o.orderType || 'Online',
      o.status,
      o.total,
      o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EzzyBites_Archive_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter italic text-zinc-400">Order <span className="text-primary">Master Ledger</span></h2>
          <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-tight">System Records: {filteredOrders.length}</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="h-12 md:h-16 px-6 md:px-10 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest gap-3 border-2 w-full md:w-auto">
          <Download className="w-4 h-4 md:w-5 md:h-5" /> Export Ledger
        </Button>
      </div>

      <div className="sticky top-[118px] lg:top-[70px] z-30 bg-zinc-50 dark:bg-zinc-950 py-2 -mx-4 px-4">
        <div className="bg-white dark:bg-zinc-900 p-2.5 md:p-3 rounded-2xl border shadow-sm flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
            <Input 
              placeholder="Search by Ticket ID, Customer or Mobile..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              className="h-10 md:h-11 pl-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-sm" 
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
             <select 
               value={statusFilter} 
               onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
               className="h-10 md:h-11 px-4 md:px-6 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[8px] md:text-[9px] tracking-widest outline-none flex-1 lg:w-48"
             >
               <option value="all">All States</option>
               <option value="pending">Placed</option>
               <option value="accepted">Confirmed</option>
               <option value="preparing">Preparing</option>
               <option value="out_for_delivery">Out for Delivery</option>
               <option value="delivered">Delivered</option>
               <option value="Cancelled">Cancelled</option>
             </select>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {groupedOrders.length === 0 ? (
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-20 text-center flex flex-col items-center justify-center gap-4 opacity-30">
            <History className="w-16 h-16" />
            <p className="font-black uppercase tracking-[0.4em] text-sm italic">No Records Match Nodes</p>
          </Card>
        ) : (
          groupedOrders.map(([dateKey, group]) => (
            <div key={dateKey} className="space-y-4">
              <div className="sticky top-[180px] lg:top-[130px] z-20 flex items-center justify-between py-2.5 px-6 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h3 className="font-black uppercase tracking-tighter text-sm italic">{group.label}</h3>
                </div>
                <Badge variant="secondary" className="rounded-lg h-6 px-2 font-black text-[9px] bg-white dark:bg-zinc-800">{group.items.length} Tickets</Badge>
              </div>

              <div className="grid gap-3">
                {group.items.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  return (
                    <Card 
                      key={order.id} 
                      className="rounded-[1.5rem] border-none shadow-sm hover:shadow-xl transition-all group cursor-pointer bg-white dark:bg-zinc-900 overflow-hidden"
                      onClick={() => onViewDetails(order)}
                    >
                      <CardContent className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="w-12 h-12 rounded-2xl bg-secondary/50 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-primary">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                               <span className="font-black text-primary italic text-sm md:text-base">#{order.orderId}</span>
                               <Badge className={cn("border-none px-2 py-0.5 rounded-[4px] text-[7px] font-black uppercase", statusInfo.class)}>{statusInfo.label}</Badge>
                            </div>
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-tight truncate max-w-[180px]">{order.customerName || 'Guest'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto md:gap-12 pt-3 md:pt-0 border-t md:border-none border-zinc-100 dark:border-zinc-800">
                          <div className="flex flex-col items-start md:items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Gross</span>
                            <span className="text-lg md:text-xl font-black text-primary italic leading-none">₹{order.total}</span>
                          </div>
                          <div className="flex flex-col items-start md:items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Protocol</span>
                            <span className="text-[10px] font-bold uppercase">{order.orderType || 'Online'}</span>
                          </div>
                          <div className="flex gap-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={(e) => handleOpenEdit(e, order)} 
                               className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary transition-all shrink-0"
                             >
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             <div className="w-10 h-10 rounded-xl bg-secondary dark:bg-zinc-800 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white transition-all">
                               <ChevronRight className="w-4 h-4" />
                             </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Epoch Node {currentPage} of {totalPages}</p>
          <div className="flex gap-2 w-full md:w-auto">
             <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex-1 md:flex-none rounded-xl h-12 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
             >
               <ChevronLeft className="w-4 h-4" /> Previous
             </Button>
             <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex-1 md:flex-none rounded-xl h-12 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
             >
               Next <ChevronRight className="w-4 h-4" />
             </Button>
          </div>
        </div>
      )}

      {/* EDIT ORDER DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
           <div className="p-10 bg-primary text-white shrink-0">
             <DialogHeader>
                <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter italic">Modify <span className="opacity-80">Ticket</span></DialogTitle>
                <DialogDescription className="text-white/70 font-medium text-[10px] uppercase tracking-widest mt-2">Syncing Metadata for #{editingOrder?.orderId}</DialogDescription>
             </DialogHeader>
          </div>
          <div className="p-10 space-y-8 max-h-[50vh] overflow-y-auto scrollbar-hide">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Entity Identity</Label>
                <Input value={editingOrder?.customerName || ''} onChange={e => setEditingOrder({...editingOrder, customerName: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Operational State</Label>
                <Select value={editingOrder?.status} onValueChange={v => setEditingOrder({...editingOrder, status: v})}>
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-black uppercase text-[10px] tracking-widest px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                     <SelectItem value="pending" className="font-bold">PLACED</SelectItem>
                     <SelectItem value="accepted" className="font-bold">CONFIRMED</SelectItem>
                     <SelectItem value="preparing" className="font-bold">PREPARING</SelectItem>
                     <SelectItem value="out_for_delivery" className="font-bold">OUT FOR DELIVERY</SelectItem>
                     <SelectItem value="delivered" className="font-bold">DELIVERED</SelectItem>
                     <SelectItem value="Cancelled" className="font-bold">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Delivery Address</Label>
              <Textarea value={editingOrder?.address || ''} onChange={e => setEditingOrder({...editingOrder, address: e.target.value})} className="min-h-[100px] rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-medium px-6 py-4" />
            </div>
          </div>
          <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t flex gap-3">
             <Button variant="outline" className="h-16 flex-1 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setIsEditProfileOpen(false)}>Close</Button>
             <Button className="h-16 flex-[2] rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl" onClick={handleSaveEdit} disabled={saving}>
               {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5 mr-2" /> Save</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};