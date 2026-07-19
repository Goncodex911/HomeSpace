import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../api/api';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';
import { Header, LoadingScreen, ErrorBox } from '../components/ui';

const PLACEHOLDER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqhinz1WRpRywtmtoOJl-Xjnv3ZbvvTm2JmT-zPfqdWGUzbgVFW3SuEYFW0ePw7PVS5vIYE_7VQNTj3c6aHRykSS0VW_UsqvEEpGUdASGaUd7L-M6e5YH9inLvruE5x1kjWYNWl0iQ5F79sK_-V5BlV6sQG86UWSsMTyCor4_AxC_C2ByrHcb2UIE6WuvBD88KEASLN3SCe4fJDlQK1KneVSBlqKwy78y896DRnsdyEoj5WkUghaOTPykAgZSg3yGgOVN1AhlEPEm',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCfcBqkWM3r21aDql5wiXK8r1kXDdZYe864IbIjJUXSGVCHKjEyK_UBES8bQM_fStWpzy37DyBN79HsugLf9B74NUc32hFtDivnF4iQMcvK3uAyLhTkfa5JTJ73f2Zl0izH8djHjzV7QHwEJY5FiyxH7sZZhYcBNYlrmU0soGLsyb0lHojl7T_fTfpRH8t9ZuqVqKfuRvXVSRhS2eeStyQk38lfXm3E1M5AxcxbYSvo2Bx9iiENsY4KqiVu2HFJIEq6gf4tU4SySm1k',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAXTVBsxtaabBH2J27cPb743kO_wPxof7yVDuNbR2VmrU1aQwAPxJt05kRu9X5kYNSfHznuKJ2MD2J38XPhwutH9eSDBmXVp3AsoxlmWUVBuywXJt8kDR5nWsPIGUKYRpiV2JdRzf8o5BlHknMcoNjfPBYefT04tn-l_wLr50QqMb2Hny0fwWR3euuGWGI1hu8QkPJHdt6bfwxVo98uI0PicozHCn0Hrct2nr2T5VIVJ_cb6W9sVlVwKY0nihRf6ycr4MUW_ejNTZb7',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAo0TFeq2XW3kTWiVvdUs-6HkTCbtUDvNOShLeF_DrVZPK_L7-f7WGbvvIW5c26zkOkQXCmTD2xHwFZjtwhpNI-aH8vPQ8sORWWRW-ml8W4S4cVHwKzxgJEBOZT2rIl8742AjVzhJwzDD34k7WqMkN-CGxwKshpuodtVVOHe9htIoY46E3UM9Ge257eymDu9vyHgn8Wc3M3M9RUaTnNhW7KUPz3LfQ85fMQZvr92C6skzsJnq4-CJALH2GMUyyNCA5zAT-K20qVLp_R',
];

const DEFAULT_ITEMS = [
  {
    _id: 'd1',
    name: 'Ether Arc Lounge Chair',
    price: 1240,
    quantity: 12,
    category: 'Seating',
    description: 'Handcrafted lounge chair with velvet upholstery.',
  },
  {
    _id: 'd2',
    name: 'Orbital Sphere Lamp',
    price: 450,
    quantity: 8,
    category: 'Lighting',
    description: 'Frosted glass sphere on thin brass stem.',
  },
  {
    _id: 'd3',
    name: 'Monolith Travertine Table',
    price: 3800,
    quantity: 4,
    category: 'Tables',
    description: 'Heavy travertine marble dining table.',
  },
  {
    _id: 'd4',
    name: 'Stratus Modular Sofa',
    price: 5600,
    quantity: 2,
    category: 'Seating',
    description: 'Modular sofa in light pebble grey bouclé.',
  },
];

const DEFAULT_STORE = {
  fullName: 'Elias Thorne',
  companyName: 'Nordic Essence',
  businessType: 'Furniture Design',
  philosophy:
    'Minimalism meets warmth. Every curve tells a story of Scandinavian heritage and modern comfort.',
  city: 'Copenhagen',
  state: 'Denmark',
  yearsInIndustry: 12,
};

const getInitials = (name) =>
  name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

const getCategory = (item) => {
  if (item.category && item.category !== 'Uncategorized') return item.category;
  const match = (item.description || '').match(/Category:\s*(.*)/);
  return match ? match[1].trim() : 'Uncategorized';
};

const getItemImage = (item, index) =>
  item.image || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];

export default function StoreProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const [store, setStore] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('collection');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setError('');
        const res = await api(`/stores/${id}`);
        setStore(res.data?.store || null);
        setItems(res.data?.items || []);
      } catch (err) {
        if (id?.startsWith('demo-')) {
          setStore(DEFAULT_STORE);
          setItems(DEFAULT_ITEMS);
        } else {
          setError(err.message || 'Failed to load store profile');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStore();
    else {
      setError('Store not found');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <LoadingScreen label="Loading Curator Profile..." />;
  }

  const displayStore = store || DEFAULT_STORE;
  const displayItems = items.length > 0 ? items : DEFAULT_ITEMS;
  const screenWidth = Dimensions.get('window').width - spacing.mobile * 2;

  const openProduct = (item) => {
    if (item._id?.startsWith('d')) return;
    navigation.navigate('ProductDetail', { id: item._id });
  };

  const renderCollection = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionLabel}>Curated Showcase</Text>
      <Text style={styles.sectionTitle}>Featured Collection</Text>
      {displayItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No collection items yet.</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.heroImage, { width: screenWidth, height: screenWidth * 0.75 }]}
            onPress={() => openProduct(displayItems[0])}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: getItemImage(displayItems[0], 0) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroItemName}>{displayItems[0].name}</Text>
              <Text style={styles.heroItemPrice}>{formatVnd(displayItems[0].price)}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.gridRow}>
            {displayItems.slice(1, 3).map((item, i) => (
              <TouchableOpacity
                key={item._id}
                style={[styles.gridItem, { width: (screenWidth - 12) / 2, height: 180 }]}
                onPress={() => openProduct(item)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: getItemImage(item, i + 1) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.gridItemPrice}>{formatVnd(item.price)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {displayItems.slice(3).map((item, i) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.gridItemFull, { width: screenWidth, height: 200 }]}
              onPress={() => openProduct(item)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: getItemImage(item, i + 3) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <View style={styles.gridOverlay}>
                <Text style={styles.gridItemName}>{item.name}</Text>
                <Text style={styles.gridItemPrice}>{formatVnd(item.price)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  const renderProducts = () => (
    <View style={styles.tabContent}>
      <View style={styles.productsHeader}>
        <View>
          <Text style={styles.sectionLabel}>Catalog</Text>
          <Text style={styles.sectionTitle}>All Products</Text>
        </View>
        <Text style={styles.itemCount}>{displayItems.length} items</Text>
      </View>

      {displayItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No products listed yet.</Text>
        </View>
      ) : (
        displayItems.map((item, i) => {
          const baseDesc = (item.description || '').split('\n\n---\n')[0];
          return (
            <TouchableOpacity
              key={item._id}
              style={styles.productCard}
              onPress={() => openProduct(item)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: getItemImage(item, i) }}
                style={styles.productImage}
                contentFit="cover"
              />
              <View style={styles.productBody}>
                <Text style={styles.productCategory}>{getCategory(item)}</Text>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {baseDesc || 'Premium artisan piece.'}
                </Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>{formatVnd(item.price)}</Text>
                  <Text
                    style={[
                      styles.stockBadge,
                      item.quantity > 0 ? styles.inStock : styles.soldOut,
                    ]}
                  >
                    {item.quantity > 0 ? 'In Stock' : 'Sold Out'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Lumina" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>
              {getInitials(displayStore.companyName || displayStore.fullName)}
            </Text>
          </View>
          <Text style={styles.storeName}>
            {displayStore.companyName || displayStore.fullName}
          </Text>
          <Text style={styles.storeByline}>
            by {displayStore.fullName} · {displayStore.businessType}
          </Text>
          {displayStore.philosophy ? (
            <Text style={styles.storePhilosophy}>"{displayStore.philosophy}"</Text>
          ) : null}
          <View style={styles.statsRow}>
            {displayStore.city ? (
              <View style={styles.statPill}>
                <Text style={styles.statText}>
                  {displayStore.city}
                  {displayStore.state ? `, ${displayStore.state}` : ''}
                </Text>
              </View>
            ) : null}
            {displayStore.yearsInIndustry > 0 ? (
              <View style={styles.statPill}>
                <Text style={styles.statText}>{displayStore.yearsInIndustry}+ Years</Text>
              </View>
            ) : null}
            <View style={styles.statPill}>
              <Text style={styles.statText}>{displayItems.length} Products</Text>
            </View>
          </View>
        </View>

        <ErrorBox message={error} />

        <View style={styles.tabs}>
          {[
            { key: 'collection', label: 'Collection' },
            { key: 'product', label: 'Products' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'collection' ? renderCollection() : renderProducts()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.mobile,
    paddingVertical: 28,
    marginBottom: 0,
  },
  avatarLg: {
    width: 80,
    height: 80,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLgText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.onPrimary,
  },
  storeName: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.onPrimary,
    marginBottom: 6,
  },
  storeByline: {
    ...typography.caps,
    fontSize: 10,
    color: colors.secondary,
    marginBottom: 12,
  },
  storePhilosophy: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statText: {
    ...typography.caps,
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    ...typography.caps,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: colors.primary,
  },
  tabContent: {
    paddingHorizontal: spacing.mobile,
    paddingTop: 24,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.secondary,
    marginBottom: 4,
  },
  sectionTitle: {
    ...typography.headline,
    fontSize: 22,
    marginBottom: 16,
  },
  heroImage: {
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroItemName: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroItemPrice: {
    ...typography.caps,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    overflow: 'hidden',
    position: 'relative',
  },
  gridItemFull: {
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gridItemName: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  gridItemPrice: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  itemCount: {
    ...typography.label,
    fontSize: 10,
  },
  productCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(196,199,199,0.35)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 220,
  },
  productBody: { padding: 16 },
  productCategory: {
    ...typography.caps,
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 4,
  },
  productName: {
    ...typography.title,
    marginBottom: 6,
  },
  productDesc: {
    ...typography.body,
    fontSize: 13,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: 12,
  },
  productPrice: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 16,
  },
  stockBadge: {
    ...typography.caps,
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inStock: {
    backgroundColor: colors.surfaceContainer,
    color: colors.primary,
  },
  soldOut: {
    backgroundColor: colors.errorContainer,
    color: colors.onErrorContainer,
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
  },
  emptyText: {
    ...typography.body,
  },
});
