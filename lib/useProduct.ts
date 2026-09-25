import { useQuery } from '@tanstack/react-query';
import { fetchProducts, type ApiProduct } from './api-products';

export function useProducts(storeId?: number | null) {
  return useQuery<ApiProduct[]>({
    queryKey: ['products', storeId],      
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });
}