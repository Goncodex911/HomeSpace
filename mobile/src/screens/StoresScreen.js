import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { colors, typography, spacing } from '../theme';
import { Header, LoadingScreen, ErrorBox } from '../components/ui';

const DEFAULT_STORES = [
  {
    _id: 'demo-1',
    companyName: 'Nordic Essence',
    fullName: 'Elias Thorne',
    businessType: 'Furniture Design',
    philosophy:
      'Minimalism meets warmth. Every curve tells a story of Scandinavian heritage and modern comfort.',
    city: 'Copenhagen',
    state: 'Denmark',
    yearsInIndustry: 12,
  },
  {
    _id: 'demo-2',
    companyName: 'Terra Forma Studio',
    fullName: 'Sienna Mare',
    businessType: 'Interior Architecture',
    philosophy:
      'We believe in sustainable luxury — where natural materials and artisanal craftsmanship create timeless spaces.',
    city: 'Milan',
    state: 'Italy',
    yearsInIndustry: 8,
  },
  {
    _id: 'demo-3',
    companyName: 'Vance Woodworks',
    fullName: 'Arthur Vance',
    businessType: 'Artisan Woodcraft',
    philosophy:
      'Every piece of wood carries the memory of the forest. We honor that story through meticulous handcraft.',
    city: 'Portland',
    state: 'Oregon',
    yearsInIndustry: 15,
  },
  {
    _id: 'demo-4',
    companyName: 'Lumen Lighting Co.',
    fullName: 'Clara Winslet',
    businessType: 'Lighting Design',
    philosophy:
      'Light shapes emotion. Our fixtures are sculptural expressions that transform any room into an experience.',
    city: 'Brooklyn',
    state: 'New York',
    yearsInIndustry: 6,
  },
  {
    _id: 'demo-5',
    companyName: 'Marble & Stone Atelier',
    fullName: 'Giovanni Rossi',
    businessType: 'Stone Sculpture',
    philosophy:
      'Working with the raw beauty of natural stone, we create functional art that stands the test of centuries.',
    city: 'Florence',
    state: 'Tuscany',
    yearsInIndustry: 20,
  },
  {
    _id: 'demo-6',
    companyName: 'Weave Collective',
    fullName: 'Anika Patel',
    businessType: 'Textile Art',
    philosophy:
      'Handwoven traditions meeting contemporary design. Each thread is a bridge between cultures and eras.',
    city: 'Jaipur',
    state: 'Rajasthan',
    yearsInIndustry: 10,
  },
];

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function StoresScreen() {
  const navigation = useNavigation();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setError('');
        const res = await api('/stores');
        const list = res.data || [];
        setStores(list);
        setUsingDemo(list.length === 0);
      } catch (err) {
        setError(err.message || 'Failed to load curators');
        setUsingDemo(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const sourceStores = stores.length > 0 ? stores : DEFAULT_STORES;

  const businessTypes = useMemo(() => {
    const types = new Set(sourceStores.map((s) => s.businessType).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [sourceStores]);

  const filteredStores = sourceStores.filter((store) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (store.companyName || '').toLowerCase().includes(q) ||
      (store.fullName || '').toLowerCase().includes(q) ||
      (store.businessType || '').toLowerCase().includes(q) ||
      (store.city || '').toLowerCase().includes(q);
    const matchesFilter = filterType === 'All' || store.businessType === filterType;
    return matchesSearch && matchesFilter;
  });

  const openStore = (store) => {
    navigation.navigate('StoreProfile', { id: store._id });
  };

  if (loading) {
    return <LoadingScreen label="Loading Curators..." />;
  }

  const renderStoreCard = ({ item: store }) => (
    <TouchableOpacity style={styles.card} onPress={() => openStore(store)} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(store.companyName || store.fullName)}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.companyName}>{store.companyName || store.fullName}</Text>
          <Text style={styles.byline}>
            by {store.fullName} · {store.businessType}
          </Text>
          {store.city ? (
            <Text style={styles.location}>
              {store.city}
              {store.state ? `, ${store.state}` : ''}
            </Text>
          ) : null}
        </View>
      </View>
      {store.philosophy ? (
        <Text style={styles.philosophy} numberOfLines={3}>
          "{store.philosophy}"
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        {store.yearsInIndustry > 0 ? (
          <Text style={styles.tag}>{store.yearsInIndustry}+ Years</Text>
        ) : null}
        <Text style={styles.viewLink}>View Profile →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Lumina" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Curator Network</Text>
          <Text style={styles.heroTitle}>Discover Ateliers</Text>
          <Text style={styles.heroSub}>
            Explore master artisans and design studios curated for Lumina collectors.
          </Text>
        </View>

        <ErrorBox message={error} />

        {usingDemo ? (
          <View style={styles.demoBanner}>
            <Text style={styles.demoText}>
              Showing featured demo curators — connect to the server to browse live stores.
            </Text>
          </View>
        ) : null}

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search curators, studios, cities..."
            placeholderTextColor={colors.outlineVariant}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {businessTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === type && styles.filterChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.resultCount}>
          {filteredStores.length} curator{filteredStores.length !== 1 ? 's' : ''}
        </Text>

        <FlatList
          data={filteredStores}
          keyExtractor={(item) => item._id}
          renderItem={renderStoreCard}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No curators found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filter.</Text>
            </View>
          }
        />
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
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: colors.primary,
    marginHorizontal: -spacing.mobile,
    paddingHorizontal: spacing.mobile,
    paddingVertical: 32,
    marginBottom: 24,
  },
  heroLabel: {
    ...typography.label,
    color: colors.secondary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.onPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.65)',
  },
  demoBanner: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 12,
    marginBottom: 16,
  },
  demoText: {
    fontSize: 12,
    color: colors.secondary,
    lineHeight: 18,
  },
  searchWrap: { marginBottom: 16 },
  searchInput: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.onSurface,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  resultCount: {
    ...typography.label,
    marginBottom: 12,
  },
  list: { gap: 16 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(196,199,199,0.4)',
    padding: 20,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.onPrimary,
    letterSpacing: 2,
  },
  cardMeta: { flex: 1 },
  companyName: {
    ...typography.title,
    marginBottom: 4,
  },
  byline: {
    fontSize: 12,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  philosophy: {
    ...typography.body,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: 12,
  },
  tag: {
    ...typography.caps,
    fontSize: 10,
    color: colors.secondary,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
  },
  emptyTitle: {
    ...typography.title,
    marginBottom: 8,
  },
  emptySub: {
    ...typography.body,
  },
});
