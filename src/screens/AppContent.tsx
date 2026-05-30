import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {
  getCategoryColor,
  PAYMENT_METHOD_LABELS,
} from '../constants/appConstants';
import {DRAWER_OPEN_THRESHOLD, DRAWER_WIDTH} from '../constants/layout';
import {PieDatum} from '../types/expense';
import {currentMonthKey, toMonthKey} from '../utils/date';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  addCategoryFromForm,
  addIncomingCustomSourceFromForm,
  deleteIncomingTransaction,
  deleteDebt,
  deleteExpense,
  openMonthDetails,
  resetDebtForms,
  resetForm,
  saveDebtFromForm,
  saveIncomingFromForm,
  saveDebtTransactionFromForm,
  saveExpenseFromForm,
  setAmountText,
  setDebtDirection,
  setDebtDueDateISO,
  setDebtNotes,
  setDebtPersonName,
  setDebtTotalAmountText,
  setDebtTransactionAmountText,
  setDebtTransactionDebtId,
  setDebtTransactionPaymentMethod,
  setExpenseDateISO,
  setIncomingAmountText,
  setIncomingPaymentMethod,
  setIncomingSourceOtherText,
  setIncomingSourceType,
  setInitialBankText,
  setInitialCashText,
  setInitialWalletText,
  setName,
  setNewCategory,
  setNotes,
  setPage,
  setSelectedCategory,
  setSelectedPaymentMethod,
  startEditingExpense,
} from '../store/appSlice';
import styles from '../styles/appStyles';
import BalancesPage from './pages/BalancesPage';
import DebtsPage from './pages/DebtsPage';
import MainPage from './pages/MainPage';
import MonthDetailsPage from './pages/MonthDetailsPage';
import MonthsPage from './pages/MonthsPage';

const DEBT_PAYMENTS_CATEGORY = 'ديون';

function AppContent(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showDebtDueDatePicker, setShowDebtDueDatePicker] = useState(false);
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerOverlayOpacity = useRef(new Animated.Value(0)).current;

  const {
    expenses,
    debts,
    categories,
    initialCashText,
    initialBankText,
    initialWalletText,
    cashText,
    bankText,
    walletText,
    page,
    selectedMonth,
    form,
    debtForm: rawDebtForm,
    debtTransactionForm: rawDebtTransactionForm,
    incomingForm: rawIncomingForm,
    incomingTransactions: rawIncomingTransactions,
    customIncomingSources: rawCustomIncomingSources,
  } = useAppSelector(state => state.app);

  const debtForm = rawDebtForm ?? {
    personName: '',
    totalAmountText: '',
    dueDateISO: new Date().toISOString(),
    notes: '',
    direction: 'owe' as const,
  };

  const debtTransactionForm = rawDebtTransactionForm ?? {
    selectedDebtId: null,
    amountText: '',
    paymentMethod: 'cash' as const,
    transactionDateISO: new Date().toISOString(),
  };

  const incomingForm = rawIncomingForm ?? {
    amountText: '',
    paymentMethod: 'cash' as const,
    sourceType: 'salary' as const,
    sourceOtherText: '',
  };

  const incomingTransactions = rawIncomingTransactions ?? [];
  const customIncomingSources = rawCustomIncomingSources ?? [];

  const {
    name,
    amountText,
    expenseDateISO,
    notes,
    selectedCategory,
    selectedPaymentMethod,
    newCategory,
    editingExpenseId,
  } = form;

  const expenseDate = useMemo(() => new Date(expenseDateISO), [expenseDateISO]);
  const debtDueDate = useMemo(() => new Date(debtForm.dueDateISO), [debtForm.dueDateISO]);

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

  const totalInitialBalance = useMemo(() => {
    const cash = Number(initialCashText) || 0;
    const bank = Number(initialBankText) || 0;
    const wallet = Number(initialWalletText) || 0;
    return cash + bank + wallet;
  }, [initialBankText, initialCashText, initialWalletText]);

  const remainingCash = useMemo(() => Number(cashText) || 0, [cashText]);
  const remainingBank = useMemo(() => Number(bankText) || 0, [bankText]);
  const remainingWallet = useMemo(() => Number(walletText) || 0, [walletText]);

  const totalRemainingBalance = useMemo(
    () => remainingCash + remainingBank + remainingWallet,
    [remainingBank, remainingCash, remainingWallet],
  );

  const selectedPaymentMethodBalance = useMemo(() => {
    if (selectedPaymentMethod === 'cash') {
      return remainingCash;
    }

    if (selectedPaymentMethod === 'bank') {
      return remainingBank;
    }

    return remainingWallet;
  }, [remainingBank, remainingCash, remainingWallet, selectedPaymentMethod]);

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

  const debtPaymentsTotalsByCategoryAll = useMemo(() => {
    return debts.reduce<Record<string, number>>((acc, debt) => {
      debt.transactions.forEach(transaction => {
        if (transaction.type !== 'payment') {
          return;
        }

        acc[DEBT_PAYMENTS_CATEGORY] =
          (acc[DEBT_PAYMENTS_CATEGORY] ?? 0) + transaction.amount;
      });

      return acc;
    }, {});
  }, [debts]);

  const totalsByCategorySelectedMonth = useMemo(() => {
    return selectedMonthExpenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});
  }, [selectedMonthExpenses]);

  const debtPaymentsTotalsByCategorySelectedMonth = useMemo(() => {
    if (!selectedMonth) {
      return {};
    }

    return debts.reduce<Record<string, number>>((acc, debt) => {
      debt.transactions.forEach(transaction => {
        if (transaction.type !== 'payment') {
          return;
        }

        if (toMonthKey(transaction.dateISO) !== selectedMonth) {
          return;
        }

        acc[DEBT_PAYMENTS_CATEGORY] =
          (acc[DEBT_PAYMENTS_CATEGORY] ?? 0) + transaction.amount;
      });

      return acc;
    }, {});
  }, [debts, selectedMonth]);

  const mergeCategoryTotals = (
    baseTotals: Record<string, number>,
    extraTotals: Record<string, number>,
  ): Record<string, number> => {
    const merged: Record<string, number> = {...baseTotals};

    Object.entries(extraTotals).forEach(([category, total]) => {
      merged[category] = (merged[category] ?? 0) + total;
    });

    return merged;
  };

  const debtsSummary = useMemo(() => {
    return debts.reduce(
      (acc, debt) => {
        if (debt.direction === 'owe') {
          acc.totalOwe += debt.remainingAmount;
        } else {
          acc.totalOwedToMe += debt.remainingAmount;
        }

        if (debt.status === 'overdue') {
          acc.totalOverdue += debt.remainingAmount;
        }

        return acc;
      },
      {totalOwe: 0, totalOwedToMe: 0, totalOverdue: 0},
    );
  }, [debts]);

  const selectedDebt = useMemo(
    () => debts.find(item => item.id === debtTransactionForm.selectedDebtId) ?? null,
    [debtTransactionForm.selectedDebtId, debts],
  );

  const selectableDebts = useMemo(
    () => debts.filter(item => item.remainingAmount > 0),
    [debts],
  );

  useEffect(() => {
    const hasCurrentSelection = selectableDebts.some(
      item => item.id === debtTransactionForm.selectedDebtId,
    );

    if (selectableDebts.length === 0) {
      if (debtTransactionForm.selectedDebtId !== null) {
        dispatch(setDebtTransactionDebtId(null));
      }
      return;
    }

    if (!hasCurrentSelection) {
      dispatch(setDebtTransactionDebtId(selectableDebts[0].id));
    }
  }, [debtTransactionForm.selectedDebtId, dispatch, selectableDebts]);

  const toPieData = (totals: Record<string, number>): PieDatum[] =>
    Object.entries(totals).map(([category, total]) => ({
      name: category,
      population: total,
      color: getCategoryColor(category),
    }));

  const pieDataAll = useMemo(
    () => toPieData(mergeCategoryTotals(totalsByCategoryAll, debtPaymentsTotalsByCategoryAll)),
    [debtPaymentsTotalsByCategoryAll, totalsByCategoryAll],
  );
  const pieDataSelectedMonth = useMemo(
    () =>
      toPieData(
        mergeCategoryTotals(
          totalsByCategorySelectedMonth,
          debtPaymentsTotalsByCategorySelectedMonth,
        ),
      ),
    [debtPaymentsTotalsByCategorySelectedMonth, totalsByCategorySelectedMonth],
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

    if (selectedPaymentMethodBalance < amount) {
      Alert.alert(
        'رصيد غير كافٍ',
        `المبلغ أكبر من ${PAYMENT_METHOD_LABELS[selectedPaymentMethod]}.`,
      );
      return;
    }

    dispatch(saveExpenseFromForm());
  };

  const submitDebt = () => {
    const cleanName = debtForm.personName.trim();
    const amount = Number(debtForm.totalAmountText);
    const validAmountPattern = /^\d+(\.\d{1,2})?$/;

    if (!cleanName) {
      Alert.alert('بيانات ناقصة', 'من فضلك اكتب اسم الشخص أو الجهة.');
      return;
    }

    if (
      !validAmountPattern.test(debtForm.totalAmountText) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      Alert.alert('قيمة غير صحيحة', 'من فضلك أدخل مبلغ دين صحيح أكبر من صفر.');
      return;
    }

    dispatch(saveDebtFromForm());
  };

  const submitDebtTransaction = () => {
    const amount = Number(debtTransactionForm.amountText);
    const validAmountPattern = /^\d+(\.\d{1,2})?$/;

    if (!selectedDebt) {
      Alert.alert('بيانات ناقصة', 'اختر ديناً أولاً.');
      return;
    }

    if (
      !validAmountPattern.test(debtTransactionForm.amountText) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      Alert.alert('قيمة غير صحيحة', 'أدخل مبلغ حركة الدين بشكل صحيح.');
      return;
    }

    if (amount > selectedDebt.remainingAmount) {
      Alert.alert('قيمة غير صحيحة', 'المبلغ أكبر من المتبقي في هذا الدين.');
      return;
    }

    if (selectedDebt.direction === 'owe') {
      const paymentMethod = debtTransactionForm.paymentMethod;
      const available =
        paymentMethod === 'cash'
          ? remainingCash
          : paymentMethod === 'bank'
            ? remainingBank
            : remainingWallet;

      if (available < amount) {
        Alert.alert(
          'رصيد غير كافٍ',
          `المبلغ أكبر من ${PAYMENT_METHOD_LABELS[paymentMethod]}.`,
        );
        return;
      }
    }

    dispatch(saveDebtTransactionFromForm());
  };

  const submitIncomingMoney = () => {
    const amount = Number(incomingForm.amountText);
    const validAmountPattern = /^\d+(\.\d{1,2})?$/;

    if (
      !validAmountPattern.test(incomingForm.amountText) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      Alert.alert('قيمة غير صحيحة', 'أدخل مبلغاً صحيحاً أكبر من صفر.');
      return;
    }

    if (incomingForm.sourceType === 'other' && !incomingForm.sourceOtherText.trim()) {
      Alert.alert('بيانات ناقصة', 'اكتب مصدر المال عند اختيار "أخرى".');
      return;
    }

    dispatch(saveIncomingFromForm());
  };

  const addCustomIncomingSource = () => {
    const cleanLabel = incomingForm.sourceOtherText.trim();

    if (!cleanLabel) {
      Alert.alert('بيانات ناقصة', 'اكتب اسم المصدر لإضافته.');
      return;
    }

    const alreadyExists = customIncomingSources.some(
      item => item.toLowerCase() === cleanLabel.toLowerCase(),
    );

    if (alreadyExists) {
      Alert.alert('موجود بالفعل', 'هذا المصدر موجود مسبقاً.');
      return;
    }

    dispatch(addIncomingCustomSourceFromForm());
  };

  const confirmDeleteIncomingTransaction = (transactionId: string) => {
    Alert.alert('تأكيد الحذف', 'هل تريد حذف هذا المبلغ الوارد؟', [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => dispatch(deleteIncomingTransaction(transactionId)),
      },
    ]);
  };

  const animateDrawer = (open: boolean) => {
    if (open) {
      setShowNavMenu(true);
    }

    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: open ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(drawerOverlayOpacity, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (!open && finished) {
        setShowNavMenu(false);
      }
    });
  };

  const setDrawerProgress = (translateX: number) => {
    drawerTranslateX.setValue(translateX);
    drawerOverlayOpacity.setValue((DRAWER_WIDTH + translateX) / DRAWER_WIDTH);
  };

  const closeMenu = () => {
    animateDrawer(false);
  };

  const openMenu = () => {
    animateDrawer(true);
  };

  const edgePanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      !showNavMenu &&
      gestureState.dx > 14 &&
      Math.abs(gestureState.dy) < 16 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
    onPanResponderGrant: () => {
      setShowNavMenu(true);
      setDrawerProgress(-DRAWER_WIDTH);
    },
    onPanResponderMove: (_, gestureState) => {
      const translateX = Math.min(
        0,
        Math.max(-DRAWER_WIDTH, -DRAWER_WIDTH + gestureState.dx),
      );
      setDrawerProgress(translateX);
    },
    onPanResponderRelease: (_, gestureState) => {
      const shouldOpen =
        gestureState.dx > DRAWER_OPEN_THRESHOLD || gestureState.vx > 0.5;

      if (shouldOpen) {
        openMenu();
        return;
      }

      closeMenu();
    },
    onPanResponderTerminate: () => {
      closeMenu();
    },
  });

  const drawerPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      showNavMenu && gestureState.dx < -8 && Math.abs(gestureState.dy) < 18,
    onPanResponderMove: (_, gestureState) => {
      const translateX = Math.min(0, Math.max(-DRAWER_WIDTH, gestureState.dx));
      setDrawerProgress(translateX);
    },
    onPanResponderRelease: (_, gestureState) => {
      const shouldClose =
        gestureState.dx < -DRAWER_OPEN_THRESHOLD || gestureState.vx < -0.5;

      if (shouldClose) {
        closeMenu();
        return;
      }

      openMenu();
    },
    onPanResponderTerminate: () => {
      openMenu();
    },
  });

  const openPageFromMenu = (targetPage: 'main' | 'balances' | 'months' | 'debts') => {
    closeMenu();
    dispatch(setPage(targetPage));
  };

  const onChangeDebtDueDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDebtDueDatePicker(false);

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    dispatch(setDebtDueDateISO(selectedDate.toISOString()));
  };

  const renderTopNavigationMenu = () => <View style={styles.topMenuContainer} />;

  const renderSideNavigationMenu = () => (
    <>
      <View style={styles.edgeMenuActivator}>
        <Pressable style={styles.edgeMenuTapArea} onPress={openMenu} />
      </View>

      <Animated.View
        pointerEvents={showNavMenu ? 'auto' : 'none'}
        style={[styles.drawerOverlay, {opacity: drawerOverlayOpacity}]}> 
        <Pressable style={styles.drawerOverlayTouch} onPress={closeMenu} />
      </Animated.View>

      <Animated.View
        {...drawerPanResponder.panHandlers}
        style={[styles.sideDrawer, {transform: [{translateX: drawerTranslateX}]}]}>
        <View style={styles.sideDrawerHeader}>
          <Text style={styles.sideDrawerTitle}>القائمة</Text>
        </View>

        <TouchableOpacity
          style={styles.topMenuItem}
          onPress={() => openPageFromMenu('main')}>
          <Text style={styles.topMenuItemText}>الصفحة الرئيسية</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topMenuItem}
          onPress={() => openPageFromMenu('balances')}>
          <Text style={styles.topMenuItemText}>الأرصدة المتاحة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topMenuItem}
          onPress={() => openPageFromMenu('debts')}>
          <Text style={styles.topMenuItemText}>المديونية</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topMenuItem, styles.topMenuItemLast]}
          onPress={() => openPageFromMenu('months')}>
          <Text style={styles.topMenuItemText}>عرض الشهور السابقة</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screenGestureLayer} {...edgePanResponder.panHandlers}>
          <ScrollView contentContainerStyle={styles.content}>
            {renderTopNavigationMenu()}

            {page === 'main' ? (
              <MainPage
                name={name}
                amountText={amountText}
                expenseDate={expenseDate}
                notes={notes}
                selectedCategory={selectedCategory}
                selectedPaymentMethod={selectedPaymentMethod}
                newCategory={newCategory}
                categories={categories}
                editingExpenseId={editingExpenseId}
                totalAllExpenses={totalAllExpenses}
                expenses={expenses}
                pieDataAll={pieDataAll}
                onNameChange={value => dispatch(setName(value))}
                onAmountChange={value => dispatch(setAmountText(value))}
                onDateChange={value => dispatch(setExpenseDateISO(value.toISOString()))}
                onNotesChange={value => dispatch(setNotes(value))}
                onSelectedCategoryChange={value => dispatch(setSelectedCategory(value))}
                onSelectedPaymentMethodChange={value =>
                  dispatch(setSelectedPaymentMethod(value))
                }
                onNewCategoryChange={value => dispatch(setNewCategory(value))}
                onAddCategory={() => dispatch(addCategoryFromForm())}
                onSubmitExpense={submitExpense}
                onCancelEdit={() => dispatch(resetForm())}
                onEditExpense={expense => dispatch(startEditingExpense(expense))}
                onDeleteExpense={expenseId => dispatch(deleteExpense(expenseId))}
              />
            ) : null}

            {page === 'balances' ? (
              <BalancesPage
                initialCashText={initialCashText}
                initialBankText={initialBankText}
                initialWalletText={initialWalletText}
                remainingCash={remainingCash}
                remainingBank={remainingBank}
                remainingWallet={remainingWallet}
                totalBefore={totalInitialBalance}
                totalAfter={totalRemainingBalance}
                incomingForm={incomingForm}
                incomingTransactions={incomingTransactions}
                customIncomingSources={customIncomingSources}
                onBack={() => dispatch(setPage('main'))}
                onInitialCashChange={value => dispatch(setInitialCashText(value))}
                onInitialBankChange={value => dispatch(setInitialBankText(value))}
                onInitialWalletChange={value => dispatch(setInitialWalletText(value))}
                onIncomingAmountChange={value => dispatch(setIncomingAmountText(value))}
                onIncomingPaymentMethodChange={value => dispatch(setIncomingPaymentMethod(value))}
                onIncomingSourceTypeChange={value => dispatch(setIncomingSourceType(value))}
                onIncomingSourceOtherTextChange={value =>
                  dispatch(setIncomingSourceOtherText(value))
                }
                onAddCustomIncomingSource={addCustomIncomingSource}
                onSubmitIncomingMoney={submitIncomingMoney}
                onDeleteIncomingTransaction={confirmDeleteIncomingTransaction}
              />
            ) : null}

            {page === 'debts' ? (
              <DebtsPage
                debtsSummary={debtsSummary}
                debtForm={debtForm}
                debtDueDate={debtDueDate}
                showDebtDueDatePicker={showDebtDueDatePicker}
                selectableDebts={selectableDebts}
                debtTransactionForm={debtTransactionForm}
                selectedDebt={selectedDebt}
                debts={debts}
                onBack={() => dispatch(setPage('main'))}
                onDebtPersonNameChange={value => dispatch(setDebtPersonName(value))}
                onDebtTotalAmountChange={value => dispatch(setDebtTotalAmountText(value))}
                onDebtDirectionChange={value => dispatch(setDebtDirection(value))}
                onShowDebtDueDatePicker={() => setShowDebtDueDatePicker(true)}
                onChangeDebtDueDate={onChangeDebtDueDate}
                onDebtNotesChange={value => dispatch(setDebtNotes(value))}
                onSubmitDebt={submitDebt}
                onResetDebtForms={() => dispatch(resetDebtForms())}
                onSelectDebt={debtId => dispatch(setDebtTransactionDebtId(debtId))}
                onDebtTransactionAmountChange={value =>
                  dispatch(setDebtTransactionAmountText(value))
                }
                onDebtTransactionPaymentMethodChange={value =>
                  dispatch(setDebtTransactionPaymentMethod(value))
                }
                onSubmitDebtTransaction={submitDebtTransaction}
                onDeleteDebt={debtId => dispatch(deleteDebt(debtId))}
              />
            ) : null}

            {page === 'months' ? (
              <MonthsPage
                months={pastMonths}
                onBack={() => dispatch(setPage('main'))}
                onSelectMonth={monthKey => dispatch(openMonthDetails(monthKey))}
              />
            ) : null}

            {page === 'monthDetails' ? (
              <MonthDetailsPage
                selectedMonth={selectedMonth}
                totalSelectedMonthExpenses={totalSelectedMonthExpenses}
                selectedMonthExpenses={selectedMonthExpenses}
                pieDataSelectedMonth={pieDataSelectedMonth}
                onBack={() => dispatch(setPage('months'))}
                onEditExpense={expense => dispatch(startEditingExpense(expense))}
                onDeleteExpense={expenseId => dispatch(deleteExpense(expenseId))}
              />
            ) : null}
          </ScrollView>

          {renderSideNavigationMenu()}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default AppContent;
