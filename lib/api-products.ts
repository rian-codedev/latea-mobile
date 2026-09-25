import { api } from './api';

export type ApiProduct = {
  id: number;
  code: string;
  name: string;
  emoji: string | null;
  image_url: string | null;
  price: number;
  discount_price: number | null;
  minimal_discount: number | null;
  is_active: boolean;
};

type ProductsResponse = {
  data: ApiProduct[];
  meta: {
    store_id: number;
    total: number;
  };
};

export async function fetchProducts(): Promise<ApiProduct[]> {
  const res = await api.get<ProductsResponse>('/products');
  return res.data.data;
}