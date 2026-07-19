import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../api/api';
import { Header, AppButton, ErrorBox, LoadingScreen } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const CATEGORIES = [
  'All',
  'Living Room',
  'Bedroom',
  'Office',
  'Kitchen',
  'Seating',
  'Lighting',
  'Tables',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'best-seller', label: 'Best Seller' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.mobile * 2 - GRID_GAP) / 2;

export default function CatalogScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const params = route.params || {};
    if (params.category) setFilterCategory(params.category);
    if (params.search) setSearchQuery(params.search);
  }, [route.params]);

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api('/items/all');
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
        setError('Unable to load product catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllItems();
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterCategory !== 'All') {
      result = result.filter((item) => {
        const itemCat = (item.category || '').toLowerCase().replace(/\s+/g, '');
        const targetCat = filterCategory.toLowerCase().replace(/\s+/g, '');
        return itemCat.includes(targetCat) || targetCat.includes(itemCat);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
      );
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'best-seller') {
      result.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [items, filterCategory, searchQuery, sortBy]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Newest';

  const resetFilters = () => {
    setFilterCategory('All');
    setSearchQuery('');
    setSortBy('newest');
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
      activeOpacity={0.85}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: item.image || FALLBACK_IMAGE }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />
        {item.model3d ? (
          <View style={styles.badge3d}>
            <Text style={styles.badge3dText}>3D</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.category ? (
        <Text style={styles.productCategory}>{item.category}</Text>
      ) : null}
      <Text style={styles.productPrice}>{formatVnd(item.price)}</Text>
    </TouchableOpacity>
  );

  const listHeader = (
    <View style={styles.filters}>
      <Text style={styles.pageTitle}>
        {filterCategory === 'All' ? 'Aura Collection' : filterCategory}
      </Text>
      <Text style={styles.resultCount}>{filteredItems.length} results</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.outlineVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.filterLabel}>Categories</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(cat) => cat}
        contentContainerStyle={styles.categoryScroll}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            onPress={() => setFilterCategory(cat)}
            style={[styles.categoryChip, filterCategory === cat && styles.categoryChipActive]}
          >
            <Text
              style={[
                styles.categoryChipText,
                filterCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat === 'All' ? 'All' : cat}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.sortRow}>
        <Text style={styles.filterLabel}>Sort</Text>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setShowSortMenu((v) => !v)}
        >
          <Text style={styles.sortBtnText}>{currentSortLabel} ▾</Text>
        </TouchableOpacity>
      </View>

      {showSortMenu ? (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortOption, sortBy === opt.value && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(opt.value);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === opt.value && styles.sortOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <ErrorBox message={error} />
    </View>
  );

  const listEmpty = loading ? null : (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptyText}>Try adjusting your filters or search.</Text>
      <AppButton title="Reset Filters" onPress={resetFilters} style={styles.resetBtn} />
    </View>
  );

  if (loading && items.length === 0) {
    return <LoadingScreen label="Loading catalog..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        showBack
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartLink}>Cart</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
  },
  filters: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  pageTitle: {
    ...typography.headline,
    marginBottom: 4,
  },
  resultCount: {
    ...typography.label,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    marginBottom: 20,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 8,
  },
  clearBtn: {
    ...typography.caps,
    fontSize: 10,
    color: colors.error,
  },
  filterLabel: {
    ...typography.label,
    marginBottom: 10,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: colors.onPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sortBtn: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceContainerLowest,
  },
  sortBtnText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  sortMenu: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 16,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  sortOptionActive: {
    backgroundColor: colors.surfaceContainer,
  },
  sortOptionText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  productCard: {
    width: CARD_WIDTH,
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badge3d: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge3dText: {
    ...typography.caps,
    fontSize: 9,
    color: colors.onSecondary,
  },
  productName: {
    ...typography.title,
    fontSize: 14,
    marginBottom: 2,
  },
  productCategory: {
    ...typography.label,
    fontSize: 9,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  emptyTitle: {
    ...typography.title,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetBtn: {
    alignSelf: 'stretch',
  },
  cartLink: {
    ...typography.caps,
    color: colors.primary,
  },
});
