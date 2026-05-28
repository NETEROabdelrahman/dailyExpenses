import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {formatDate} from '../utils/date';

type ExpenseFormCardProps = {
  name: string;
  amountText: string;
  expenseDate: Date;
  notes: string;
  selectedCategory: string;
  newCategory: string;
  categories: string[];
  editing: boolean;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: Date) => void;
  onNotesChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onNewCategoryChange: (value: string) => void;
  onAddCategory: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

function ExpenseFormCard({
  name,
  amountText,
  expenseDate,
  notes,
  selectedCategory,
  newCategory,
  categories,
  editing,
  onNameChange,
  onAmountChange,
  onDateChange,
  onNotesChange,
  onSelectedCategoryChange,
  onNewCategoryChange,
  onAddCategory,
  onSubmit,
  onCancelEdit,
}: ExpenseFormCardProps): React.JSX.Element {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const keypadRows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', '←'],
  ];

  const applyAmountKey = (key: string) => {
    if (key === '←') {
      onAmountChange(amountText.slice(0, -1));
      return;
    }

    if (key === '.') {
      if (amountText.includes('.')) {
        return;
      }
      onAmountChange(amountText ? `${amountText}.` : '0.');
      return;
    }

    const next = `${amountText}${key}`;
    if (!/^\d*(\.\d{0,2})?$/.test(next)) {
      return;
    }

    onAmountChange(next);
  };

  const sanitizeAmountInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const [whole = '', decimal = ''] = cleaned.split('.');
    const limitedDecimal = decimal.slice(0, 2);
    const normalized = cleaned.includes('.')
      ? `${whole}.${limitedDecimal}`
      : whole;
    onAmountChange(normalized);
  };

  const onChangeExpenseDate = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(false);

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    onDateChange(selectedDate);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>اسم المصروف</Text>
      <TextInput
        style={styles.input}
        placeholder="مثال: وجبة غداء"
        value={name}
        onChangeText={onNameChange}
      />

      <Text style={styles.label}>السعر</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="numeric"
        value={amountText}
        onChangeText={sanitizeAmountInput}
      />
      <View style={styles.keypadCard}>
        {keypadRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.keypadRow}>
            {row.map(key => (
              <TouchableOpacity
                key={key}
                style={[styles.keypadBtn, key === '←' ? styles.keypadBackspace : null]}
                onPress={() => applyAmountKey(key)}>
                <Text style={styles.keypadBtnText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={styles.keypadClearBtn} onPress={() => onAmountChange('')}>
          <Text style={styles.btnText}>مسح</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>التاريخ</Text>
      <TouchableOpacity
        style={styles.datePickerBtn}
        onPress={() => setShowDatePicker(true)}>
        <Text style={styles.datePickerBtnText}>{formatDate(expenseDate.toISOString())}</Text>
      </TouchableOpacity>
      {showDatePicker ? (
        <DateTimePicker
          value={expenseDate}
          mode="date"
          display="default"
          onChange={onChangeExpenseDate}
        />
      ) : null}

      <Text style={styles.label}>الفئة (Category)</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={itemValue => onSelectedCategoryChange(String(itemValue))}>
          {categories.map(cat => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="إضافة فئة جديدة"
          value={newCategory}
          onChangeText={onNewCategoryChange}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={onAddCategory}>
          <Text style={styles.btnText}>إضافة فئة</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>ملاحظات</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="أي ملاحظة"
        value={notes}
        onChangeText={onNotesChange}
        multiline
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.btnText}>{editing ? 'تحديث المصروف' : 'إضافة المصروف'}</Text>
      </TouchableOpacity>
      {editing ? (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancelEdit}>
          <Text style={styles.btnText}>إلغاء التعديل</Text>
        </TouchableOpacity>
      ) : null}
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
  datePickerBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerBtnText: {
    color: '#0f172a',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pickerWrap: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    overflow: 'hidden',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexInput: {
    flex: 1,
  },
  keypadCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  keypadRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  keypadBtn: {
    flex: 1,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  keypadBackspace: {
    backgroundColor: '#bfdbfe',
  },
  keypadBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  keypadClearBtn: {
    marginTop: 2,
    backgroundColor: '#64748b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  notesInput: {
    minHeight: 62,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cancelBtn: {
    backgroundColor: '#64748b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ExpenseFormCard;
