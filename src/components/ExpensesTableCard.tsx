import React, {useMemo, useRef, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {getCategoryColor, getCategoryTint} from '../constants/appConstants';
import {Expense} from '../types/expense';
import {formatDate} from '../utils/date';

const MAX_VISIBLE_ROWS = 8;
const TABLE_ROW_ESTIMATED_HEIGHT = 44;

type ExpensesTableCardProps = {
  items: Expense[];
  onEdit: (item: Expense) => void;
  onDelete: (expenseId: string) => void;
};

type SortKey = 'name' | 'amount' | 'dateISO' | 'category' | 'notes';
type SortDirection = 'asc' | 'desc';

function ExpensesTableCard({
  items,
  onEdit,
  onDelete,
}: ExpensesTableCardProps): React.JSX.Element {
  const horizontalScrollRef = useRef<ScrollView | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedItems = useMemo(() => {
    if (!sortKey) {
      return items;
    }

    const sorted = [...items].sort((first, second) => {
      switch (sortKey) {
        case 'amount':
          return first.amount - second.amount;
        case 'dateISO':
          return new Date(first.dateISO).getTime() - new Date(second.dateISO).getTime();
        case 'category':
          return first.category.localeCompare(second.category, 'ar');
        case 'notes':
          return (first.notes || '').localeCompare(second.notes || '', 'ar');
        case 'name':
        default:
          return first.name.localeCompare(second.name, 'ar');
      }
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [items, sortDirection, sortKey]);

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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const getSortArrow = (key: SortKey): string => {
    if (sortKey !== key) {
      return '↕';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const renderTableRow = (item: Expense) => {
    const categoryColor = getCategoryColor(item.category);

    return (
      <View
        key={item.id}
        style={[styles.tableRow, {backgroundColor: getCategoryTint(item.category)}]}>
        <View style={[styles.categoryStripe, {backgroundColor: categoryColor}]} />
        <Text style={styles.cell}>{item.name}</Text>
        <Text style={styles.cell}>{item.amount.toFixed(2)}</Text>
        <Text style={styles.cell}>{formatDate(item.dateISO)}</Text>
        <Text style={[styles.cell, styles.categoryCell, {color: categoryColor}]}>
          {item.category}
        </Text>
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
    );
  };

  return (
    <View style={styles.card}>
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => {
          horizontalScrollRef.current?.scrollToEnd({animated: false});
        }}>
        <View>
          {sortedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>لا توجد مصاريف</Text>
            </View>
          ) : (
            <View style={styles.tableHeaderRow}>
              <View style={styles.categoryStripePlaceholder} />
              <TouchableOpacity
                style={[styles.headerSortCell, styles.cell]}
                onPress={() => toggleSort('name')}>
                <Text style={styles.headerSortText}>الاسم {getSortArrow('name')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerSortCell, styles.cell]}
                onPress={() => toggleSort('amount')}>
                <Text style={styles.headerSortText}>المبلغ {getSortArrow('amount')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerSortCell, styles.cell]}
                onPress={() => toggleSort('dateISO')}>
                <Text style={styles.headerSortText}>التاريخ {getSortArrow('dateISO')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerSortCell, styles.cell]}
                onPress={() => toggleSort('category')}>
                <Text style={styles.headerSortText}>الفئة {getSortArrow('category')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerSortCell, styles.cell]}
                onPress={() => toggleSort('notes')}>
                <Text style={styles.headerSortText}>ملاحظات {getSortArrow('notes')}</Text>
              </TouchableOpacity>
              <View style={[styles.cell, styles.actionsHeaderCell]}>
                <Text style={styles.actionsHeaderText}>الإجراءات</Text>
              </View>
            </View>
          )}

          {sortedItems.length > 0 && (sortedItems.length > MAX_VISIBLE_ROWS ? (
            <ScrollView
              style={styles.tableBodyScrollable}
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {sortedItems.map(renderTableRow)}
            </ScrollView>
          ) : (
            sortedItems.map(renderTableRow)
          ))}
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  tableHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
    backgroundColor: '#dbeafe',
  },
  categoryStripe: {
    width: 6,
    alignSelf: 'stretch',
  },
  categoryStripePlaceholder: {
    width: 6,
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
  headerSortCell: {
    justifyContent: 'center',
  },
  headerSortText: {
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
  },
  categoryCell: {
    fontWeight: '700',
  },
  actionsCell: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionsHeaderCell: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionsHeaderText: {
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
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
