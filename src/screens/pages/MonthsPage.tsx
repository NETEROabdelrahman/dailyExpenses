import React from 'react';
import MonthsListCard from '../../components/MonthsListCard';
import PageHeader from '../../components/PageHeader';

type MonthsPageProps = {
  months: string[];
  onBack: () => void;
  onSelectMonth: (monthKey: string) => void;
};

function MonthsPage({months, onBack, onSelectMonth}: MonthsPageProps): React.JSX.Element {
  return (
    <>
      <PageHeader title="الشهور السابقة" onBack={onBack} />
      <MonthsListCard months={months} onSelectMonth={onSelectMonth} />
    </>
  );
}

export default MonthsPage;
