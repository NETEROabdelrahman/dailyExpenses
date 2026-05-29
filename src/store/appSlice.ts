import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DEFAULT_CATEGORIES} from '../constants/appConstants';
import {
  AppPage,
  Debt,
  DebtDirection,
  DebtStatus,
  DebtTransaction,
  Expense,
  PaymentMethod,
} from '../types/expense';
import {normalizedDateISO} from '../utils/date';

type AppState = {
  expenses: Expense[];
  debts: Debt[];
  categories: string[];
  initialCashText: string;
  initialBankText: string;
  initialWalletText: string;
  cashText: string;
  bankText: string;
  walletText: string;
  page: AppPage;
  selectedMonth: string | null;
  form: {
    name: string;
    amountText: string;
    expenseDateISO: string;
    notes: string;
    selectedCategory: string;
    selectedPaymentMethod: PaymentMethod;
    newCategory: string;
    editingExpenseId: string | null;
  };
  debtForm: {
    personName: string;
    totalAmountText: string;
    dueDateISO: string;
    notes: string;
    direction: DebtDirection;
  };
  debtTransactionForm: {
    selectedDebtId: string | null;
    amountText: string;
    paymentMethod: PaymentMethod;
    transactionDateISO: string;
  };
};

const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'cash';
const DEFAULT_DEBT_DIRECTION: DebtDirection = 'owe';

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePaymentMethod = (
  paymentMethod?: Expense['paymentMethod'],
): PaymentMethod => {
  if (paymentMethod === 'cash' || paymentMethod === 'bank' || paymentMethod === 'wallet') {
    return paymentMethod;
  }
  return DEFAULT_PAYMENT_METHOD;
};

const normalizeDebtDirection = (direction?: DebtDirection): DebtDirection => {
  if (direction === 'owe' || direction === 'owedToMe') {
    return direction;
  }
  return DEFAULT_DEBT_DIRECTION;
};

const computeDebtStatus = (dueDateISO: string, remainingAmount: number): DebtStatus => {
  if (remainingAmount <= 0) {
    return 'settled';
  }

  const dueDate = new Date(dueDateISO);
  const now = new Date();

  if (dueDate.getTime() < now.getTime()) {
    return 'overdue';
  }

  return 'active';
};

const getBalanceValue = (state: AppState, paymentMethod: PaymentMethod): number => {
  if (paymentMethod === 'cash') {
    return toNumber(state.cashText);
  }

  if (paymentMethod === 'bank') {
    return toNumber(state.bankText);
  }

  return toNumber(state.walletText);
};

const setBalanceValue = (state: AppState, paymentMethod: PaymentMethod, value: number) => {
  const normalizedValue = String(Math.round(value * 100) / 100);

  if (paymentMethod === 'cash') {
    state.cashText = normalizedValue;
    return;
  }

  if (paymentMethod === 'bank') {
    state.bankText = normalizedValue;
    return;
  }

  state.walletText = normalizedValue;
};

const adjustBalance = (state: AppState, paymentMethod: PaymentMethod, delta: number) => {
  const current = getBalanceValue(state, paymentMethod);
  setBalanceValue(state, paymentMethod, current + delta);
};

const createInitialState = (): AppState => ({
  expenses: [],
  debts: [],
  categories: DEFAULT_CATEGORIES,
  initialCashText: '',
  initialBankText: '',
  initialWalletText: '',
  cashText: '',
  bankText: '',
  walletText: '',
  page: 'main',
  selectedMonth: null,
  form: {
    name: '',
    amountText: '',
    expenseDateISO: new Date().toISOString(),
    notes: '',
    selectedCategory: DEFAULT_CATEGORIES[0],
    selectedPaymentMethod: DEFAULT_PAYMENT_METHOD,
    newCategory: '',
    editingExpenseId: null,
  },
  debtForm: {
    personName: '',
    totalAmountText: '',
    dueDateISO: new Date().toISOString(),
    notes: '',
    direction: DEFAULT_DEBT_DIRECTION,
  },
  debtTransactionForm: {
    selectedDebtId: null,
    amountText: '',
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    transactionDateISO: new Date().toISOString(),
  },
});

const resetFormValues = (state: AppState) => {
  if (!state.form) {
    state.form = {
      name: '',
      amountText: '',
      expenseDateISO: new Date().toISOString(),
      notes: '',
      selectedCategory: DEFAULT_CATEGORIES[0],
      selectedPaymentMethod: DEFAULT_PAYMENT_METHOD,
      newCategory: '',
      editingExpenseId: null,
    };
  }

  state.form.name = '';
  state.form.amountText = '';
  state.form.expenseDateISO = new Date().toISOString();
  state.form.notes = '';
  state.form.selectedPaymentMethod = DEFAULT_PAYMENT_METHOD;
  state.form.newCategory = '';
  state.form.editingExpenseId = null;
};

const resetDebtFormValues = (state: AppState) => {
  if (!state.debtForm) {
    state.debtForm = {
      personName: '',
      totalAmountText: '',
      dueDateISO: new Date().toISOString(),
      notes: '',
      direction: DEFAULT_DEBT_DIRECTION,
    };
  }

  state.debtForm.personName = '';
  state.debtForm.totalAmountText = '';
  state.debtForm.dueDateISO = new Date().toISOString();
  state.debtForm.notes = '';
  state.debtForm.direction = DEFAULT_DEBT_DIRECTION;
};

const ensureDebtRuntimeState = (state: AppState) => {
  if (!state.debtForm) {
    state.debtForm = {
      personName: '',
      totalAmountText: '',
      dueDateISO: new Date().toISOString(),
      notes: '',
      direction: DEFAULT_DEBT_DIRECTION,
    };
  }

  if (!state.debtTransactionForm) {
    state.debtTransactionForm = {
      selectedDebtId: null,
      amountText: '',
      paymentMethod: DEFAULT_PAYMENT_METHOD,
      transactionDateISO: new Date().toISOString(),
    };
  }
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
    setSelectedPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      state.form.selectedPaymentMethod = action.payload;
    },
    setNewCategory(state, action: PayloadAction<string>) {
      state.form.newCategory = action.payload;
    },
    setInitialCashText(state, action: PayloadAction<string>) {
      state.initialCashText = action.payload;
      state.cashText = action.payload;
    },
    setInitialBankText(state, action: PayloadAction<string>) {
      state.initialBankText = action.payload;
      state.bankText = action.payload;
    },
    setInitialWalletText(state, action: PayloadAction<string>) {
      state.initialWalletText = action.payload;
      state.walletText = action.payload;
    },
    setCashText(state, action: PayloadAction<string>) {
      state.cashText = action.payload;
    },
    setBankText(state, action: PayloadAction<string>) {
      state.bankText = action.payload;
    },
    setWalletText(state, action: PayloadAction<string>) {
      state.walletText = action.payload;
    },
    setPage(state, action: PayloadAction<AppPage>) {
      state.page = action.payload;
    },
    setSelectedMonth(state, action: PayloadAction<string | null>) {
      state.selectedMonth = action.payload;
    },
    setDebtPersonName(state, action: PayloadAction<string>) {
      ensureDebtRuntimeState(state);
      state.debtForm.personName = action.payload;
    },
    setDebtTotalAmountText(state, action: PayloadAction<string>) {
      ensureDebtRuntimeState(state);
      state.debtForm.totalAmountText = action.payload;
    },
    setDebtDueDateISO(state, action: PayloadAction<string>) {
      ensureDebtRuntimeState(state);
      state.debtForm.dueDateISO = action.payload;
    },
    setDebtNotes(state, action: PayloadAction<string>) {
      ensureDebtRuntimeState(state);
      state.debtForm.notes = action.payload;
    },
    setDebtDirection(state, action: PayloadAction<DebtDirection>) {
      ensureDebtRuntimeState(state);
      state.debtForm.direction = normalizeDebtDirection(action.payload);
    },
    setDebtTransactionDebtId(state, action: PayloadAction<string | null>) {
      ensureDebtRuntimeState(state);
      state.debtTransactionForm.selectedDebtId = action.payload;
    },
    setDebtTransactionAmountText(state, action: PayloadAction<string>) {
      ensureDebtRuntimeState(state);
      state.debtTransactionForm.amountText = action.payload;
    },
    setDebtTransactionPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      ensureDebtRuntimeState(state);
      state.debtTransactionForm.paymentMethod = normalizePaymentMethod(action.payload);
    },
    setDebtTransactionDateISO(state, action: PayloadAction<string>) {
      ensureDebtRuntimeState(state);
      state.debtTransactionForm.transactionDateISO = action.payload;
    },
    resetForm(state) {
      resetFormValues(state);
    },
    resetDebtForms(state) {
      ensureDebtRuntimeState(state);
      resetDebtFormValues(state);
      state.debtTransactionForm.amountText = '';
      state.debtTransactionForm.transactionDateISO = new Date().toISOString();
      state.debtTransactionForm.paymentMethod = DEFAULT_PAYMENT_METHOD;
      state.debtTransactionForm.selectedDebtId = state.debts[0]?.id ?? null;
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
      const selectedPaymentMethod = normalizePaymentMethod(
        state.form.selectedPaymentMethod,
      );

      if (!cleanName || !Number.isFinite(amount) || amount <= 0) {
        return;
      }

      if (state.form.editingExpenseId) {
        const currentExpense = state.expenses.find(
          item => item.id === state.form.editingExpenseId,
        );

        if (!currentExpense) {
          return;
        }

        const currentPaymentMethod = normalizePaymentMethod(currentExpense.paymentMethod);

        // Restore old amount before applying edited amount/method.
        adjustBalance(state, currentPaymentMethod, currentExpense.amount);

        if (getBalanceValue(state, selectedPaymentMethod) < amount) {
          // Keep state unchanged when edited amount cannot be covered.
          adjustBalance(state, currentPaymentMethod, -currentExpense.amount);
          return;
        }

        adjustBalance(state, selectedPaymentMethod, -amount);

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
            paymentMethod: selectedPaymentMethod,
          };
        });
        resetFormValues(state);
        return;
      }

      if (getBalanceValue(state, selectedPaymentMethod) < amount) {
        return;
      }

      adjustBalance(state, selectedPaymentMethod, -amount);

      const expense: Expense = {
        id: `${Date.now()}`,
        name: cleanName,
        amount,
        dateISO,
        notes: state.form.notes.trim(),
        category: state.form.selectedCategory,
        paymentMethod: selectedPaymentMethod,
      };

      state.expenses = [expense, ...state.expenses];
      resetFormValues(state);
    },
    saveDebtFromForm(state) {
      ensureDebtRuntimeState(state);
      const personName = state.debtForm.personName.trim();
      const totalAmount = Number(state.debtForm.totalAmountText);
      const dueDateISO = normalizedDateISO(new Date(state.debtForm.dueDateISO));
      const direction = normalizeDebtDirection(state.debtForm.direction);

      if (!personName || !Number.isFinite(totalAmount) || totalAmount <= 0) {
        return;
      }

      const debt: Debt = {
        id: `${Date.now()}`,
        personName,
        totalAmount,
        remainingAmount: totalAmount,
        direction,
        dueDateISO,
        notes: state.debtForm.notes.trim(),
        createdAtISO: new Date().toISOString(),
        status: computeDebtStatus(dueDateISO, totalAmount),
        transactions: [],
      };

      state.debts = [debt, ...state.debts];
      state.debtTransactionForm.selectedDebtId = debt.id;
      resetDebtFormValues(state);
    },
    saveDebtTransactionFromForm(state) {
      ensureDebtRuntimeState(state);
      const debtId = state.debtTransactionForm.selectedDebtId;
      const amount = Number(state.debtTransactionForm.amountText);
      const paymentMethod = normalizePaymentMethod(state.debtTransactionForm.paymentMethod);
      const dateISO = normalizedDateISO(new Date(state.debtTransactionForm.transactionDateISO));

      if (!debtId || !Number.isFinite(amount) || amount <= 0) {
        return;
      }

      const debt = state.debts.find(item => item.id === debtId);

      if (!debt || amount > debt.remainingAmount) {
        return;
      }

      const direction = normalizeDebtDirection(debt.direction);
      const transactionType: DebtTransaction['type'] =
        direction === 'owe' ? 'payment' : 'collection';

      if (direction === 'owe') {
        if (getBalanceValue(state, paymentMethod) < amount) {
          return;
        }

        adjustBalance(state, paymentMethod, -amount);
      } else {
        adjustBalance(state, paymentMethod, amount);
      }

      const transaction: DebtTransaction = {
        id: `${Date.now()}_${Math.random()}`,
        debtId,
        amount,
        dateISO,
        paymentMethod,
        type: transactionType,
      };

      state.debts = state.debts.map(item => {
        if (item.id !== debtId) {
          return item;
        }

        const nextRemaining = Math.max(0, Math.round((item.remainingAmount - amount) * 100) / 100);

        return {
          ...item,
          remainingAmount: nextRemaining,
          status: computeDebtStatus(item.dueDateISO, nextRemaining),
          transactions: [transaction, ...item.transactions],
        };
      });

      state.debtTransactionForm.amountText = '';
      state.debtTransactionForm.transactionDateISO = new Date().toISOString();
    },
    deleteDebt(state, action: PayloadAction<string>) {
      const debtId = action.payload;
      const debt = state.debts.find(item => item.id === debtId);

      if (!debt) {
        return;
      }

      debt.transactions.forEach(transaction => {
        if (transaction.type === 'payment') {
          adjustBalance(state, transaction.paymentMethod, transaction.amount);
          return;
        }

        adjustBalance(state, transaction.paymentMethod, -transaction.amount);
      });

      state.debts = state.debts.filter(item => item.id !== debtId);

      if (state.debtTransactionForm.selectedDebtId === debtId) {
        state.debtTransactionForm.selectedDebtId = state.debts[0]?.id ?? null;
      }
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
      state.form.selectedPaymentMethod = normalizePaymentMethod(expense.paymentMethod);
    },
    deleteExpense(state, action: PayloadAction<string>) {
      const expenseId = action.payload;
      const deletedExpense = state.expenses.find(item => item.id === expenseId);

      if (deletedExpense) {
        adjustBalance(
          state,
          normalizePaymentMethod(deletedExpense.paymentMethod),
          deletedExpense.amount,
        );
      }

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
  deleteDebt,
  deleteExpense,
  openMonthDetails,
  resetForm,
  resetDebtForms,
  saveDebtFromForm,
  saveDebtTransactionFromForm,
  saveExpenseFromForm,
  setAmountText,
  setBankText,
  setCashText,
  setDebtDirection,
  setDebtDueDateISO,
  setDebtNotes,
  setDebtPersonName,
  setDebtTotalAmountText,
  setDebtTransactionAmountText,
  setDebtTransactionDateISO,
  setDebtTransactionDebtId,
  setDebtTransactionPaymentMethod,
  setExpenseDateISO,
  setInitialBankText,
  setInitialCashText,
  setInitialWalletText,
  setName,
  setNewCategory,
  setNotes,
  setPage,
  setSelectedCategory,
  setSelectedPaymentMethod,
  setSelectedMonth,
  setWalletText,
  startEditingExpense,
} = appSlice.actions;

export default appSlice.reducer;
