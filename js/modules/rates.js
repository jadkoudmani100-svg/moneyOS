export const DEFAULT_RATES_TO_USD = {
  USD: 1,
  SYP: 0.00007,
  EUR: 1.08,
  SAR: 0.27,
  GOLD: 75.0
};

export function convertToUSD(amount, currency) {
  const rate = DEFAULT_RATES_TO_USD[currency] || 1;
  return amount * rate;
}
