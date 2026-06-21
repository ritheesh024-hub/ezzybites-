
'use client';

import { useCallback } from 'react';
import { logEvent } from 'firebase/analytics';
import { useAnalyticsInstance, useFirestore } from '@/firebase/provider';
import { FoodItem } from '@/app/lib/store';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Custom hook for high-level Firebase Analytics event tracking and Firestore behavioral logging.
 */
export function useAnalytics() {
  const analytics = useAnalyticsInstance();
  const db = useFirestore();

  const trackEvent = useCallback(async (eventName: string, params?: object) => {
    // 1. Google Analytics (Standard)
    if (analytics) {
      logEvent(analytics, eventName, params);
    }

    // 2. Firestore Analytics (Real-time Custom Dashboard Feed)
    if (db) {
      try {
        await addDoc(collection(db, 'analytics'), {
          event: eventName,
          ...params,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.warn("Behavioral log failed", e);
      }
    }
  }, [analytics, db]);

  const trackAppOpen = useCallback(() => {
    trackEvent('app_open');
  }, [trackEvent]);

  const trackLogin = useCallback((method: string = 'google', userEmail?: string) => {
    trackEvent('login', { method, email: userEmail });
  }, [trackEvent]);

  const trackSignup = useCallback((method: string = 'google', userEmail?: string) => {
    trackEvent('sign_up', { method, email: userEmail });
  }, [trackEvent]);

  const trackAddToCart = useCallback((item: FoodItem, quantity: number = 1) => {
    trackEvent('add_to_cart', {
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: quantity,
      value: item.price * quantity,
      currency: 'INR'
    });
  }, [trackEvent]);

  const trackCheckoutStarted = useCallback((cart: any[], total: number) => {
    trackEvent('begin_checkout', {
      item_count: cart.length,
      value: total,
      currency: 'INR'
    });
  }, [trackEvent]);

  const trackOrderPlaced = useCallback((order: any) => {
    trackEvent('purchase', {
      transaction_id: order.orderId,
      value: order.total,
      currency: 'INR',
      items: order.items.length
    });
  }, [trackEvent]);

  const trackOrderCancelled = useCallback((orderId: string, reason: string = 'customer_request') => {
    trackEvent('order_cancelled', {
      order_id: orderId,
      reason: reason
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string) => {
    trackEvent('search', { search_term: searchTerm });
  }, [trackEvent]);

  const trackCategoryView = useCallback((category: string) => {
    trackEvent('category_view', { category_name: category });
  }, [trackEvent]);

  const trackProductView = useCallback((item: FoodItem) => {
    trackEvent('view_item', {
      item_id: item.id,
      item_name: item.name,
      item_category: item.category
    });
  }, [trackEvent]);

  const trackMenuView = useCallback(() => {
    trackEvent('menu_view');
  }, [trackEvent]);

  /**
   * Logs staff-specific operational actions to the audit trail
   */
  const logStaffAction = useCallback(async (staffId: string, staffName: string, action: string, details: string) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'activity_logs'), {
        staffId,
        staffName,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Activity log failed", e);
    }
  }, [db]);

  return {
    trackEvent,
    trackAppOpen,
    trackLogin,
    trackSignup,
    trackAddToCart,
    trackCheckoutStarted,
    trackOrderPlaced,
    trackOrderCancelled,
    trackSearch,
    trackCategoryView,
    trackProductView,
    trackMenuView,
    logStaffAction
  };
}
