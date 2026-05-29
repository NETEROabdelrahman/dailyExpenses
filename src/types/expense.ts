export type Expense = {
  id: string;
  name: string;
  amount: number;
  dateISO: string;
  notes: string;
  category: string;
  paymentMethod: PaymentMethod;
};

export type PaymentMethod = 'cash' | 'bank' | 'wallet';

export type DebtDirection = 'owe' | 'owedToMe';

export type DebtStatus = 'active' | 'settled' | 'overdue';

export type DebtTransactionType = 'payment' | 'collection';

export type DebtTransaction = {
  id: string;
  debtId: string;
  amount: number;
  dateISO: string;
  paymentMethod: PaymentMethod;
  type: DebtTransactionType;
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

export type AppPage = 'main' | 'balances' | 'debts' | 'months' | 'monthDetails';
