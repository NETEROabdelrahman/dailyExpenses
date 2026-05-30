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
import {IncomingMoneySourceType, IncomingMoneyTransaction, PaymentMethod} from '../../types/expense';
import {sanitizeAmountInput} from '../../utils/amount';
import {formatDate} from '../../utils/date';
import styles from '../../styles/appStyles';

type BalancesIncomingForm = {
  amountText: string;
  paymentMethod: PaymentMethod;
  sourceType: IncomingMoneySourceType;
  sourceOtherText: string;
};

type BalancesPageProps = {
  initialCashText: string;
  initialBankText: string;
  initialWalletText: string;
  remainingCash: number;
  remainingBank: number;
  remainingWallet: number;
  totalBefore: number;
  totalAfter: number;
  incomingForm: BalancesIncomingForm;
  incomingTransactions: IncomingMoneyTransaction[];
  customIncomingSources: string[];
  onBack: () => void;
  onInitialCashChange: (value: string) => void;
  onInitialBankChange: (value: string) => void;
  onInitialWalletChange: (value: string) => void;
  onIncomingAmountChange: (value: string) => void;
  onIncomingPaymentMethodChange: (value: PaymentMethod) => void;
  onIncomingSourceTypeChange: (value: IncomingMoneySourceType) => void;
  onIncomingSourceOtherTextChange: (value: string) => void;
  onAddCustomIncomingSource: () => void;
  onSubmitIncomingMoney: () => void;
  onDeleteIncomingTransaction: (transactionId: string) => void;
};

function BalancesPage({
  initialCashText,
  initialBankText,
  initialWalletText,
  remainingCash,
  remainingBank,
  remainingWallet,
  totalBefore,
  totalAfter,
  incomingForm,
  incomingTransactions,
  customIncomingSources,
  onBack,
  onInitialCashChange,
  onInitialBankChange,
  onInitialWalletChange,
  onIncomingAmountChange,
  onIncomingPaymentMethodChange,
  onIncomingSourceTypeChange,
  onIncomingSourceOtherTextChange,
  onAddCustomIncomingSource,
  onSubmitIncomingMoney,
  onDeleteIncomingTransaction,
}: BalancesPageProps): React.JSX.Element {
  return (
    <>
      <PageHeader title="الأرصدة المتاحة" onBack={onBack} />

      <MoneySummaryCard
        initialCashText={initialCashText}
        initialBankText={initialBankText}
        initialWalletText={initialWalletText}
        remainingCash={remainingCash}
        remainingBank={remainingBank}
        remainingWallet={remainingWallet}
        totalBefore={totalBefore}
        totalAfter={totalAfter}
        onInitialCashChange={value => onInitialCashChange(sanitizeAmountInput(value))}
        onInitialBankChange={value => onInitialBankChange(sanitizeAmountInput(value))}
        onInitialWalletChange={value => onInitialWalletChange(sanitizeAmountInput(value))}
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
        <Text style={styles.sectionTitle}>آخر المبالغ الواردة</Text>

        {incomingTransactions.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد مبالغ واردة حتى الآن.</Text>
        ) : (
          incomingTransactions.slice(0, 8).map(item => {
            const sourceText =
              item.sourceType === 'other' && item.sourceLabel
                ? item.sourceLabel
                : INCOMING_MONEY_SOURCE_LABELS[item.sourceType];

            return (
              <View key={item.id} style={styles.balanceHistoryItem}>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{item.amount.toFixed(2)} ج.م</Text>
                  <Text style={styles.debtItemLabel}>المبلغ</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</Text>
                  <Text style={styles.debtItemLabel}>الرصيد</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{sourceText}</Text>
                  <Text style={styles.debtItemLabel}>المصدر</Text>
                </View>
                <View style={styles.debtItemRow}>
                  <Text style={styles.debtItemValue}>{formatDate(item.dateISO)}</Text>
                  <Text style={styles.debtItemLabel}>التاريخ</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtnLarge}
                  onPress={() => onDeleteIncomingTransaction(item.id)}>
                  <Text style={styles.btnText}>حذف الحركة</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

export default BalancesPage;
