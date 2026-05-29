/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-chart-kit', () => ({
  PieChart: 'PieChart',
}));

jest.mock('@react-native-picker/picker', () => {
  const {View} = require('react-native');

  const Picker = ({children}: {children?: React.ReactNode}) => (
    <View>{children}</View>
  );

  Picker.Item = ({children}: {children?: React.ReactNode}) => (
    <View>{children}</View>
  );

  return {Picker};
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('redux-persist/integration/react', () => {
  const ReactLib = require('react');

  return {
    PersistGate: ({children}: {children?: React.ReactNode}) => (
      <ReactLib.Fragment>{children}</ReactLib.Fragment>
    ),
  };
});

jest.mock('react-redux', () => {
  const ReactLib = require('react');

  return {
    Provider: ({children}: {children?: React.ReactNode}) => (
      <ReactLib.Fragment>{children}</ReactLib.Fragment>
    ),
    useDispatch: () => jest.fn(),
    useSelector: () => null,
  };
});

jest.mock('../src/store/store', () => ({
  store: {},
  persistor: {},
}));

const mockState = {
  app: {
    expenses: [],
    debts: [],
    categories: ['طعام', 'ديون', 'مواصلات', 'تسوق', 'أخرى'],
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
      selectedCategory: 'طعام',
      selectedPaymentMethod: 'cash',
      newCategory: '',
      editingExpenseId: null,
    },
    debtForm: {
      personName: '',
      totalAmountText: '',
      dueDateISO: new Date().toISOString(),
      notes: '',
      direction: 'owe',
    },
    debtTransactionForm: {
      selectedDebtId: null,
      amountText: '',
      paymentMethod: 'cash',
      transactionDateISO: new Date().toISOString(),
    },
  },
};

jest.mock('../src/store/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
}));

jest.mock('../src/store/appSlice', () => ({
  addCategoryFromForm: () => ({type: 'app/addCategoryFromForm'}),
  deleteDebt: (payload: string) => ({type: 'app/deleteDebt', payload}),
  deleteExpense: (payload: string) => ({type: 'app/deleteExpense', payload}),
  openMonthDetails: (payload: string) => ({type: 'app/openMonthDetails', payload}),
  resetDebtForms: () => ({type: 'app/resetDebtForms'}),
  resetForm: () => ({type: 'app/resetForm'}),
  saveDebtFromForm: () => ({type: 'app/saveDebtFromForm'}),
  saveDebtTransactionFromForm: () => ({type: 'app/saveDebtTransactionFromForm'}),
  saveExpenseFromForm: () => ({type: 'app/saveExpenseFromForm'}),
  setAmountText: (payload: string) => ({type: 'app/setAmountText', payload}),
  setDebtDirection: (payload: string) => ({type: 'app/setDebtDirection', payload}),
  setDebtDueDateISO: (payload: string) => ({type: 'app/setDebtDueDateISO', payload}),
  setDebtNotes: (payload: string) => ({type: 'app/setDebtNotes', payload}),
  setDebtPersonName: (payload: string) => ({type: 'app/setDebtPersonName', payload}),
  setDebtTotalAmountText: (payload: string) => ({type: 'app/setDebtTotalAmountText', payload}),
  setDebtTransactionAmountText: (payload: string) => ({type: 'app/setDebtTransactionAmountText', payload}),
  setDebtTransactionDebtId: (payload: string) => ({type: 'app/setDebtTransactionDebtId', payload}),
  setDebtTransactionPaymentMethod: (payload: string) => ({type: 'app/setDebtTransactionPaymentMethod', payload}),
  setExpenseDateISO: (payload: string) => ({type: 'app/setExpenseDateISO', payload}),
  setInitialBankText: (payload: string) => ({type: 'app/setInitialBankText', payload}),
  setInitialCashText: (payload: string) => ({type: 'app/setInitialCashText', payload}),
  setInitialWalletText: (payload: string) => ({type: 'app/setInitialWalletText', payload}),
  setName: (payload: string) => ({type: 'app/setName', payload}),
  setNewCategory: (payload: string) => ({type: 'app/setNewCategory', payload}),
  setNotes: (payload: string) => ({type: 'app/setNotes', payload}),
  setPage: (payload: string) => ({type: 'app/setPage', payload}),
  setSelectedCategory: (payload: string) => ({type: 'app/setSelectedCategory', payload}),
  setSelectedPaymentMethod: (payload: string) => ({type: 'app/setSelectedPaymentMethod', payload}),
  startEditingExpense: (payload: unknown) => ({type: 'app/startEditingExpense', payload}),
}));

jest.mock('d3-shape', () => {
  const pie = () => {
    let valueAccessor = (item: {population: number}) => item.population;

    const generator = (data: Array<{population: number}>) => {
      const total = data.reduce((sum, item) => sum + valueAccessor(item), 0) || 1;
      let startAngle = 0;

      return data.map(item => {
        const value = valueAccessor(item);
        const angle = (value / total) * Math.PI * 2;
        const slice = {
          data: item,
          startAngle,
          endAngle: startAngle + angle,
        };
        startAngle += angle;
        return slice;
      });
    };

    generator.value = (
      fn: (item: {population: number}) => number,
    ) => {
      valueAccessor = fn;
      return generator;
    };
    generator.sort = () => generator;

    return generator;
  };

  const arc = () => {
    let inner = 0;
    let outer = 100;

    const fn = (slice: {startAngle: number; endAngle: number}) => {
      const mid = (slice.startAngle + slice.endAngle) / 2;
      const x = Math.cos(mid) * outer;
      const y = Math.sin(mid) * outer;
      return `M0 0 L${x} ${y} Z`;
    };

    fn.innerRadius = (value: number) => {
      inner = value;
      return fn;
    };

    fn.outerRadius = (value: number) => {
      outer = value;
      return fn;
    };

    fn.centroid = (slice: {startAngle: number; endAngle: number}) => {
      const mid = (slice.startAngle + slice.endAngle) / 2;
      const r = (inner + outer) / 2;
      return [Math.cos(mid) * r, Math.sin(mid) * r];
    };

    return fn;
  };

  return {
    pie,
    arc,
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
