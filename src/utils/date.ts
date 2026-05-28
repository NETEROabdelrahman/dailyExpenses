export const toMonthKey = (dateISO: string) => dateISO.slice(0, 7);

export const formatDate = (dateISO: string) =>
  new Date(dateISO).toLocaleDateString('ar-EG');

export const formatMonthLabel = (monthKey: string) =>
  new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('ar-EG', {
    month: 'long',
    year: 'numeric',
  });

export const currentMonthKey = () => toMonthKey(new Date().toISOString());

export const normalizedDateISO = (date: Date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(12, 0, 0, 0);
  return normalizedDate.toISOString();
};
