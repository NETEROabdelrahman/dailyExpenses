export const sanitizeAmountInput = (value: string): string => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole = '', decimal = ''] = cleaned.split('.');
  const limitedDecimal = decimal.slice(0, 2);
  return cleaned.includes('.') ? `${whole}.${limitedDecimal}` : whole;
};
