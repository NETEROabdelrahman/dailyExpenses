import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import ExpensesTableCard from '../../components/ExpensesTableCard';
import PageHeader from '../../components/PageHeader';
import PieChartCard from '../../components/PieChartCard';
import {Expense, PieDatum} from '../../types/expense';
import styles from '../../styles/appStyles';

type MonthDetailsPageProps = {
  selectedMonth: string | null;
  selectedMonthLabel: string;
  totalSelectedMonthExpenses: number;
  selectedMonthExpenses: Expense[];
  pieDataSelectedMonth: PieDatum[];
  pieDataSelectedMonthBySubcategory: Record<string, PieDatum[]>;
  onBack: () => void;
  onSharePdf: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
};

function MonthDetailsPage({
  selectedMonth,
  selectedMonthLabel,
  totalSelectedMonthExpenses,
  selectedMonthExpenses,
  pieDataSelectedMonth,
  pieDataSelectedMonthBySubcategory,
  onBack,
  onSharePdf,
  onEditExpense,
  onDeleteExpense,
}: MonthDetailsPageProps): React.JSX.Element {
  return (
    <>
      <PageHeader
        title={selectedMonth ? selectedMonthLabel : ''}
        onBack={onBack}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>إجمالي الشهر المحدد</Text>
        <Text style={styles.totalValue}>{totalSelectedMonthExpenses.toFixed(2)} ج.م</Text>
      </View>

      <View style={styles.inlineRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onSharePdf}>
          <Text style={styles.btnText}>مشاركة PDF</Text>
        </TouchableOpacity>
      </View>

      <ExpensesTableCard
        items={selectedMonthExpenses}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
      <PieChartCard
        key={selectedMonth ?? 'no-month'}
        data={pieDataSelectedMonth}
        drillDownData={pieDataSelectedMonthBySubcategory}
      />
    </>
  );
}

export default MonthDetailsPage;
