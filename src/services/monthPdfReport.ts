import {generatePDF} from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {BalanceTransaction, Expense} from '../types/expense';
import {formatDate} from '../utils/date';

type MonthReportSummary = {
  income: number;
  expenses: number;
  debtPayments: number;
  debtCollections: number;
  net: number;
};

type CategoryTotal = {
  category: string;
  total: number;
};

type MonthPdfReportInput = {
  monthLabel: string;
  expenses: Expense[];
  balanceTransactions: BalanceTransaction[];
  summary: MonthReportSummary;
  categoryTotals: CategoryTotal[];
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatMoney = (value: number): string => `${value.toFixed(2)} ج.م`;

const getBalanceTransactionTypeLabel = (type: BalanceTransaction['type']) => {
  switch (type) {
    case 'incoming':
      return 'وارد';
    case 'expense':
      return 'مصروف';
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

const buildExpensesRows = (expenses: Expense[]) => {
  if (expenses.length === 0) {
    return '<tr><td colspan="5" class="empty">لا توجد مصاريف في هذا الشهر</td></tr>';
  }

  return expenses
    .map(
      item => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${formatMoney(item.amount)}</td>
          <td>${escapeHtml(item.category)}</td>
          <td>${formatDate(item.dateISO)}</td>
          <td>${escapeHtml(item.notes || '-')}</td>
        </tr>
      `,
    )
    .join('');
};

const buildMovementsRows = (items: BalanceTransaction[]) => {
  if (items.length === 0) {
    return '<tr><td colspan="4" class="empty">لا توجد حركات رصيد في هذا الشهر</td></tr>';
  }

  return items
    .map(
      item => `
        <tr>
          <td>${getBalanceTransactionTypeLabel(item.type)}</td>
          <td class="${item.amount < 0 ? 'negative' : 'positive'}">${formatMoney(item.amount)}</td>
          <td>${escapeHtml(item.title)}</td>
          <td>${formatDate(item.dateISO)}</td>
        </tr>
      `,
    )
    .join('');
};

const buildCategoryRows = (categoryTotals: CategoryTotal[]) => {
  if (categoryTotals.length === 0) {
    return '<tr><td colspan="2" class="empty">لا توجد فئات في هذا الشهر</td></tr>';
  }

  return categoryTotals
    .map(
      item => `
        <tr>
          <td>${escapeHtml(item.category)}</td>
          <td>${formatMoney(item.total)}</td>
        </tr>
      `,
    )
    .join('');
};

const buildHtml = ({
  monthLabel,
  expenses,
  balanceTransactions,
  summary,
  categoryTotals,
}: MonthPdfReportInput) => `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: sans-serif;
      direction: rtl;
      color: #0f172a;
      padding: 24px;
      line-height: 1.55;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 24px;
    }
    h2 {
      margin: 22px 0 10px;
      font-size: 17px;
      color: #0f172a;
    }
    .muted {
      color: #64748b;
      font-size: 12px;
      margin-bottom: 18px;
    }
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 14px 0 18px;
    }
    .summaryItem {
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .label {
      color: #475569;
      font-size: 12px;
    }
    .value {
      font-size: 17px;
      font-weight: 700;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      font-size: 11px;
      text-align: right;
      vertical-align: top;
      word-wrap: break-word;
    }
    th {
      background: #eff6ff;
      color: #0f172a;
      font-weight: 700;
    }
    .positive {
      color: #0f766e;
      font-weight: 700;
    }
    .negative {
      color: #dc2626;
      font-weight: 700;
    }
    .empty {
      text-align: center;
      color: #64748b;
      padding: 14px;
    }
  </style>
</head>
<body>
  <h1>تقرير ${escapeHtml(monthLabel)}</h1>
  <div class="muted">تم الإنشاء في ${new Date().toLocaleString('ar-EG')}</div>

  <div class="summary">
    <div class="summaryItem">
      <div class="label">الوارد</div>
      <div class="value positive">${formatMoney(summary.income)}</div>
    </div>
    <div class="summaryItem">
      <div class="label">المصاريف</div>
      <div class="value negative">${formatMoney(summary.expenses)}</div>
    </div>
    <div class="summaryItem">
      <div class="label">سداد الديون</div>
      <div class="value negative">${formatMoney(summary.debtPayments)}</div>
    </div>
    <div class="summaryItem">
      <div class="label">تحصيل الديون</div>
      <div class="value positive">${formatMoney(summary.debtCollections)}</div>
    </div>
    <div class="summaryItem">
      <div class="label">الصافي</div>
      <div class="value ${summary.net < 0 ? 'negative' : 'positive'}">${formatMoney(summary.net)}</div>
    </div>
  </div>

  <h2>المصاريف</h2>
  <table>
    <thead>
      <tr>
        <th>الاسم</th>
        <th>المبلغ</th>
        <th>الفئة</th>
        <th>التاريخ</th>
        <th>ملاحظات</th>
      </tr>
    </thead>
    <tbody>${buildExpensesRows(expenses)}</tbody>
  </table>

  <h2>إجمالي الفئات</h2>
  <table>
    <thead>
      <tr>
        <th>الفئة</th>
        <th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>${buildCategoryRows(categoryTotals)}</tbody>
  </table>

  <h2>حركات الرصيد</h2>
  <table>
    <thead>
      <tr>
        <th>النوع</th>
        <th>المبلغ</th>
        <th>الوصف</th>
        <th>التاريخ</th>
      </tr>
    </thead>
    <tbody>${buildMovementsRows(balanceTransactions)}</tbody>
  </table>
</body>
</html>
`;

const getSafeFileName = (monthLabel: string) =>
  `daily-${monthLabel.replace(/[^\w\u0600-\u06FF]+/g, '-')}`;

export const shareMonthPdfReport = async (input: MonthPdfReportInput) => {
  const fileName = getSafeFileName(input.monthLabel);
  const pdf = await generatePDF({
    html: buildHtml(input),
    fileName,
    base64: true,
  });

  if (!pdf.base64) {
    throw new Error('تعذر إنشاء ملف PDF.');
  }

  await Share.open({
    title: `تقرير ${input.monthLabel}`,
    message: `تقرير ${input.monthLabel}`,
    url: `data:application/pdf;base64,${pdf.base64}`,
    type: 'application/pdf',
    filename: fileName,
    useInternalStorage: true,
    failOnCancel: false,
  });
};
