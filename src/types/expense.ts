export type Expense = {
  id: string;
  name: string;
  amount: number;
  dateISO: string;
  periodKey: string;
  notes: string;
  category: string;
  subcategory: string;
  paymentMethod: PaymentMethod;
};

export type PaymentMethod = 'cash' | 'bank' | 'wallet';

export type IncomingMoneySourceType =
  | 'salary'
  | 'freelance'
  | 'gift'
  | 'refund'
  | 'other';

export type IncomingMoneyTransaction = {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  sourceType: IncomingMoneySourceType;
  sourceLabel: string;
  dateISO: string;
  periodKey: string;
};

export type BalanceTransactionType =
  | 'expense'
  | 'incoming'
  | 'debtPayment'
  | 'debtCollection'
  | 'transferOut'
  | 'transferIn'
  | 'manualAdjustment';

export type BalanceTransactionSourceType =
  | 'expense'
  | 'incoming'
  | 'debtTransaction'
  | 'balanceTransfer'
  | 'manualAdjustment';

export type BalanceTransaction = {
  id: string;
  type: BalanceTransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  dateISO: string;
  periodKey: string;
  title: string;
  sourceType: BalanceTransactionSourceType;
  sourceId: string;
  debtId?: string;
};

export type DebtDirection = 'owe' | 'owedToMe';

export type DebtStatus = 'active' | 'settled' | 'overdue';

export type DebtTransactionType = 'payment' | 'collection';

export type DebtTransaction = {
  id: string;
  debtId: string;
  amount: number;
  dateISO: string;
  periodKey: string;
  paymentMethod: PaymentMethod;
  type: DebtTransactionType;
};

export type AccountingPeriod = {
  id: string;
  label: string;
  startedAtISO: string;
  endedAtISO: string | null;
};

export type Debt = {
  id: string;
  personName: string;
  totalAmount: number;
  remainingAmount: number;
  direction: DebtDirection;
  dueDateISO: string;
  notes: string;
  createdAtISO: string;
  status: DebtStatus;
  transactions: DebtTransaction[];
};

export type PieDatum = {
  name: string;
  population: number;
  color: string;
};

export type AppPage =
  | 'main'
  | 'balances'
  | 'debts'
  | 'months'
  | 'monthDetails'
  | 'backup';
