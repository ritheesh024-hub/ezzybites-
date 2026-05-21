
"use client"
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Smartphone, 
  Truck, 
  ShoppingBag, 
  Loader2, 
  Zap,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CheckoutPage() {
  const { cart, getTotal, clearCart } = useStore();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    setOrderId(`EB-${Math.floor(Math.random() * 90000) + 10000}`);
  }, []);

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast({ 
        variant: "destructive", 
        title: "Missing details", 
        description: "Please fill in all delivery information." 
      });
      setStep(2);
      return;
    }

    setLoading(true);

    if (formData.paymentMethod === 'razorpay') {
      toast({ title: "Opening Secure Gateway...", description: "Connecting to Razorpay" });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const orderData = {
      orderId: orderId,
      customerName: formData.name,
      customerPhone: formData.phone,
      address: formData.address,
      instructions: formData.instructions,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      deliveryFee,
      total,
      status: 'Pending',
      paymentMethod: formData.paymentMethod,
      createdAt: serverTimestamp()
    };

    const orderRef = doc(collection(db, 'orders'), orderId!);
    
    setDoc(orderRef, orderData)
      .then(() => {
        setLoading(false);
        clearCart();
        setStep(4);
      })
      .catch(async (error) => {
        setLoading(false);
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: orderData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const qrImage = placeholderData.placeholderImages.find(img => img.id === 'qr-code')?.imageUrl || '';

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8">
            <ShoppingBag className="w-12 h-12 text-primary/20" />
          </div>
          <h2 className="text-3xl font-headline font-black mb-4">Hungry? Fill your cart!</h2>
          <p className="text-muted-foreground mb-10 max-w-sm text-center font-medium">Your cart is feeling light. Let's add some delicious bites.</p>
          <Link href="/menu">
            <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold">Explore Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
            <div className={`absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-700`} style={{ width: `${(step - 1) * 33.33}%` }} />
            
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-[6px] border-background ${step >= s ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black">{s}</span>}
                </div>
                <span className={`text-[10px] md:text-xs font-black mt-3 uppercase tracking-[0.2em] ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Review' : s === 2 ? 'Details' : s === 3 ? 'Pay' : 'Success'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-headline font-black">Review Order</h2>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 py-1.5 px-4 rounded-full font-bold">
                    {cart.length} Items Selected
                  </Badge>
                </div>
                <div className="bg-card border-none shadow-xl rounded-[32px] overflow-hidden">
                  {cart.map((item) => (
                    <div key={item.id} className="p-6 border-b last:border-0 flex gap-6 items-center hover:bg-muted/30 transition-colors">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-secondary shadow-md shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg">{item.name}</h4>
                        <p className="text-sm text-muted-foreground font-medium mb-2">{item.category}</p>
                        <Badge variant="secondary" className="rounded-lg">Qty: {item.quantity}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-primary">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleNext} className="w-full h-16 rounded-[20px] text-xl font-bold shadow-2xl shadow-primary/20">
                  Proceed to Delivery
                  <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                <h2 className="text-3xl font-headline font-black">Delivery Details</h2>
                <Card className="rounded-[32px] border-none shadow-xl">
                  <CardContent className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-black uppercase tracking-widest ml-1">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Your Name" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="rounded-2xl h-14 border-muted focus:ring-primary/20 bg-muted/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-sm font-black uppercase tracking-widest ml-1">Phone Number</Label>
                        <Input 
                          id="phone" 
                          placeholder="+91 00000 00000" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="rounded-2xl h-14 border-muted focus:ring-primary/20 bg-muted/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-sm font-black uppercase tracking-widest ml-1">Delivery Address</Label>
                      <Textarea 
                        id="address" 
                        placeholder="House No, Landmark, Area, Pincode" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="rounded-2xl min-h-[120px] border-muted bg-muted/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="instructions" className="text-sm font-black uppercase tracking-widest ml-1">Cooking Instructions</Label>
                      <Input 
                        id="instructions" 
                        placeholder="E.g. Extra spicy, no onions" 
                        value={formData.instructions}
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                        className="rounded-2xl h-14 border-muted bg-muted/20"
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-16 rounded-[20px] px-8 font-bold">
                    <ChevronLeft className="mr-2 w-6 h-6" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-16 rounded-[20px] text-xl font-bold shadow-xl">
                    Payment Options
                    <ChevronRight className="ml-2 w-6 h-6" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                <h2 className="text-3xl font-headline font-black">Choose Payment</h2>
                <RadioGroup 
                  defaultValue={formData.paymentMethod} 
                  onValueChange={(v) => setFormData({...formData, paymentMethod: v})}
                  className="space-y-5"
                >
                  <Label 
                    htmlFor="razorpay" 
                    className={`flex items-center gap-6 p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-transparent bg-card shadow-sm'}`}
                  >
                    <RadioGroupItem value="razorpay" id="razorpay" className="sr-only" />
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg">Online Payment</p>
                      <p className="text-sm text-muted-foreground font-medium">Credit/Debit Cards & Net Banking via Razorpay</p>
                    </div>
                    <Zap className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </Label>

                  <Label 
                    htmlFor="upi" 
                    className={`flex items-center gap-6 p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-transparent bg-card shadow-sm'}`}
                  >
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Smartphone className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg">UPI / QR Code</p>
                      <p className="text-sm text-muted-foreground font-medium">Pay instantly using any UPI app</p>
                    </div>
                  </Label>

                  <Label 
                    htmlFor="cod" 
                    className={`flex items-center gap-6 p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-transparent bg-card shadow-sm'}`}
                  >
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                      <Truck className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground font-medium">Pay when your food arrives</p>
                    </div>
                  </Label>
                </RadioGroup>

                {formData.paymentMethod === 'upi' && (
                  <div className="bg-card border-none shadow-xl rounded-[40px] p-8 text-center space-y-6 animate-in zoom-in duration-500">
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Scan & Pay Securely</p>
                    <div className="w-56 h-56 mx-auto relative bg-secondary rounded-[32px] overflow-hidden border-8 border-white shadow-inner">
                      <Image src={qrImage} alt="UPI QR" fill className="p-4" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-primary">8639366800@ybl</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">Verify receiver: Easy Bites</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-16 rounded-[20px] px-8 font-bold">
                    <ChevronLeft className="mr-2 w-6 h-6" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-16 rounded-[20px] text-xl font-bold shadow-2xl shadow-primary/20">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : 'Confirm Order'}
                    {!loading && <CheckCircle2 className="ml-2 w-6 h-6" />}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-card border-none shadow-2xl rounded-[48px] p-12 text-center space-y-8 animate-in zoom-in duration-700">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-14 h-14" />
                </div>
                <div>
                  <h2 className="text-5xl font-headline font-black mb-4">Great! Order <span className="text-primary">Placed</span></h2>
                  <p className="text-lg text-muted-foreground font-medium max-w-sm mx-auto">Your delicious bites are being prepared with love. Prepare your tastebuds!</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-3xl inline-flex flex-col items-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mb-2">Order Tracking ID</p>
                  <p className="font-mono text-2xl font-black text-primary">{orderId}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={`/orders/${orderId}`}>
                    <Button variant="default" className="rounded-full px-12 h-14 font-black uppercase tracking-widest">Track Order</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="rounded-full px-12 h-14 font-black uppercase tracking-widest border-2">Home</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {step < 4 && (
            <div className="space-y-8">
              <Card className="rounded-[32px] border-none shadow-2xl sticky top-28 overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/20">
                  <CardTitle className="text-xl font-black uppercase tracking-widest">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-base font-medium">
                      <span className="text-muted-foreground">Item Subtotal</span>
                      <span className="font-bold">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-base font-medium">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? "text-green-600 font-black" : "font-bold"}>
                        {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-dashed pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black uppercase tracking-widest">Grand Total</span>
                      <span className="text-4xl font-headline font-black text-primary">₹{total}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-primary/5 border-t border-primary/10">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xs font-bold leading-relaxed">Arriving in <span className="text-primary">20-30 mins</span> to Pocharam area.</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
