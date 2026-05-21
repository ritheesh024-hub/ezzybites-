
"use client"
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  rating: number;
  isAvailable: boolean;
}

interface CartItem extends FoodItem {
  quantity: number;
}

interface AppStore {
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (item) => set((state) => {
        const existing = state.cart.find((i) => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map((i) => 
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
      }),
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((i) => i.id !== id)
      })),
      updateQuantity: (id, delta) => set((state) => ({
        cart: state.cart.map((i) => 
          i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        ).filter(i => i.quantity > 0)
      })),
      clearCart: () => set({ cart: [] }),
      getTotal: () => get().cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    { name: 'ezzy-bites-storage' }
  )
);
