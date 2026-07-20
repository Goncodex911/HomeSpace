/** Legacy catalog prices were stored in VND; new prices are USD. */
export const VND_PER_USD = 25000;

export const toUSD = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 10000) return value / VND_PER_USD;
  return value;
};

export const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toUSD(amount));

export const formatUSDCompact = (amount) => {
  const usd = toUSD(amount);
  return `$${usd.toLocaleString('en-US', {
    minimumFractionDigits: usd % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};
