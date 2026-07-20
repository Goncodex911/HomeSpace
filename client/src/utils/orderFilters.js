const getStoreItems = (order, storeUserId, isAdmin) => {
  if (isAdmin || !storeUserId) return order.items || [];
  return (order.items || []).filter(
    (item) => item.store?.toString() === storeUserId.toString()
  );
};

export const getOrderStoreTotal = (order, storeUserId, isAdmin) =>
  getStoreItems(order, storeUserId, isAdmin).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

export const getOrderItemsLabel = (order, storeUserId, isAdmin) =>
  getStoreItems(order, storeUserId, isAdmin)
    .map((item) => `${item.quantity}x ${item.item?.name || 'Product'}`)
    .join(', ');

const getOrderSearchableText = (order, storeUserId, isAdmin) => {
  const itemsLabel = getOrderItemsLabel(order, storeUserId, isAdmin);
  return [
    order.orderCode,
    order.status,
    order.paymentStatus,
    order.customer?.fullName,
    order.customer?.email,
    itemsLabel,
    getOrderStoreTotal(order, storeUserId, isAdmin),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const STATUS_PHRASES = {
  paid: (order) => (order.paymentStatus || '').toLowerCase() === 'paid',
  unpaid: (order) => (order.paymentStatus || 'pending').toLowerCase() !== 'paid',
  pending: (order) => (order.status || 'pending') === 'pending',
  processing: (order) => order.status === 'processing',
  shipped: (order) => order.status === 'shipped',
  delivered: (order) => order.status === 'delivered',
  cancelled: (order) => order.status === 'cancelled',
  canceled: (order) => order.status === 'cancelled',
};

const stripStatusPhrases = (term) => {
  let cleaned = term.toLowerCase();
  Object.keys(STATUS_PHRASES).forEach((phrase) => {
    cleaned = cleaned.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), ' ');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
};

const tokenMatchesOrder = (order, token, storeUserId, isAdmin) => {
  const lowerToken = token.toLowerCase();
  const searchable = getOrderSearchableText(order, storeUserId, isAdmin);
  const amount = getOrderStoreTotal(order, storeUserId, isAdmin);

  if (/^#\d+$/.test(lowerToken)) {
    return String(order.orderCode || '').includes(lowerToken.replace('#', ''));
  }

  if (/^>\s*\$?\d+(\.\d+)?$/.test(lowerToken)) {
    return amount > parseFloat(lowerToken.replace(/^>\s*\$?/, ''));
  }

  if (/^<\s*\$?\d+(\.\d+)?$/.test(lowerToken)) {
    return amount < parseFloat(lowerToken.replace(/^<\s*\$?/, ''));
  }

  if (/^\$?\d+(\.\d+)?$/.test(lowerToken)) {
    const value = parseFloat(lowerToken.replace('$', ''));
    return Math.abs(amount - value) < 0.01 || String(order.orderCode || '').includes(String(value));
  }

  return searchable.includes(lowerToken);
};

export const matchesOrderSmartSearch = (order, searchTerm, storeUserId, isAdmin) => {
  const rawTerm = (searchTerm || '').trim().toLowerCase();
  if (!rawTerm) return true;

  for (const [phrase, test] of Object.entries(STATUS_PHRASES)) {
    if (new RegExp(`\\b${phrase}\\b`, 'i').test(rawTerm) && !test(order)) {
      return false;
    }
  }

  const cleanedTerm = stripStatusPhrases(rawTerm);
  if (!cleanedTerm) return true;

  const tokens = cleanedTerm.split(/\s+/).filter(Boolean);
  return tokens.every((token) => tokenMatchesOrder(order, token, storeUserId, isAdmin));
};

export const matchesOrderStatusFilter = (order, statusFilter) => {
  if (!statusFilter || statusFilter === 'all') return true;
  return (order.status || 'pending') === statusFilter;
};

export const matchesPaymentFilter = (order, paymentFilter) => {
  if (!paymentFilter || paymentFilter === 'all') return true;
  return (order.paymentStatus || 'pending') === paymentFilter;
};

export const matchesOrderAmountFilter = (order, minAmount, maxAmount, storeUserId, isAdmin) => {
  const amount = getOrderStoreTotal(order, storeUserId, isAdmin);
  const min = minAmount !== '' && minAmount != null ? Number(minAmount) : null;
  const max = maxAmount !== '' && maxAmount != null ? Number(maxAmount) : null;

  if (min != null && !Number.isNaN(min) && amount < min) return false;
  if (max != null && !Number.isNaN(max) && amount > max) return false;
  return true;
};

export const sortOrders = (orders, sortBy, storeUserId, isAdmin) => {
  const sorted = [...orders];

  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    case 'amount_asc':
      return sorted.sort(
        (a, b) =>
          getOrderStoreTotal(a, storeUserId, isAdmin) - getOrderStoreTotal(b, storeUserId, isAdmin)
      );
    case 'amount_desc':
      return sorted.sort(
        (a, b) =>
          getOrderStoreTotal(b, storeUserId, isAdmin) - getOrderStoreTotal(a, storeUserId, isAdmin)
      );
    case 'customer_asc':
      return sorted.sort((a, b) =>
        (a.customer?.fullName || '').localeCompare(b.customer?.fullName || '')
      );
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

export const filterOrders = (
  orders,
  { searchTerm, statusFilter, paymentFilter, minAmount, maxAmount, sortBy },
  storeUserId,
  isAdmin
) => {
  const filtered = orders.filter(
    (order) =>
      matchesOrderSmartSearch(order, searchTerm, storeUserId, isAdmin) &&
      matchesOrderStatusFilter(order, statusFilter) &&
      matchesPaymentFilter(order, paymentFilter) &&
      matchesOrderAmountFilter(order, minAmount, maxAmount, storeUserId, isAdmin)
  );

  return sortOrders(filtered, sortBy, storeUserId, isAdmin);
};

export const hasActiveOrderFilters = ({
  searchTerm,
  statusFilter,
  paymentFilter,
  minAmount,
  maxAmount,
  sortBy,
}) =>
  Boolean(
    searchTerm?.trim() ||
      (statusFilter && statusFilter !== 'all') ||
      (paymentFilter && paymentFilter !== 'all') ||
      minAmount !== '' ||
      maxAmount !== '' ||
      (sortBy && sortBy !== 'newest')
  );
