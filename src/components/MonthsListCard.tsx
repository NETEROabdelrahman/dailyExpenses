import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AccountingPeriod} from '../types/expense';
import {formatDate, formatPeriodLabel} from '../utils/date';

type MonthsListCardProps = {
  periods: AccountingPeriod[];
  onSelectMonth: (periodId: string) => void;
};

function MonthsListCard({
  periods,
  onSelectMonth,
}: MonthsListCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {periods.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد شهور سابقة حتى الآن</Text>
      ) : (
        periods.map(period => (
          <TouchableOpacity
            key={period.id}
            style={styles.monthRow}
            onPress={() => onSelectMonth(period.id)}>
            <Text style={styles.monthRowArrow}>‹</Text>
            <View style={styles.monthTextWrap}>
              <Text style={styles.monthRowLabel}>
                {formatPeriodLabel(period.startedAtISO)}
              </Text>
              {period.endedAtISO ? (
                <Text style={styles.monthRowMeta}>
                  انتهى في {formatDate(period.endedAtISO)}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fef2f2',
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
  monthTextWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  monthRowMeta: {
    color: '#64748b',
    fontSize: 12,
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
