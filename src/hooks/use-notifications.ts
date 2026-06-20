'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: 'order' | 'promo' | 'system';
  link?: string;
  read: boolean;
  createdAt: any;
  orderId?: string;
}

export function useNotifications() {
  const db = useFirestore();
  const { user } = useUser();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }

    // LISTENING TO user_notifications/{userId}/messages
    // Collection references must have an odd number of segments
    const q = query(
      collection(db, 'user_notifications', user.uid, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AppNotification[];
      
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
      setLoading(false);
    }, (error) => {
      console.warn("Notification listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  const markAsRead = useCallback(async (notifId: string) => {
    if (!db || !user?.uid) return;
    const notifRef = doc(db, 'user_notifications', user.uid, 'messages', notifId);
    updateDoc(notifRef, { read: true });
  }, [db, user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user?.uid || notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'user_notifications', user.uid!, 'messages', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  }, [db, user?.uid, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
}
