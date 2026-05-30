import {Dimensions} from 'react-native';
import {
  DebtDirection,
  DebtStatus,
  IncomingMoneySourceType,
  PaymentMethod,
} from '../types/expense';

export const DEFAULT_CATEGORIES = ['طعام', 'ديون', 'مواصلات', 'تسوق', 'أخرى'];

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank', 'wallet'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'النقد المتوفر',
  bank: 'رصيد البنك',
  wallet: 'رصيد المحفظة',
};

export const INCOMING_MONEY_SOURCES: IncomingMoneySourceType[] = [
  'salary',
  'freelance',
  'gift',
  'refund',
  'other',
];

export const INCOMING_MONEY_SOURCE_LABELS: Record<IncomingMoneySourceType, string> = {
  salary: 'راتب',
  freelance: 'عمل إضافي',
  gift: 'هدية',
  refund: 'استرجاع',
  other: 'أخرى',
};

export const DEBT_DIRECTION_LABELS: Record<DebtDirection, string> = {
  owe: 'عليّ',
  owedToMe: 'لي',
};

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  active: 'نشط',
  settled: 'مسدد',
  overdue: 'متأخر',
};

export const CHART_COLORS = [
  '#f97316',
  '#0284c7',
  '#65a30d',
  '#dc2626',
  '#7c3aed',
];

const PRESET_CATEGORY_COLORS: Record<string, string> = {
  طعام: '#f97316',
  ديون: '#dc2626',
  مواصلات: '#0284c7',
  تسوق: '#7c3aed',
  أخرى: '#65a30d',
};

const stringHash = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
};

const rgbToHex = (red: number, green: number, blue: number): string => {
  const toHex = (value: number): string => value.toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const hslToHex = (hue: number, saturation: number, lightness: number): string => {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = chroma;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = chroma;
  } else if (hue < 180) {
    gPrime = chroma;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = chroma;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = chroma;
  } else {
    rPrime = chroma;
    bPrime = x;
  }

  const red = Math.round((rPrime + m) * 255);
  const green = Math.round((gPrime + m) * 255);
  const blue = Math.round((bPrime + m) * 255);
  return rgbToHex(red, green, blue);
};

const hexToHue = (hex: string): number => {
  const safeHex = hex.replace('#', '');
  const red = parseInt(safeHex.slice(0, 2), 16) / 255;
  const green = parseInt(safeHex.slice(2, 4), 16) / 255;
  const blue = parseInt(safeHex.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) {
    return 0;
  }

  if (max === red) {
    return (60 * ((green - blue) / delta) + 360) % 360;
  }

  if (max === green) {
    return (60 * ((blue - red) / delta) + 120) % 360;
  }

  return (60 * ((red - green) / delta) + 240) % 360;
};

const hueDistance = (first: number, second: number): number => {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
};

const RESERVED_HUES = Object.values(PRESET_CATEGORY_COLORS).map(hexToHue);
const MIN_HUE_DISTANCE = 28;

const pickDistinctHue = (baseHue: number): number => {
  const maxAttempts = 12;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = (baseHue + attempt * 137) % 360;
    const isFarEnough = RESERVED_HUES.every(
      reservedHue => hueDistance(candidate, reservedHue) >= MIN_HUE_DISTANCE,
    );
    if (isFarEnough) {
      return candidate;
    }
  }

  return baseHue;
};

const toRgba = (hex: string, alpha: number): string => {
  const safeHex = hex.replace('#', '');
  const red = parseInt(safeHex.slice(0, 2), 16);
  const green = parseInt(safeHex.slice(2, 4), 16);
  const blue = parseInt(safeHex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const getCategoryColor = (category: string): string => {
  const cleanCategory = category.trim();
  if (PRESET_CATEGORY_COLORS[cleanCategory]) {
    return PRESET_CATEGORY_COLORS[cleanCategory];
  }

  const hash = stringHash(cleanCategory || 'category');
  const hue = pickDistinctHue(hash % 360);
  const saturation = 66 + (hash % 14);
  const lightness = 40 + (Math.floor(hash / 8) % 12);
  return hslToHex(hue, saturation, lightness);
};

export const getCategoryTint = (category: string, alpha = 0.14): string =>
  toRgba(getCategoryColor(category), alpha);

export const PIE_CHART_SIZE = Math.min(Dimensions.get('window').width - 48, 320);

export const EXPENSES_STORAGE_KEY = 'daily_expenses_items_v1';
export const CATEGORIES_STORAGE_KEY = 'daily_expenses_categories_v1';
export const CASH_STORAGE_KEY = 'daily_expenses_cash_v1';
export const BANK_STORAGE_KEY = 'daily_expenses_bank_v1';
