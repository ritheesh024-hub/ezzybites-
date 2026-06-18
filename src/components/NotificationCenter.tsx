'use client';

import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  ShoppingBag, 
  TicketPercent, 
  Settings, 
  X, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/use-notifications';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export const NotificationCenter = ({ children }: { children: React.ReactNode }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestPermission } = useNotifications();
  const router = useRouter();

  const handleNotifClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-4 h-4 text-primary" />;
      case 'promo': return <TicketPercent className="w-4 h-4 text-emerald-500" />;
      default: return <Settings className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild onClick={() => requestPermission()}>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 rounded-l-[2.5rem] border-none shadow-3xl bg-white dark:bg-zinc-950">
        <SheetHeader className="p-8 border-b bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black font-headline tracking-tighter uppercase">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white animate-pulse" />}
              </div>
              Inbox
            </SheetTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                onClick={() => markAllAsRead()}
                className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-secondary/50 rounded-[2.5rem] flex items-center justify-center opacity-20">
                <Inbox className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black uppercase tracking-tighter italic">Station Clear</h4>
                <p className="text-xs font-medium text-muted-foreground opacity-60">You're all caught up with your bites.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={cn(
                    "p-6 transition-all cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex gap-5 items-start",
                    !notif.read && "bg-primary/[0.02] border-l-4 border-primary"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    notif.type === 'order' ? "bg-primary/5" : notif.type === 'promo' ? "bg-emerald-50" : "bg-blue-50"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h5 className={cn(
                        "text-sm font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors",
                        !notif.read ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {notif.title}
                      </h5>
                      <span className="text-[8px] font-black uppercase opacity-30 whitespace-nowrap pt-1">
                        {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), 'hh:mm a') : 'Now'}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-muted-foreground line-clamp-2">
                      {notif.body}
                    </p>
                    {notif.orderId && (
                      <div className="pt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary bg-primary/5 px-2">
                          #{notif.orderId}
                        </Badge>
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Track Order <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100">
           <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-[1.5rem] border border-dashed border-zinc-200 shadow-sm">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-[10px] font-bold leading-relaxed text-muted-foreground">
                Enable <span className="text-foreground">Browser Push</span> in settings to receive updates even when the app is closed.
              </p>
           </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
