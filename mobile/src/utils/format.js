export const formatVnd = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('vi-VN') + '₫';
};

export const formatUsdish = (n) => {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0 });
};
