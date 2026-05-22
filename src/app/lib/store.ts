
"use client"
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BeverageOptions {
  size: 'Small' | 'Medium' | 'Large';
  sugar: 'None' | 'Less' | 'Regular' | 'Extra';
  temp: 'Hot' | 'Cold';
  addons: string[];
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isVeg: boolean;
  rating: number;
  isAvailable: boolean;
  isBeverage?: boolean;
  isBestSeller?: boolean;
  isPopular?: boolean;
  createdAt?: any;
}

export interface CartItem extends FoodItem {
  quantity: number;
  customization?: BeverageOptions;
  cartId: string; // Unique ID for cart matching (id + stringified options)
}

interface AppStore {
  cart: CartItem[];
  isAdminMuted: boolean;
  addToCart: (item: FoodItem, customization?: BeverageOptions) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  toggleAdminMute: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      cart: [],
      isAdminMuted: false, // Default to sounds enabled
      addToCart: (item, customization) => set((state) => {
        const cartId = customization 
          ? `${item.id}-${customization.size}-${customization.temp}-${customization.sugar}-${customization.addons.sort().join(',')}`
          : item.id;

        const existing = state.cart.find((i) => i.cartId === cartId);
        
        if (existing) {
          return {
            cart: state.cart.map((i) => 
              i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }

        let finalPrice = item.price;
        if (customization) {
          if (customization.size === 'Medium') finalPrice += 20;
          if (customization.size === 'Large') finalPrice += 40;
          finalPrice += customization.addons.length * 15;
        }

        return { 
          cart: [...state.cart, { ...item, price: finalPrice, quantity: 1, customization, cartId }] 
        };
      }),
      removeFromCart: (cartId) => set((state) => ({
        cart: state.cart.filter((i) => i.cartId !== cartId)
      })),
      updateQuantity: (cartId, delta) => set((state) => ({
        cart: state.cart.map((i) => 
          i.cartId === cartId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        ).filter(i => i.quantity > 0)
      })),
      clearCart: () => set({ cart: [] }),
      getTotal: () => get().cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
      toggleAdminMute: () => set((state) => ({ isAdminMuted: !state.isAdminMuted })),
    }),
    { name: 'ezzy-bites-operational-storage' }
  )
);
