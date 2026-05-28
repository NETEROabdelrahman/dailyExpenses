import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DEFAULT_CATEGORIES} from '../constants/appConstants';
import {AppPage, Expense} from '../types/expense';
import {normalizedDateISO} from '../utils/date';

type AppState = {
  expenses: Expense[];
  categories: string[];
  cashText: string;
  bankText: string;
  page: AppPage;
  selectedMonth: string | null;
  form: {
    name: string;
    amountText: string;
    expenseDateISO: string;
    notes: string;
    selectedCategory: string;
    newCategory: string;
    editingExpenseId: string | null;
  };
};

const createInitialState = (): AppState => ({
  expenses: [],
  categories: DEFAULT_CATEGORIES,
  cashText: '',
  bankText: '',
  page: 'main',
  selectedMonth: null,
  form: {
    name: '',
    amountText: '',
    expenseDateISO: new Date().toISOString(),
    notes: '',
    selectedCategory: DEFAULT_CATEGORIES[0],
    newCategory: '',
    editingExpenseId: null,
  },
});

const resetFormValues = (state: AppState) => {
  state.form.name = '';
  state.form.amountText = '';
  state.form.expenseDateISO = new Date().toISOString();
  state.form.notes = '';
  state.form.newCategory = '';
  state.form.editingExpenseId = null;
};

const appSlice = createSlice({
  name: 'app',
  initialState: createInitialState(),
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.form.name = action.payload;
    },
    setAmountText(state, action: PayloadAction<string>) {
      state.form.amountText = action.payload;
    },
    setExpenseDateISO(state, action: PayloadAction<string>) {
      state.form.expenseDateISO = action.payload;
    },
    setNotes(state, action: PayloadAction<string>) {
      state.form.notes = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.form.selectedCategory = action.payload;
    },
    setNewCategory(state, action: PayloadAction<string>) {
      state.form.newCategory = action.payload;
    },
    setCashText(state, action: PayloadAction<string>) {
      state.cashText = action.payload;
    },
    setBankText(state, action: PayloadAction<string>) {
      state.bankText = action.payload;
    },
    setPage(state, action: PayloadAction<AppPage>) {
      state.page = action.payload;
    },
    setSelectedMonth(state, action: PayloadAction<string | null>) {
      state.selectedMonth = action.payload;
    },
    resetForm(state) {
      resetFormValues(state);
    },
    addCategoryFromForm(state) {
      const clean = state.form.newCategory.trim();
      if (!clean || state.categories.includes(clean)) {
        return;
      }

      state.categories.push(clean);
      state.form.selectedCategory = clean;
      state.form.newCategory = '';
    },
    saveExpenseFromForm(state) {
      const cleanName = state.form.name.trim();
      const amount = Number(state.form.amountText);
      const dateISO = normalizedDateISO(new Date(state.form.expenseDateISO));

      if (!cleanName || !Number.isFinite(amount) || amount <= 0) {
        return;
      }

      if (state.form.editingExpenseId) {
        state.expenses = state.expenses.map(item => {
          if (item.id !== state.form.editingExpenseId) {
            return item;
          }

          return {
            ...item,
            name: cleanName,
            amount,
            dateISO,
            notes: state.form.notes.trim(),
            category: state.form.selectedCategory,
          };
        });
        resetFormValues(state);
        return;
      }

      const expense: Expense = {
        id: `${Date.now()}`,
        name: cleanName,
        amount,
        dateISO,
        notes: state.form.notes.trim(),
        category: state.form.selectedCategory,
      };

      state.expenses = [expense, ...state.expenses];
      resetFormValues(state);
    },
    startEditingExpense(state, action: PayloadAction<Expense>) {
      const expense = action.payload;
      state.page = 'main';
      state.form.editingExpenseId = expense.id;
      state.form.name = expense.name;
      state.form.amountText = String(expense.amount);
      state.form.expenseDateISO = expense.dateISO;
      state.form.notes = expense.notes;
      state.form.selectedCategory = expense.category;
    },
    deleteExpense(state, action: PayloadAction<string>) {
      const expenseId = action.payload;
      state.expenses = state.expenses.filter(item => item.id !== expenseId);

      if (state.form.editingExpenseId === expenseId) {
        resetFormValues(state);
      }
    },
    openMonthDetails(state, action: PayloadAction<string>) {
      state.selectedMonth = action.payload;
      state.page = 'monthDetails';
    },
  },
});

export const {
  addCategoryFromForm,
  deleteExpense,
  openMonthDetails,
  resetForm,
  saveExpenseFromForm,
  setAmountText,
  setBankText,
  setCashText,
  setExpenseDateISO,
  setName,
  setNewCategory,
  setNotes,
  setPage,
  setSelectedCategory,
  setSelectedMonth,
  startEditingExpense,
} = appSlice.actions;

export default appSlice.reducer;
