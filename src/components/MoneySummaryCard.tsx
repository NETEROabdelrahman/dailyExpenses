import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type MoneySummaryCardProps = {
  remainingCash: number;
  remainingBank: number;
  remainingWallet: number;
  totalBalance: number;
};

function MoneySummaryCard({
  remainingCash,
  remainingBank,
  remainingWallet,
  totalBalance,
}: MoneySummaryCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>الأرصدة الحالية</Text>

      <View style={styles.moneySummaryRow}>
        <Text style={styles.moneySummaryValue}>{remainingCash.toFixed(2)} ج.م</Text>
        <Text style={styles.moneySummaryLabel}>النقد المتوفر</Text>
      </View>

      <View style={styles.moneySummaryRow}>
        <Text style={styles.moneySummaryValue}>{remainingBank.toFixed(2)} ج.م</Text>
        <Text style={styles.moneySummaryLabel}>رصيد البنك</Text>
      </View>

      <View style={styles.moneySummaryRow}>
        <Text style={styles.moneySummaryValue}>{remainingWallet.toFixed(2)} ج.م</Text>
        <Text style={styles.moneySummaryLabel}>رصيد المحفظة</Text>
      </View>

      <View style={styles.moneySummaryRow}>
        <Text
          style={[
            styles.moneySummaryValue,
            totalBalance < 0 ? styles.negativeValue : null,
          ]}>
          {totalBalance.toFixed(2)} ج.م
        </Text>
        <Text style={styles.moneySummaryLabel}>الإجمالي</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  moneySummaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
});

export default MoneySummaryCard;
