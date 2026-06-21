
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { 
  Bot, 
  User, 
  Package, 
  CreditCard, 
  Truck, 
  Utensils, 
  Star, 
  HelpCircle, 
  Send, 
  Loader2, 
  ChevronRight,
  ArrowLeft,
  X,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ezzySupportAI } from '@/ai/flows/support-ai-flow';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  type?: 'text' | 'options' | 'orders' | 'feedback' | 'contact';
  options?: string[];
};

export default function SupportPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'assistant', 
      content: '👋 Hi! I am Ezzy AI. How can I help you today?',
      type: 'options' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Recent Orders Query
  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(3));
  }, [db, user]);
  const { data: recentOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const supportCategories = [
    { id: 'order', label: 'Order Issue', icon: Package, color: 'bg-primary/10 text-primary' },
    { id: 'payment', label: 'Payment Issue', icon: CreditCard, color: 'bg-blue-100 text-blue-600' },
    { id: 'delivery', label: 'Delivery Issue', icon: Truck, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'food', label: 'Food Quality', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { id: 'feedback', label: 'Feedback', icon: Star, color: 'bg-purple-100 text-purple-600' },
    { id: 'general', label: 'General Enquiry', icon: HelpCircle, color: 'bg-zinc-100 text-zinc-600' },
    { id: 'contact', label: 'Contact Support', icon: Phone, color: 'bg-rose-100 text-rose-600' }
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (role: 'assistant' | 'user', content: string, type: Message['type'] = 'text', options?: string[]) => {
    const newMsg: Message = { 
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
      role, 
      content, 
      type, 
      options 
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSendMessage = async (text?: string) => {
    const msg = text || inputText;
    if (!msg.trim()) return;

    addMessage('user', msg);
    setInputText('');
    setIsTyping(true);

    try {
      const chatHistory = messages.map(m => ({ 
        role: m.role === 'assistant' ? 'model' as const : 'user' as const, 
        content: m.content 
      }));

      const response = await ezzySupportAI({
        message: msg,
        category: activeCategory || undefined,
        chatHistory
      });

      addMessage('assistant', response.reply, 'text', response.suggestedActions);
    } catch (e) {
      console.error("AI Flow Error:", e);
      addMessage('assistant', 'Ezzy AI Assistant is currently unavailable. Please try again later or use the contact options.');
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
      addMessage('assistant', 'Your feedback improves our operational density. Please rate us:', 'feedback');
    } else if (cat.id === 'contact') {
      addMessage('assistant', 'Our high-speed support nodes are available during working hours:', 'contact');
    } else {
      setIsTyping(true);
      setTimeout(async () => {
        try {
          const response = await ezzySupportAI({ message: cat.label, category: cat.label });
          addMessage('assistant', response.reply, 'text', response.suggestedActions);
        } catch (err) {
          addMessage('assistant', 'Ezzy AI logic node is currently offline. Please try again.');
        }
        setIsTyping(false);
      }, 500);
    }
  };

  const handleOrderSelect = async (order: any) => {
    const orderText = `Order #${order.orderId}`;
    addMessage('user', orderText);
    setIsTyping(true);
    
    const issues = ["Order Delayed", "Missing Item", "Wrong Food", "Damaged Packaging", "Need Invoice", "Cancel Order"];
    addMessage('assistant', `Acknowledged. What seems to be the issue with ${orderText}?`, 'text', issues);
    setIsTyping(false);
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
      addMessage('assistant', '🎉 Thank you! Your feedback has been synchronized with our kitchen logs.');
    } catch (e) {
      toast({ variant: "destructive", title: "Feedback Sync Failed" });
    }
  };

  if (userLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-20 md:pt-24 max-w-2xl mx-auto w-full px-4 pb-4">
        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 py-6 flex flex-col">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex flex-col max-w-[85%] space-y-1", msg.role === 'user' ? "items-end ml-auto" : "items-start")}
              >
                <div className={cn(
                  "p-4 rounded-[1.8rem] shadow-sm text-sm font-medium leading-relaxed",
                  msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white dark:bg-zinc-900 border rounded-tl-none"
                )}>
                  {msg.content}
                </div>

                {/* RENDER OPTIONS */}
                {msg.type === 'options' && (
                  <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-sm">
                    {supportCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border hover:border-primary transition-all text-left group"
                      >
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", cat.color)}>
                          <cat.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight group-hover:text-primary">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* RENDER ORDERS */}
                {msg.type === 'orders' && (
                  <div className="space-y-2 mt-4 w-full">
                    {ordersLoading ? <Loader2 className="w-5 h-5 animate-spin opacity-20" /> : 
                      recentOrders.length === 0 ? <p className="text-[10px] font-bold opacity-40">No recent orders found.</p> :
                      recentOrders.map(o => (
                        <button key={o.id} onClick={() => handleOrderSelect(o)} className="w-full p-4 bg-white rounded-2xl border flex items-center justify-between group hover:border-primary">
                          <div className="flex items-center gap-4">
                            <Package className="w-4 h-4 text-primary" />
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase text-primary">Ticket #{o.orderId}</p>
                              <p className="text-[9px] font-bold opacity-40 uppercase">₹{o.total} • {o.status}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-20 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))
                    }
                  </div>
                )}

                {/* RENDER FEEDBACK */}
                {msg.type === 'feedback' && <FeedbackInput onComplete={submitFeedback} />}

                {/* RENDER CONTACT */}
                {msg.type === 'contact' && (
                  <div className="bg-white p-6 rounded-3xl border space-y-4 mt-4 w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Phone className="w-5 h-5" /></div>
                      <div><p className="text-[8px] font-black uppercase opacity-40">Call Hotline</p><p className="text-sm font-black">+91 8639366800</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Mail className="w-5 h-5" /></div>
                      <div><p className="text-[8px] font-black uppercase opacity-40">Email Support</p><p className="text-sm font-black">support@ezzybites.com</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Clock className="w-5 h-5" /></div>
                      <div><p className="text-[8px] font-black uppercase opacity-40">Working Window</p><p className="text-sm font-black">08:00 AM - 10:00 PM</p></div>
                    </div>
                  </div>
                )}

                {/* SUGGESTED CHIPS */}
                {msg.options && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(opt)}
                        className="px-3 py-1.5 bg-secondary/50 rounded-full text-[10px] font-black uppercase tracking-tight border hover:bg-primary/5 hover:border-primary transition-all"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 p-4 bg-white rounded-2xl rounded-tl-none border w-fit">
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* INPUT AREA */}
        <div className="shrink-0 pt-4 border-t bg-zinc-50 dark:bg-zinc-950 pb-4">
          <div className="flex gap-3 bg-white dark:bg-zinc-900 p-2 rounded-[2rem] border shadow-lg">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tell me your concern..." 
              className="flex-1 border-none bg-transparent focus-visible:ring-0 font-bold px-4 h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="w-12 h-12 rounded-full p-0 bg-primary text-white shadow-xl shadow-primary/20"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-[8px] font-black text-center mt-3 uppercase tracking-widest opacity-20">Ezzy AI Assistant Node v4.2 • Pocharam HQ</p>
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
    <Card className="w-full mt-4 rounded-3xl border shadow-xl p-6 bg-white dark:bg-zinc-900">
      <div className="space-y-6">
        <div className="flex justify-center gap-3">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-75">
              <Star className={cn("w-8 h-8", s <= rating ? "fill-primary text-primary" : "text-zinc-200")} />
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Comments</Label>
          <Textarea 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            placeholder="Tell us what we can improve..."
            className="rounded-2xl bg-secondary/30 border-none min-h-[80px] font-medium"
          />
        </div>
        <Button 
          className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest"
          onClick={() => { setSubmitted(true); onComplete(rating, comment); }}
        >
          Settle Feedback
        </Button>
      </div>
    </Card>
  );
}
