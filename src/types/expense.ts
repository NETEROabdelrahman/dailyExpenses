export type Expense = {
  id: string;
  name: string;
  amount: number;
  dateISO: string;
  notes: string;
  category: string;
};

export type PieDatum = {
  name: string;
  population: number;
  color: string;
};

export type AppPage = 'main' | 'months' | 'monthDetails';
