import React from 'react';
import {Text, View} from 'react-native';
import ExpenseFormCard from '../../components/ExpenseFormCard';
import ExpensesTableCard from '../../components/ExpensesTableCard';
import PieChartCard from '../../components/PieChartCard';
import {Expense, PaymentMethod, PieDatum} from '../../types/expense';
import styles from '../../styles/appStyles';

type MainPageProps = {
  name: string;
  amountText: string;
  expenseDate: Date;
  notes: string;
  selectedCategory: string;
  selectedPaymentMethod: PaymentMethod;
  newCategory: string;
  categories: string[];
  editingExpenseId: string | null;
  totalAllExpenses: number;
  expenses: Expense[];
  pieDataAll: PieDatum[];
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: Date) => void;
  onNotesChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onSelectedPaymentMethodChange: (value: PaymentMethod) => void;
  onNewCategoryChange: (value: string) => void;
  onAddCategory: () => void;
  onSubmitExpense: () => void;
  onCancelEdit: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
};

function MainPage({
  name,
  amountText,
  expenseDate,
  notes,
  selectedCategory,
  selectedPaymentMethod,
  newCategory,
  categories,
  editingExpenseId,
  totalAllExpenses,
  expenses,
  pieDataAll,
  onNameChange,
  onAmountChange,
  onDateChange,
  onNotesChange,
  onSelectedCategoryChange,
  onSelectedPaymentMethodChange,
  onNewCategoryChange,
  onAddCategory,
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
        selectedPaymentMethod={selectedPaymentMethod}
        newCategory={newCategory}
        categories={categories}
        editing={editingExpenseId !== null}
        onNameChange={onNameChange}
        onAmountChange={onAmountChange}
        onDateChange={onDateChange}
        onNotesChange={onNotesChange}
        onSelectedCategoryChange={onSelectedCategoryChange}
        onSelectedPaymentMethodChange={onSelectedPaymentMethodChange}
        onNewCategoryChange={onNewCategoryChange}
        onAddCategory={onAddCategory}
        onSubmit={onSubmitExpense}
        onCancelEdit={onCancelEdit}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>إجمالي كل المصاريف</Text>
        <Text style={styles.totalValue}>{totalAllExpenses.toFixed(2)} ج.م</Text>
      </View>

      <ExpensesTableCard
        items={expenses}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
      <PieChartCard data={pieDataAll} />
    </>
  );
}

export default MainPage;
