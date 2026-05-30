import React from 'react';
import {Text, View} from 'react-native';
import ExpensesTableCard from '../../components/ExpensesTableCard';
import PageHeader from '../../components/PageHeader';
import PieChartCard from '../../components/PieChartCard';
import {Expense, PieDatum} from '../../types/expense';
import {formatMonthLabel} from '../../utils/date';
import styles from '../../styles/appStyles';

type MonthDetailsPageProps = {
  selectedMonth: string | null;
  totalSelectedMonthExpenses: number;
  selectedMonthExpenses: Expense[];
  pieDataSelectedMonth: PieDatum[];
  onBack: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
};

function MonthDetailsPage({
  selectedMonth,
  totalSelectedMonthExpenses,
  selectedMonthExpenses,
  pieDataSelectedMonth,
  onBack,
  onEditExpense,
  onDeleteExpense,
}: MonthDetailsPageProps): React.JSX.Element {
  return (
    <>
      <PageHeader
        title={selectedMonth ? formatMonthLabel(selectedMonth) : ''}
        onBack={onBack}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>إجمالي الشهر المحدد</Text>
        <Text style={styles.totalValue}>{totalSelectedMonthExpenses.toFixed(2)} ج.م</Text>
      </View>

      <ExpensesTableCard
        items={selectedMonthExpenses}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
      <PieChartCard data={pieDataSelectedMonth} />
    </>
  );
}

export default MonthDetailsPage;
