'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { 
  Bot, 
  Package, 
  CreditCard, 
  Truck, 
  Utensils, 
  Star, 
  HelpCircle, 
  Send, 
  Loader2, 
  ChevronRight,
  Phone,
  Mail,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ezzySupportAI } from '@/ai/flows/support-ai-flow';
import { useGlobalSettings } from '@/hooks/use-global-settings';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  type?: 'text' | 'options' | 'orders' | 'feedback' | 'contact' | 'chips';
  options?: any[];
};

export default function SupportPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { settings, loading: settingsLoading } = useGlobalSettings();
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialMessage: Message = { 
    id: 'welcome', 
    role: 'assistant', 
    content: '👋 Welcome to Ezzy Bites Support. How can we help you today?',
    type: 'options' 
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Recent Orders Query
  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user]);
  const { data: recentOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  // Menu Registry Query for AI Context
  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), limit(100));
  }, [db]);
  const { data: menuItems } = useCollection<any>(menuQuery);

  const supportCategories = [
    { id: 'order', label: 'Order Issue', icon: Package, color: 'bg-primary/10 text-primary' },
    { id: 'payment', label: 'Payment Issue', icon: CreditCard, color: 'bg-blue-100 text-blue-600' },
    { id: 'delivery', label: 'Delivery Issue', icon: Truck, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'food', label: 'Food Quality', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { id: 'feedback', label: 'Feedback', icon: Star, color: 'bg-purple-100 text-purple-600' },
    { id: 'general', label: 'General Enquiry', icon: HelpCircle, color: 'bg-zinc-100 text-zinc-600' },
    { id: 'contact', label: 'Contact Support', icon: Phone, color: 'bg-rose-100 text-rose-600' }
  ];

  const generalOptions = ["Restaurant Timings", "Delivery Charges", "Coupons & Offers", "Payment Methods"];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (role: 'assistant' | 'user', content: string, type: Message['type'] = 'text', options?: any[]) => {
    const newMsg: Message = { 
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
      role, 
      content, 
      type, 
      options 
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSendMessage = async (text?: string, categoryOverride?: string) => {
    const msg = text || inputText;
    if (!msg.trim()) return;

    addMessage('user', msg);
    setInputText('');
    setIsTyping(true);

    try {
      const chatHistory = messages
        .filter(m => m.type === 'text')
        .map(m => ({ 
          role: m.role === 'assistant' ? 'model' as const : 'user' as const, 
          content: m.content 
        }));

      // Summarize Menu and Settings for AI Context
      const menuContext = menuItems?.map(i => `${i.name} (₹${i.price}) - ${i.isAvailable ? 'In Stock' : 'Sold Out'}`).join('\n') || '';
      const settingsContext = settings ? `Store Status: ${settings.isOpen ? 'OPEN' : 'CLOSED'}, Delivery: ${settings.deliveryActive ? 'ACTIVE' : 'INACTIVE'}, Charge: ₹${settings.deliveryCharge}, Free Delivery above: ₹${settings.freeDeliveryThreshold}` : '';

      const response = await ezzySupportAI({
        message: msg,
        category: categoryOverride || activeCategory || undefined,
        chatHistory,
        menuContext,
        settingsContext
      });

      addMessage('assistant', response.reply, 'chips', response.suggestedActions);
    } catch (e) {
      console.error("🔥 [Ezzy AI] UI Error:", e);
      addMessage('assistant', "Sorry, I'm currently unavailable. Please try again later.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleCategoryClick = (cat: any) => {
    setActiveCategory(cat.label);
    addMessage('user', cat.label);
    
    if (cat.id === 'order') {
      addMessage('assistant', 'Please select the order you need help with:', 'orders');
    } else if (cat.id === 'feedback') {
      addMessage('assistant', 'We value your input. Please rate your experience:', 'feedback');
    } else if (cat.id === 'contact') {
      addMessage('assistant', 'Our support nodes are active 08:00 AM - 10:00 PM:', 'contact');
    } else if (cat.id === 'general') {
      addMessage('assistant', 'Select a topic or type your question:', 'chips', generalOptions);
    } else {
      handleSendMessage(cat.label, cat.label);
    }
  };

  const handleOrderSelect = (order: any) => {
    const orderText = `Order #${order.orderId}`;
    addMessage('user', orderText);
    const issues = ["Where is my order?", "Items missing", "Packaging issue", "Cancel my order"];
    addMessage('assistant', `Understood. What's the issue with ${orderText}?`, 'chips', issues);
  };

  const submitFeedback = async (rating: number, comment: string) => {
    if (!db || !user) return;
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: user.uid,
        userName: user.displayName || 'Guest',
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      addMessage('assistant', '🎉 Thank you! Your feedback has been recorded in our logs.');
      addMessage('assistant', 'Is there anything else I can help with?', 'options');
    } catch (e) {
      toast({ variant: "destructive", title: "Feedback Sync Failed" });
    }
  };

  const handleClearChat = () => {
    setMessages([initialMessage]);
    setActiveCategory(null);
    toast({ title: "Session Cleared" });
  };

  if (userLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-14 md:pt-20 max-w-2xl mx-auto w-full px-4 pb-3">
        {/* CHAT HEADER / CONTROLS */}
        <div className="flex justify-between items-center py-2 px-1 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Active Support Node</span>
           </div>
           <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearChat}
              className="h-8 rounded-lg font-black uppercase text-[8px] tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 gap-2 transition-all"
           >
              <RotateCcw className="w-3 h-3" /> Clear History
           </Button>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 py-4 flex flex-col">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex flex-col max-w-[85%] space-y-1.5", msg.role === 'user' ? "items-end ml-auto" : "items-start")}
              >
                {msg.content && (
                  <div className={cn(
                    "p-3.5 rounded-2xl shadow-sm text-xs font-medium leading-relaxed",
                    msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white dark:bg-zinc-900 border rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                )}

                {/* RENDER OPTIONS - Main Grid */}
                {msg.type === 'options' && (
                  <div className="grid grid-cols-2 gap-2 mt-1 w-full max-w-sm">
                    {supportCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border hover:border-primary transition-all text-left group shadow-sm"
                      >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cat.color)}>
                          <cat.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tight group-hover:text-primary truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* RENDER CHIPS - Quick Replies */}
                {msg.type === 'chips' && msg.options && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(opt)}
                        className="px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-full text-[8px] font-black uppercase tracking-tight border border-zinc-200 hover:border-primary hover:text-primary transition-all shadow-sm"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* RENDER ORDERS - Clickable Cards */}
                {msg.type === 'orders' && (
                  <div className="space-y-2 mt-1 w-full">
                    {ordersLoading ? <Loader2 className="w-4 h-4 animate-spin opacity-20" /> : 
                      (!recentOrders || recentOrders.length === 0) ? (
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-center">
                          <p className="text-[9px] font-black uppercase opacity-40">No recent orders found.</p>
                        </div>
                      ) :
                      recentOrders.map(o => (
                        <button key={o.id} onClick={() => handleOrderSelect(o)} className="w-full p-3 bg-white dark:bg-zinc-900 rounded-xl border flex items-center justify-between group hover:border-primary transition-all shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <p className="text-[9px] font-black uppercase text-primary leading-none mb-0.5">Ticket #{o.orderId}</p>
                              <p className="text-[8px] font-bold opacity-40 uppercase">₹{o.total} • {o.status.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-20 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))
                    }
                  </div>
                )}

                {/* RENDER FEEDBACK */}
                {msg.type === 'feedback' && <FeedbackInput onComplete={submitFeedback} />}

                {/* RENDER CONTACT */}
                {msg.type === 'contact' && (
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm space-y-4 mt-1 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Phone className="w-4 h-4" /></div>
                      <div><p className="text-[7px] font-black uppercase opacity-40 leading-none mb-0.5">Hotline</p><p className="text-xs font-black">+91 8639366800</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-center justify-center text-blue-600"><Mail className="w-4 h-4" /></div>
                      <div><p className="text-[7px] font-black uppercase opacity-40 leading-none mb-0.5">Email</p><p className="text-xs font-black">support@ezzybites.com</p></div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 p-2 bg-white dark:bg-zinc-900 rounded-xl rounded-tl-none border w-fit shadow-sm">
                <span className="w-1 h-1 bg-primary/30 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-primary/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 bg-primary/30 rounded-full animate-bounce [animation-delay:0.4s]" />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* INPUT AREA */}
        <div className="shrink-0 pt-3 border-t bg-zinc-50 dark:bg-zinc-950 pb-3">
          <div className="flex gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-full border shadow-lg items-center ring-2 ring-primary/5">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Ezzy AI anything..." 
              className="flex-1 border-none bg-transparent focus-visible:ring-0 font-bold px-4 h-10 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="w-10 h-10 rounded-full p-0 bg-primary text-white shadow-lg shrink-0 transition-transform active:scale-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[7px] font-black text-center mt-2.5 uppercase tracking-widest opacity-20">Ezzy AI Assistant • Secure Node 4.5</p>
        </div>
      </main>
    </div>
  );
}

function FeedbackInput({ onComplete }: { onComplete: (r: number, c: string) => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return null;

  return (
    <Card className="w-full mt-1 rounded-2xl border shadow-md p-4 md:p-6 bg-white dark:bg-zinc-900 animate-in zoom-in-95">
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-75 p-1">
              <Star className={cn("w-6 h-6 md:w-7 md:h-7", s <= rating ? "fill-primary text-primary" : "text-zinc-200 dark:text-zinc-800")} />
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[8px] font-black uppercase opacity-40 ml-1">Comments</Label>
          <Textarea 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            placeholder="Help us improve..."
            className="rounded-xl bg-secondary/30 border-none min-h-[70px] font-medium text-xs p-3"
          />
        </div>
        <Button 
          className="w-full h-10 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest shadow-md"
          onClick={() => { setSubmitted(true); onComplete(rating, comment); }}
        >
          Submit Feedback
        </Button>
      </div>
    </Card>
  );
}
