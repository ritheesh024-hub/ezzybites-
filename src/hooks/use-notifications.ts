'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  setDoc,
  doc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { useFirestore, useUser, useFirebase } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const { messaging } = useFirebase();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch & Listen to Notifications
  useEffect(() => {
    if (!db || !user) {
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
    });

    return unsubscribe;
  }, [db, user]);

  // 2. Browser Push Permission (Request only on demand)
  const requestPermission = useCallback(async () => {
    if (!messaging || !user || !db) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BGE1W8R8N9S8_YOUR_VAPID_KEY' // Note: This needs a real VAPID key for production push
        });
        
        if (token) {
          // Store token in Firestore for backend push targeting
          await setDoc(doc(db, 'users', user.uid, 'fcm_tokens', token), {
            token,
            updatedAt: serverTimestamp(),
            platform: 'web'
          });
          return true;
        }
      }
    } catch (e) {
      console.warn("Notification permission failed", e);
    }
    return false;
  }, [messaging, user, db]);

  // 3. Trigger Notification (Internal Logic)
  const sendNotification = useCallback(async (uid: string, data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    if (!db) return;
    const notifRef = collection(db, 'users', uid, 'notifications');
    await addDoc(notifRef, {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
  }, [db]);

  // 4. Mark Read
  const markAsRead = useCallback(async (notifId: string) => {
    if (!db || !user) return;
    const notifRef = doc(db, 'users', user.uid, 'notifications', notifId);
    await updateDoc(notifRef, { read: true });
  }, [db, user]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user || notifications.length === 0) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'users', user.uid!, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  }, [db, user, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    requestPermission,
    sendNotification,
    markAsRead,
    markAllAsRead
  };
}
