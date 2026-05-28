import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {formatMonthLabel} from '../utils/date';

type MonthsListCardProps = {
  months: string[];
  onSelectMonth: (month: string) => void;
};

function MonthsListCard({
  months,
  onSelectMonth,
}: MonthsListCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {months.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد شهور سابقة حتى الآن</Text>
      ) : (
        months.map(month => (
          <TouchableOpacity
            key={month}
            style={styles.monthRow}
            onPress={() => onSelectMonth(month)}>
            <Text style={styles.monthRowArrow}>‹</Text>
            <Text style={styles.monthRowLabel}>{formatMonthLabel(month)}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 2,
  },
  monthRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  monthRowLabel: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  monthRowArrow: {
    color: '#64748b',
    fontSize: 24,
    lineHeight: 24,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

export default MonthsListCard;
