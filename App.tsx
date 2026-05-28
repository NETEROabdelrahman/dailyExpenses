import React, {useMemo} from 'react';
import {Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import CategoryTotalsCard from './src/components/CategoryTotalsCard';
import ExpenseFormCard from './src/components/ExpenseFormCard';
import ExpensesTableCard from './src/components/ExpensesTableCard';
import MoneySummaryCard from './src/components/MoneySummaryCard';
import MonthsListCard from './src/components/MonthsListCard';
import PageHeader from './src/components/PageHeader';
import PieChartCard from './src/components/PieChartCard';
import {CHART_COLORS} from './src/constants/appConstants';
import {PieDatum} from './src/types/expense';
import {currentMonthKey, formatMonthLabel, toMonthKey} from './src/utils/date';
import {useAppDispatch, useAppSelector} from './src/store/hooks';
import {
  addCategoryFromForm,
  deleteExpense,
  openMonthDetails,
  resetForm,
  saveExpenseFromForm,
  setAmountText,
  setBankText,
  setCashText,
  setCategoryLimit,
  setExpenseDateISO,
  setName,
  setNewCategory,
  setNotes,
  setPage,
  setSelectedCategory,
  startEditingExpense,
} from './src/store/appSlice';
import {persistor, store} from './src/store/store';

function AppContent(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const {
    expenses,
    categories,
    categoryLimits,
    cashText,
    bankText,
    page,
    selectedMonth,
    form,
  } = useAppSelector(state => state.app);

  const {
    name,
    amountText,
    expenseDateISO,
    notes,
    selectedCategory,
    newCategory,
    editingExpenseId,
  } = form;

  const expenseDate = useMemo(() => new Date(expenseDateISO), [expenseDateISO]);

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(expenses.map(item => toMonthKey(item.dateISO))),
    ).sort((a, b) => b.localeCompare(a));
    return uniqueMonths;
  }, [expenses]);

  const pastMonths = useMemo(
    () => monthOptions.filter(month => month < currentMonthKey()),
    [monthOptions],
  );

  const selectedMonthExpenses = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    return expenses.filter(item => toMonthKey(item.dateISO) === selectedMonth);
  }, [expenses, selectedMonth]);

  const totalAllExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );

  const totalCashAndBank = useMemo(() => {
    const cash = Number(cashText) || 0;
    const bank = Number(bankText) || 0;
    return cash + bank;
  }, [cashText, bankText]);

  const remainingBalance = useMemo(
    () => totalCashAndBank - totalAllExpenses,
    [totalCashAndBank, totalAllExpenses],
  );

  const totalSelectedMonthExpenses = useMemo(
    () => selectedMonthExpenses.reduce((sum, item) => sum + item.amount, 0),
    [selectedMonthExpenses],
  );

  const totalsByCategoryAll = useMemo(() => {
    return expenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});
  }, [expenses]);

  const totalsByCategorySelectedMonth = useMemo(() => {
    return selectedMonthExpenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});
  }, [selectedMonthExpenses]);

  const toPieData = (totals: Record<string, number>): PieDatum[] =>
    Object.entries(totals).map(([category, total], index) => ({
      name: category,
      population: total,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const pieDataAll = useMemo(() => toPieData(totalsByCategoryAll), [totalsByCategoryAll]);
  const pieDataSelectedMonth = useMemo(
    () => toPieData(totalsByCategorySelectedMonth),
    [totalsByCategorySelectedMonth],
  );

  const submitExpense = () => {
    const cleanName = name.trim();
    const amount = Number(amountText);
    const validAmountPattern = /^\d+(\.\d{1,2})?$/;

    if (!cleanName) {
      Alert.alert('بيانات ناقصة', 'من فضلك اكتب اسم المصروف.');
      return;
    }

    if (!validAmountPattern.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('قيمة غير صحيحة', 'من فضلك أدخل مبلغ صحيح أكبر من صفر.');
      return;
    }

    dispatch(saveExpenseFromForm());
  };

  const renderMainPage = () => (
    <>
      <MoneySummaryCard
        cashText={cashText}
        bankText={bankText}
        totalCashAndBank={totalCashAndBank}
        remainingBalance={remainingBalance}
        onCashChange={value => dispatch(setCashText(value))}
        onBankChange={value => dispatch(setBankText(value))}
      />

      <ExpenseFormCard
        name={name}
        amountText={amountText}
        expenseDate={expenseDate}
        notes={notes}
        selectedCategory={selectedCategory}
        newCategory={newCategory}
        categories={categories}
        editing={editingExpenseId !== null}
        onNameChange={value => dispatch(setName(value))}
        onAmountChange={value => dispatch(setAmountText(value))}
        onDateChange={value => dispatch(setExpenseDateISO(value.toISOString()))}
        onNotesChange={value => dispatch(setNotes(value))}
        onSelectedCategoryChange={value => dispatch(setSelectedCategory(value))}
        onNewCategoryChange={value => dispatch(setNewCategory(value))}
        onAddCategory={() => dispatch(addCategoryFromForm())}
        onSubmit={submitExpense}
        onCancelEdit={() => dispatch(resetForm())}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>إجمالي كل المصاريف</Text>
        <Text style={styles.totalValue}>{totalAllExpenses.toFixed(2)} ج.م</Text>
      </View>

      <TouchableOpacity style={styles.monthsBtn} onPress={() => dispatch(setPage('months'))}>
        <Text style={styles.btnText}>عرض الشهور السابقة</Text>
      </TouchableOpacity>

      <ExpensesTableCard
        items={expenses}
        onEdit={expense => dispatch(startEditingExpense(expense))}
        onDelete={expenseId => dispatch(deleteExpense(expenseId))}
      />

      <CategoryTotalsCard
        totals={totalsByCategoryAll}
        categoryLimits={categoryLimits}
        onLimitChange={(category, limitText) =>
          dispatch(setCategoryLimit({category, limitText}))
        }
      />
      <PieChartCard data={pieDataAll} />
    </>
  );

  const renderMonthsPage = () => (
    <>
      <PageHeader title="الشهور السابقة" onBack={() => dispatch(setPage('main'))} />
      <MonthsListCard
        months={pastMonths}
        onSelectMonth={monthKey => dispatch(openMonthDetails(monthKey))}
      />
    </>
  );

  const renderMonthDetailsPage = () => (
    <>
      <PageHeader
        title={selectedMonth ? formatMonthLabel(selectedMonth) : ''}
        onBack={() => dispatch(setPage('months'))}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>إجمالي الشهر المحدد</Text>
        <Text style={styles.totalValue}>{totalSelectedMonthExpenses.toFixed(2)} ج.م</Text>
      </View>

      <ExpensesTableCard
        items={selectedMonthExpenses}
        onEdit={expense => dispatch(startEditingExpense(expense))}
        onDelete={expenseId => dispatch(deleteExpense(expenseId))}
      />

      <CategoryTotalsCard
        totals={totalsByCategorySelectedMonth}
        categoryLimits={categoryLimits}
        onLimitChange={(category, limitText) =>
          dispatch(setCategoryLimit({category, limitText}))
        }
      />
      <PieChartCard data={pieDataSelectedMonth} />
    </>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {page === 'main' ? renderMainPage() : null}
          {page === 'months' ? renderMonthsPage() : null}
          {page === 'monthDetails' ? renderMonthDetailsPage() : null}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },
  totalCard: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  monthsBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#ccfbf1',
    fontSize: 14,
    textAlign: 'right',
  },
  totalValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'right',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  label: {
    color: '#334155',
    textAlign: 'right',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
  },
  datePickerBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerBtnText: {
    color: '#0f172a',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notesInput: {
    minHeight: 62,
    textAlignVertical: 'top',
  },
  pickerWrap: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    overflow: 'hidden',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexInput: {
    flex: 1,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cancelBtn: {
    backgroundColor: '#64748b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default App;
