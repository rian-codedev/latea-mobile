export type Product = {
  id: number;
  code: string;
  name: string;
  emoji: string;
  price: number;
  discountPrice: number | null;
  minimalDiscount: number | null;
  isActive: boolean;
};

export const MOCK_PRODUCTS: Product[] = [
  { id: 1,  code: 'P-001', name: 'Kopi Susu',    emoji: '☕', price: 18000, discountPrice: 16000, minimalDiscount: 3,    isActive: true },
  { id: 2,  code: 'P-002', name: 'Teh Hijau',    emoji: '🍵', price: 15000, discountPrice: null,  minimalDiscount: null, isActive: true },
  { id: 3,  code: 'P-003', name: 'Croissant',    emoji: '🥐', price: 22000, discountPrice: 20000, minimalDiscount: 5,    isActive: true },
  { id: 4,  code: 'P-004', name: 'Cheese Cake',  emoji: '🍰', price: 25000, discountPrice: null,  minimalDiscount: null, isActive: true },
  { id: 5,  code: 'P-005', name: 'Americano',    emoji: '🥤', price: 17000, discountPrice: 15000, minimalDiscount: 3,    isActive: true },
  { id: 6,  code: 'P-006', name: 'Matcha Latte', emoji: '🍵', price: 23000, discountPrice: null,  minimalDiscount: null, isActive: true },
  { id: 7,  code: 'P-007', name: 'Donat Gula',   emoji: '🍩', price: 10000, discountPrice: 8000,  minimalDiscount: 6,    isActive: true },
  { id: 8,  code: 'P-008', name: 'Es Kopi',      emoji: '🧊', price: 20000, discountPrice: null,  minimalDiscount: null, isActive: true },
  { id: 9,  code: 'P-009', name: 'Roti Bakar',   emoji: '🍞', price: 12000, discountPrice: 10000, minimalDiscount: 4,    isActive: true },
  { id: 10, code: 'P-010', name: 'Es Teh',       emoji: '🥤', price: 8000,  discountPrice: null,  minimalDiscount: null, isActive: true },
];