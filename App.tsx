import React, {useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import ExpenseFormCard from './src/components/ExpenseFormCard';
import ExpensesTableCard from './src/components/ExpensesTableCard';
import MoneySummaryCard from './src/components/MoneySummaryCard';
import MonthsListCard from './src/components/MonthsListCard';
import PageHeader from './src/components/PageHeader';
import PieChartCard from './src/components/PieChartCard';
import {
  DEBT_DIRECTION_LABELS,
  DEBT_STATUS_LABELS,
  getCategoryColor,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from './src/constants/appConstants';
import {PieDatum} from './src/types/expense';
import {currentMonthKey, formatDate, formatMonthLabel, toMonthKey} from './src/utils/date';
import {useAppDispatch, useAppSelector} from './src/store/hooks';
import {
  addCategoryFromForm,
  deleteDebt,
  deleteExpense,
  openMonthDetails,
  resetDebtForms,
  resetForm,
  saveDebtFromForm,
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
} from './src/store/appSlice';
import {persistor, store} from './src/store/store';

const DRAWER_WIDTH = 280;
const DRAWER_OPEN_THRESHOLD = DRAWER_WIDTH * 0.35;

const sanitizeAmountInput = (value: string): string => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole = '', decimal = ''] = cleaned.split('.');
  const limitedDecimal = decimal.slice(0, 2);
  return cleaned.includes('.') ? `${whole}.${limitedDecimal}` : whole;
};

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

  const totalsByCategorySelectedMonth = useMemo(() => {
    return selectedMonthExpenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});
  }, [selectedMonthExpenses]);

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

  const toPieData = (totals: Record<string, number>): PieDatum[] =>
    Object.entries(totals).map(([category, total]) => ({
      name: category,
      population: total,
      color: getCategoryColor(category),
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

  const renderMainPage = () => (
    <>
      <ExpenseFormCard
        name={name}
        amountText={amountText}
        expenseDate={expenseDate}
        notes={notes}
        selectedCategory={selectedCategory}
        selectedPaymentMethod={selectedPaymentMethod}
        newCategory={newCategory}
        categories={categories}
        editing={editingExpenseId !== null}
        onNameChange={value => dispatch(setName(value))}
        onAmountChange={value => dispatch(setAmountText(value))}
        onDateChange={value => dispatch(setExpenseDateISO(value.toISOString()))}
        onNotesChange={value => dispatch(setNotes(value))}
        onSelectedCategoryChange={value => dispatch(setSelectedCategory(value))}
        onSelectedPaymentMethodChange={value => dispatch(setSelectedPaymentMethod(value))}
        onNewCategoryChange={value => dispatch(setNewCategory(value))}
        onAddCategory={() => dispatch(addCategoryFromForm())}
        onSubmit={submitExpense}
        onCancelEdit={() => dispatch(resetForm())}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>إجمالي كل المصاريف</Text>
        <Text style={styles.totalValue}>{totalAllExpenses.toFixed(2)} ج.م</Text>
      </View>

      <ExpensesTableCard
        items={expenses}
        onEdit={expense => dispatch(startEditingExpense(expense))}
        onDelete={expenseId => dispatch(deleteExpense(expenseId))}
      />
      <PieChartCard data={pieDataAll} />
    </>
  );

  const renderBalancesPage = () => (
    <>
      <PageHeader title="الأرصدة المتاحة" onBack={() => dispatch(setPage('main'))} />

      <MoneySummaryCard
        initialCashText={initialCashText}
        initialBankText={initialBankText}
        initialWalletText={initialWalletText}
        remainingCash={remainingCash}
        remainingBank={remainingBank}
        remainingWallet={remainingWallet}
        totalBefore={totalInitialBalance}
        totalAfter={totalRemainingBalance}
        onInitialCashChange={value => dispatch(setInitialCashText(sanitizeAmountInput(value)))}
        onInitialBankChange={value => dispatch(setInitialBankText(sanitizeAmountInput(value)))}
        onInitialWalletChange={value => dispatch(setInitialWalletText(sanitizeAmountInput(value)))}
      />
    </>
  );

  const renderDebtsPage = () => (
    <>
      <PageHeader title="المديونية" onBack={() => dispatch(setPage('main'))} />

      <View style={styles.debtSummaryCard}>
        <View style={styles.moneySummaryRow}>
          <Text style={[styles.moneySummaryValue, styles.negativeValue]}>
            {debtsSummary.totalOwe.toFixed(2)} ج.م
          </Text>
          <Text style={styles.moneySummaryLabel}>إجمالي الديون عليّ</Text>
        </View>

        <View style={styles.moneySummaryRow}>
          <Text style={styles.moneySummaryValue}>{debtsSummary.totalOwedToMe.toFixed(2)} ج.م</Text>
          <Text style={styles.moneySummaryLabel}>إجمالي الديون لي</Text>
        </View>

        <View style={styles.moneySummaryRowLast}>
          <Text style={[styles.moneySummaryValue, styles.warningValue]}>
            {debtsSummary.totalOverdue.toFixed(2)} ج.م
          </Text>
          <Text style={styles.moneySummaryLabel}>المتأخر</Text>
        </View>
      </View>

      <View style={styles.debtCard}>
        <Text style={styles.sectionTitle}>إضافة دين جديد</Text>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>الاسم</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم الشخص أو الجهة"
              value={debtForm.personName}
              onChangeText={value => dispatch(setDebtPersonName(value))}
            />
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={debtForm.totalAmountText}
              onChangeText={value => dispatch(setDebtTotalAmountText(sanitizeAmountInput(value)))}
            />
          </View>
        </View>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>نوع الدين</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={debtForm.direction}
                onValueChange={itemValue =>
                  dispatch(setDebtDirection(itemValue as 'owe' | 'owedToMe'))
                }>
                <Picker.Item label={DEBT_DIRECTION_LABELS.owe} value="owe" />
                <Picker.Item label={DEBT_DIRECTION_LABELS.owedToMe} value="owedToMe" />
              </Picker>
            </View>
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>تاريخ الاستحقاق</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDebtDueDatePicker(true)}>
              <Text style={styles.datePickerBtnText}>{formatDate(debtDueDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={styles.input}
            placeholder="ملاحظة اختيارية"
            value={debtForm.notes}
            onChangeText={value => dispatch(setDebtNotes(value))}
          />
        </View>

        <View style={styles.inlineRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={submitDebt}>
            <Text style={styles.btnText}>حفظ الدين</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => dispatch(resetDebtForms())}>
            <Text style={styles.btnText}>تفريغ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDebtDueDatePicker ? (
        <DateTimePicker
          value={debtDueDate}
          mode="date"
          display="default"
          onChange={onChangeDebtDueDate}
        />
      ) : null}

      <View style={styles.debtCard}>
        <Text style={styles.sectionTitle}>تسجيل حركة دين</Text>

        {debts.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد ديون بعد.</Text>
        ) : (
          <>
            <View style={styles.compactField}>
              <Text style={styles.label}>اختيار الدين</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={debtTransactionForm.selectedDebtId}
                  onValueChange={itemValue =>
                    dispatch(setDebtTransactionDebtId(String(itemValue)))
                  }>
                  {debts.map(item => (
                    <Picker.Item
                      key={item.id}
                      label={`${item.personName} (${item.remainingAmount.toFixed(2)} ج.م)`}
                      value={item.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.compactFieldsRow}>
              <View style={styles.compactField}>
                <Text style={styles.label}>المبلغ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={debtTransactionForm.amountText}
                  onChangeText={value =>
                    dispatch(setDebtTransactionAmountText(sanitizeAmountInput(value)))
                  }
                />
              </View>

              <View style={styles.compactField}>
                <Text style={styles.label}>وسيلة الحركة</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={debtTransactionForm.paymentMethod}
                    onValueChange={itemValue =>
                      dispatch(
                        setDebtTransactionPaymentMethod(
                          itemValue as 'cash' | 'bank' | 'wallet',
                        ),
                      )
                    }>
                    {PAYMENT_METHODS.map(method => (
                      <Picker.Item
                        key={method}
                        label={PAYMENT_METHOD_LABELS[method]}
                        value={method}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={submitDebtTransaction}>
              <Text style={styles.btnText}>
                {selectedDebt?.direction === 'owe' ? 'تسجيل سداد' : 'تسجيل تحصيل'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.debtCard}>
        <Text style={styles.sectionTitle}>قائمة الديون</Text>

        {debts.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد ديون مسجلة.</Text>
        ) : (
          debts.map(item => (
            <View key={item.id} style={styles.debtItem}>
              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{item.personName}</Text>
                <Text style={styles.debtItemLabel}>الاسم</Text>
              </View>

              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{DEBT_DIRECTION_LABELS[item.direction]}</Text>
                <Text style={styles.debtItemLabel}>النوع</Text>
              </View>

              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{DEBT_STATUS_LABELS[item.status]}</Text>
                <Text style={styles.debtItemLabel}>الحالة</Text>
              </View>

              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{item.totalAmount.toFixed(2)} ج.م</Text>
                <Text style={styles.debtItemLabel}>الإجمالي</Text>
              </View>

              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{item.remainingAmount.toFixed(2)} ج.م</Text>
                <Text style={styles.debtItemLabel}>المتبقي</Text>
              </View>

              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{formatDate(item.dueDateISO)}</Text>
                <Text style={styles.debtItemLabel}>الاستحقاق</Text>
              </View>

              {item.notes ? (
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.notes}</Text>
                  <Text style={styles.debtItemLabel}>ملاحظات</Text>
                </View>
              ) : null}

              <View style={styles.debtItemRow}>
                <Text style={styles.debtItemValue}>{item.transactions.length}</Text>
                <Text style={styles.debtItemLabel}>عدد الحركات</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtnLarge}
                onPress={() => dispatch(deleteDebt(item.id))}>
                <Text style={styles.btnText}>حذف الدين</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
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
      <PieChartCard data={pieDataSelectedMonth} />
    </>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screenGestureLayer} {...edgePanResponder.panHandlers}>
          <ScrollView contentContainerStyle={styles.content}>
            {renderTopNavigationMenu()}
            {page === 'main' ? renderMainPage() : null}
            {page === 'balances' ? renderBalancesPage() : null}
            {page === 'debts' ? renderDebtsPage() : null}
            {page === 'months' ? renderMonthsPage() : null}
            {page === 'monthDetails' ? renderMonthDetailsPage() : null}
          </ScrollView>

          {renderSideNavigationMenu()}
        </View>
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
  screenGestureLayer: {
    flex: 1,
  },
  totalCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  topMenuContainer: {
    position: 'relative',
    zIndex: 10,
    minHeight: 1,
  },
  edgeMenuActivator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    marginTop: -42,
    width: 30,
    height: 84,
    zIndex: 35,
  },
  edgeMenuTapArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    zIndex: 30,
  },
  drawerOverlayTouch: {
    flex: 1,
  },
  sideDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#e2e8f0',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    zIndex: 40,
    paddingTop: 56,
  },
  sideDrawerHeader: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  sideDrawerTitle: {
    color: '#0f172a',
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 20,
  },
  topMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  topMenuItemText: {
    color: '#0f172a',
    textAlign: 'right',
    fontWeight: '600',
  },
  topMenuItemLast: {
    borderBottomWidth: 0,
  },
  totalLabel: {
    color: '#0f4c81',
    fontSize: 14,
    textAlign: 'right',
  },
  totalValue: {
    color: '#0c4a6e',
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
    height: 48,
  },
  datePickerBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  datePickerBtnText: {
    color: '#0f172a',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pickerWrap: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    overflow: 'hidden',
    height: 48,
    justifyContent: 'center',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactFieldsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  compactField: {
    flex: 1,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    flex: 1,
  },
  cancelBtn: {
    marginTop: 6,
    backgroundColor: '#64748b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  debtSummaryCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  debtCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  moneySummaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  moneySummaryRowLast: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  moneySummaryLabel: {
    color: '#334155',
    fontWeight: '600',
  },
  moneySummaryValue: {
    color: '#0f766e',
    fontWeight: '700',
  },
  negativeValue: {
    color: '#dc2626',
  },
  warningValue: {
    color: '#d97706',
  },
  debtItem: {
    backgroundColor: '#ffedd5',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  debtItemRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtItemLabel: {
    color: '#7c2d12',
    fontWeight: '600',
  },
  debtItemValue: {
    color: '#431407',
    fontWeight: '500',
    maxWidth: '70%',
    textAlign: 'right',
  },
  deleteBtnLarge: {
    marginTop: 6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

export default App;
