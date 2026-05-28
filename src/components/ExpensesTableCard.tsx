import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Expense} from '../types/expense';
import {formatDate} from '../utils/date';

const MAX_VISIBLE_ROWS = 8;
const TABLE_ROW_ESTIMATED_HEIGHT = 44;

type ExpensesTableCardProps = {
  items: Expense[];
  onEdit: (item: Expense) => void;
  onDelete: (expenseId: string) => void;
};

function ExpensesTableCard({
  items,
  onEdit,
  onDelete,
}: ExpensesTableCardProps): React.JSX.Element {
  const confirmDelete = (expenseId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المصروف؟', [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => onDelete(expenseId),
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>لا توجد مصاريف</Text>
            </View>
          ) : items.length > MAX_VISIBLE_ROWS ? (
            <ScrollView
              style={styles.tableBodyScrollable}
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {items.map(item => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.cell}>{item.name}</Text>
                  <Text style={styles.cell}>{item.amount.toFixed(2)}</Text>
                  <Text style={styles.cell}>{formatDate(item.dateISO)}</Text>
                  <Text style={styles.cell}>{item.category}</Text>
                  <Text style={styles.cell}>{item.notes || '-'}</Text>
                  <View style={[styles.cell, styles.actionsCell]}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onEdit(item)}>
                      <Text style={styles.actionBtnText}>تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(item.id)}>
                      <Text style={styles.actionBtnText}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            items.map(item => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.amount.toFixed(2)}</Text>
                <Text style={styles.cell}>{formatDate(item.dateISO)}</Text>
                <Text style={styles.cell}>{item.category}</Text>
                <Text style={styles.cell}>{item.notes || '-'}</Text>
                <View style={[styles.cell, styles.actionsCell]}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => onEdit(item)}>
                    <Text style={styles.actionBtnText}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(item.id)}>
                    <Text style={styles.actionBtnText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableBodyScrollable: {
    maxHeight: MAX_VISIBLE_ROWS * TABLE_ROW_ESTIMATED_HEIGHT,
  },
  cell: {
    minWidth: 120,
    maxWidth: 180,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#334155',
    textAlign: 'right',
  },
  actionsCell: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  editBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    padding: 14,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

export default ExpensesTableCard;
