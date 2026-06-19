'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { MapPin, Plus, Trash2, Home, Briefcase, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AddressesPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const addrQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'addresses'), where('userId', '==', user.uid));
  }, [db, user]);

  const { data: addresses, loading: addrLoading } = useCollection<any>(addrQuery);

  const handleDelete = (id: string) => {
    if (!db) return;
    const addrRef = doc(db, 'addresses', id);
    deleteDoc(addrRef)
      .then(() => toast({ title: "Address Deleted" }))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: addrRef.path,
          operation: 'delete'
        } satisfies SecurityRuleContext));
      });
  };

  if (userLoading || addrLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-16 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black font-headline uppercase tracking-tighter">Saved <span className="text-primary italic">Addresses</span></h1>
                <p className="text-muted-foreground text-xs font-medium">Manage your delivery locations.</p>
              </div>
            </div>
            <Button className="rounded-full h-11 px-6 font-black uppercase text-[9px] tracking-widest gap-2 bg-primary">
              <Plus className="w-4 h-4" /> Add New
            </Button>
          </div>

          <div className="space-y-6">
            {addresses.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-secondary/10 rounded-[3rem] border-2 border-dashed">
                <MapPin className="w-16 h-16 text-muted-foreground opacity-20 mx-auto" />
                <p className="font-bold opacity-40 uppercase text-xs">No saved addresses found</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <Card key={addr.id} className="rounded-3xl border-none shadow-xl bg-white dark:bg-zinc-900 group">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {addr.type === 'Home' ? <Home className="w-5 h-5" /> : addr.type === 'Work' ? <Briefcase className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-black text-base">{addr.name || addr.type}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-md">{addr.address}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} className="text-muted-foreground hover:text-destructive rounded-full">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
