
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
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
  const { cart, getTotal, clearCart, removeFromCart } = useStore();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    // Generate a consistent ID for the session
    setOrderId(`EB-${Math.floor(Math.random() * 90000) + 10000}`);
  }, []);

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!db) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ 
        variant: "destructive", 
        title: "Missing details", 
        description: "Please fill in delivery info." 
      });
      setStep(2);
      return;
    }

    setLoading(true);

    const currentOrderId = orderId || `EB-${Date.now()}`;
    const orderData = {
      orderId: currentOrderId,
      customerName: formData.name,
      customerPhone: formData.phone,
      address: formData.address,
      instructions: formData.instructions || '',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal: Number(subtotal),
      deliveryFee: Number(deliveryFee),
      total: Number(total),
      status: 'Pending',
      paymentMethod: formData.paymentMethod,
      createdAt: serverTimestamp()
    };

    const orderRef = doc(db, 'orders', currentOrderId);
    
    // Initiate write operation
    setDoc(orderRef, orderData)
      .catch(async (error) => {
        // If it fails (e.g. security rules), emit the error context
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: orderData,
        }));
      });

    // Optimistic completion: Proceed immediately without awaiting the promise
    // This prevents "infinite loading" while waiting for server confirmation
    setTimeout(() => {
      setLoading(false);
      clearCart();
      setStep(4);
      toast({ title: "Order Placed Successfully! 🚀" });
    }, 500);
  };

  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent('upi://pay?pa=8639366800@ybl&pn=Ezzy%20Bites&cu=INR')}`;

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-24">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-6" />
          <h2 className="text-2xl font-black mb-2">Your cart is empty</h2>
          <Link href="/menu">
            <Button className="rounded-full px-10 h-14 font-bold mt-4">Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-12">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 md:pt-32">
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
                <h2 className="text-2xl md:text-4xl font-headline font-black">Review Order</h2>
                <Card className="rounded-[24px] md:rounded-[40px] border-none shadow-xl overflow-hidden">
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div key={item.id} className="p-4 md:p-6 flex gap-4 md:gap-6 items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden bg-secondary shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized={item.imageUrl.startsWith('http')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base md:text-lg truncate">{item.name}</h4>
                          <Badge variant="secondary" className="mt-1">Qty: {item.quantity}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg md:text-xl text-primary">₹{item.price * item.quantity}</p>
                          <button 
                            onClick={() => removeFromCart(item.id)} 
                            className="text-muted-foreground hover:text-destructive mt-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Button onClick={handleNext} className="w-full h-14 md:h-16 rounded-2xl text-lg font-bold shadow-xl">Proceed to Details</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl md:text-4xl font-headline font-black">Delivery Details</h2>
                <Card className="rounded-[24px] md:rounded-[40px] border-none shadow-xl">
                  <CardContent className="p-6 md:p-10 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Full Name</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          className="h-12 md:h-14 rounded-xl" 
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Phone Number</Label>
                        <Input 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                          className="h-12 md:h-14 rounded-xl" 
                          placeholder="Mobile Number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Delivery Address</Label>
                      <Textarea 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})} 
                        className="rounded-xl min-h-[100px] md:min-h-[140px]" 
                        placeholder="Complete address (Building, Street, Area)"
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-3 md:gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 md:h-16 rounded-xl px-4 md:px-8 font-bold border-2"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button onClick={handleNext} className="flex-1 h-14 md:h-16 rounded-xl text-base md:text-lg font-bold">Select Payment</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl md:text-4xl font-headline font-black">Payment</h2>
                <RadioGroup defaultValue={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})} className="space-y-3 md:space-y-4">
                  <Label htmlFor="cod" className={cn(
                    "flex items-center gap-4 p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all",
                    formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-card border-transparent'
                  )}>
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <Truck className={cn("w-6 h-6 md:w-8 md:h-8 transition-colors", formData.paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base">Cash on Delivery</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Pay when you receive your meal</p>
                    </div>
                  </Label>
                  <Label htmlFor="upi" className={cn(
                    "flex items-center gap-4 p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all",
                    formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'bg-card border-transparent'
                  )}>
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <Smartphone className={cn("w-6 h-6 md:w-8 md:h-8 transition-colors", formData.paymentMethod === 'upi' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base">UPI / QR Scan</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Instant payment via any UPI app</p>
                    </div>
                  </Label>
                </RadioGroup>

                {formData.paymentMethod === 'upi' && (
                  <Card className="p-6 md:p-10 text-center animate-in zoom-in rounded-[32px] border-dashed border-2">
                    <div className="w-48 h-48 md:w-56 md:h-56 mx-auto relative bg-white border rounded-2xl overflow-hidden mb-6 p-2">
                      <Image src={qrImage} alt="QR Code" fill className="object-contain p-2" priority unoptimized />
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 inline-block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">UPI ID</p>
                      <p className="font-black text-primary text-base md:text-lg">8639366800@ybl</p>
                    </div>
                  </Card>
                )}

                <div className="flex gap-3 md:gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 md:h-16 rounded-xl px-4 md:px-8 font-bold border-2"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-14 md:h-16 rounded-xl text-base md:text-lg font-bold shadow-2xl shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <Card className="p-8 md:p-16 text-center space-y-8 rounded-[32px] md:rounded-[60px] shadow-2xl animate-in zoom-in border-none">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-6xl font-black mb-2">Order <span className="text-primary italic">Placed!</span></h2>
                  <p className="text-muted-foreground font-medium text-sm md:text-lg">Your meal is being prepared with love.</p>
                </div>
                <div className="bg-secondary/50 p-4 md:p-6 rounded-2xl inline-block w-full max-w-xs mx-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Tracking ID</p>
                  <p className="font-mono text-xl md:text-2xl font-black text-primary">{orderId}</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pt-4">
                  <Link href={`/orders/${orderId}`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto rounded-full px-10 h-14 font-black">Track Order</Button>
                  </Link>
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto rounded-full px-10 h-14 font-black border-2">Go Home</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {step < 4 && (
            <Card className="rounded-[24px] md:rounded-[40px] border-none shadow-xl h-fit sticky top-24 lg:top-28">
              <CardHeader className="p-6 md:p-8 border-b bg-muted/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Order Summary</p>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between text-sm md:text-base text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base text-muted-foreground">
                  <span>Delivery</span>
                  <span className="font-bold text-green-600">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>
                <div className="border-t border-dashed pt-6 flex justify-between items-center">
                  <span className="text-sm md:text-lg font-black uppercase tracking-widest">Total</span>
                  <span className="text-2xl md:text-4xl font-headline font-black text-primary">₹{total}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
