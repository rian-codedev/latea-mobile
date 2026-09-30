import { create } from 'zustand';

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
  clear: () => void;
  setItems: (items: CartItem[]) => void;  // ⭐ TAMBAH INI
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
   Store
   ══════════════════════════════════════════════════════ */
export const useCart = create<CartState>((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  increment: (productId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),

  decrement: (productId) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, i.quantity - 1) }
            : i
        )
        .filter((i) => i.quantity > 0),
    })),

  clear: () => set({ items: [] }),

  // ⭐ Set items langsung (untuk edit mode)
  setItems: (items) => set({ items }),
}));