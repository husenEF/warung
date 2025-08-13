export function moneyFormat(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID',
): string {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
