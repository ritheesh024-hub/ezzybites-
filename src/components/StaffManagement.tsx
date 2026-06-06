'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Trash2, 
  ShieldCheck, Receipt, ChefHat,
  Loader2, Search,
  MoreVertical, Edit3, Eye,
  Fingerprint, Copy, AlertCircle, CheckCircle2,
  Ban, RefreshCcw, UserCircle2, UserCog
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { StaffRole } from '@/app/admin/dashboard/page';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const StaffManagement = () => {
  const db = useFirestore();
  const auth = getAuth();
  const { user: currentUser } = useUser();
  
  const staffQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
  }, [db]);
  
  const { data: staffList, loading } = useCollection<any>(staffQuery);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [alertAction, setAlertAction] = useState<{ type: 'delete' | 'disable' | 'enable', staffId: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier' as StaffRole,
    photoUrl: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const handleAddStaff = async () => {
    if (!db) return;
    if (!formData.email || !formData.name) {
      toast({ variant: "destructive", title: "Required Fields", description: "Name and Email are mandatory." });
      return;
    }

    setSubmitting(true);
    const newStaffId = `staff-${Date.now()}`;
    const staffRef = doc(db, 'admins', newStaffId);
    const staffData = {
      id: newStaffId,
      name: formData.name,
      email: formData.email.toLowerCase(),
      phone: formData.phone || '',
      role: formData.role,
      status: 'active',
      onlineStatus: 'offline',
      photoUrl: formData.photoUrl || `https://picsum.photos/seed/${newStaffId}/200`,
      createdAt: serverTimestamp(),
      lastLoginAt: null,
      stats: {
        ordersHandled: 0,
        billsGenerated: 0,
        kitchenUpdates: 0
      }
    };

    setDoc(staffRef, staffData)
      .then(() => {
        toast({ title: "Staff Member Added", description: `${formData.name} has been added.` });
        setIsAddDialogOpen(false);
        resetForm();
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: staffRef.path,
          operation: 'create',
          requestResourceData: staffData
        }));
      })
      .finally(() => setSubmitting(false));
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff || !db) return;
    setSubmitting(true);
    const staffRef = doc(db, 'admins', selectedStaff.id);
    const updateData = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      photoUrl: formData.photoUrl
    };

    updateDoc(staffRef, updateData)
      .then(() => {
        toast({ title: "Profile Updated", description: "Record synchronized." });
        setIsEditDialogOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: staffRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
      .finally(() => setSubmitting(false));
  };

  const handleResetPassword = async (email: string) => {
    if (!auth || !email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset Link Sent",
        description: `Instructions sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message,
      });
    }
  };

  const handleAlertConfirm = async () => {
    if (!alertAction || !db) return;
    const { type, staffId } = alertAction;
    const staffRef = doc(db, 'admins', staffId);
    
    if (type === 'delete') {
      if (staffId === currentUser?.uid) {
        toast({ variant: "destructive", title: "Action Blocked", description: "You cannot delete your own active session." });
        setIsAlertDialogOpen(false);
        return;
      }
      deleteDoc(staffRef)
        .then(() => toast({ title: "Staff Deleted" }))
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: staffRef.path,
            operation: 'delete'
          }));
        })
        .finally(() => setIsAlertDialogOpen(false));
    } else {
      const status = type === 'disable' ? 'disabled' : 'active';
      updateDoc(staffRef, { status })
        .then(() => toast({ title: `Access ${status}` }))
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: staffRef.path,
            operation: 'update',
            requestResourceData: { status }
          }));
        })
        .finally(() => setIsAlertDialogOpen(false));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', role: 'cashier', photoUrl: '' });
  };

  const openEdit = (staff: any) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'cashier',
      photoUrl: staff.photoUrl || ''
    });
    setTimeout(() => setIsEditDialogOpen(true), 50);
  };

  const openProfile = (staff: any) => {
    setSelectedStaff(staff);
    setTimeout(() => setIsProfileDialogOpen(true), 50);
  };

  const triggerAlert = (type: 'delete' | 'disable' | 'enable', staffId: string) => {
    setAlertAction({ type, staffId });
    setIsAlertDialogOpen(true);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-3.5 h-3.5 text-primary" />;
      case 'cashier': return <Receipt className="w-3.5 h-3.5 text-blue-500" />;
      case 'kitchen': return <ChefHat className="w-3.5 h-3.5 text-orange-500" />;
      default: return <Users className="w-3.5 h-3.5" />;
    }
  };

  const getOnlineStatus = (status: string) => {
    switch (status) {
      case 'online': return <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[9px] font-black uppercase text-green-600">Online</span></div>;
      case 'busy': return <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /><span className="text-[9px] font-black uppercase text-orange-600">Busy</span></div>;
      default: return <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /><span className="text-[9px] font-black uppercase text-zinc-400">Offline</span></div>;
    }
  };

  const filteredStaff = useMemo(() => {
    if (!staffList) return [];
    return staffList.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Team <span className="text-primary italic">Ops</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Manage permissions, monitor activity, and grow your crew.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <UserPlus className="w-5 h-5" /> Add New Staff
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email or UID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold" />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 w-full lg:w-40 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest">
              <SelectValue placeholder="Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="cashier">Cashiers</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-full lg:w-40 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-40 text-center space-y-4">
              <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary" />
              <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Syncing Staff Directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/10 dark:bg-zinc-800 border-b">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground text-left">
                    <th className="px-8 py-6">Member & UID</th>
                    <th className="px-8 py-6">Role</th>
                    <th className="px-8 py-6">Identity Verification</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center opacity-30">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">No staff members found</p>
                      </td>
                    </tr>
                  ) : filteredStaff.map((staff) => (
                    <tr key={staff.id} className={cn("hover:bg-secondary/5 transition-colors group", staff.id === currentUser?.uid && "bg-primary/5")}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-2xl shadow-md border-2 border-background shrink-0">
                            <AvatarImage src={staff.photoUrl} alt={staff.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black">
                              {(staff.name || 'EB').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm group-hover:text-primary transition-colors truncate">{staff.name || 'Anonymous'}</span>
                              {staff.id === currentUser?.uid && (
                                <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary bg-primary/5 px-1 py-0">You</Badge>
                              )}
                            </div>
                            <span className="text-[9px] font-medium opacity-50 truncate">{staff.email}</span>
                            <span className="text-[8px] font-black text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                              <Fingerprint className="w-2.5 h-2.5" /> {staff.id.slice(0, 16)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="outline" className="rounded-full px-3 py-1 gap-2 border-muted bg-zinc-50 dark:bg-zinc-800 text-foreground font-black uppercase text-[8px] tracking-widest">
                          {getRoleIcon(staff.role)}
                          {staff.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        {staff.id.startsWith('staff-') ? (
                          <div className="flex flex-col gap-1">
                             <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black text-[7px] uppercase w-fit px-1.5 py-0">Invite Placeholder</Badge>
                             <p className="text-[8px] font-medium text-muted-foreground italic">Linked via email invite</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                             <Badge className="bg-green-50 text-green-600 border-green-100 font-black text-[7px] uppercase w-fit px-1.5 py-0">Real Identity</Badge>
                             <p className="text-[8px] font-black text-muted-foreground/40 uppercase">Verified Firebase UID</p>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {staff.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 border-none px-2 font-black text-[8px] uppercase">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-none px-2 font-black text-[8px] uppercase">Blocked</Badge>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary"><MoreVertical className="w-5 h-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-3xl border-none">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openProfile(staff); }} className="rounded-xl gap-3 py-3 font-bold cursor-pointer"><Eye className="w-4 h-4 text-blue-500" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEdit(staff); }} className="rounded-xl gap-3 py-3 font-bold cursor-pointer"><Edit3 className="w-4 h-4 text-primary" /> Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Account Control</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => copyText(staff.id)} className="rounded-xl gap-3 py-3 font-bold cursor-pointer"><Fingerprint className="w-4 h-4 text-zinc-500" /> Copy UID</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(staff.email)} className="rounded-xl gap-3 py-3 font-bold cursor-pointer"><RefreshCcw className="w-4 h-4 text-purple-500" /> Send Reset Link</DropdownMenuItem>
                            {staff.status === 'active' ? (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); triggerAlert('disable', staff.id); }} className="rounded-xl gap-3 py-3 font-bold text-orange-600 cursor-pointer"><Ban className="w-4 h-4" /> Block Access</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); triggerAlert('enable', staff.id); }} className="rounded-xl gap-3 py-3 font-bold text-green-600 cursor-pointer"><CheckCircle2 className="w-4 h-4" /> Unblock Access</DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onSelect={(e) => { e.preventDefault(); triggerAlert('delete', staff.id); }} 
                              className={cn("rounded-xl gap-3 py-3 font-bold text-destructive cursor-pointer", staff.id === currentUser?.uid && "opacity-30 cursor-not-allowed")}
                              disabled={staff.id === currentUser?.uid}
                            >
                              <Trash2 className="w-4 h-4" /> Delete Forever
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-10 border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter">Add <span className="text-primary italic">Recruit</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Staff Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Work Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-bold" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Assigned Role</Label>
                <Select value={formData.role} onValueChange={(v: StaffRole) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="h-14 rounded-xl bg-secondary/20 dark:bg-zinc-800 border-muted font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="cashier">Billing Cashier</SelectItem>
                    <SelectItem value="kitchen">Kitchen Chef</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Mobile</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 dark:bg-zinc-800 font-bold" />
              </div>
            </div>
            <Button className="w-full h-18 rounded-2xl font-black text-lg bg-primary text-white mt-4" onClick={handleAddStaff} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : 'Register Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Detail View */}
      <Dialog open={isProfileDialogOpen} onOpenChange={(open) => {
        setIsProfileDialogOpen(open);
        if(!open) setTimeout(() => setSelectedStaff(null), 300);
      }}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Staff Profile: {selectedStaff?.name || 'Details'}</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="flex flex-col">
              <div className="relative h-48 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute -bottom-12 left-10">
                  <Avatar className="h-32 w-32 rounded-[2.5rem] border-8 border-white dark:border-zinc-900 shadow-2xl">
                    <AvatarImage src={selectedStaff.photoUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-3xl">{(selectedStaff.name || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="pt-16 px-10 pb-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black font-headline tracking-tighter uppercase">{selectedStaff.name || 'Staff Member'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">{selectedStaff.role}</Badge>
                      {getOnlineStatus(selectedStaff.onlineStatus)}
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-2xl text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Internal Reference UID</p>
                    <p className="text-[10px] font-mono font-bold flex items-center gap-2">
                      {selectedStaff.id}
                      <Copy className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" onClick={() => copyText(selectedStaff.id)} />
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-2xl flex items-start gap-4">
                  {selectedStaff.id.startsWith('staff-') ? (
                    <>
                      <UserCog className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange-700">Account Type: Placeholder</p>
                        <p className="text-[11px] font-medium leading-relaxed">This record was created via a manual invite. It will automatically merge with a real account when the user logs in for the first time.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <UserCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-green-700">Account Type: Verified</p>
                        <p className="text-[11px] font-medium leading-relaxed">This is a confirmed operational account linked to a unique Firebase identifier.</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className={cn(
                    "p-6 rounded-3xl space-y-1 transition-all",
                    selectedStaff.role === 'cashier' ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100" : "bg-secondary/30 dark:bg-zinc-800"
                  )}>
                    <p className="text-[9px] font-black uppercase opacity-40">Orders Handled</p>
                    <p className={cn("text-2xl font-black italic", selectedStaff.role === 'cashier' && "text-blue-600")}>{selectedStaff.stats?.ordersHandled || 0}</p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-3xl space-y-1 transition-all",
                    selectedStaff.role === 'cashier' ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100" : "bg-secondary/30 dark:bg-zinc-800"
                  )}>
                    <p className="text-[9px] font-black uppercase opacity-40">Bills Generated</p>
                    <p className={cn("text-2xl font-black italic", selectedStaff.role === 'cashier' && "text-blue-600")}>{selectedStaff.stats?.billsGenerated || 0}</p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-3xl space-y-1 transition-all",
                    selectedStaff.role === 'kitchen' ? "bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-100" : "bg-secondary/30 dark:bg-zinc-800"
                  )}>
                    <p className="text-[9px] font-black uppercase opacity-40">Kitchen Updates</p>
                    <p className={cn("text-2xl font-black italic", selectedStaff.role === 'kitchen' && "text-orange-600")}>{selectedStaff.stats?.kitchenUpdates || 0}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-dashed">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="opacity-40">Registered Email</span>
                      <span className="font-bold">{selectedStaff.email}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="opacity-40">Joining Date</span>
                      <span className="font-bold">{selectedStaff.createdAt?.toDate ? selectedStaff.createdAt.toDate().toLocaleDateString() : 'Active Member'}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl bg-white dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" /> Security Check
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-base mt-4 leading-relaxed">
              {alertAction?.type === 'delete' && "Are you sure? This will permanently remove the staff member from the database."}
              {alertAction?.type === 'disable' && "This will block the staff member from logging in until re-enabled."}
              {alertAction?.type === 'enable' && "This will restore system access for this staff member."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm} className={cn("h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest", alertAction?.type === 'delete' ? "bg-destructive text-white" : "bg-primary text-white")}>Confirm Action</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
