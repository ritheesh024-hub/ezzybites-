'use client';

import React, { useState, useMemo, useRef } from 'react';
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
  Ban, RefreshCcw, UserCircle2, UserCog,
  Camera, Calendar, MapPin, Building, Mail, Phone,
  ChevronLeft, ChevronRight, Save, X, KeyRound,
  FileText
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, orderBy, getDocs, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { StaffRole } from '@/app/admin/dashboard/page';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export const StaffManagement = () => {
  const db = useFirestore();
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    id: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    role: 'cashier' as StaffRole,
    joiningDate: '',
    status: 'active',
    photoUrl: ''
  });
  
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      username: '',
      email: '',
      phone: '',
      gender: 'Male',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      role: 'cashier',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      photoUrl: ''
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) { toast({ variant: "destructive", title: "Missing Name" }); return false; }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) { toast({ variant: "destructive", title: "Invalid Email" }); return false; }
    if (!formData.phone.trim() || formData.phone.length < 10) { toast({ variant: "destructive", title: "Invalid Phone", description: "10 digits required." }); return false; }
    if (!formData.username.trim()) { toast({ variant: "destructive", title: "Missing Username" }); return false; }
    return true;
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Max 1MB allowed." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStaff = async () => {
    if (!db || !validateForm()) return;

    setSubmitting(true);
    try {
      const qEmail = query(collection(db, 'admins'), where('email', '==', formData.email.toLowerCase()));
      const qPhone = query(collection(db, 'admins'), where('phone', '==', formData.phone));
      const [emailSnap, phoneSnap] = await Promise.all([getDocs(qEmail), getDocs(qPhone)]);

      if (!emailSnap.empty) { toast({ variant: "destructive", title: "Email exists", description: "This node is already registered." }); setSubmitting(false); return; }
      if (!phoneSnap.empty) { toast({ variant: "destructive", title: "Phone exists", description: "Mobile is already in the ledger." }); setSubmitting(false); return; }

      const newStaffId = `staff-${Date.now()}`;
      const staffRef = doc(db, 'admins', newStaffId);
      const staffData = {
        ...formData,
        id: newStaffId,
        uid: newStaffId,
        email: formData.email.toLowerCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onlineStatus: 'offline',
        stats: { ordersHandled: 0, billsGenerated: 0, kitchenUpdates: 0 }
      };

      await setDoc(staffRef, staffData);
      toast({ title: "Staff Registered", description: `${formData.name} is now operational.` });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'admins/new',
        operation: 'create',
        requestResourceData: formData
      } satisfies SecurityRuleContext));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff || !db || !validateForm()) return;
    setSubmitting(true);
    const staffRef = doc(db, 'admins', selectedStaff.id);
    
    try {
      const qEmail = query(collection(db, 'admins'), where('email', '==', formData.email.toLowerCase()));
      const emailSnap = await getDocs(qEmail);
      const isOtherEmail = emailSnap.docs.some(d => d.id !== selectedStaff.id);
      if (isOtherEmail) { toast({ variant: "destructive", title: "Conflict", description: "Email used by another node." }); setSubmitting(false); return; }

      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(staffRef, updateData);
      toast({ title: "Node Synchronized", description: "Record updates committed." });
      setIsEditDialogOpen(false);
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: staffRef.path,
        operation: 'update',
        requestResourceData: formData
      } satisfies SecurityRuleContext));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!auth || !email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Link Sent", description: `Protocol instructions sent to ${email}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reset Failed", description: error.message });
    }
  };

  const handleAlertConfirm = async () => {
    if (!alertAction || !db) return;
    const { type, staffId } = alertAction;
    const staffRef = doc(db, 'admins', staffId);
    
    if (type === 'delete') {
      if (staffId === currentUser?.uid) {
        toast({ variant: "destructive", title: "Action Blocked", description: "You cannot terminate your own active node." });
        setIsAlertDialogOpen(false);
        return;
      }
      deleteDoc(staffRef)
        .then(() => toast({ title: "Entity Terminated" }))
        .finally(() => setIsAlertDialogOpen(false));
    } else {
      const status = type === 'disable' ? 'disabled' : 'active';
      updateDoc(staffRef, { status })
        .then(() => toast({ title: `Access ${status}` }))
        .finally(() => setIsAlertDialogOpen(false));
    }
  };

  const openEdit = (staff: any) => {
    setSelectedStaff(staff);
    setFormData({
      id: staff.id || '',
      name: staff.name || '',
      username: staff.username || (staff.email ? staff.email.split('@')[0] : ''),
      email: staff.email || '',
      phone: staff.phone || '',
      gender: staff.gender || 'Male',
      dateOfBirth: staff.dateOfBirth || '',
      address: staff.address || '',
      city: staff.city || '',
      state: staff.state || '',
      pincode: staff.pincode || '',
      role: staff.role || 'cashier',
      joiningDate: staff.joiningDate || new Date().toISOString().split('T')[0],
      status: staff.status || 'active',
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-3.5 h-3.5 text-primary" />;
      case 'cashier': return <Receipt className="w-3.5 h-3.5 text-blue-500" />;
      case 'kitchen': return <ChefHat className="w-3.5 h-3.5 text-orange-500" />;
      default: return <Users className="w-3.5 h-3.5" />;
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin': return ["Full Hub Control", "Logistics Master", "Audit Access", "Staff Registry Management"];
      case 'cashier': return ["Billing Control", "Payment Verification", "Dispatch Logs"];
      case 'kitchen': return ["Order Acceptance", "Status Flow Updates", "Cooking Station Pulse"];
      default: return [];
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Team <span className="text-primary">Registry</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Manage permissions, monitor activity, and grow your crew.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 bg-primary text-white shadow-3xl hover:scale-[1.02] transition-all w-full md:w-auto">
          <UserPlus className="w-5 h-5" /> Register Recruit
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border shadow-sm">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 w-full lg:w-48 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest px-6">
              <SelectValue placeholder="Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="cashier">Cashiers</SelectItem>
              <SelectItem value="kitchen">Kitchen Station</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-full lg:w-48 rounded-xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Access</SelectItem>
              <SelectItem value="active">Operational</SelectItem>
              <SelectItem value="disabled">Restricted</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden border">
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
                    <th className="px-8 py-6">Member Identity</th>
                    <th className="px-8 py-6">Assignment</th>
                    <th className="px-8 py-6">Verified Node</th>
                    <th className="px-8 py-6">State</th>
                    <th className="px-8 py-6 text-right">Ledger Actions</th>
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
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-xl shadow-lg border-2 border-white dark:border-zinc-900 shrink-0 group-hover:scale-110 transition-transform">
                            <AvatarImage src={staff.photoUrl} alt={staff.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{(staff.name || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm uppercase tracking-tighter group-hover:text-primary transition-colors truncate">{staff.name || 'Staff'}</span>
                              {staff.id === currentUser?.uid && <Badge className="bg-primary text-white border-none text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full">YOU</Badge>}
                            </div>
                            <span className="text-[9px] font-medium opacity-50 truncate">{staff.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="outline" className="rounded-full px-3 py-1 gap-1.5 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-foreground font-black uppercase text-[8px] tracking-widest">
                          {getRoleIcon(staff.role)}
                          {staff.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                         <Badge className={cn("font-black text-[7px] uppercase w-fit px-2 py-0.5 rounded-md", staff.id.startsWith('staff-') ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                           {staff.id.startsWith('staff-') ? 'PENDING LINK' : 'VERIFIED ID'}
                         </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn("w-2.5 h-2.5 rounded-full", staff.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]')} title={staff.status} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1.5">
                           <Button variant="ghost" size="icon" onClick={() => openProfile(staff)} className="h-9 w-9 rounded-lg hover:bg-blue-50 text-blue-500 transition-all"><Eye className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => openEdit(staff)} className="h-9 w-9 rounded-lg hover:bg-primary/10 text-primary transition-all"><Edit3 className="w-4 h-4" /></Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-secondary"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-3xl border-none">
                                <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-40 px-3 py-2">Account Hub</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleResetPassword(staff.email)} className="rounded-xl gap-4 py-3 font-bold cursor-pointer"><RefreshCcw className="w-4 h-4 text-purple-500" /> Reset Protocol</DropdownMenuItem>
                                <DropdownMenuSeparator className="opacity-10" />
                                {staff.status === 'active' ? (
                                  <DropdownMenuItem onSelect={() => triggerAlert('disable', staff.id)} className="rounded-xl gap-4 py-3 font-bold text-orange-600 cursor-pointer"><Ban className="w-4 h-4" /> Restrict Node</DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onSelect={() => triggerAlert('enable', staff.id)} className="rounded-xl gap-4 py-3 font-bold text-emerald-600 cursor-pointer"><CheckCircle2 className="w-4 h-4" /> Restore Access</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onSelect={() => triggerAlert('delete', staff.id)} className="rounded-xl gap-4 py-3 font-bold text-rose-600 cursor-pointer" disabled={staff.id === currentUser?.uid}><Trash2 className="w-4 h-4" /> Purge Entity</DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <StaffFormDialog 
        isOpen={isAddDialogOpen || isEditDialogOpen} 
        onClose={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={isEditDialogOpen ? handleUpdateStaff : handleAddStaff}
        submitting={submitting}
        isEdit={isEditDialogOpen}
        fileInputRef={fileInputRef}
        handlePhotoClick={handlePhotoClick}
        handleFileChange={handleFileChange}
        getRolePermissions={getRolePermissions}
      />

      <StaffProfileDialog 
        isOpen={isProfileDialogOpen} 
        onClose={() => setIsProfileDialogOpen(false)}
        staff={selectedStaff}
        copyText={(text: string) => { navigator.clipboard.writeText(text); toast({ title: "Identity Copied" }); }}
      />

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl bg-white dark:bg-zinc-900 w-[95vw] md:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter flex items-center gap-4 mb-2">
              <AlertCircle className="w-10 h-10 text-rose-600 shrink-0" /> Security Node
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium leading-relaxed opacity-70">
              {alertAction?.type === 'delete' && "Terminate this entity from the ecosystem permanently? All behavioral logs and registry entries will be orphaned."}
              {alertAction?.type === 'disable' && "Restrict this member from hub entry? Their operational session will be suspended instantly."}
              {alertAction?.type === 'enable' && "Restore system credentials and full operational node permissions for this member?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col md:flex-row gap-3">
            <AlertDialogCancel className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 w-full md:w-auto">Return</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm} className={cn("h-14 rounded-xl font-black uppercase text-[10px] tracking-widest px-8 text-white w-full md:w-auto", alertAction?.type === 'delete' ? "bg-rose-600" : "bg-zinc-950")}>Commit Protocol</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StaffFormDialog = ({ isOpen, onClose, formData, setFormData, onSubmit, submitting, isEdit, fileInputRef, handlePhotoClick, handleFileChange, getRolePermissions }: any) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-4xl bg-white dark:bg-zinc-950 max-h-[90vh] flex flex-col">
        <div className="p-6 md:p-8 bg-zinc-950 text-white shrink-0 relative overflow-hidden">
           <div className="absolute inset-0 bg-primary/10 animate-pulse" />
           <div className="relative z-10 flex justify-between items-center">
              <DialogHeader>
                 <DialogTitle className="text-2xl md:text-4xl font-black font-headline uppercase tracking-tighter italic">
                    {isEdit ? 'Modify' : 'Register'} <span className="text-primary opacity-80">Member</span>
                 </DialogTitle>
                 <DialogDescription className="text-white/40 font-medium text-[10px] uppercase tracking-widest mt-1">Identity Registry v4.2</DialogDescription>
              </DialogHeader>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8 space-y-8 md:space-y-12">
          <Tabs defaultValue="personal" className="w-full">
            <div className="sticky top-0 z-20 bg-white dark:bg-zinc-950 pb-4">
              <TabsList className="bg-secondary/40 dark:bg-zinc-900 p-1 rounded-xl border flex w-full md:w-fit overflow-x-auto scrollbar-hide snap-x">
                <TabsTrigger value="personal" className="flex-1 md:flex-none px-4 md:px-8 py-2.5 rounded-lg gap-2 font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all snap-start"><UserCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> Personal</TabsTrigger>
                <TabsTrigger value="employment" className="flex-1 md:flex-none px-4 md:px-8 py-2.5 rounded-lg gap-2 font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all snap-start"><FileText className="w-3 h-3 md:w-3.5 md:h-3.5" /> Ops</TabsTrigger>
                <TabsTrigger value="account" className="flex-1 md:flex-none px-4 md:px-8 py-2.5 rounded-lg gap-2 font-black uppercase text-[8px] md:text-[9px] tracking-widest transition-all snap-start"><KeyRound className="w-3 h-3 md:w-3.5 md:h-3.5" /> Identity</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personal" className="space-y-8 md:space-y-10 animate-in fade-in duration-500 outline-none">
               <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                     <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                        <Avatar className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] md:rounded-[2.5rem] border-4 md:border-8 border-secondary dark:border-zinc-800 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                           <AvatarImage src={formData.photoUrl} />
                           <AvatarFallback className="bg-primary/10 text-primary font-black text-3xl md:text-4xl">{(formData.name || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-primary text-white rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center border-2 md:border-4 border-white dark:border-zinc-950 group-hover:rotate-12 transition-all"><Camera className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                     </div>
                     <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Identity Asset Node</p>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Full Legal Entity</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6" />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Mobile Node</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                          <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="h-12 md:h-14 pl-12 md:pl-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6" />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Binary Gender</Label>
                        <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                           <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-xl"><SelectItem value="Male" className="font-bold">Male</SelectItem><SelectItem value="Female" className="font-bold">Female</SelectItem><SelectItem value="Other" className="font-bold">Other</SelectItem></SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Date of Manifestation</Label>
                        <Input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6" />
                     </div>
                  </div>
               </div>

               <div className="space-y-4 md:space-y-6">
                  <h5 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.4em] border-b pb-2 flex items-center gap-3"><MapPin className="w-3 h-3" /> Location Ledger</h5>
                  <div className="space-y-1.5">
                     <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Resident Address</Label>
                     <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="min-h-[100px] rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-medium px-5 md:px-6 py-4" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">City Hub</Label>
                        <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5" />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">State Node</Label>
                        <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="h-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5" />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Pincode Node</Label>
                        <Input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="h-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5" />
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-8 md:space-y-10 animate-in fade-in duration-500 outline-none">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="space-y-6 md:space-y-8">
                     <h5 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2 flex items-center gap-3"><Building className="w-3 h-3" /> Assignments</h5>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Registry Role</Label>
                        <Select value={formData.role} onValueChange={(v: StaffRole) => setFormData({...formData, role: v})}>
                           <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-black uppercase text-[9px] tracking-widest px-5 md:px-6"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-xl">
                              <SelectItem value="admin" className="font-bold">Administrator</SelectItem>
                              <SelectItem value="cashier" className="font-bold">Billing Agent</SelectItem>
                              <SelectItem value="kitchen" className="font-bold">Cooking Station</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Operational State</Label>
                        <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                           <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-xl"><SelectItem value="active" className="font-bold text-emerald-600">Active Node</SelectItem><SelectItem value="disabled" className="font-bold text-rose-600">Inactive Node</SelectItem></SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="space-y-6 md:space-y-8">
                     <h5 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2 flex items-center gap-3"><Calendar className="w-3 h-3" /> Chronicles</h5>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Activation Epoch (Joining Date)</Label>
                        <Input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6" />
                     </div>
                     <div className="p-5 md:p-6 bg-secondary/20 dark:bg-zinc-900/50 rounded-2xl md:rounded-3xl border border-dashed space-y-4">
                        <p className="text-[7px] md:text-[8px] font-black uppercase opacity-40 mb-3 tracking-widest">Active Node Permissions</p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                           {getRolePermissions(formData.role).map((p: string) => (
                              <Badge key={p} className="bg-primary/10 text-primary border-none text-[6px] md:text-[7px] font-black uppercase px-2 py-0.5 rounded-md">{p}</Badge>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-8 md:space-y-10 animate-in fade-in duration-500 outline-none">
               <div className="max-w-xl space-y-6 md:space-y-8">
                  <h5 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2 flex items-center gap-3"><KeyRound className="w-3 h-3" /> Protocol Credentials</h5>
                  <div className="space-y-4 md:space-y-6">
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">Identity Login (Email)</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                          <Input disabled={isEdit} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 md:h-14 pl-12 md:pl-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6 opacity-60" />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[9px] font-black uppercase opacity-40 ml-1">System Handle (Username)</Label>
                        <div className="relative">
                          <UserCog className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                          <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="h-12 md:h-14 pl-12 md:pl-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 dark:bg-zinc-900 font-bold px-5 md:px-6" />
                        </div>
                     </div>
                  </div>
                  {isEdit && (
                     <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl md:rounded-3xl border border-dashed space-y-4">
                        <p className="text-[10px] md:text-[11px] font-medium leading-relaxed italic opacity-60">"Reset password protocol will dispatch an encryption bypass signal to the member's primary email."</p>
                        <Button variant="outline" className="w-full md:w-auto rounded-xl h-12 gap-3 border-2 font-black uppercase text-[9px] tracking-widest text-primary hover:bg-primary/5" onClick={() => handleResetPassword(formData.email)}>
                           <RefreshCcw className="w-4 h-4" /> Reset Credentials
                        </Button>
                     </div>
                  )}
               </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border-t flex flex-col md:flex-row gap-3 md:gap-4 shrink-0">
           <Button variant="outline" className="h-12 md:h-16 flex-1 rounded-xl md:rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] border-2 w-full md:w-auto" onClick={onClose}>Abort Protocol</Button>
           <Button className="h-12 md:h-16 flex-[2] rounded-xl md:rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-white shadow-2xl shadow-primary/30 w-full md:w-auto" onClick={onSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-4 h-4 md:w-5 md:h-5" /> Commit Registry</>}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StaffProfileDialog = ({ isOpen, onClose, staff, copyText }: any) => {
  if (!staff) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] rounded-[2.5rem] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-4xl flex flex-col h-[85vh]">
        <DialogHeader className="sr-only">
           <DialogTitle>Staff Profile: {staff.name}</DialogTitle>
           <DialogDescription>Operational details and metrics for staff member {staff.name}.</DialogDescription>
        </DialogHeader>
        <div className="relative h-48 md:h-64 bg-zinc-950 shrink-0">
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
           <div className="absolute -bottom-10 md:-bottom-14 left-1/2 md:left-10 -translate-x-1/2 md:translate-x-0">
              <Avatar className="h-32 w-32 md:h-40 md:w-36 rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-white dark:border-zinc-900 shadow-3xl">
                 <AvatarImage src={staff.photoUrl} />
                 <AvatarFallback className="bg-primary/10 text-primary font-black text-3xl md:text-4xl">{(staff.name || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
           </div>
           <div className="absolute top-6 md:top-8 right-6 md:right-10 flex gap-3">
              <Badge className={cn("px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[8px] md:text-[9px] uppercase tracking-widest border-none", staff.status === 'active' ? "bg-emerald-500" : "bg-rose-600")}>{staff.status}</Badge>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pt-16 md:pt-20 px-6 md:px-10 pb-8 md:pb-12 space-y-8 md:space-y-12">
           <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-6">
              <div>
                 <h3 className="text-3xl md:text-4xl font-black font-headline tracking-tighter uppercase leading-none mb-2 italic">{staff.name}</h3>
                 <p className="text-[9px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">@{staff.username || staff.email.split('@')[0]}</p>
                 <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 mt-4">
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md">{staff.role}</Badge>
                    <span className="text-[8px] md:text-[9px] font-black uppercase opacity-30 flex items-center gap-2"><Fingerprint className="w-3 h-3" /> {staff.id.slice(-12)}</span>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button size="icon" variant="ghost" onClick={() => window.location.href = `mailto:${staff.email}`} className="h-10 w-10 rounded-xl bg-secondary/50 md:bg-transparent hover:bg-secondary"><Mail className="w-4 h-4" /></Button>
                 <Button size="icon" variant="ghost" onClick={() => window.location.href = `tel:${staff.phone}`} className="h-10 w-10 rounded-xl bg-secondary/50 md:bg-transparent hover:bg-secondary"><Phone className="w-4 h-4" /></Button>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border text-center space-y-0.5 md:space-y-1">
                 <p className="text-[7px] font-black uppercase opacity-30 tracking-widest">Load</p>
                 <p className="text-xl md:text-2xl font-black italic">{staff.stats?.ordersHandled || 0}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border text-center space-y-0.5 md:space-y-1">
                 <p className="text-[7px] font-black uppercase opacity-30 tracking-widest">Revenue</p>
                 <p className="text-xl md:text-2xl font-black italic text-emerald-600">{staff.stats?.billsGenerated || 0}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border text-center space-y-0.5 md:space-y-1">
                 <p className="text-[7px] font-black uppercase opacity-30 tracking-widest">Updates</p>
                 <p className="text-xl md:text-2xl font-black italic text-orange-600">{staff.stats?.kitchenUpdates || 0}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border text-center space-y-0.5 md:space-y-1">
                 <p className="text-[7px] font-black uppercase opacity-30 tracking-widest">Pulse</p>
                 <p className="text-xl md:text-2xl font-black italic text-primary">{staff.onlineStatus?.toUpperCase()}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-4 md:space-y-6">
                 <h5 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2 italic">Entity Metadata</h5>
                 <div className="space-y-3 md:space-y-4">
                    <InfoRow label="Email Identity" val={staff.email} />
                    <InfoRow label="Mobile Node" val={staff.phone} />
                    <InfoRow label="Activation Epoch" val={staff.joiningDate || 'Pre-Registry'} />
                    <InfoRow label="Registry Epoch" val={staff.createdAt?.toDate ? staff.createdAt.toDate().toLocaleDateString() : 'Active Member'} />
                 </div>
              </div>
              <div className="space-y-4 md:space-y-6">
                 <h5 className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-[0.3em] border-b pb-2 italic">Resident Node</h5>
                 <div className="bg-secondary/20 dark:bg-zinc-900/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-dashed">
                    <p className="text-[10px] md:text-[11px] font-medium leading-relaxed italic opacity-80">"{staff.address || 'Location data restricted or unmapped.'}"</p>
                    <p className="text-[8px] font-bold uppercase mt-4 opacity-40">{staff.city}, {staff.state} - {staff.pincode}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border-t flex flex-col md:flex-row justify-center items-center gap-4 shrink-0">
           <Button variant="outline" className="w-full md:hidden h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2" onClick={onClose}>Close Registry</Button>
           <p className="text-[7px] font-black uppercase tracking-[0.5em] opacity-20 hidden md:block">Authorized Registry • Confidential Log</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, val }: any) => (
  <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800">
     <span className="text-[8px] md:text-[9px] font-black uppercase opacity-40 tracking-widest">{label}</span>
     <span className="text-[9px] md:text-[10px] font-bold uppercase truncate max-w-[150px] md:max-w-xs">{val || 'N/A'}</span>
  </div>
);
