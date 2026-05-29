import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

type MoneySummaryCardProps = {
  initialCashText: string;
  initialBankText: string;
  initialWalletText: string;
  remainingCash: number;
  remainingBank: number;
  remainingWallet: number;
  totalBefore: number;
  totalAfter: number;
  onInitialCashChange: (value: string) => void;
  onInitialBankChange: (value: string) => void;
  onInitialWalletChange: (value: string) => void;
};

function MoneySummaryCard({
  initialCashText,
  initialBankText,
  initialWalletText,
  remainingCash,
  remainingBank,
  remainingWallet,
  totalBefore,
  totalAfter,
  onInitialCashChange,
  onInitialBankChange,
  onInitialWalletChange,
}: MoneySummaryCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>الأرصدة الابتدائية</Text>

      <View style={styles.compactFieldsRow}>
        <View style={styles.compactField}>
          <Text style={styles.label}>النقد المتوفر</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={initialCashText}
            onChangeText={onInitialCashChange}
          />
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>رصيد البنك</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={initialBankText}
            onChangeText={onInitialBankChange}
          />
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>رصيد المحفظة</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={initialWalletText}
            onChangeText={onInitialWalletChange}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>الرصيد المتبقي لكل وسيلة</Text>

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
        <Text style={styles.moneySummaryValue}>{totalBefore.toFixed(2)} ج.م</Text>
        <Text style={styles.moneySummaryLabel}>الإجمالي قبل الحركة</Text>
      </View>

      <View style={styles.moneySummaryRow}>
        <Text
          style={[
            styles.moneySummaryValue,
            totalAfter < 0 ? styles.negativeValue : null,
          ]}>
          {totalAfter.toFixed(2)} ج.م
        </Text>
        <Text style={styles.moneySummaryLabel}>الإجمالي بعد الحركة</Text>
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
  compactFieldsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  compactField: {
    flex: 1,
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
