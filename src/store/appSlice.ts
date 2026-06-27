import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DEFAULT_CATEGORIES} from '../constants/appConstants';
import {
  AccountingPeriod,
  AppPage,
  BalanceTransaction,
  BalanceTransactionSourceType,
  Debt,
  DebtDirection,
  DebtStatus,
  DebtTransaction,
  Expense,
  IncomingMoneySourceType,
  IncomingMoneyTransaction,
  PaymentMethod,
} from '../types/expense';
import {formatPeriodLabel, normalizedDateISO} from '../utils/date';

export type AppState = {
  expenses: Expense[];
  debts: Debt[];
  balanceTransactions: BalanceTransaction[];
  incomingTransactions: IncomingMoneyTransaction[];
  periods: AccountingPeriod[];
  currentPeriodId: string;
  customIncomingSources: string[];
  categories: string[];
  subcategories: Record<string, string[]>;
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
    selectedSubcategory: string;
    selectedPaymentMethod: PaymentMethod;
    newCategory: string;
    newSubcategory: string;
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
  incomingForm: {
    amountText: string;
    paymentMethod: PaymentMethod;
    sourceType: IncomingMoneySourceType;
    sourceOtherText: string;
  };
  transferForm: {
    amountText: string;
    fromPaymentMethod: PaymentMethod;
    toPaymentMethod: PaymentMethod;
    notes: string;
  };
  backendSettings: {
    supabaseUrl: string;
    anonKey: string;
    email: string;
    lastBackupAtISO: string | null;
    lastRestoreAtISO: string | null;
    hasUnsyncedChanges: boolean;
  };
};

const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'cash';
const DEFAULT_TRANSFER_FROM_PAYMENT_METHOD: PaymentMethod = 'wallet';
const DEFAULT_TRANSFER_TO_PAYMENT_METHOD: PaymentMethod = 'cash';
const DEFAULT_DEBT_DIRECTION: DebtDirection = 'owe';
const DEFAULT_INCOMING_SOURCE: IncomingMoneySourceType = 'salary';
const FIRST_PERIOD_ID = 'period_1';
const DEFAULT_BACKEND_SETTINGS: AppState['backendSettings'] = {
  supabaseUrl: '',
  anonKey: '',
  email: '',
  lastBackupAtISO: null,
  lastRestoreAtISO: null,
  hasUnsyncedChanges: false,
};

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const createId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const createPeriod = (index: number, startedAtISO: string): AccountingPeriod => ({
  id: `period_${index}`,
  label: formatPeriodLabel(startedAtISO),
  startedAtISO,
  endedAtISO: null,
});

const normalizePaymentMethod = (
  paymentMethod?: Expense['paymentMethod'],
): PaymentMethod => {
  if (paymentMethod === 'cash' || paymentMethod === 'bank' || paymentMethod === 'wallet') {
    return paymentMethod;
  }
  return DEFAULT_PAYMENT_METHOD;
};

const getPaymentMethodLabel = (paymentMethod: PaymentMethod): string => {
  if (paymentMethod === 'cash') {
    return 'النقد';
  }

  if (paymentMethod === 'bank') {
    return 'البنك';
  }

  return 'المحفظة';
};

const normalizeDebtDirection = (direction?: DebtDirection): DebtDirection => {
  if (direction === 'owe' || direction === 'owedToMe') {
    return direction;
  }
  return DEFAULT_DEBT_DIRECTION;
};

const normalizeIncomingSourceType = (
  sourceType?: IncomingMoneySourceType,
): IncomingMoneySourceType => {
  if (
    sourceType === 'salary' ||
    sourceType === 'freelance' ||
    sourceType === 'gift' ||
    sourceType === 'refund' ||
    sourceType === 'other'
  ) {
    return sourceType;
  }

  return DEFAULT_INCOMING_SOURCE;
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
  const ledgerBalance = (state.balanceTransactions ?? []).reduce((sum, item) => {
    if (normalizePaymentMethod(item.paymentMethod) !== paymentMethod) {
      return sum;
    }

    return sum + item.amount;
  }, 0);

  return roundMoney(ledgerBalance);
};

const getBalanceValueWithoutSource = (
  state: AppState,
  paymentMethod: PaymentMethod,
  sourceType: BalanceTransactionSourceType,
  sourceId: string,
): number => {
  const ledgerBalance = (state.balanceTransactions ?? []).reduce((sum, item) => {
    if (normalizePaymentMethod(item.paymentMethod) !== paymentMethod) {
      return sum;
    }

    if (item.sourceType === sourceType && item.sourceId === sourceId) {
      return sum;
    }

    return sum + item.amount;
  }, 0);

  return roundMoney(ledgerBalance);
};

const syncBalanceTexts = (state: AppState) => {
  state.cashText = String(getBalanceValue(state, 'cash'));
  state.bankText = String(getBalanceValue(state, 'bank'));
  state.walletText = String(getBalanceValue(state, 'wallet'));
};

const addBalanceTransaction = (
  state: AppState,
  transaction: BalanceTransaction,
) => {
  state.balanceTransactions = [transaction, ...(state.balanceTransactions ?? [])];
  syncBalanceTexts(state);
};

const removeBalanceTransactionsBySource = (
  state: AppState,
  sourceType: BalanceTransactionSourceType,
  sourceId: string,
) => {
  state.balanceTransactions = (state.balanceTransactions ?? []).filter(
    item => item.sourceType !== sourceType || item.sourceId !== sourceId,
  );
  syncBalanceTexts(state);
};

const removeBalanceTransactionsByDebtId = (state: AppState, debtId: string) => {
  state.balanceTransactions = (state.balanceTransactions ?? []).filter(
    item => item.debtId !== debtId,
  );
  syncBalanceTexts(state);
};

const ensureBalanceLedgerRuntimeState = (state: AppState) => {
  if (!Array.isArray(state.balanceTransactions)) {
    state.balanceTransactions = [];
  }

  syncBalanceTexts(state);
};

const ensurePeriodRuntimeState = (state: AppState) => {
  if (!Array.isArray(state.periods) || state.periods.length === 0) {
    state.periods = [createPeriod(1, new Date().toISOString())];
  }

  const currentPeriodExists = state.periods.some(
    period => period.id === state.currentPeriodId && period.endedAtISO === null,
  );

  if (!state.currentPeriodId || !currentPeriodExists) {
    const activePeriod = state.periods.find(period => period.endedAtISO === null);
    if (activePeriod) {
      state.currentPeriodId = activePeriod.id;
      return;
    }

    const nextPeriod = createPeriod(state.periods.length + 1, new Date().toISOString());
    state.periods = [nextPeriod, ...state.periods];
    state.currentPeriodId = nextPeriod.id;
  }
};

const getCurrentPeriodId = (state: AppState): string => {
  ensurePeriodRuntimeState(state);
  return state.currentPeriodId;
};

const createInitialState = (): AppState => ({
  expenses: [],
  debts: [],
  balanceTransactions: [],
  incomingTransactions: [],
  periods: [createPeriod(1, new Date().toISOString())],
  currentPeriodId: FIRST_PERIOD_ID,
  customIncomingSources: [],
  categories: DEFAULT_CATEGORIES,
  subcategories: Object.fromEntries(DEFAULT_CATEGORIES.map(category => [category, []])),
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
    selectedSubcategory: '',
    selectedPaymentMethod: DEFAULT_PAYMENT_METHOD,
    newCategory: '',
    newSubcategory: '',
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
  incomingForm: {
    amountText: '',
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    sourceType: DEFAULT_INCOMING_SOURCE,
    sourceOtherText: '',
  },
  transferForm: {
    amountText: '',
    fromPaymentMethod: DEFAULT_TRANSFER_FROM_PAYMENT_METHOD,
    toPaymentMethod: DEFAULT_TRANSFER_TO_PAYMENT_METHOD,
    notes: '',
  },
  backendSettings: {...DEFAULT_BACKEND_SETTINGS},
});

const resetFormValues = (state: AppState) => {
  if (!state.form) {
    state.form = {
      name: '',
      amountText: '',
      expenseDateISO: new Date().toISOString(),
      notes: '',
      selectedCategory: DEFAULT_CATEGORIES[0],
      selectedSubcategory: '',
      selectedPaymentMethod: DEFAULT_PAYMENT_METHOD,
      newCategory: '',
      newSubcategory: '',
      editingExpenseId: null,
    };
  }

  state.form.name = '';
  state.form.amountText = '';
  state.form.expenseDateISO = new Date().toISOString();
  state.form.notes = '';
  state.form.selectedPaymentMethod = DEFAULT_PAYMENT_METHOD;
  state.form.newCategory = '';
  state.form.selectedSubcategory = '';
  state.form.newSubcategory = '';
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
  ensureBalanceLedgerRuntimeState(state);

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

const ensureIncomingRuntimeState = (state: AppState) => {
  ensureBalanceLedgerRuntimeState(state);

  if (!state.incomingForm) {
    state.incomingForm = {
      amountText: '',
      paymentMethod: DEFAULT_PAYMENT_METHOD,
      sourceType: DEFAULT_INCOMING_SOURCE,
      sourceOtherText: '',
    };
  }

  if (!Array.isArray(state.incomingTransactions)) {
    state.incomingTransactions = [];
  }

  if (!Array.isArray(state.customIncomingSources)) {
    state.customIncomingSources = [];
  }
};

const ensureTransferRuntimeState = (state: AppState) => {
  ensureBalanceLedgerRuntimeState(state);
  ensurePeriodRuntimeState(state);

  if (!state.transferForm) {
    state.transferForm = {
      amountText: '',
      fromPaymentMethod: DEFAULT_TRANSFER_FROM_PAYMENT_METHOD,
      toPaymentMethod: DEFAULT_TRANSFER_TO_PAYMENT_METHOD,
      notes: '',
    };
  }
};

const ensureBackendSettingsRuntimeState = (state: AppState) => {
  state.backendSettings = {
    ...DEFAULT_BACKEND_SETTINGS,
    ...(state.backendSettings ?? {}),
  };
};

const markNeedsBackup = (state: AppState) => {
  ensureBackendSettingsRuntimeState(state);
  state.backendSettings.hasUnsyncedChanges = true;
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
      const categorySubcategories = state.subcategories[action.payload] ?? [];
      if (!categorySubcategories.includes(state.form.selectedSubcategory)) {
        state.form.selectedSubcategory = '';
      }
    },
    setSelectedSubcategory(state, action: PayloadAction<string>) {
      state.form.selectedSubcategory = action.payload;
    },
    setSelectedPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      state.form.selectedPaymentMethod = action.payload;
    },
    setNewCategory(state, action: PayloadAction<string>) {
      state.form.newCategory = action.payload;
    },
    setNewSubcategory(state, action: PayloadAction<string>) {
      state.form.newSubcategory = action.payload;
    },
    setInitialCashText(state, action: PayloadAction<string>) {
      state.initialCashText = action.payload;
      ensureBalanceLedgerRuntimeState(state);
    },
    setInitialBankText(state, action: PayloadAction<string>) {
      state.initialBankText = action.payload;
      ensureBalanceLedgerRuntimeState(state);
    },
    setInitialWalletText(state, action: PayloadAction<string>) {
      state.initialWalletText = action.payload;
      ensureBalanceLedgerRuntimeState(state);
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
    setIncomingAmountText(state, action: PayloadAction<string>) {
      ensureIncomingRuntimeState(state);
      state.incomingForm.amountText = action.payload;
    },
    setIncomingPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      ensureIncomingRuntimeState(state);
      state.incomingForm.paymentMethod = normalizePaymentMethod(action.payload);
    },
    setIncomingSourceType(state, action: PayloadAction<IncomingMoneySourceType>) {
      ensureIncomingRuntimeState(state);
      state.incomingForm.sourceType = normalizeIncomingSourceType(action.payload);
    },
    setIncomingSourceOtherText(state, action: PayloadAction<string>) {
      ensureIncomingRuntimeState(state);
      state.incomingForm.sourceOtherText = action.payload;
    },
    setTransferAmountText(state, action: PayloadAction<string>) {
      ensureTransferRuntimeState(state);
      state.transferForm.amountText = action.payload;
    },
    setTransferFromPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      ensureTransferRuntimeState(state);
      state.transferForm.fromPaymentMethod = normalizePaymentMethod(action.payload);
    },
    setTransferToPaymentMethod(state, action: PayloadAction<PaymentMethod>) {
      ensureTransferRuntimeState(state);
      state.transferForm.toPaymentMethod = normalizePaymentMethod(action.payload);
    },
    setTransferNotes(state, action: PayloadAction<string>) {
      ensureTransferRuntimeState(state);
      state.transferForm.notes = action.payload;
    },
    setBackendSupabaseUrl(state, action: PayloadAction<string>) {
      ensureBackendSettingsRuntimeState(state);
      state.backendSettings.supabaseUrl = action.payload;
    },
    setBackendAnonKey(state, action: PayloadAction<string>) {
      ensureBackendSettingsRuntimeState(state);
      state.backendSettings.anonKey = action.payload;
    },
    setBackendEmail(state, action: PayloadAction<string>) {
      ensureBackendSettingsRuntimeState(state);
      state.backendSettings.email = action.payload;
    },
    markBackupSucceeded(state) {
      ensureBackendSettingsRuntimeState(state);
      state.backendSettings.lastBackupAtISO = new Date().toISOString();
      state.backendSettings.hasUnsyncedChanges = false;
    },
    markRestoreSucceeded(state) {
      ensureBackendSettingsRuntimeState(state);
      state.backendSettings.lastRestoreAtISO = new Date().toISOString();
      state.backendSettings.hasUnsyncedChanges = false;
    },
    addIncomingCustomSourceFromForm(state) {
      ensureIncomingRuntimeState(state);
      const cleanLabel = state.incomingForm.sourceOtherText.trim();

      if (!cleanLabel) {
        return;
      }

      const alreadyExists = state.customIncomingSources.some(
        item => item.toLowerCase() === cleanLabel.toLowerCase(),
      );

      if (alreadyExists) {
        return;
      }

      state.customIncomingSources = [cleanLabel, ...state.customIncomingSources];
      markNeedsBackup(state);
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
    resetIncomingForm(state) {
      ensureIncomingRuntimeState(state);
      state.incomingForm.amountText = '';
      state.incomingForm.paymentMethod = DEFAULT_PAYMENT_METHOD;
      state.incomingForm.sourceType = DEFAULT_INCOMING_SOURCE;
      state.incomingForm.sourceOtherText = '';
    },
    resetTransferForm(state) {
      ensureTransferRuntimeState(state);
      state.transferForm.amountText = '';
      state.transferForm.fromPaymentMethod = DEFAULT_TRANSFER_FROM_PAYMENT_METHOD;
      state.transferForm.toPaymentMethod = DEFAULT_TRANSFER_TO_PAYMENT_METHOD;
      state.transferForm.notes = '';
    },
    addCategoryFromForm(state) {
      const clean = state.form.newCategory.trim();
      if (!clean || state.categories.includes(clean)) {
        return;
      }

      state.categories.push(clean);
      state.subcategories[clean] = [];
      state.form.selectedCategory = clean;
      state.form.selectedSubcategory = '';
      state.form.newCategory = '';
      markNeedsBackup(state);
    },
    addSubcategoryFromForm(state) {
      const category = state.form.selectedCategory;
      const clean = state.form.newSubcategory.trim();
      const categorySubcategories = state.subcategories[category] ?? [];

      if (!category || !clean || categorySubcategories.includes(clean)) {
        return;
      }

      state.subcategories[category] = [...categorySubcategories, clean];
      state.form.selectedSubcategory = clean;
      state.form.newSubcategory = '';
      markNeedsBackup(state);
    },
    saveExpenseFromForm(state) {
      ensureBalanceLedgerRuntimeState(state);
      const activePeriodId = getCurrentPeriodId(state);
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

        if (
          getBalanceValueWithoutSource(
            state,
            selectedPaymentMethod,
            'expense',
            currentExpense.id,
          ) < amount
        ) {
          return;
        }

        const periodKey = currentExpense.periodKey ?? activePeriodId;

        state.expenses = state.expenses.map(item => {
          if (item.id !== state.form.editingExpenseId) {
            return item;
          }

          return {
            ...item,
            name: cleanName,
            amount,
            dateISO,
            periodKey,
            notes: state.form.notes.trim(),
            category: state.form.selectedCategory,
            subcategory: state.form.selectedSubcategory,
            paymentMethod: selectedPaymentMethod,
          };
        });
        removeBalanceTransactionsBySource(state, 'expense', currentExpense.id);
        addBalanceTransaction(state, {
          id: createId('balance'),
          type: 'expense',
          paymentMethod: selectedPaymentMethod,
          amount: -amount,
          dateISO,
          periodKey,
          title: cleanName,
          sourceType: 'expense',
          sourceId: currentExpense.id,
        });
        resetFormValues(state);
        markNeedsBackup(state);
        return;
      }

      if (getBalanceValue(state, selectedPaymentMethod) < amount) {
        return;
      }

      const expenseId = createId('expense');

      const expense: Expense = {
        id: expenseId,
        name: cleanName,
        amount,
        dateISO,
        periodKey: activePeriodId,
        notes: state.form.notes.trim(),
        category: state.form.selectedCategory,
        subcategory: state.form.selectedSubcategory,
        paymentMethod: selectedPaymentMethod,
      };

      state.expenses = [expense, ...state.expenses];
      addBalanceTransaction(state, {
        id: createId('balance'),
        type: 'expense',
        paymentMethod: selectedPaymentMethod,
        amount: -amount,
        dateISO,
        periodKey: activePeriodId,
        title: cleanName,
        sourceType: 'expense',
        sourceId: expenseId,
      });
      resetFormValues(state);
      markNeedsBackup(state);
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
        id: createId('debt'),
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
      markNeedsBackup(state);
    },
    saveDebtTransactionFromForm(state) {
      ensureDebtRuntimeState(state);
      const activePeriodId = getCurrentPeriodId(state);
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

      if (direction === 'owe' && getBalanceValue(state, paymentMethod) < amount) {
        return;
      }

      const transactionId = createId('debt_tx');
      const transaction: DebtTransaction = {
        id: transactionId,
        debtId,
        amount,
        dateISO,
        periodKey: activePeriodId,
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

      addBalanceTransaction(state, {
        id: createId('balance'),
        type: direction === 'owe' ? 'debtPayment' : 'debtCollection',
        paymentMethod,
        amount: direction === 'owe' ? -amount : amount,
        dateISO,
        periodKey: activePeriodId,
        title: debt.personName,
        sourceType: 'debtTransaction',
        sourceId: transactionId,
        debtId,
      });

      state.debtTransactionForm.amountText = '';
      state.debtTransactionForm.transactionDateISO = new Date().toISOString();
      markNeedsBackup(state);
    },
    saveIncomingFromForm(state) {
      ensureIncomingRuntimeState(state);
      const activePeriodId = getCurrentPeriodId(state);
      const amount = Number(state.incomingForm.amountText);
      const paymentMethod = normalizePaymentMethod(state.incomingForm.paymentMethod);
      const sourceType = normalizeIncomingSourceType(state.incomingForm.sourceType);
      const otherLabel = state.incomingForm.sourceOtherText.trim();

      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      if (sourceType === 'other' && !otherLabel) {
        return;
      }

      const sourceLabel = sourceType === 'other' ? otherLabel : sourceType;
      const transactionId = createId('incoming');

      const transaction: IncomingMoneyTransaction = {
        id: transactionId,
        amount,
        paymentMethod,
        sourceType,
        sourceLabel,
        dateISO: new Date().toISOString(),
        periodKey: activePeriodId,
      };

      state.incomingTransactions = [transaction, ...state.incomingTransactions];
      addBalanceTransaction(state, {
        id: createId('balance'),
        type: 'incoming',
        paymentMethod,
        amount,
        dateISO: transaction.dateISO,
        periodKey: activePeriodId,
        title: sourceLabel,
        sourceType: 'incoming',
        sourceId: transactionId,
      });
      state.incomingForm.amountText = '';
      state.incomingForm.sourceOtherText = '';
      markNeedsBackup(state);
    },
    deleteIncomingTransaction(state, action: PayloadAction<string>) {
      ensureIncomingRuntimeState(state);
      const transactionId = action.payload;
      const transaction = state.incomingTransactions.find(item => item.id === transactionId);

      if (!transaction) {
        return;
      }

      state.incomingTransactions = state.incomingTransactions.filter(
        item => item.id !== transactionId,
      );
      removeBalanceTransactionsBySource(state, 'incoming', transactionId);
      markNeedsBackup(state);
    },
    saveTransferFromForm(state) {
      ensureTransferRuntimeState(state);
      const activePeriodId = getCurrentPeriodId(state);
      const amount = Number(state.transferForm.amountText);
      const fromPaymentMethod = normalizePaymentMethod(
        state.transferForm.fromPaymentMethod,
      );
      const toPaymentMethod = normalizePaymentMethod(
        state.transferForm.toPaymentMethod,
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        fromPaymentMethod === toPaymentMethod
      ) {
        return;
      }

      if (getBalanceValue(state, fromPaymentMethod) < amount) {
        return;
      }

      const transferId = createId('transfer');
      const dateISO = new Date().toISOString();
      const cleanNotes = state.transferForm.notes.trim();
      const fromLabel = getPaymentMethodLabel(fromPaymentMethod);
      const toLabel = getPaymentMethodLabel(toPaymentMethod);
      const titleSuffix = cleanNotes ? ` - ${cleanNotes}` : '';

      addBalanceTransaction(state, {
        id: createId('balance'),
        type: 'transferOut',
        paymentMethod: fromPaymentMethod,
        amount: -amount,
        dateISO,
        periodKey: activePeriodId,
        title: `تحويل إلى ${toLabel}${titleSuffix}`,
        sourceType: 'balanceTransfer',
        sourceId: transferId,
      });

      addBalanceTransaction(state, {
        id: createId('balance'),
        type: 'transferIn',
        paymentMethod: toPaymentMethod,
        amount,
        dateISO,
        periodKey: activePeriodId,
        title: `تحويل من ${fromLabel}${titleSuffix}`,
        sourceType: 'balanceTransfer',
        sourceId: transferId,
      });

      state.transferForm.amountText = '';
      state.transferForm.notes = '';
      markNeedsBackup(state);
    },
    deleteDebt(state, action: PayloadAction<string>) {
      const debtId = action.payload;
      const debt = state.debts.find(item => item.id === debtId);

      if (!debt) {
        return;
      }

      state.debts = state.debts.filter(item => item.id !== debtId);
      removeBalanceTransactionsByDebtId(state, debtId);

      if (state.debtTransactionForm.selectedDebtId === debtId) {
        state.debtTransactionForm.selectedDebtId = state.debts[0]?.id ?? null;
      }
      markNeedsBackup(state);
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
      state.form.selectedSubcategory = expense.subcategory ?? '';
      state.form.selectedPaymentMethod = normalizePaymentMethod(expense.paymentMethod);
    },
    deleteExpense(state, action: PayloadAction<string>) {
      const expenseId = action.payload;
      const deletedExpense = state.expenses.find(item => item.id === expenseId);

      state.expenses = state.expenses.filter(item => item.id !== expenseId);
      if (deletedExpense) {
        removeBalanceTransactionsBySource(state, 'expense', expenseId);
      }

      if (state.form.editingExpenseId === expenseId) {
        resetFormValues(state);
      }
      markNeedsBackup(state);
    },
    openMonthDetails(state, action: PayloadAction<string>) {
      state.selectedMonth = action.payload;
      state.page = 'monthDetails';
    },
    endCurrentMonth(state) {
      ensurePeriodRuntimeState(state);
      const endedAtISO = new Date().toISOString();
      const currentPeriodId = state.currentPeriodId;

      state.periods = state.periods.map(period => {
        if (period.id !== currentPeriodId) {
          return period;
        }

        return {
          ...period,
          endedAtISO,
        };
      });

      const nextPeriod = createPeriod(state.periods.length + 1, endedAtISO);
      state.periods = [nextPeriod, ...state.periods];
      state.currentPeriodId = nextPeriod.id;
      state.selectedMonth = currentPeriodId;
      markNeedsBackup(state);
    },
    restoreAppFromBackup(state, action: PayloadAction<AppState>) {
      const localBackendSettings = {
        ...DEFAULT_BACKEND_SETTINGS,
        ...(state.backendSettings ?? {}),
      };
      const restoredBackendSettings = {
        ...DEFAULT_BACKEND_SETTINGS,
        ...(action.payload.backendSettings ?? {}),
      };
      const restoredCategories = Array.isArray(action.payload.categories)
        ? action.payload.categories
        : DEFAULT_CATEGORIES;
      const restoredSubcategories = restoredCategories.reduce<Record<string, string[]>>(
        (result, category) => {
          const values = action.payload.subcategories?.[category];
          result[category] = Array.isArray(values)
            ? values.filter(value => typeof value === 'string')
            : [];
          return result;
        },
        {},
      );
      const initialForm = createInitialState().form;
      const restoredForm = {
        ...initialForm,
        ...(action.payload.form ?? {}),
        selectedSubcategory: action.payload.form?.selectedSubcategory ?? '',
        newSubcategory: action.payload.form?.newSubcategory ?? '',
      };

      Object.assign(state, {
        ...createInitialState(),
        ...action.payload,
        categories: restoredCategories,
        subcategories: restoredSubcategories,
        expenses: (action.payload.expenses ?? []).map(expense => ({
          ...expense,
          subcategory: expense.subcategory ?? '',
        })),
        form: restoredForm,
        backendSettings: {
          ...restoredBackendSettings,
          supabaseUrl:
            localBackendSettings.supabaseUrl || restoredBackendSettings.supabaseUrl,
          anonKey: localBackendSettings.anonKey || restoredBackendSettings.anonKey,
          email: localBackendSettings.email || restoredBackendSettings.email,
        },
        page: 'main',
        selectedMonth: null,
      });
    },
  },
});

export const {
  addCategoryFromForm,
  addSubcategoryFromForm,
  addIncomingCustomSourceFromForm,
  deleteIncomingTransaction,
  deleteDebt,
  deleteExpense,
  endCurrentMonth,
  openMonthDetails,
  resetForm,
  resetDebtForms,
  resetIncomingForm,
  resetTransferForm,
  restoreAppFromBackup,
  saveDebtFromForm,
  saveIncomingFromForm,
  saveDebtTransactionFromForm,
  saveExpenseFromForm,
  saveTransferFromForm,
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
  setIncomingAmountText,
  setIncomingPaymentMethod,
  setIncomingSourceOtherText,
  setIncomingSourceType,
  setTransferAmountText,
  setTransferFromPaymentMethod,
  setTransferNotes,
  setTransferToPaymentMethod,
  setBackendAnonKey,
  setBackendEmail,
  setBackendSupabaseUrl,
  markBackupSucceeded,
  markRestoreSucceeded,
  setInitialBankText,
  setInitialCashText,
  setInitialWalletText,
  setName,
  setNewCategory,
  setNewSubcategory,
  setNotes,
  setPage,
  setSelectedCategory,
  setSelectedSubcategory,
  setSelectedPaymentMethod,
  setSelectedMonth,
  setWalletText,
  startEditingExpense,
} = appSlice.actions;

export default appSlice.reducer;
