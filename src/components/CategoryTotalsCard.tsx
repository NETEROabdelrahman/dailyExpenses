import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

type CategoryTotalsCardProps = {
  totals: Record<string, number>;
  categoryLimits: Record<string, number>;
  onLimitChange: (category: string, limitText: string) => void;
};

function CategoryTotalsCard({
  totals,
  categoryLimits,
  onLimitChange,
}: CategoryTotalsCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>إجمالي كل فئة</Text>
      {Object.keys(totals).length === 0 ? (
        <Text style={styles.emptyText}>لا توجد بيانات للفترة المحددة</Text>
      ) : (
        Object.entries(totals).map(([category, total]) => {
          const limit = categoryLimits[category] ?? 0;
          const ratio = limit > 0 ? total / limit : 0;
          const fillWidth = `${Math.min(ratio, 1) * 100}%`;
          const barColor = ratio >= 1 ? '#dc2626' : ratio >= 0.8 ? '#f59e0b' : '#0f766e';

          return (
            <View key={category} style={styles.categoryTotalRowWrap}>
              <View style={styles.categoryTotalRow}>
                <Text style={styles.categoryTotalAmount}>{total.toFixed(2)} ج.م</Text>
                <Text style={styles.categoryTotalName}>{category}</Text>
              </View>

              <View style={styles.limitRow}>
                <TextInput
                  style={styles.limitInput}
                  keyboardType="numeric"
                  placeholder="حد الصرف"
                  value={limit > 0 ? String(limit) : ''}
                  onChangeText={value => onLimitChange(category, value)}
                />
                <Text style={styles.limitLabel}>حد الفئة</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: fillWidth, backgroundColor: barColor}]} />
              </View>
              <Text style={[styles.progressText, ratio >= 1 ? styles.overLimitText : null]}>
                {limit > 0
                  ? `${(ratio * 100).toFixed(0)}% من الحد (${limit.toFixed(2)} ج.م)`
                  : 'بدون حد محدد'}
              </Text>
            </View>
          );
        })
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
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
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
  limitRow: {
    marginTop: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  limitLabel: {
    color: '#334155',
    fontSize: 12,
  },
  limitInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0f172a',
    textAlign: 'right',
  },
  progressTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    marginTop: 6,
    color: '#475569',
    fontSize: 12,
    textAlign: 'right',
  },
  overLimitText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

export default CategoryTotalsCard;
