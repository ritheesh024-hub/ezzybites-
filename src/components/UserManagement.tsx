
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Search, Loader2, 
  CalendarDays, Mail, Phone,
  Clock, ShieldCheck, UserCircle2,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 20;

export const UserManagement = () => {
  const db = useFirestore();
  const usersQuery = useMemo(() => db ? query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1000)) : null, [db]);
  const { data: users, loading } = useCollection<any>(usersQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (u.phone || '').includes(searchQuery);
      return matchesSearch;
    });
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleExportUsers = () => {
    if (!filteredUsers.length) return;
    const headers = ["Name", "Email", "Phone", "Registration Date", "Order Count"];
    const rows = filteredUsers.map(u => [
      u.name || 'Anonymous',
      u.email || 'N/A',
      u.phone || 'N/A',
      u.createdAt?.toDate ? format(u.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
      u.orderCount || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EzzyBites_CRM_Audit_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Customer <span className="text-primary">CRM</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Directory Size: {filteredUsers.length}</p>
        </div>
        <Button onClick={handleExportUsers} className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 bg-zinc-950 text-white shadow-3xl hover:bg-zinc-800 transition-all">
          <Download className="w-5 h-5" /> Export CRM
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border shadow-sm border-zinc-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
          <Input 
            placeholder="Search by identity, email or contact..." 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
            className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-base" 
          />
        </div>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-48 text-center space-y-6">
              <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary opacity-20" />
              <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground animate-pulse">Establishing Identity Sync...</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground text-left tracking-[0.2em]">
                    <th className="px-10 py-6">Identity Registry</th>
                    <th className="px-10 py-6">Verification Node</th>
                    <th className="px-10 py-6">Behavioral Metrics</th>
                    <th className="px-10 py-6">Registry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center opacity-10">
                        <UserCircle2 className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.4em] text-sm italic">No entries found</p>
                      </td>
                    </tr>
                  ) : paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-primary/5 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <Avatar className="h-14 w-14 rounded-2xl shadow-xl border-4 border-white dark:border-zinc-800 shrink-0">
                            <AvatarImage src={u.photoUrl} alt={u.name} />
                            <AvatarFallback className="bg-zinc-950 text-white font-black text-base">
                              {(u.name || 'EB').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-base uppercase tracking-tighter truncate">{u.name || 'Guest'}</span>
                            <span className="text-[10px] font-medium opacity-50 truncate flex items-center gap-2 mt-0.5">
                               <Mail className="w-3.5 h-3.5" /> {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                               <ShieldCheck className={cn("w-4 h-4", u.email ? "text-emerald-500" : "text-zinc-300")} />
                               <span className="text-[10px] font-black uppercase tracking-tight">{u.email ? 'Identity Verified' : 'Standard Node'}</span>
                            </div>
                            {u.phone && <p className="text-[11px] font-bold text-muted-foreground">+91 {u.phone}</p>}
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <Badge className="bg-zinc-950 text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest rounded-lg">
                            {u.orderCount || 0} Orders
                         </Badge>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground opacity-30 italic">
                           <CalendarDays className="w-4 h-4" />
                           {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM dd, yyyy') : 'Pre-Launch'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        
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
    </div>
  );
};
