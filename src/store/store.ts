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
import appReducer from './appSlice';

type PersistedExpense = {
  id: string;
  name: string;
  amount: number;
  dateISO: string;
  notes: string;
  category: string;
  paymentMethod?: 'cash' | 'bank' | 'wallet';
};

type PersistedDebtTransaction = {
  id: string;
  debtId: string;
  amount: number;
  dateISO: string;
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
};

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  version: 3,
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
