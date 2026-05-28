import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type CategoryTotalsCardProps = {
  totals: Record<string, number>;
};

function CategoryTotalsCard({totals}: CategoryTotalsCardProps): React.JSX.Element {
  const safeTotals = totals ?? {};

  return (
    <View style={styles.card}>
      {Object.keys(safeTotals).length === 0 ? (
        <Text style={styles.emptyText}>لا توجد بيانات للفترة المحددة</Text>
      ) : (
        Object.entries(safeTotals).map(([category, total]) => {
          return (
            <View key={category} style={styles.categoryTotalRowWrap}>
              <View style={styles.categoryTotalRow}>
                <Text style={styles.categoryTotalAmount}>{total.toFixed(2)} ج.م</Text>
                <Text style={styles.categoryTotalName}>{category}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fefce8',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 2,
  },
  categoryTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  categoryTotalRowWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  categoryTotalName: {
    color: '#0f172a',
    fontWeight: '600',
  },
  categoryTotalAmount: {
    color: '#0f766e',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

export default CategoryTotalsCard;
