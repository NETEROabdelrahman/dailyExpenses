import React from 'react';
import MonthsListCard from '../../components/MonthsListCard';
import PageHeader from '../../components/PageHeader';
import {AccountingPeriod} from '../../types/expense';

type MonthsPageProps = {
  periods: AccountingPeriod[];
  onBack: () => void;
  onSelectMonth: (periodId: string) => void;
};

function MonthsPage({periods, onBack, onSelectMonth}: MonthsPageProps): React.JSX.Element {
  return (
    <>
      <PageHeader title="الشهور السابقة" onBack={onBack} />
      <MonthsListCard periods={periods} onSelectMonth={onSelectMonth} />
    </>
  );
}

export default MonthsPage;
