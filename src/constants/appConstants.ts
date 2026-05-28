import {Dimensions} from 'react-native';

export const CHART_COLORS = [
  '#f97316',
  '#0284c7',
  '#65a30d',
  '#dc2626',
  '#7c3aed',
];

export const PIE_CHART_SIZE = Math.min(Dimensions.get('window').width - 48, 320);

export const EXPENSES_STORAGE_KEY = 'daily_expenses_items_v1';
export const CATEGORIES_STORAGE_KEY = 'daily_expenses_categories_v1';
export const CASH_STORAGE_KEY = 'daily_expenses_cash_v1';
export const BANK_STORAGE_KEY = 'daily_expenses_bank_v1';

export const DEFAULT_CATEGORIES = ['طعام', 'ديون', 'مواصلات', 'تسوق', 'أخرى'];
