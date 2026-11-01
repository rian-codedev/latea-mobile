import { api } from './client';

/* ── Types ── */
export type ServerTime = { time: string; date_full: string };

export type SaleItem = {
  product_id: number;
  product_name: string;
  product_code: string;
  price: number;
  discount_price: number | null;
  effective_price: number;
  quantity: number;
  line_total: number;
};

export type SalesMetrics = {
  my_revenue: number;
  my_transactions: number;
  my_items_sold: number;
  store_revenue: number;
  store_transactions: number;
  store_items_sold: number;
  server_time?: ServerTime;
};

export type Sale = {
  id: number;
  invoice_number: string;
  sale_date: string;
  cashier_name: string;
  store: { id: number; name: string; code: string; location: string } | null;
  items: SaleItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_amount: number;
  change_amount: number;
  status: string;
};

export type SaleListItem = {
  id: number;
  invoice_number: string;
  sale_date: string;
  total: number;
  items_count: number;
  total_quantity: number;
  status: string;
};

export type CreateSaleInput = {
  items: { product_id: number; quantity: number }[];
  payment_amount: number;
};

export type ProductSummaryItem = {
  product_id: number;
  product_name: string;
  product_code: string;
  total_qty: number;
  total_revenue: number;
};

export type SalesListResponse = {
  data: SaleListItem[];
  meta: Record<string, unknown>;
  metrics?: SalesMetrics;
};

/* ── API ── */
export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const res = await api.post<{ data: Sale }>('/sales', input);
  return res.data.data;
}

export async function fetchSales(): Promise<SalesListResponse> {
  const res = await api.get<SalesListResponse>('/sales');
  return res.data;
}

export async function fetchProductSummary(params?: {
  date_from?: string;
  date_to?: string;
}): Promise<ProductSummaryItem[]> {
  const res = await api.get<{ data: ProductSummaryItem[] }>(
    '/sales/product-summary',
    { params },
  );
  return res.data.data;
}

export async function fetchSaleDetail(saleId: number): Promise<Sale> {
  const res = await api.get<{ data: Sale }>(`/sales/${saleId}`);
  return res.data.data;
}

export async function updateSale(
  saleId: number,
  payload: CreateSaleInput,
): Promise<Sale> {
  const res = await api.put<{ data: Sale }>(`/sales/${saleId}`, payload);
  return res.data.data;
}

export async function deleteSale(saleId: number): Promise<void> {
  await api.delete(`/sales/${saleId}`);
}