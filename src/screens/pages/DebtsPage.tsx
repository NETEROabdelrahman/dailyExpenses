import React from 'react';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import PageHeader from '../../components/PageHeader';
import {
  DEBT_DIRECTION_LABELS,
  DEBT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from '../../constants/appConstants';
import {Debt, DebtDirection, PaymentMethod} from '../../types/expense';
import {sanitizeAmountInput} from '../../utils/amount';
import {formatDate} from '../../utils/date';
import styles from '../../styles/appStyles';

type DebtSummary = {
  totalOwe: number;
  totalOwedToMe: number;
  totalOverdue: number;
};

type DebtForm = {
  personName: string;
  totalAmountText: string;
  dueDateISO: string;
  notes: string;
  direction: DebtDirection;
};

type DebtTransactionForm = {
  selectedDebtId: string | null;
  amountText: string;
  paymentMethod: PaymentMethod;
};

type DebtsPageProps = {
  debtsSummary: DebtSummary;
  debtForm: DebtForm;
  debtDueDate: Date;
  showDebtDueDatePicker: boolean;
  selectableDebts: Debt[];
  debtTransactionForm: DebtTransactionForm;
  selectedDebt: Debt | null;
  debts: Debt[];
  onBack: () => void;
  onDebtPersonNameChange: (value: string) => void;
  onDebtTotalAmountChange: (value: string) => void;
  onDebtDirectionChange: (value: DebtDirection) => void;
  onShowDebtDueDatePicker: () => void;
  onChangeDebtDueDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onDebtNotesChange: (value: string) => void;
  onSubmitDebt: () => void;
  onResetDebtForms: () => void;
  onSelectDebt: (debtId: string) => void;
  onDebtTransactionAmountChange: (value: string) => void;
  onDebtTransactionPaymentMethodChange: (value: PaymentMethod) => void;
  onSubmitDebtTransaction: () => void;
  onDeleteDebt: (debtId: string) => void;
};

const DEBT_ITEM_BG_SETTLED = '#dcfce7';
const DEBT_ITEM_BG_PARTIAL = '#fef9c3';
const DEBT_ITEM_BG_NEVER_PAID = '#fee2e2';
const DEBT_ITEM_BG_OWED_TO_ME = '#dbeafe';

function DebtsPage({
  debtsSummary,
  debtForm,
  debtDueDate,
  showDebtDueDatePicker,
  selectableDebts,
  debtTransactionForm,
  selectedDebt,
  debts,
  onBack,
  onDebtPersonNameChange,
  onDebtTotalAmountChange,
  onDebtDirectionChange,
  onShowDebtDueDatePicker,
  onChangeDebtDueDate,
  onDebtNotesChange,
  onSubmitDebt,
  onResetDebtForms,
  onSelectDebt,
  onDebtTransactionAmountChange,
  onDebtTransactionPaymentMethodChange,
  onSubmitDebtTransaction,
  onDeleteDebt,
}: DebtsPageProps): React.JSX.Element {
  return (
    <>
      <PageHeader title="المديونية" onBack={onBack} />

      <View style={styles.debtSummaryCard}>
        <View style={styles.moneySummaryRow}>
          <Text style={[styles.moneySummaryValue, styles.negativeValue]}>
            {debtsSummary.totalOwe.toFixed(2)} ج.م
          </Text>
          <Text style={styles.moneySummaryLabel}>إجمالي الديون عليّ</Text>
        </View>

        <View style={styles.moneySummaryRow}>
          <Text style={styles.moneySummaryValue}>{debtsSummary.totalOwedToMe.toFixed(2)} ج.م</Text>
          <Text style={styles.moneySummaryLabel}>إجمالي الديون لي</Text>
        </View>

        <View style={styles.moneySummaryRowLast}>
          <Text style={[styles.moneySummaryValue, styles.warningValue]}>
            {debtsSummary.totalOverdue.toFixed(2)} ج.م
          </Text>
          <Text style={styles.moneySummaryLabel}>المتأخر</Text>
        </View>
      </View>

      <View style={styles.debtCard}>
        <Text style={styles.sectionTitle}>إضافة دين جديد</Text>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>الاسم</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم الشخص أو الجهة"
              value={debtForm.personName}
              onChangeText={onDebtPersonNameChange}
            />
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={debtForm.totalAmountText}
              onChangeText={value => onDebtTotalAmountChange(sanitizeAmountInput(value))}
            />
          </View>
        </View>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>نوع الدين</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={debtForm.direction}
                onValueChange={itemValue =>
                  onDebtDirectionChange(itemValue as DebtDirection)
                }>
                <Picker.Item label={DEBT_DIRECTION_LABELS.owe} value="owe" />
                <Picker.Item label={DEBT_DIRECTION_LABELS.owedToMe} value="owedToMe" />
              </Picker>
            </View>
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>تاريخ الاستحقاق</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={onShowDebtDueDatePicker}>
              <Text style={styles.datePickerBtnText}>{formatDate(debtDueDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.compactField}>
          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={styles.input}
            placeholder="ملاحظة اختيارية"
            value={debtForm.notes}
            onChangeText={onDebtNotesChange}
          />
        </View>

        <View style={styles.inlineRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onSubmitDebt}>
            <Text style={styles.btnText}>حفظ الدين</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onResetDebtForms}>
            <Text style={styles.btnText}>تفريغ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDebtDueDatePicker ? (
        <DateTimePicker
          value={debtDueDate}
          mode="date"
          display="default"
          onChange={onChangeDebtDueDate}
        />
      ) : null}

      <View style={styles.debtCard}>
        <Text style={styles.sectionTitle}>تسجيل حركة دين</Text>

        {selectableDebts.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد ديون غير مسددة حالياً.</Text>
        ) : (
          <>
            <View style={styles.compactField}>
              <Text style={styles.label}>اختيار الدين</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={debtTransactionForm.selectedDebtId}
                  onValueChange={itemValue => onSelectDebt(String(itemValue))}>
                  {selectableDebts.map(item => (
                    <Picker.Item
                      key={item.id}
                      label={`${item.personName} (${item.remainingAmount.toFixed(2)} ج.م)`}
                      value={item.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.compactFieldsRow}>
              <View style={styles.compactField}>
                <Text style={styles.label}>المبلغ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={debtTransactionForm.amountText}
                  onChangeText={value =>
                    onDebtTransactionAmountChange(sanitizeAmountInput(value))
                  }
                />
              </View>

              <View style={styles.compactField}>
                <Text style={styles.label}>وسيلة الحركة</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={debtTransactionForm.paymentMethod}
                    onValueChange={itemValue =>
                      onDebtTransactionPaymentMethodChange(itemValue as PaymentMethod)
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

            <TouchableOpacity style={styles.primaryBtn} onPress={onSubmitDebtTransaction}>
              <Text style={styles.btnText}>
                {selectedDebt?.direction === 'owe' ? 'تسجيل سداد' : 'تسجيل تحصيل'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.debtCard}>
        <Text style={styles.sectionTitle}>قائمة الديون</Text>

        {debts.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد ديون مسجلة.</Text>
        ) : (
          debts.map(item => {
            const isOwedToMe = item.direction === 'owedToMe';
            const isSettled = item.remainingAmount <= 0;
            const hasTransactions = item.transactions.length > 0;
            const debtItemBackgroundColor = isOwedToMe
              ? DEBT_ITEM_BG_OWED_TO_ME
              : isSettled
                ? DEBT_ITEM_BG_SETTLED
                : hasTransactions
                  ? DEBT_ITEM_BG_PARTIAL
                  : DEBT_ITEM_BG_NEVER_PAID;

            return (
              <View
                key={item.id}
                style={[styles.debtItem, {backgroundColor: debtItemBackgroundColor}]}> 
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.personName}</Text>
                  <Text style={styles.debtItemLabel}>الاسم</Text>
                </View>

                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{DEBT_DIRECTION_LABELS[item.direction]}</Text>
                  <Text style={styles.debtItemLabel}>النوع</Text>
                </View>

                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{DEBT_STATUS_LABELS[item.status]}</Text>
                  <Text style={styles.debtItemLabel}>الحالة</Text>
                </View>

                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.totalAmount.toFixed(2)} ج.م</Text>
                  <Text style={styles.debtItemLabel}>الإجمالي</Text>
                </View>

                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.remainingAmount.toFixed(2)} ج.م</Text>
                  <Text style={styles.debtItemLabel}>المتبقي</Text>
                </View>

                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{formatDate(item.dueDateISO)}</Text>
                  <Text style={styles.debtItemLabel}>الاستحقاق</Text>
                </View>

                {item.notes ? (
                  <View style={styles.debtItemRow}>
                    <Text style={styles.debtItemValue}>{item.notes}</Text>
                    <Text style={styles.debtItemLabel}>ملاحظات</Text>
                  </View>
                ) : null}

                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.transactions.length}</Text>
                  <Text style={styles.debtItemLabel}>عدد الحركات</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtnLarge}
                  onPress={() => {
                    Alert.alert('تأكيد الحذف', 'هل تريد حذف هذا الدين؟', [
                      {text: 'إلغاء', style: 'cancel'},
                      {
                        text: 'حذف',
                        style: 'destructive',
                        onPress: () => onDeleteDebt(item.id),
                      },
                    ]);
                  }}>
                  <Text style={styles.btnText}>حذف الدين</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

export default DebtsPage;
