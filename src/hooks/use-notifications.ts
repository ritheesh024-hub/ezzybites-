'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'promo' | 'system';
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

  // Fetch & Listen to Notifications (In-App Only)
  useEffect(() => {
    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
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
  }, [db, user?.uid]); // Use UID string to stabilize dependency

  // Trigger Notification (Internal Logic)
  const sendNotification = useCallback(async (uid: string, data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    if (!db) return;
    const notifRef = collection(db, 'users', uid, 'notifications');
    addDoc(notifRef, {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
  }, [db]);

  // Mark Read
  const markAsRead = useCallback(async (notifId: string) => {
    if (!db || !user?.uid) return;
    const notifRef = doc(db, 'users', user.uid, 'notifications', notifId);
    updateDoc(notifRef, { read: true });
  }, [db, user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user?.uid || notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'users', user.uid!, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  }, [db, user?.uid, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    sendNotification,
    markAsRead,
    markAllAsRead
  };
}
