import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import ExpenseFormCard from '../../components/ExpenseFormCard';
import ExpensesTableCard from '../../components/ExpensesTableCard';
import PieChartCard from '../../components/PieChartCard';
import {Expense, PaymentMethod, PieDatum} from '../../types/expense';
import styles from '../../styles/appStyles';

type MainPageProps = {
  currentPeriodLabel: string;
  currentPeriodStartedText: string;
  currentPeriodSummary: {
    income: number;
    expenses: number;
    debtPayments: number;
    debtCollections: number;
    net: number;
  };
  totalRemainingBalance: number;
  name: string;
  amountText: string;
  expenseDate: Date;
  notes: string;
  selectedCategory: string;
  selectedSubcategory: string;
  selectedPaymentMethod: PaymentMethod;
  newCategory: string;
  newSubcategory: string;
  categories: string[];
  subcategories: string[];
  editingExpenseId: string | null;
  totalAllExpenses: number;
  expenses: Expense[];
  pieDataAll: PieDatum[];
  pieDataAllBySubcategory: Record<string, PieDatum[]>;
  onEndCurrentMonth: () => void;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: Date) => void;
  onNotesChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onSelectedSubcategoryChange: (value: string) => void;
  onSelectedPaymentMethodChange: (value: PaymentMethod) => void;
  onNewCategoryChange: (value: string) => void;
  onNewSubcategoryChange: (value: string) => void;
  onAddCategory: () => void;
  onAddSubcategory: () => void;
  onSubmitExpense: () => void;
  onCancelEdit: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
};

function MainPage({
  currentPeriodLabel,
  currentPeriodStartedText,
  currentPeriodSummary,
  totalRemainingBalance,
  name,
  amountText,
  expenseDate,
  notes,
  selectedCategory,
  selectedSubcategory,
  selectedPaymentMethod,
  newCategory,
  newSubcategory,
  categories,
  subcategories,
  editingExpenseId,
  totalAllExpenses,
  expenses,
  pieDataAll,
  pieDataAllBySubcategory,
  onEndCurrentMonth,
  onNameChange,
  onAmountChange,
  onDateChange,
  onNotesChange,
  onSelectedCategoryChange,
  onSelectedSubcategoryChange,
  onSelectedPaymentMethodChange,
  onNewCategoryChange,
  onNewSubcategoryChange,
  onAddCategory,
  onAddSubcategory,
  onSubmitExpense,
  onCancelEdit,
  onEditExpense,
  onDeleteExpense,
}: MainPageProps): React.JSX.Element {
  return (
    <>
      <ExpenseFormCard
        name={name}
        amountText={amountText}
        expenseDate={expenseDate}
        notes={notes}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        selectedPaymentMethod={selectedPaymentMethod}
        newCategory={newCategory}
        newSubcategory={newSubcategory}
        categories={categories}
        subcategories={subcategories}
        editing={editingExpenseId !== null}
        onNameChange={onNameChange}
        onAmountChange={onAmountChange}
        onDateChange={onDateChange}
        onNotesChange={onNotesChange}
        onSelectedCategoryChange={onSelectedCategoryChange}
        onSelectedSubcategoryChange={onSelectedSubcategoryChange}
        onSelectedPaymentMethodChange={onSelectedPaymentMethodChange}
        onNewCategoryChange={onNewCategoryChange}
        onNewSubcategoryChange={onNewSubcategoryChange}
        onAddCategory={onAddCategory}
        onAddSubcategory={onAddSubcategory}
        onSubmit={onSubmitExpense}
        onCancelEdit={onCancelEdit}
      />

      <View style={styles.totalCard}>
        <View style={styles.periodHeaderRow}>
          <Text style={styles.totalLabel}>{currentPeriodLabel}</Text>
          <TouchableOpacity style={styles.endMonthBtn} onPress={onEndCurrentMonth}>
            <Text style={styles.btnText}>إنهاء الشهر</Text>
          </TouchableOpacity>
        </View>
        {currentPeriodStartedText ? (
          <Text style={styles.periodMetaText}>{currentPeriodStartedText}</Text>
        ) : null}
        <Text style={styles.totalLabel}>إجمالي مصاريف الشهر الحالي</Text>
        <Text style={styles.totalValue}>{totalAllExpenses.toFixed(2)} ج.م</Text>
      </View>

      <View style={styles.monthSummaryCard}>
        <Text style={styles.sectionTitle}>ملخص الشهر الحالي</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{currentPeriodSummary.income.toFixed(2)} ج.م</Text>
            <Text style={styles.summaryLabel}>الوارد</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.negativeValue]}>
              {currentPeriodSummary.expenses.toFixed(2)} ج.م
            </Text>
            <Text style={styles.summaryLabel}>المصاريف</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.negativeValue]}>
              {currentPeriodSummary.debtPayments.toFixed(2)} ج.م
            </Text>
            <Text style={styles.summaryLabel}>سداد الديون</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {currentPeriodSummary.debtCollections.toFixed(2)} ج.م
            </Text>
            <Text style={styles.summaryLabel}>تحصيل الديون</Text>
          </View>
        </View>

        <View style={styles.moneySummaryRow}>
          <Text
            style={[
              styles.moneySummaryValue,
              currentPeriodSummary.net < 0 ? styles.negativeValue : null,
            ]}>
            {currentPeriodSummary.net.toFixed(2)} ج.م
          </Text>
          <Text style={styles.moneySummaryLabel}>صافي حركة الشهر</Text>
        </View>

        <View style={styles.moneySummaryRowLast}>
          <Text
            style={[
              styles.moneySummaryValue,
              totalRemainingBalance < 0 ? styles.negativeValue : null,
            ]}>
            {totalRemainingBalance.toFixed(2)} ج.م
          </Text>
          <Text style={styles.moneySummaryLabel}>الرصيد المتاح الآن</Text>
        </View>
      </View>

      <ExpensesTableCard
        items={expenses}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
      <PieChartCard
        data={pieDataAll}
        drillDownData={pieDataAllBySubcategory}
      />
    </>
  );
}

export default MainPage;
