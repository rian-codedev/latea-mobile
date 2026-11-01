import type { Href } from 'expo-router';

export const APP_NAME = 'Latea App';
export const APP_TAGLINE = 'Annuqayah Latee';
export const APP_ORG = 'PP. Annuqayah Latee';
export const APP_SUBTITLE = 'Point of Sale Information System';

export const ROUTES = {
  onboarding: '/(onboarding)' as Href,
  login: '/(auth)/login' as Href,
  home: '/(app)' as Href,
  cashier: '/(app)/cashier' as Href,
  cashierEdit: (saleId: number) =>
    `/(app)/cashier?editSaleId=${saleId}` as Href,
};