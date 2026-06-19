import React from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import MoneySummaryCard from '../../components/MoneySummaryCard';
import PageHeader from '../../components/PageHeader';
import {
  INCOMING_MONEY_SOURCE_LABELS,
  INCOMING_MONEY_SOURCES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from '../../constants/appConstants';
import {
  BalanceTransaction,
  IncomingMoneySourceType,
  PaymentMethod,
} from '../../types/expense';
import {sanitizeAmountInput} from '../../utils/amount';
import {formatDate} from '../../utils/date';
import styles from '../../styles/appStyles';

type BalancesIncomingForm = {
  amountText: string;
  paymentMethod: PaymentMethod;
  sourceType: IncomingMoneySourceType;
  sourceOtherText: string;
};

type BalancesTransferForm = {
  amountText: string;
  fromPaymentMethod: PaymentMethod;
  toPaymentMethod: PaymentMethod;
  notes: string;
};

type BalancesPageProps = {
  remainingCash: number;
  remainingBank: number;
  remainingWallet: number;
  totalBalance: number;
  incomingForm: BalancesIncomingForm;
  transferForm: BalancesTransferForm;
  balanceTransactions: BalanceTransaction[];
  customIncomingSources: string[];
  onBack: () => void;
  onIncomingAmountChange: (value: string) => void;
  onIncomingPaymentMethodChange: (value: PaymentMethod) => void;
  onIncomingSourceTypeChange: (value: IncomingMoneySourceType) => void;
  onIncomingSourceOtherTextChange: (value: string) => void;
  onAddCustomIncomingSource: () => void;
  onSubmitIncomingMoney: () => void;
  onTransferAmountChange: (value: string) => void;
  onTransferFromPaymentMethodChange: (value: PaymentMethod) => void;
  onTransferToPaymentMethodChange: (value: PaymentMethod) => void;
  onTransferNotesChange: (value: string) => void;
  onSubmitTransfer: () => void;
  onResetTransfer: () => void;
  onDeleteIncomingTransaction: (transactionId: string) => void;
};

function BalancesPage({
  remainingCash,
  remainingBank,
  remainingWallet,
  totalBalance,
  incomingForm,
  transferForm,
  balanceTransactions,
  customIncomingSources,
  onBack,
  onIncomingAmountChange,
  onIncomingPaymentMethodChange,
  onIncomingSourceTypeChange,
  onIncomingSourceOtherTextChange,
  onAddCustomIncomingSource,
  onSubmitIncomingMoney,
  onTransferAmountChange,
  onTransferFromPaymentMethodChange,
  onTransferToPaymentMethodChange,
  onTransferNotesChange,
  onSubmitTransfer,
  onResetTransfer,
  onDeleteIncomingTransaction,
}: BalancesPageProps): React.JSX.Element {
  const getBalanceTransactionTypeLabel = (type: BalanceTransaction['type']) => {
    switch (type) {
      case 'expense':
        return 'مصروف';
      case 'incoming':
        return 'وارد';
      case 'debtPayment':
        return 'سداد دين';
      case 'debtCollection':
        return 'تحصيل دين';
      case 'transferOut':
        return 'تحويل صادر';
      case 'transferIn':
        return 'تحويل وارد';
      case 'manualAdjustment':
      default:
        return 'تعديل رصيد';
    }
  };

  return (
    <>
      <PageHeader title="الأرصدة المتاحة" onBack={onBack} />

      <MoneySummaryCard
        remainingCash={remainingCash}
        remainingBank={remainingBank}
        remainingWallet={remainingWallet}
        totalBalance={totalBalance}
      />

      <View style={styles.balanceActionCard}>
        <Text style={styles.sectionTitle}>إضافة مبلغ وارد</Text>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={incomingForm.amountText}
              onChangeText={value => onIncomingAmountChange(sanitizeAmountInput(value))}
            />
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>إلى أي رصيد</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={incomingForm.paymentMethod}
                onValueChange={itemValue =>
                  onIncomingPaymentMethodChange(itemValue as PaymentMethod)
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

        <View style={styles.compactField}>
          <Text style={styles.label}>مصدر المبلغ</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={incomingForm.sourceType}
              onValueChange={itemValue =>
                onIncomingSourceTypeChange(itemValue as IncomingMoneySourceType)
              }>
              {INCOMING_MONEY_SOURCES.map(source => (
                <Picker.Item
                  key={source}
                  label={INCOMING_MONEY_SOURCE_LABELS[source]}
                  value={source}
                />
              ))}
            </Picker>
          </View>
        </View>

        {incomingForm.sourceType === 'other' ? (
          <View style={styles.customSourceCard}>
            {customIncomingSources.length > 0 ? (
              <View style={styles.compactField}>
                <Text style={styles.label}>مصدر مخصص محفوظ</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={incomingForm.sourceOtherText}
                    onValueChange={itemValue =>
                      onIncomingSourceOtherTextChange(String(itemValue))
                    }>
                    <Picker.Item label="اختر مصدر محفوظ" value="" />
                    {customIncomingSources.map(source => (
                      <Picker.Item key={source} label={source} value={source} />
                    ))}
                  </Picker>
                </View>
              </View>
            ) : null}

            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="مثال: بيع أغراض"
                value={incomingForm.sourceOtherText}
                onChangeText={onIncomingSourceOtherTextChange}
              />
              <TouchableOpacity style={styles.secondaryBtn} onPress={onAddCustomIncomingSource}>
                <Text style={styles.btnText}>حفظ المصدر</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmitIncomingMoney}>
          <Text style={styles.btnText}>إضافة المبلغ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceActionCard}>
        <Text style={styles.sectionTitle}>تحويل بين الأرصدة</Text>

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>من رصيد</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={transferForm.fromPaymentMethod}
                onValueChange={itemValue =>
                  onTransferFromPaymentMethodChange(itemValue as PaymentMethod)
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

          <View style={styles.compactField}>
            <Text style={styles.label}>إلى رصيد</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={transferForm.toPaymentMethod}
                onValueChange={itemValue =>
                  onTransferToPaymentMethodChange(itemValue as PaymentMethod)
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

        <View style={styles.compactFieldsRow}>
          <View style={styles.compactField}>
            <Text style={styles.label}>المبلغ</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={transferForm.amountText}
              onChangeText={value => onTransferAmountChange(sanitizeAmountInput(value))}
            />
          </View>

          <View style={styles.compactField}>
            <Text style={styles.label}>ملاحظة</Text>
            <TextInput
              style={styles.input}
              placeholder="اختياري"
              value={transferForm.notes}
              onChangeText={onTransferNotesChange}
            />
          </View>
        </View>

        <View style={styles.inlineRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onSubmitTransfer}>
            <Text style={styles.btnText}>تنفيذ التحويل</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onResetTransfer}>
            <Text style={styles.btnText}>تفريغ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceActionCard}>
        <Text style={styles.sectionTitle}>آخر حركات الرصيد</Text>

        {balanceTransactions.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد حركات رصيد حتى الآن.</Text>
        ) : (
          balanceTransactions.slice(0, 10).map(item => {
            const amountText =
              item.amount >= 0
                ? `+${item.amount.toFixed(2)} ج.م`
                : `${item.amount.toFixed(2)} ج.م`;

            return (
              <View key={item.id} style={styles.balanceHistoryItem}>
                <View style={styles.debtItemRow}>
                  <Text
                    style={[
                      styles.debtItemValue,
                      item.amount < 0 ? styles.negativeValue : null,
                    ]}>
                    {amountText}
                  </Text>
                  <Text style={styles.debtItemLabel}>المبلغ</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</Text>
                  <Text style={styles.debtItemLabel}>الرصيد</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{getBalanceTransactionTypeLabel(item.type)}</Text>
                  <Text style={styles.debtItemLabel}>النوع</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.title}</Text>
                  <Text style={styles.debtItemLabel}>الوصف</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{formatDate(item.dateISO)}</Text>
                  <Text style={styles.debtItemLabel}>التاريخ</Text>
                </View>

                {item.sourceType === 'incoming' ? (
                  <TouchableOpacity
                    style={styles.deleteBtnLarge}
                    onPress={() => onDeleteIncomingTransaction(item.sourceId)}>
                    <Text style={styles.btnText}>حذف الحركة</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

export default BalancesPage;
