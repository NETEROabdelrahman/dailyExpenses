import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {PAYMENT_METHOD_LABELS, PAYMENT_METHODS} from '../constants/appConstants';
import {PaymentMethod} from '../types/expense';
import {formatDate} from '../utils/date';

type ExpenseFormCardProps = {
  name: string;
  amountText: string;
  expenseDate: Date;
  notes: string;
  selectedCategory: string;
  selectedPaymentMethod: PaymentMethod;
  newCategory: string;
  categories: string[];
  editing: boolean;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: Date) => void;
  onNotesChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onSelectedPaymentMethodChange: (value: PaymentMethod) => void;
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
  selectedPaymentMethod,
  newCategory,
  categories,
  editing,
  onNameChange,
  onAmountChange,
  onDateChange,
  onNotesChange,
  onSelectedCategoryChange,
  onSelectedPaymentMethodChange,
  onNewCategoryChange,
  onAddCategory,
  onSubmit,
  onCancelEdit,
}: ExpenseFormCardProps): React.JSX.Element {
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      <View style={styles.compactFieldsRow}>
        <View style={styles.compactField}>
          <Text style={styles.label}>اسم المصروف</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: وجبة غداء"
            value={name}
            onChangeText={onNameChange}
          />
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={[styles.input, styles.compactNotesInput]}
            placeholder="أي ملاحظة"
            value={notes}
            onChangeText={onNotesChange}
          />
        </View>
      </View>

      <View style={styles.compactFieldsRow}>
        <View style={styles.compactField}>
          <Text style={styles.label}>السعر</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={amountText}
            onChangeText={sanitizeAmountInput}
          />
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>التاريخ</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerBtnText}>{formatDate(expenseDate.toISOString())}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>الفئة</Text>
          <View style={styles.pickerWrap}>
            <Picker
              style={styles.compactPicker}
              selectedValue={selectedCategory}
              onValueChange={itemValue => onSelectedCategoryChange(String(itemValue))}>
              {categories.map(cat => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.compactFieldsRow}>
        <View style={styles.compactField}>
          <Text style={styles.label}>طريقة الدفع</Text>
          <View style={styles.pickerWrap}>
            <Picker
              style={styles.compactPicker}
              selectedValue={selectedPaymentMethod}
              onValueChange={itemValue =>
                onSelectedPaymentMethodChange(itemValue as PaymentMethod)
              }>
              {PAYMENT_METHODS.map(method => (
                <Picker.Item
                  key={method}
                  label={PAYMENT_METHOD_LABELS[method]}
                  value={method}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      {showDatePicker ? (
        <DateTimePicker
          value={expenseDate}
          mode="date"
          display="default"
          onChange={onChangeExpenseDate}
        />
      ) : null}

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
  compactControl: {
    height: 48,
  },
  card: {
    backgroundColor: '#fff4e8',
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
    height: 48,
  },
  datePickerBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
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
    height: 48,
    justifyContent: 'center',
  },
  compactPicker: {
    height: 48,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactFieldsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  compactField: {
    flex: 1,
  },
  flexInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 62,
    textAlignVertical: 'top',
  },
  compactNotesInput: {
    height: 48,
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
