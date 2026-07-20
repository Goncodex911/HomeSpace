export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

export const dayKey = (date) => startOfDay(date).toISOString().slice(0, 10);
export const weekKey = (date) => startOfWeek(date).toISOString().slice(0, 10);
export const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const resolveBucketKey = (date, period) => {
  if (period === 'month') return dayKey(date);
  if (period === 'quarter') return weekKey(date);
  return monthKey(date);
};

export const buildChartSeries = (period) => {
  const now = new Date();

  if (period === 'month') {
    const buckets = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        key: dayKey(d),
        label: String(d.getDate()),
        revenue: 0,
        orders: 0,
      });
    }
    return {
      chartType: 'bar',
      period: 'month',
      start: startOfDay(new Date(now.getTime() - 29 * 86400000)),
      buckets,
    };
  }

  if (period === 'quarter') {
    const weekStart = startOfWeek(now);
    const buckets = [];
    for (let i = 12; i >= 0; i -= 1) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - i * 7);
      buckets.push({
        key: weekKey(d),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 0,
        orders: 0,
      });
    }
    return {
      chartType: 'line',
      period: 'quarter',
      start: buckets[0] ? startOfDay(new Date(buckets[0].key)) : startOfDay(now),
      buckets,
    };
  }

  const buckets = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: monthKey(d),
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: 0,
      orders: 0,
    });
  }

  return {
    chartType: 'line',
    period: 'year',
    start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
    buckets,
  };
};

export const getStoreRevenueFromOrder = (order, storeId) => {
  if (order.paymentStatus !== 'paid') return 0;
  return (order.items || [])
    .filter((item) => item.store?.toString() === storeId.toString())
    .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
};
