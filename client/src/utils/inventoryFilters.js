export const getUniqueCategories = (items) => {
  const categories = new Set(
    (items || []).map((item) => item.category || 'Uncategorized').filter(Boolean)
  );
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
};

const getSearchableText = (item) =>
  [item.name, item.category, item.description, item.price, item.quantity]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const STOCK_PHRASES = {
  'in stock': (item) => (item.quantity || 0) > 0,
  instock: (item) => (item.quantity || 0) > 0,
  'low stock': (item) => (item.quantity || 0) > 0 && (item.quantity || 0) < 5,
  lowstock: (item) => (item.quantity || 0) > 0 && (item.quantity || 0) < 5,
  'out of stock': (item) => (item.quantity || 0) === 0,
  outofstock: (item) => (item.quantity || 0) === 0,
};

const stripStockPhrases = (term) => {
  let cleaned = term.toLowerCase();
  Object.keys(STOCK_PHRASES).forEach((phrase) => {
    cleaned = cleaned.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), ' ');
  });
  return cleaned.replace(/\s+/g, ' ').trim();
};

const tokenMatchesItem = (item, token) => {
  const lowerToken = token.toLowerCase();
  const searchable = getSearchableText(item);
  const price = item.price || 0;
  const qty = item.quantity || 0;

  if (/^#\w+/.test(lowerToken)) {
    const category = lowerToken.replace('#', '');
    return (item.category || '').toLowerCase().includes(category);
  }

  if (/^>\s*\$?\d+(\.\d+)?$/.test(lowerToken)) {
    return price > parseFloat(lowerToken.replace(/^>\s*\$?/, ''));
  }

  if (/^<\s*\$?\d+(\.\d+)?$/.test(lowerToken)) {
    return price < parseFloat(lowerToken.replace(/^<\s*\$?/, ''));
  }

  if (/^\$?\d+(\.\d+)?$/.test(lowerToken)) {
    const value = parseFloat(lowerToken.replace('$', ''));
    return Math.abs(price - value) < 0.01 || String(qty) === String(value);
  }

  return searchable.includes(lowerToken);
};

export const matchesInventorySmartSearch = (item, searchTerm) => {
  const rawTerm = (searchTerm || '').trim().toLowerCase();
  if (!rawTerm) return true;

  for (const [phrase, test] of Object.entries(STOCK_PHRASES)) {
    if (new RegExp(`\\b${phrase}\\b`, 'i').test(rawTerm) && !test(item)) {
      return false;
    }
  }

  const cleanedTerm = stripStockPhrases(rawTerm);
  if (!cleanedTerm) return true;

  const tokens = cleanedTerm.split(/\s+/).filter(Boolean);
  return tokens.every((token) => tokenMatchesItem(item, token));
};

export const matchesCategoryFilter = (item, categoryFilter) => {
  if (!categoryFilter || categoryFilter === 'all') return true;
  return (item.category || 'Uncategorized') === categoryFilter;
};

export const matchesStockFilter = (item, stockFilter) => {
  if (!stockFilter || stockFilter === 'all') return true;
  const qty = item.quantity || 0;

  switch (stockFilter) {
    case 'in_stock':
      return qty > 0;
    case 'low_stock':
      return qty > 0 && qty < 5;
    case 'out_of_stock':
      return qty === 0;
    default:
      return true;
  }
};

export const matchesPriceFilter = (item, minPrice, maxPrice) => {
  const price = item.price || 0;
  const min = minPrice !== '' && minPrice != null ? Number(minPrice) : null;
  const max = maxPrice !== '' && maxPrice != null ? Number(maxPrice) : null;

  if (min != null && !Number.isNaN(min) && price < min) return false;
  if (max != null && !Number.isNaN(max) && price > max) return false;
  return true;
};

export const sortInventoryItems = (items, sortBy) => {
  const sorted = [...items];

  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    case 'price_asc':
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'price_desc':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'name_asc':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'stock_asc':
      return sorted.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
    case 'stock_desc':
      return sorted.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

export const filterInventoryItems = (
  items,
  { searchTerm, categoryFilter, stockFilter, minPrice, maxPrice, sortBy }
) => {
  const filtered = items.filter(
    (item) =>
      matchesInventorySmartSearch(item, searchTerm) &&
      matchesCategoryFilter(item, categoryFilter) &&
      matchesStockFilter(item, stockFilter) &&
      matchesPriceFilter(item, minPrice, maxPrice)
  );

  return sortInventoryItems(filtered, sortBy);
};

export const hasActiveInventoryFilters = ({
  searchTerm,
  categoryFilter,
  stockFilter,
  minPrice,
  maxPrice,
  sortBy,
}) =>
  Boolean(
    searchTerm?.trim() ||
      (categoryFilter && categoryFilter !== 'all') ||
      (stockFilter && stockFilter !== 'all') ||
      minPrice !== '' ||
      maxPrice !== '' ||
      (sortBy && sortBy !== 'newest')
  );
