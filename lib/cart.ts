import { create } from 'zustand';

export type CartItem = {
  productId: number;
  name: string;
  code: string;
  emoji: string;              // fallback kalau API tidak punya
  imageUrl: string | null;    // dari API
  price: number;
  discountPrice: number | null;
  minimalDiscount: number | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (p: Omit<CartItem, 'quantity'>) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],

  addItem: (p) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === p.productId);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === p.productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...s.items, { ...p, quantity: 1 }] };
    }),

  increment: (id) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.productId === id ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),

  decrement: (id) =>
    set((s) => ({
      items: s.items
        .map((i) =>
          i.productId === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),

  clear: () => set({ items: [] }),
}));

/** Logika harga efektif — SAMA dengan backend Product::effectivePriceFor() */
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

  return { subtotal, discount: subtotal - total, total };
}