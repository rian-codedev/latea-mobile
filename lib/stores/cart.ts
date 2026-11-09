import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/* ══════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════ */
export type CartItem = {
  productId: number;
  name: string;
  code: string;
  emoji: string;
  imageUrl: string | null;
  price: number;
  discountPrice: number | null;
  minimalDiscount: number | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  setItems: (items: CartItem[]) => void;
};

/* ══════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════ */
export function effectivePrice(item: CartItem): number {
  if (
    item.discountPrice != null &&
    item.minimalDiscount != null &&
    item.quantity >= item.minimalDiscount
  ) {
    return item.discountPrice;
  }
  return item.price;
}

export function calcTotals(items: CartItem[]) {
  let subtotal = 0;
  let total = 0;

  for (const item of items) {
    subtotal += item.price * item.quantity;
    total += effectivePrice(item) * item.quantity;
  }

  return {
    subtotal,
    discount: subtotal - total,
    total,
  };
}

/* ══════════════════════════════════════════════════════
   Store (dengan persist)
   ══════════════════════════════════════════════════════ */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => i.productId !== productId,
          ),
        })),

      increment: (productId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        })),

      decrement: (productId) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(0, i.quantity - 1) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      setQuantity: (productId, quantity) => {
        const safeQty = Math.max(1, Math.floor(quantity));
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: safeQty }
              : i,
          ),
        }));
      },

      clear: () => set({ items: [] }),
      setItems: (items) => set({ items }),
    }),
    {
      name: 'latea-cart',          // key di AsyncStorage
      version: 1,                  // untuk migrasi di masa depan
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Hanya persist `items`. Actions (functions) otomatis
       * di-recreate saat store dibuat ulang — tidak bisa
       * di-serialize ke JSON.
       */
      partialize: (state) => ({ items: state.items }),
    },
  ),
);