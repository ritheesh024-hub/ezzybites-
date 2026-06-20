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
  Loader2, 
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
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { StaffRole } from '@/app/admin/dashboard/page';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const StaffManagement = () => {
  const db = useFirestore();
  const auth = useAuth();
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
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [staffList, roleFilter, statusFilter]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Team <span className="text-primary">Registry</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Manage permissions, monitor activity, and grow your crew.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 bg-primary text-white shadow-3xl hover:scale-[1.02] transition-all">
          <UserPlus className="w-5 h-5" /> Register Staff
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border shadow-sm border-zinc-100">
        <div className="flex gap-4 w-full justify-between lg:justify-start">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-14 w-full lg:w-48 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest px-6">
              <SelectValue placeholder="Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="cashier">Cashiers</SelectItem>
              <SelectItem value="kitchen">Kitchen Station</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-14 w-full lg:w-48 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Access</SelectItem>
              <SelectItem value="active">Operational</SelectItem>
              <SelectItem value="disabled">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-48 text-center space-y-6">
              <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary opacity-20" />
              <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground animate-pulse">Establishing Team Sync...</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground text-left tracking-[0.2em]">
                    <th className="px-10 py-6">Member Identity</th>
                    <th className="px-10 py-6">Operational Role</th>
                    <th className="px-10 py-6">Entity Verification</th>
                    <th className="px-10 py-6">Access Hub</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center opacity-10">
                        <Users className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.4em] text-sm italic">Registry Entry Empty</p>
                      </td>
                    </tr>
                  ) : filteredStaff.map((staff) => (
                    <tr key={staff.id} className={cn("hover:bg-primary/5 transition-all group", staff.id === currentUser?.uid && "bg-primary/5")}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <Avatar className="h-14 w-14 rounded-2xl shadow-xl border-4 border-white dark:border-zinc-800 shrink-0 group-hover:scale-110 transition-transform duration-700">
                            <AvatarImage src={staff.photoUrl} alt={staff.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black">
                              {(staff.name || 'EB').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base uppercase tracking-tighter group-hover:text-primary transition-colors truncate">{staff.name || 'Staff'}</span>
                              {staff.id === currentUser?.uid && (
                                <Badge className="bg-primary text-white border-none text-[7px] font-black uppercase px-2 py-0.5 rounded-full">ACTIVE YOU</Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-medium opacity-50 truncate">{staff.email}</span>
                            <span className="text-[8px] font-black text-muted-foreground/40 flex items-center gap-1 mt-1 uppercase tracking-widest">
                              <Fingerprint className="w-2.5 h-2.5" /> ID: {staff.id.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 gap-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-foreground font-black uppercase text-[8px] tracking-widest">
                          {getRoleIcon(staff.role)}
                          {staff.role}
                        </Badge>
                      </td>
                      <td className="px-10 py-6">
                        {staff.id.startsWith('staff-') ? (
                          <div className="flex flex-col gap-1">
                             <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black text-[7px] uppercase w-fit px-2 py-0.5 rounded-md">Pending Link</Badge>
                             <p className="text-[8px] font-medium text-muted-foreground italic">Invite Placeholder</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                             <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[7px] uppercase w-fit px-2 py-0.5 rounded-md">Verified node</Badge>
                             <p className="text-[8px] font-black text-muted-foreground/40 uppercase">Authenticated ID</p>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        {staff.status === 'active' ? (
                          <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-lg font-black text-[8px] uppercase shadow-sm">Operational</Badge>
                        ) : (
                          <Badge className="bg-rose-500 text-white border-none px-3 py-1 rounded-lg font-black text-[8px] uppercase shadow-sm">Restricted</Badge>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"><MoreVertical className="w-5 h-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60 rounded-[1.8rem] p-2 shadow-3xl border-none mt-2">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Entity Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openProfile(staff); }} className="rounded-xl gap-4 py-3.5 font-bold cursor-pointer transition-all"><Eye className="w-4 h-4 text-blue-500" /> View Record</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEdit(staff); }} className="rounded-xl gap-4 py-3.5 font-bold cursor-pointer transition-all"><Edit3 className="w-4 h-4 text-primary" /> Modify Profile</DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-10" />
                            <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Security Hub</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleResetPassword(staff.email)} className="rounded-xl gap-4 py-3.5 font-bold cursor-pointer transition-all"><RefreshCcw className="w-4 h-4 text-purple-500" /> Reset Password</DropdownMenuItem>
                            {staff.status === 'active' ? (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); triggerAlert('disable', staff.id); }} className="rounded-xl gap-4 py-3.5 font-bold text-orange-600 cursor-pointer transition-all"><Ban className="w-4 h-4" /> Block Entry</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); triggerAlert('enable', staff.id); }} className="rounded-xl gap-4 py-3.5 font-bold text-emerald-600 cursor-pointer transition-all"><CheckCircle2 className="w-4 h-4" /> Restore Access</DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onSelect={(e) => { e.preventDefault(); triggerAlert('delete', staff.id); }} 
                              className={cn("rounded-xl gap-4 py-3.5 font-bold text-rose-600 cursor-pointer transition-all", staff.id === currentUser?.uid && "opacity-30 cursor-not-allowed")}
                              disabled={staff.id === currentUser?.uid}
                            >
                              <Trash2 className="w-4 h-4" /> Purge Entity
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

      {/* ADD STAFF DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <div className="p-10 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
             <DialogHeader className="relative z-10">
                <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter leading-none">New <span className="italic opacity-80">Recruit</span></DialogTitle>
                <p className="text-white/70 font-medium text-xs uppercase tracking-widest mt-2">Provisioning Operational Identity</p>
             </DialogHeader>
          </div>
          <div className="p-10 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Full Legal Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6" placeholder="Staff Name" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Professional Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6" placeholder="staff@ezzybites.com" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Operational Assignment</Label>
                <Select value={formData.role} onValueChange={(v: StaffRole) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6 uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="admin" className="font-bold">Administrator</SelectItem>
                    <SelectItem value="cashier" className="font-bold">Billing Cashier</SelectItem>
                    <SelectItem value="kitchen" className="font-bold">Kitchen Chef</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Secure Contact</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6" placeholder="Mobile" />
              </div>
            </div>
            <Button className="w-full h-18 rounded-[1.8rem] font-black text-lg bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-widest mt-4" onClick={handleAddStaff} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Register Identity'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROFILE DETAIL VIEW */}
      <Dialog open={isProfileDialogOpen} onOpenChange={(open) => {
        setIsProfileDialogOpen(open);
        if(!open) setTimeout(() => setSelectedStaff(null), 300);
      }}>
        <DialogContent className="max-w-2xl rounded-[3.5rem] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Staff Profile: {selectedStaff?.name || 'Details'}</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="flex flex-col">
              <div className="relative h-56 bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute -bottom-14 left-10">
                  <Avatar className="h-36 w-32 rounded-[2.5rem] border-8 border-white dark:border-zinc-900 shadow-3xl">
                    <AvatarImage src={selectedStaff.photoUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-4xl">{(selectedStaff.name || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute top-8 right-10">
                   <Badge className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 font-black text-[9px] uppercase tracking-widest">Operational Entity</Badge>
                </div>
              </div>
              <div className="pt-20 px-10 pb-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-4xl font-black font-headline tracking-tighter uppercase leading-none mb-2">{selectedStaff.name || 'Staff Member'}</h3>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md">{selectedStaff.role}</Badge>
                      {getOnlineStatus(selectedStaff.onlineStatus)}
                    </div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-right border">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Internal ID Registry</p>
                    <p className="text-[10px] font-mono font-bold flex items-center gap-3">
                      {selectedStaff.id.slice(0, 20)}...
                      <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-primary transition-colors" onClick={() => copyText(selectedStaff.id)} />
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className={cn(
                    "p-8 rounded-[2rem] space-y-2 transition-all border",
                    selectedStaff.role === 'cashier' ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800" : "bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                  )}>
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Ticket Load</p>
                    <p className={cn("text-3xl font-black italic", selectedStaff.role === 'cashier' && "text-blue-600")}>{selectedStaff.stats?.ordersHandled || 0}</p>
                  </div>
                  <div className={cn(
                    "p-8 rounded-[2rem] space-y-2 transition-all border",
                    selectedStaff.role === 'cashier' ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800" : "bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                  )}>
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Settlements</p>
                    <p className={cn("text-3xl font-black italic", selectedStaff.role === 'cashier' && "text-blue-600")}>{selectedStaff.stats?.billsGenerated || 0}</p>
                  </div>
                  <div className={cn(
                    "p-8 rounded-[2rem] space-y-2 transition-all border",
                    selectedStaff.role === 'kitchen' ? "bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800" : "bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                  )}>
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Prep Ops</p>
                    <p className={cn("text-3xl font-black italic", selectedStaff.role === 'kitchen' && "text-orange-600")}>{selectedStaff.stats?.kitchenUpdates || 0}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-dashed">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="opacity-40">Identity Email</span>
                      <span className="font-bold">{selectedStaff.email}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="opacity-40">Registry Date</span>
                      <span className="font-bold">{selectedStaff.createdAt?.toDate ? selectedStaff.createdAt.toDate().toLocaleDateString() : 'Active Member'}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent className="rounded-[3rem] p-12 border-none shadow-3xl bg-white dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter flex items-center gap-4 mb-2">
              <AlertCircle className="w-10 h-10 text-rose-600" /> Security Node
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-lg leading-relaxed opacity-70">
              {alertAction?.type === 'delete' && "Are you sure? This will permanently terminate the staff member from the ecosystem. This action is irreversible."}
              {alertAction?.type === 'disable' && "This will restrict the staff member from hub entry until manually re-enabled by an administrator."}
              {alertAction?.type === 'enable' && "This will restore full system access and operational permissions for this staff member."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-2 px-8">Return</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm} className={cn("h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] px-8", alertAction?.type === 'delete' ? "bg-rose-600 text-white" : "bg-zinc-950 text-white")}>Commit Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
