
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
  ChevronRight
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface ArchiveSystemProps {
  orders: any[];
  onViewDetails: (order: any) => void;
}

const ITEMS_PER_PAGE = 20;

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

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'orderplaced':
        return { label: 'PLACED', class: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'confirmed':
        return { label: 'CONFIRMED', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      case 'preparing':
        return { label: 'PREPARING', class: 'bg-orange-50 text-orange-600 border-orange-100' };
      case 'outfordelivery':
        return { label: 'OUT FOR DELIVERY', class: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'delivered':
        return { label: 'DELIVERED', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'cancelled':
        return { label: 'CANCELLED', class: 'bg-rose-50 text-rose-600 border-rose-100' };
      default:
        return { label: (status || 'UNKNOWN').toUpperCase(), class: 'bg-zinc-50 text-zinc-600 border-zinc-100' };
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic text-zinc-400">Order <span className="text-primary">Master Ledger</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Records: {filteredOrders.length}</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 border-2">
          <Download className="w-5 h-5" /> Export Ledger
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
            <Input 
              placeholder="Search by Ticket ID, Customer or Mobile..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-base" 
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
             <select 
               value={statusFilter} 
               onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
               className="h-14 px-6 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest outline-none"
             >
               <option value="all">All States</option>
               <option value="orderPlaced">Placed</option>
               <option value="confirmed">Confirmed</option>
               <option value="preparing">Preparing</option>
               <option value="outForDelivery">Out for Delivery</option>
               <option value="delivered">Delivered</option>
               <option value="Cancelled">Cancelled</option>
             </select>
          </div>
        </div>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr className="text-[10px] font-black uppercase text-muted-foreground text-left tracking-[0.2em]">
                <th className="px-10 py-6">Identity Ticker</th>
                <th className="px-10 py-6">Recipient Entity</th>
                <th className="px-10 py-6">Fulfillment</th>
                <th className="px-10 py-6">Gross Sum</th>
                <th className="px-10 py-6 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center opacity-10">
                    <History className="w-20 h-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-[0.4em] text-sm italic">No Records Match</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-primary/5 transition-all group cursor-pointer"
                      onClick={() => onViewDetails(order)}
                    >
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-primary italic">#{order.orderId}</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase">
                            {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM dd, hh:mm a') : 'Legacy'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <p className="font-black text-sm uppercase tracking-tighter truncate max-w-[150px]">{order.customerName || 'Anonymous'}</p>
                        <p className="text-[9px] font-bold opacity-40">{order.customerPhone}</p>
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest">{order.orderType || 'Online'}</span>
                            <Badge className={cn("border px-2 py-0.5 rounded text-[7px] font-black uppercase w-fit", statusInfo.class)}>{statusInfo.label}</Badge>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <p className="font-black text-xl italic">₹{order.total}</p>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={(e) => handleOpenEdit(e, order)} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 transition-all"><Edit2 className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all"><Eye className="w-4 h-4" /> Manifest</Button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-8 border-t flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/30">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="rounded-xl h-10 w-10 p-0 border-2"
               >
                 <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="rounded-xl h-10 w-10 p-0 border-2"
               >
                 <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
          </div>
        )}
      </Card>

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
                     <SelectItem value="orderPlaced" className="font-bold">PLACED</SelectItem>
                     <SelectItem value="confirmed" className="font-bold">CONFIRMED</SelectItem>
                     <SelectItem value="preparing" className="font-bold">PREPARING</SelectItem>
                     <SelectItem value="outForDelivery" className="font-bold">OUT FOR DELIVERY</SelectItem>
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
