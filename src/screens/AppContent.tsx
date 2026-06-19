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
import {AccountingPeriod, BalanceTransaction, PieDatum} from '../types/expense';
import {formatDate, formatPeriodLabel} from '../utils/date';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  addCategoryFromForm,
  addIncomingCustomSourceFromForm,
  deleteIncomingTransaction,
  deleteDebt,
  deleteExpense,
  endCurrentMonth,
  openMonthDetails,
  resetDebtForms,
  resetForm,
  resetTransferForm,
  saveDebtFromForm,
  saveIncomingFromForm,
  saveDebtTransactionFromForm,
  saveExpenseFromForm,
  saveTransferFromForm,
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
  setTransferAmountText,
  setTransferFromPaymentMethod,
  setTransferNotes,
  setTransferToPaymentMethod,
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
const EMPTY_BALANCE_TRANSACTIONS: BalanceTransaction[] = [];
const EMPTY_PERIODS: AccountingPeriod[] = [];

function AppContent(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showDebtDueDatePicker, setShowDebtDueDatePicker] = useState(false);
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerOverlayOpacity = useRef(new Animated.Value(0)).current;

  const {
    expenses,
    debts,
    balanceTransactions: rawBalanceTransactions,
    periods: rawPeriods,
    currentPeriodId: rawCurrentPeriodId,
    categories,
    page,
    selectedMonth,
    form,
    debtForm: rawDebtForm,
    debtTransactionForm: rawDebtTransactionForm,
    incomingForm: rawIncomingForm,
    transferForm: rawTransferForm,
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

  const transferForm = rawTransferForm ?? {
    amountText: '',
    fromPaymentMethod: 'wallet' as const,
    toPaymentMethod: 'cash' as const,
    notes: '',
  };

  const customIncomingSources = rawCustomIncomingSources ?? [];
  const balanceTransactions = rawBalanceTransactions ?? EMPTY_BALANCE_TRANSACTIONS;
  const periods = rawPeriods ?? EMPTY_PERIODS;
  const currentPeriodId = rawCurrentPeriodId ?? periods.find(
    period => period.endedAtISO === null,
  )?.id ?? 'period_1';
  const currentPeriod = periods.find(period => period.id === currentPeriodId) ?? null;

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

  const closedPeriods = useMemo(
    () =>
      periods
        .filter(period => period.endedAtISO !== null)
        .sort((first, second) =>
          (second.endedAtISO ?? '').localeCompare(first.endedAtISO ?? ''),
        ),
    [periods],
  );

  const currentPeriodExpenses = useMemo(
    () => expenses.filter(item => (item.periodKey ?? currentPeriodId) === currentPeriodId),
    [currentPeriodId, expenses],
  );

  const selectedPeriod = useMemo(
    () => periods.find(period => period.id === selectedMonth) ?? null,
    [periods, selectedMonth],
  );

  const selectedMonthExpenses = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    return expenses.filter(item => item.periodKey === selectedMonth);
  }, [expenses, selectedMonth]);

  const totalAllExpenses = useMemo(
    () => currentPeriodExpenses.reduce((sum, item) => sum + item.amount, 0),
    [currentPeriodExpenses],
  );

  const remainingCash = useMemo(
    () =>
      balanceTransactions
        .filter(item => item.paymentMethod === 'cash')
        .reduce((sum, item) => sum + item.amount, 0),
    [balanceTransactions],
  );
  const remainingBank = useMemo(
    () =>
      balanceTransactions
        .filter(item => item.paymentMethod === 'bank')
        .reduce((sum, item) => sum + item.amount, 0),
    [balanceTransactions],
  );
  const remainingWallet = useMemo(
    () =>
      balanceTransactions
        .filter(item => item.paymentMethod === 'wallet')
        .reduce((sum, item) => sum + item.amount, 0),
    [balanceTransactions],
  );

  const totalRemainingBalance = useMemo(
    () => remainingCash + remainingBank + remainingWallet,
    [remainingBank, remainingCash, remainingWallet],
  );

  const currentPeriodBalanceTransactions = useMemo(
    () =>
      balanceTransactions.filter(
        item => (item.periodKey ?? currentPeriodId) === currentPeriodId,
      ),
    [balanceTransactions, currentPeriodId],
  );

  const currentPeriodSummary = useMemo(() => {
    return currentPeriodBalanceTransactions.reduce(
      (acc, item) => {
        if (item.type === 'incoming') {
          acc.income += item.amount;
        }

        if (item.type === 'expense') {
          acc.expenses += Math.abs(item.amount);
        }

        if (item.type === 'debtPayment') {
          acc.debtPayments += Math.abs(item.amount);
        }

        if (item.type === 'debtCollection') {
          acc.debtCollections += item.amount;
        }

        acc.net += item.amount;
        return acc;
      },
      {
        income: 0,
        expenses: 0,
        debtPayments: 0,
        debtCollections: 0,
        net: 0,
      },
    );
  }, [currentPeriodBalanceTransactions]);

  const currentPeriodStartedText = useMemo(() => {
    if (!currentPeriod?.startedAtISO) {
      return '';
    }

    const startedAt = new Date(currentPeriod.startedAtISO);
    const now = new Date();
    const elapsedMs = now.getTime() - startedAt.getTime();
    const daysSinceStart = Math.max(
      0,
      Math.floor(elapsedMs / (1000 * 60 * 60 * 24)),
    );

    return `${formatDate(currentPeriod.startedAtISO)} - منذ ${daysSinceStart} يوم`;
  }, [currentPeriod?.startedAtISO]);

  const currentPeriodLabel = useMemo(
    () =>
      currentPeriod?.startedAtISO
        ? formatPeriodLabel(currentPeriod.startedAtISO)
        : 'الشهر الحالي',
    [currentPeriod?.startedAtISO],
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

  const getAvailableBalance = (paymentMethod: 'cash' | 'bank' | 'wallet') => {
    if (paymentMethod === 'cash') {
      return remainingCash;
    }

    if (paymentMethod === 'bank') {
      return remainingBank;
    }

    return remainingWallet;
  };

  const totalSelectedMonthExpenses = useMemo(
    () => selectedMonthExpenses.reduce((sum, item) => sum + item.amount, 0),
    [selectedMonthExpenses],
  );

  const totalsByCategoryAll = useMemo(() => {
    return currentPeriodExpenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});
  }, [currentPeriodExpenses]);

  const debtPaymentsTotalsByCategoryAll = useMemo(() => {
    return debts.reduce<Record<string, number>>((acc, debt) => {
      debt.transactions.forEach(transaction => {
        if (transaction.type !== 'payment') {
          return;
        }

        if ((transaction.periodKey ?? currentPeriodId) === currentPeriodId) {
          acc[DEBT_PAYMENTS_CATEGORY] =
            (acc[DEBT_PAYMENTS_CATEGORY] ?? 0) + transaction.amount;
        }
      });

      return acc;
    }, {});
  }, [currentPeriodId, debts]);

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

        if (transaction.periodKey !== selectedMonth) {
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

  const submitTransfer = () => {
    const amount = Number(transferForm.amountText);
    const validAmountPattern = /^\d+(\.\d{1,2})?$/;

    if (
      !validAmountPattern.test(transferForm.amountText) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      Alert.alert('قيمة غير صحيحة', 'أدخل مبلغ تحويل صحيح أكبر من صفر.');
      return;
    }

    if (transferForm.fromPaymentMethod === transferForm.toPaymentMethod) {
      Alert.alert('تحويل غير صحيح', 'اختر رصيدين مختلفين للتحويل.');
      return;
    }

    const available = getAvailableBalance(transferForm.fromPaymentMethod);

    if (available < amount) {
      Alert.alert(
        'رصيد غير كافٍ',
        `المبلغ أكبر من ${PAYMENT_METHOD_LABELS[transferForm.fromPaymentMethod]}.`,
      );
      return;
    }

    dispatch(saveTransferFromForm());
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

  const confirmEndCurrentMonth = () => {
    Alert.alert(
      'إنهاء الشهر',
      'سيتم نقل المصاريف الحالية إلى الشهور السابقة، وأي مبالغ أو مصاريف جديدة ستبدأ في شهر جديد.',
      [
        {text: 'إلغاء', style: 'cancel'},
        {
          text: 'إنهاء الشهر',
          onPress: () => dispatch(endCurrentMonth()),
        },
      ],
    );
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
                currentPeriodLabel={currentPeriodLabel}
                currentPeriodStartedText={currentPeriodStartedText}
                currentPeriodSummary={currentPeriodSummary}
                totalRemainingBalance={totalRemainingBalance}
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
                expenses={currentPeriodExpenses}
                pieDataAll={pieDataAll}
                onEndCurrentMonth={confirmEndCurrentMonth}
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
                remainingCash={remainingCash}
                remainingBank={remainingBank}
                remainingWallet={remainingWallet}
                totalBalance={totalRemainingBalance}
                incomingForm={incomingForm}
                transferForm={transferForm}
                balanceTransactions={balanceTransactions}
                customIncomingSources={customIncomingSources}
                onBack={() => dispatch(setPage('main'))}
                onIncomingAmountChange={value => dispatch(setIncomingAmountText(value))}
                onIncomingPaymentMethodChange={value => dispatch(setIncomingPaymentMethod(value))}
                onIncomingSourceTypeChange={value => dispatch(setIncomingSourceType(value))}
                onIncomingSourceOtherTextChange={value =>
                  dispatch(setIncomingSourceOtherText(value))
                }
                onAddCustomIncomingSource={addCustomIncomingSource}
                onSubmitIncomingMoney={submitIncomingMoney}
                onTransferAmountChange={value => dispatch(setTransferAmountText(value))}
                onTransferFromPaymentMethodChange={value =>
                  dispatch(setTransferFromPaymentMethod(value))
                }
                onTransferToPaymentMethodChange={value =>
                  dispatch(setTransferToPaymentMethod(value))
                }
                onTransferNotesChange={value => dispatch(setTransferNotes(value))}
                onSubmitTransfer={submitTransfer}
                onResetTransfer={() => dispatch(resetTransferForm())}
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
                periods={closedPeriods}
                onBack={() => dispatch(setPage('main'))}
                onSelectMonth={periodId => dispatch(openMonthDetails(periodId))}
              />
            ) : null}

            {page === 'monthDetails' ? (
              <MonthDetailsPage
                selectedMonth={selectedMonth}
                selectedMonthLabel={
                  selectedPeriod?.startedAtISO
                    ? formatPeriodLabel(selectedPeriod.startedAtISO)
                    : ''
                }
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
