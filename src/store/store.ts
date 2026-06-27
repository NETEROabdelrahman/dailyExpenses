import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {
  createMigrate,
  FLUSH,
  MigrationManifest,
  PAUSE,
  PERSIST,
  PersistConfig,
  PersistedState,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import {AccountingPeriod, BalanceTransaction} from '../types/expense';
import {formatPeriodLabel} from '../utils/date';
import appReducer from './appSlice';

const INITIAL_PERIOD_ID = 'period_1';

const createInitialPeriod = (startedAtISO: string): AccountingPeriod => ({
  id: INITIAL_PERIOD_ID,
  label: formatPeriodLabel(startedAtISO),
  startedAtISO,
  endedAtISO: null,
});

type PersistedExpense = {
  id: string;
  name: string;
  amount: number;
  dateISO: string;
  periodKey?: string;
  notes: string;
  category: string;
  subcategory?: string;
  paymentMethod?: 'cash' | 'bank' | 'wallet';
};

type PersistedDebtTransaction = {
  id: string;
  debtId: string;
  amount: number;
  dateISO: string;
  periodKey?: string;
  paymentMethod?: 'cash' | 'bank' | 'wallet';
  type?: 'payment' | 'collection';
};

type PersistedDebt = {
  id: string;
  personName: string;
  totalAmount: number;
  remainingAmount: number;
  direction?: 'owe' | 'owedToMe';
  dueDateISO: string;
  notes: string;
  createdAtISO: string;
  status?: 'active' | 'settled' | 'overdue';
  transactions?: PersistedDebtTransaction[];
};

type PersistedIncomingMoneyTransaction = {
  id: string;
  amount: number;
  paymentMethod?: 'cash' | 'bank' | 'wallet';
  sourceType?: 'salary' | 'freelance' | 'gift' | 'refund' | 'other';
  sourceLabel?: string;
  dateISO: string;
  periodKey?: string;
};

const rootReducer = combineReducers({
  app: appReducer,
});

type PersistedRootState = ReturnType<typeof rootReducer> & {
  app?: ReturnType<typeof appReducer> & {
    categoryLimits?: unknown;
    expenses?: PersistedExpense[];
    debts?: PersistedDebt[];
    initialCashText?: string;
    initialBankText?: string;
    initialWalletText?: string;
    walletText?: string;
    incomingTransactions?: PersistedIncomingMoneyTransaction[];
    balanceTransactions?: BalanceTransaction[];
    periods?: AccountingPeriod[];
    currentPeriodId?: string;
    customIncomingSources?: string[];
    incomingForm?: ReturnType<typeof appReducer>['incomingForm'] & {
      paymentMethod?: 'cash' | 'bank' | 'wallet';
      sourceType?: 'salary' | 'freelance' | 'gift' | 'refund' | 'other';
    };
    transferForm?: ReturnType<typeof appReducer>['transferForm'] & {
      fromPaymentMethod?: 'cash' | 'bank' | 'wallet';
      toPaymentMethod?: 'cash' | 'bank' | 'wallet';
    };
    backendSettings?: ReturnType<typeof appReducer>['backendSettings'];
    form?: ReturnType<typeof appReducer>['form'] & {
      selectedPaymentMethod?: 'cash' | 'bank' | 'wallet';
    };
    debtForm?: ReturnType<typeof appReducer>['debtForm'] & {
      direction?: 'owe' | 'owedToMe';
    };
    debtTransactionForm?: ReturnType<typeof appReducer>['debtTransactionForm'] & {
      paymentMethod?: 'cash' | 'bank' | 'wallet';
    };
  };
};

const migrations: MigrationManifest = {
  1: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};
    delete nextApp.categoryLimits;
    nextState.app = nextApp;
    return nextState;
  },
  2: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    if (Array.isArray(nextApp.expenses)) {
      nextApp.expenses = nextApp.expenses.map(item => ({
        ...item,
        paymentMethod:
          item.paymentMethod === 'cash' ||
          item.paymentMethod === 'bank' ||
          item.paymentMethod === 'wallet'
            ? item.paymentMethod
            : 'cash',
      }));
    }

    if (typeof nextApp.walletText !== 'string') {
      nextApp.walletText = '';
    }

    if (nextApp.form) {
      nextApp.form = {
        ...nextApp.form,
        selectedPaymentMethod:
          nextApp.form.selectedPaymentMethod === 'cash' ||
          nextApp.form.selectedPaymentMethod === 'bank' ||
          nextApp.form.selectedPaymentMethod === 'wallet'
            ? nextApp.form.selectedPaymentMethod
            : 'cash',
      };
    }

    nextState.app = nextApp;
    return nextState;
  },
  3: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    if (typeof nextApp.initialCashText !== 'string') {
      nextApp.initialCashText = typeof nextApp.cashText === 'string' ? nextApp.cashText : '';
    }

    if (typeof nextApp.initialBankText !== 'string') {
      nextApp.initialBankText = typeof nextApp.bankText === 'string' ? nextApp.bankText : '';
    }

    if (typeof nextApp.initialWalletText !== 'string') {
      nextApp.initialWalletText =
        typeof nextApp.walletText === 'string' ? nextApp.walletText : '';
    }

    if (!Array.isArray(nextApp.debts)) {
      nextApp.debts = [];
    }

    nextApp.debts = nextApp.debts.map(debt => ({
      ...debt,
      direction: debt.direction === 'owedToMe' ? 'owedToMe' : 'owe',
      status:
        debt.status === 'settled' || debt.status === 'overdue' ? debt.status : 'active',
      transactions: Array.isArray(debt.transactions)
        ? debt.transactions.map(transaction => ({
            ...transaction,
            paymentMethod:
              transaction.paymentMethod === 'bank' ||
              transaction.paymentMethod === 'wallet'
                ? transaction.paymentMethod
                : 'cash',
            type: transaction.type === 'collection' ? 'collection' : 'payment',
          }))
        : [],
    }));

    if (nextApp.debtForm) {
      nextApp.debtForm = {
        ...nextApp.debtForm,
        direction: nextApp.debtForm.direction === 'owedToMe' ? 'owedToMe' : 'owe',
      };
    } else {
      nextApp.debtForm = {
        personName: '',
        totalAmountText: '',
        dueDateISO: new Date().toISOString(),
        notes: '',
        direction: 'owe',
      };
    }

    if (nextApp.debtTransactionForm) {
      nextApp.debtTransactionForm = {
        ...nextApp.debtTransactionForm,
        paymentMethod:
          nextApp.debtTransactionForm.paymentMethod === 'bank' ||
          nextApp.debtTransactionForm.paymentMethod === 'wallet'
            ? nextApp.debtTransactionForm.paymentMethod
            : 'cash',
      };
    } else {
      nextApp.debtTransactionForm = {
        selectedDebtId: null,
        amountText: '',
        paymentMethod: 'cash',
        transactionDateISO: new Date().toISOString(),
      };
    }

    nextState.app = nextApp;
    return nextState;
  },
  4: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    if (!Array.isArray(nextApp.incomingTransactions)) {
      nextApp.incomingTransactions = [];
    }

    nextApp.incomingTransactions = nextApp.incomingTransactions.map(item => ({
      ...item,
      paymentMethod:
        item.paymentMethod === 'bank' || item.paymentMethod === 'wallet'
          ? item.paymentMethod
          : 'cash',
      sourceType:
        item.sourceType === 'freelance' ||
        item.sourceType === 'gift' ||
        item.sourceType === 'refund' ||
        item.sourceType === 'other'
          ? item.sourceType
          : 'salary',
      sourceLabel: typeof item.sourceLabel === 'string' ? item.sourceLabel : '',
    }));

    if (nextApp.incomingForm) {
      nextApp.incomingForm = {
        ...nextApp.incomingForm,
        paymentMethod:
          nextApp.incomingForm.paymentMethod === 'bank' ||
          nextApp.incomingForm.paymentMethod === 'wallet'
            ? nextApp.incomingForm.paymentMethod
            : 'cash',
        sourceType:
          nextApp.incomingForm.sourceType === 'freelance' ||
          nextApp.incomingForm.sourceType === 'gift' ||
          nextApp.incomingForm.sourceType === 'refund' ||
          nextApp.incomingForm.sourceType === 'other'
            ? nextApp.incomingForm.sourceType
            : 'salary',
      };
    } else {
      nextApp.incomingForm = {
        amountText: '',
        paymentMethod: 'cash',
        sourceType: 'salary',
        sourceOtherText: '',
      };
    }

    nextState.app = nextApp;
    return nextState;
  },
  5: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    if (!Array.isArray(nextApp.customIncomingSources)) {
      nextApp.customIncomingSources = [];
    }

    nextState.app = nextApp;
    return nextState;
  },
  6: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    if (Array.isArray(nextApp.balanceTransactions)) {
      nextState.app = nextApp;
      return nextState;
    }

    const normalizePaymentMethod = (
      paymentMethod?: 'cash' | 'bank' | 'wallet',
    ) => {
      if (paymentMethod === 'bank' || paymentMethod === 'wallet') {
        return paymentMethod;
      }

      return 'cash';
    };

    const balanceTransactions: BalanceTransaction[] = [];

    if (Array.isArray(nextApp.expenses)) {
      nextApp.expenses.forEach(expense => {
        balanceTransactions.push({
          id: `migration_balance_expense_${expense.id}`,
          type: 'expense',
          paymentMethod: normalizePaymentMethod(expense.paymentMethod),
          amount: -expense.amount,
          dateISO: expense.dateISO,
          periodKey: expense.periodKey ?? INITIAL_PERIOD_ID,
          title: expense.name,
          sourceType: 'expense',
          sourceId: expense.id,
        });
      });
    }

    if (Array.isArray(nextApp.incomingTransactions)) {
      nextApp.incomingTransactions.forEach(transaction => {
        balanceTransactions.push({
          id: `migration_balance_incoming_${transaction.id}`,
          type: 'incoming',
          paymentMethod: normalizePaymentMethod(transaction.paymentMethod),
          amount: transaction.amount,
          dateISO: transaction.dateISO,
          periodKey: transaction.periodKey ?? INITIAL_PERIOD_ID,
          title: transaction.sourceLabel || transaction.sourceType || 'incoming',
          sourceType: 'incoming',
          sourceId: transaction.id,
        });
      });
    }

    if (Array.isArray(nextApp.debts)) {
      nextApp.debts.forEach(debt => {
        const transactions = Array.isArray(debt.transactions) ? debt.transactions : [];

        transactions.forEach(transaction => {
          const isCollection = transaction.type === 'collection';

          balanceTransactions.push({
            id: `migration_balance_debt_${transaction.id}`,
            type: isCollection ? 'debtCollection' : 'debtPayment',
            paymentMethod: normalizePaymentMethod(transaction.paymentMethod),
            amount: isCollection ? transaction.amount : -transaction.amount,
            dateISO: transaction.dateISO,
            periodKey: transaction.periodKey ?? INITIAL_PERIOD_ID,
            title: debt.personName,
            sourceType: 'debtTransaction',
            sourceId: transaction.id,
            debtId: debt.id,
          });
        });
      });
    }

    nextApp.balanceTransactions = balanceTransactions.sort((first, second) =>
      second.dateISO.localeCompare(first.dateISO),
    );

    nextState.app = nextApp;
    return nextState;
  },
  7: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};
    const startedAtISO = new Date().toISOString();

    if (!Array.isArray(nextApp.periods) || nextApp.periods.length === 0) {
      nextApp.periods = [createInitialPeriod(startedAtISO)];
    }

    if (!nextApp.currentPeriodId) {
      const activePeriod = nextApp.periods.find(period => period.endedAtISO === null);
      nextApp.currentPeriodId = activePeriod?.id ?? INITIAL_PERIOD_ID;
    }

    if (Array.isArray(nextApp.expenses)) {
      nextApp.expenses = nextApp.expenses.map(expense => ({
        ...expense,
        periodKey: expense.periodKey ?? nextApp.currentPeriodId ?? INITIAL_PERIOD_ID,
      }));
    }

    if (Array.isArray(nextApp.incomingTransactions)) {
      nextApp.incomingTransactions = nextApp.incomingTransactions.map(transaction => ({
        ...transaction,
        periodKey: transaction.periodKey ?? nextApp.currentPeriodId ?? INITIAL_PERIOD_ID,
      }));
    }

    if (Array.isArray(nextApp.debts)) {
      nextApp.debts = nextApp.debts.map(debt => ({
        ...debt,
        transactions: Array.isArray(debt.transactions)
          ? debt.transactions.map(transaction => ({
              ...transaction,
              periodKey: transaction.periodKey ?? nextApp.currentPeriodId ?? INITIAL_PERIOD_ID,
            }))
          : [],
      }));
    }

    if (Array.isArray(nextApp.balanceTransactions)) {
      nextApp.balanceTransactions = nextApp.balanceTransactions.map(transaction => ({
        ...transaction,
        periodKey: transaction.periodKey ?? nextApp.currentPeriodId ?? INITIAL_PERIOD_ID,
      }));
    }

    nextState.app = nextApp;
    return nextState;
  },
  8: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    const normalizePaymentMethod = (
      paymentMethod?: 'cash' | 'bank' | 'wallet',
      fallback: 'cash' | 'bank' | 'wallet' = 'cash',
    ) => {
      if (
        paymentMethod === 'cash' ||
        paymentMethod === 'bank' ||
        paymentMethod === 'wallet'
      ) {
        return paymentMethod;
      }

      return fallback;
    };

    nextApp.transferForm = {
      amountText: nextApp.transferForm?.amountText ?? '',
      fromPaymentMethod: normalizePaymentMethod(
        nextApp.transferForm?.fromPaymentMethod,
        'wallet',
      ),
      toPaymentMethod: normalizePaymentMethod(
        nextApp.transferForm?.toPaymentMethod,
        'cash',
      ),
      notes: nextApp.transferForm?.notes ?? '',
    };

    nextState.app = nextApp;
    return nextState;
  },
  9: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    nextApp.backendSettings = {
      supabaseUrl: nextApp.backendSettings?.supabaseUrl ?? '',
      anonKey: nextApp.backendSettings?.anonKey ?? '',
      email: nextApp.backendSettings?.email ?? '',
      lastBackupAtISO: nextApp.backendSettings?.lastBackupAtISO ?? null,
      lastRestoreAtISO: nextApp.backendSettings?.lastRestoreAtISO ?? null,
      hasUnsyncedChanges: nextApp.backendSettings?.hasUnsyncedChanges ?? false,
    };

    nextState.app = nextApp;
    return nextState;
  },
  10: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};

    nextApp.backendSettings = {
      supabaseUrl: nextApp.backendSettings?.supabaseUrl ?? '',
      anonKey: nextApp.backendSettings?.anonKey ?? '',
      email: nextApp.backendSettings?.email ?? '',
      lastBackupAtISO: nextApp.backendSettings?.lastBackupAtISO ?? null,
      lastRestoreAtISO: nextApp.backendSettings?.lastRestoreAtISO ?? null,
      hasUnsyncedChanges: nextApp.backendSettings?.hasUnsyncedChanges ?? false,
    };

    nextState.app = nextApp;
    return nextState;
  },
  11: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};
    const categories = Array.isArray(nextApp.categories) ? nextApp.categories : [];
    const existingSubcategories =
      nextApp.subcategories && typeof nextApp.subcategories === 'object'
        ? nextApp.subcategories
        : {};

    nextApp.subcategories = categories.reduce<Record<string, string[]>>(
      (result, category) => {
        const values = existingSubcategories[category];
        result[category] = Array.isArray(values)
          ? values.filter(value => typeof value === 'string')
          : [];
        return result;
      },
      {},
    );

    if (Array.isArray(nextApp.expenses)) {
      nextApp.expenses = nextApp.expenses.map(expense => ({
        ...expense,
        subcategory: typeof expense.subcategory === 'string' ? expense.subcategory : '',
      }));
    }

    if (nextApp.form) {
      nextApp.form = {
        ...nextApp.form,
        selectedSubcategory:
          typeof nextApp.form.selectedSubcategory === 'string'
            ? nextApp.form.selectedSubcategory
            : '',
        newSubcategory:
          typeof nextApp.form.newSubcategory === 'string'
            ? nextApp.form.newSubcategory
            : '',
      };
    }

    nextState.app = nextApp;
    return nextState;
  },
};

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  version: 11,
  storage: AsyncStorage,
  whitelist: ['app'],
  migrate: createMigrate(migrations, {debug: false}),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
