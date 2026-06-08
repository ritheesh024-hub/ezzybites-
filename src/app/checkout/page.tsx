"use client"
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Smartphone, 
  Truck, 
  ShoppingBag, 
  Loader2, 
  Trash2,
  UserCheck,
  TicketPercent,
  X,
  PartyPopper,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';

export default function CheckoutPage() {
  const { cart, getTotal, clearCart, removeFromCart } = useStore();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    // Correct way to generate dynamic values to avoid hydration mismatch
    setOrderId(`EB-${Math.floor(10000 + Math.random() * 90000)}`);
  }, []);

  useEffect(() => {
    if (user && db) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
      }));
      
      const loadProfile = async () => {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setFormData(prev => ({
            ...prev,
            name: data.name || user.displayName || prev.name,
            phone: data.phone || prev.phone,
            address: data.address || prev.address
          }));
        }
      };
      loadProfile();
    }
  }, [user, db]);

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal - discount + deliveryFee;

  const handleApplyCoupon = async () => {
    if (!db) return;
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    try {
      const couponRef = doc(db, 'coupons', code);
      const couponSnap = await getDoc(couponRef);

      if (couponSnap.exists()) {
        const data = couponSnap.data();
        if (!data.isActive) throw new Error("This coupon is currently disabled.");
        if (data.expiryDate && new Date() > new Date(data.expiryDate)) throw new Error("This coupon has expired.");
        if (data.minOrderValue && subtotal < data.minOrderValue) throw new Error(`Minimum order of ₹${data.minOrderValue} required.`);

        const discountVal = Math.round(subtotal * (data.discount / 100));
        setDiscount(discountVal);
        setAppliedCoupon(code);
        setCouponInput('');
        toast({ title: "Coupon Applied! 🎉", description: `${data.discount}% discount activated.` });
      } else {
         throw new Error("Invalid promo code.");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Coupon Error", description: e.message });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    toast({ title: "Coupon Removed" });
  };

  const handleNext = () => {
    if (step === 2) {
      if (!formData.name || !formData.phone || !formData.address) {
        toast({ variant: "destructive", title: "Details Required", description: "Please fill in all delivery info." });
        return;
      }
      if (formData.phone.length < 10) {
        toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid 10-digit number." });
        return;
      }
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!db || !user) return;

    setLoading(true);
    const finalOrderId = orderId || `EB-${Date.now()}`;
    const orderData = {
      orderId: finalOrderId,
      userId: user.uid,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: user.email || '',
      address: formData.address,
      instructions: formData.instructions || '',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customization: item.customization || null
      })),
      subtotal: Number(subtotal),
      discount: Number(discount),
      couponCode: appliedCoupon,
      deliveryFee: Number(deliveryFee),
      total: Number(total),
      totalAmount: Number(total),
      status: 'Pending',
      paymentMethod: formData.paymentMethod,
      orderType: 'Online',
      createdAt: serverTimestamp()
    };

    const orderRef = doc(db, 'orders', finalOrderId);
    setDoc(orderRef, orderData)
      .then(() => {
        // Update customer profile for better UX next time
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          phone: formData.phone,
          name: formData.name,
          address: formData.address,
          lastOrderAt: serverTimestamp(),
          orderCount: increment(1)
        }, { merge: true });

        clearCart();
        setStep(4);
        toast({ title: "Order Placed Successfully! 🚀" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: orderData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setLoading(false));
  };

  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent('upi://pay?pa=8639366800@ybl&pn=Ezzy%20Bites&cu=INR')}`;

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-24">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-6" />
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Your Tray is <span className="text-primary italic">Empty</span></h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-8">Add some premium bites to your cart before proceeding to checkout.</p>
          <Link href="/menu">
            <Button className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px] bg-primary">Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-12 overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 md:pt-32">
        {/* Stepper */}
        <div className="max-w-xl mx-auto mb-10 md:mb-16 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700" 
              style={{ width: `${(step - 1) * 33.33}%` }} 
            />
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 border-background transition-all",
                  step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {step > s ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <span className="font-black text-xs md:text-sm">{s}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6 md:gap-10">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl md:text-4xl font-headline font-black uppercase tracking-tighter">Review <span className="text-primary italic">Order</span></h2>
                <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div key={item.cartId} className="p-4 md:p-6 flex gap-4 md:gap-6 items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden bg-secondary shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm md:text-lg truncate uppercase tracking-tight">{item.name}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-[9px] font-black uppercase">Qty: {item.quantity}</Badge>
                            {item.customization && <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">{item.customization.size}</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-base md:text-xl text-primary italic">₹{item.price * item.quantity}</p>
                          <button onClick={() => removeFromCart(item.cartId)} className="text-muted-foreground hover:text-destructive mt-2 transition-colors">
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Button onClick={handleNext} className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20">Confirm & Continue</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl md:text-4xl font-headline font-black uppercase tracking-tighter">Delivery <span className="text-primary italic">Details</span></h2>
                  {user && (
                    <Badge variant="outline" className="mb-2 bg-green-50 text-green-700 border-green-200 flex items-center gap-1 font-black text-[10px] py-1 uppercase px-3">
                      <UserCheck className="w-3 h-3" /> {user.displayName?.split(' ')[0]}
                    </Badge>
                  )}
                </div>
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900">
                  <CardContent className="p-6 md:p-10 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Full Name</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          className="h-14 rounded-xl font-bold bg-secondary/20 border-none" 
                          placeholder="Your Name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Mobile Number</Label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 border-muted">
                            <span className="text-xs font-black">+91</span>
                          </div>
                          <Input 
                            type="tel"
                            value={formData.phone} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setFormData({...formData, phone: val});
                            }} 
                            className="h-14 pl-20 rounded-xl font-black bg-secondary/20 border-none" 
                            placeholder="00000 00000"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Delivery Address</Label>
                      <Textarea 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})} 
                        className="rounded-xl min-h-[120px] font-medium bg-secondary/20 border-none px-6 py-4" 
                        placeholder="Complete address (Building, Street, Area)" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Special Instructions (Optional)</Label>
                      <Input 
                        value={formData.instructions} 
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})} 
                        className="h-14 rounded-xl bg-secondary/20 border-none" 
                        placeholder="e.g. Leave at the gate" 
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-16 rounded-2xl px-8 font-black border-2"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button onClick={handleNext} className="flex-1 h-16 rounded-2xl text-base font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20">
                    {!user && <Lock className="w-4 h-4 mr-2" />}
                    {user ? 'Select Payment' : 'Login to Continue'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl md:text-4xl font-headline font-black uppercase tracking-tighter">Payment <span className="text-primary italic">Methods</span></h2>
                <RadioGroup value={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})} className="space-y-4">
                  <Label htmlFor="cod" className={cn("flex items-center gap-4 p-6 rounded-[2rem] border-4 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-white dark:bg-zinc-900 border-transparent')}>
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <Truck className={cn("w-8 h-8", formData.paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="flex-1">
                      <p className="font-black text-base uppercase">Cash on Delivery</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Pay when you receive your meal</p>
                    </div>
                  </Label>
                  <Label htmlFor="upi" className={cn("flex items-center gap-4 p-6 rounded-[2rem] border-4 cursor-pointer transition-all", formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'bg-white dark:bg-zinc-900 border-transparent')}>
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <Smartphone className={cn("w-8 h-8", formData.paymentMethod === 'upi' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="flex-1">
                      <p className="font-black text-base uppercase">UPI / QR Scan</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Instant payment via any UPI app</p>
                    </div>
                  </Label>
                </RadioGroup>
                
                {formData.paymentMethod === 'upi' && (
                  <Card className="p-10 text-center animate-in zoom-in rounded-[3rem] border-dashed border-4 bg-white dark:bg-zinc-900">
                    <div className="w-48 h-48 md:w-56 md:h-56 mx-auto relative bg-white border-8 border-secondary rounded-[2rem] overflow-hidden mb-6 p-2 shadow-inner">
                      <Image src={qrImage} alt="QR Code" fill className="object-contain p-2" priority unoptimized />
                    </div>
                    <div className="bg-secondary/50 rounded-2xl p-4 inline-block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Business UPI ID</p>
                      <p className="font-black text-primary text-base md:text-lg">8639366800@ybl</p>
                    </div>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-16 rounded-2xl px-8 font-black border-2"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-16 rounded-2xl text-base font-black uppercase tracking-widest bg-primary shadow-2xl shadow-primary/30">
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <Card className="p-10 md:p-16 text-center space-y-8 rounded-[3rem] md:rounded-[5rem] shadow-3xl animate-in zoom-in border-none bg-white dark:bg-zinc-900">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 md:w-16 md:h-16" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-6xl font-black font-headline uppercase tracking-tighter">Order <span className="text-primary italic">Placed!</span></h2>
                  <p className="text-muted-foreground font-bold text-sm md:text-lg uppercase tracking-widest opacity-60">Preparing with love.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-[2rem] inline-block w-full max-w-xs mx-auto border-2 border-dashed">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Tracking ID</p>
                  <p className="font-mono text-xl md:text-3xl font-black text-primary">{orderId}</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                  <Link href={`/orders/${orderId}`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto rounded-2xl px-12 h-16 font-black uppercase text-[10px] tracking-widest bg-primary">Track Order</Button>
                  </Link>
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto rounded-2xl px-12 h-16 font-black uppercase text-[10px] tracking-widest border-2">Go Home</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {step < 4 && (
            <div className="space-y-6 sticky top-24 lg:top-28 h-fit">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="p-6 border-b bg-muted/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Promo Engine</p>
                </CardHeader>
                <CardContent className="p-6">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-2xl animate-in zoom-in duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
                          <PartyPopper className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-green-700 tracking-tighter">{appliedCoupon}</p>
                          <p className="text-[8px] font-bold text-green-600 uppercase tracking-widest">Active Discount</p>
                        </div>
                      </div>
                      <button onClick={removeCoupon} className="text-green-700 hover:text-destructive transition-colors p-2">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <TicketPercent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input 
                          placeholder="Coupon Code" 
                          value={couponInput} 
                          onChange={(e) => setCouponInput(e.target.value)} 
                          className="rounded-xl h-14 pl-12 uppercase font-black bg-secondary/20 border-none"
                        />
                      </div>
                      <Button 
                        onClick={handleApplyCoupon} 
                        disabled={couponLoading || !couponInput}
                        className="h-14 rounded-xl font-black text-[10px] uppercase px-6 bg-primary"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900">
                <CardHeader className="p-6 border-b bg-muted/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Billing Ledger</p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-2xl border border-green-100">
                      <span className="text-[10px] font-black text-green-700 uppercase">Discount</span>
                      <span className="font-black text-green-600">- ₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <span>Delivery</span>
                    <span className="text-green-600 italic">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="border-t border-dashed pt-6 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Grand Total</span>
                    <div className="text-right">
                      {discount > 0 && (
                        <p className="text-[10px] line-through text-muted-foreground opacity-30 font-bold mb-[-2px]">₹{subtotal + deliveryFee}</p>
                      )}
                      <span className="text-4xl font-headline font-black text-primary italic">₹{total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          if (step === 2) setStep(3);
        }}
      />
    </div>
  );
}
