import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';
import { Header, LoadingScreen, AppButton } from '../components/ui';
import ModelViewer3D from '../components/ModelViewer3D';

const MATERIALS = [
  { key: 'Cream', color: '#FAF9F5' },
  { key: 'Charcoal', color: '#444748' },
  { key: 'Sand', color: '#D2B48C' },
];

export default function RoomBuilderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const productId = route.params?.productId;

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMaterial, setActiveMaterial] = useState('Cream');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch3DProducts = async () => {
      try {
        setError('');
        const res = await api('/items/all');
        const allItems = res.data || [];
        const itemsWith3D = allItems.filter((item) => item.model3d);

        setProducts(itemsWith3D);

        if (itemsWith3D.length > 0) {
          const matched = itemsWith3D.find((item) => item._id === productId);
          setSelectedProduct(matched || itemsWith3D[0]);
        } else {
          setError('No products with 3D models found in the catalog.');
        }
      } catch (err) {
        setError(err.message || 'Could not load 3D product data from the server.');
      } finally {
        setLoading(false);
      }
    };
    fetch3DProducts();
  }, [productId]);

  if (loading) {
    return <LoadingScreen label="Loading 3D Studio..." />;
  }

  if (error || !selectedProduct) {
    return (
      <View style={styles.container}>
        <Header title="Lumina" showBack />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>◇</Text>
          <Text style={styles.emptyTitle}>No 3D Models Available</Text>
          <Text style={styles.emptySub}>
            {error ||
              'Add model3d URLs to products in the Store Dashboard before using the Room Builder.'}
          </Text>
          <AppButton
            title="Go to Store Dashboard"
            onPress={() => navigation.navigate('StoreDashboard')}
            style={{ marginTop: 16, width: '100%' }}
          />
          <AppButton
            title="Back to Home"
            variant="outline"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 12, width: '100%' }}
          />
        </View>
      </View>
    );
  }

  const descParts = (selectedProduct.description || '').split('\n\n---\n');
  const baseDescription = descParts[0];
  let specsList = [
    'Premium surface finish',
    'Export-quality craftsmanship',
    '24-month warranty',
  ];

  if (descParts.length > 1) {
    const lines = descParts[1].split('\n').filter((line) => line.includes(':'));
    if (lines.length > 0) {
      specsList = lines.map((line) => line.replace(/:/g, ': '));
    }
  }

  const previewImage =
    selectedProduct.image ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqhinz1WRpRywtmtoOJl-Xjnv3ZbvvTm2JmT-zPfqdWGUzbgVFW3SuEYFW0ePw7PVS5vIYE_7VQNTj3c6aHRykSS0VW_UsqvEEpGUdASGaUd7L-M6e5YH9inLvruE5x1kjWYNWl0iQ5F79sK_-V5BlV6sQG86UWSsMTyCor4_AxC_C2ByrHcb2UIE6WuvBD88KEASLN3SCe4fJDlQK1KneVSBlqKwy78y896DRnsdyEoj5WkUghaOTPykAgZSg3yGgOVN1AhlEPEm';

  return (
    <View style={styles.container}>
      <Header
        title="3D Studio"
        showBack
        right={
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        }
      />

      <View style={styles.viewport}>
        <ModelViewer3D
          key={selectedProduct._id + String(selectedProduct.model3d)}
          modelUrl={selectedProduct.model3d}
          posterUrl={previewImage}
          style={styles.modelViewer}
        />
        <View style={styles.hintBar} pointerEvents="none">
          <Text style={styles.hintText}>
            Drag to rotate · Pinch to zoom · Two-finger to pan
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.panel}>
          <View style={styles.productHeader}>
            <Text style={styles.categoryBadge}>
              {selectedProduct.category || 'Studio Piece'}
            </Text>
            <Text style={styles.productName}>{selectedProduct.name}</Text>
            <Text style={styles.productPrice}>{formatVnd(selectedProduct.price)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Select Display Product</Text>
          <View style={styles.productGrid}>
            {products.map((prod) => (
              <TouchableOpacity
                key={prod._id}
                style={[
                  styles.productChip,
                  selectedProduct._id === prod._id && styles.productChipActive,
                ]}
                onPress={() => setSelectedProduct(prod)}
              >
                <Text
                  style={[
                    styles.productChipText,
                    selectedProduct._id === prod._id && styles.productChipTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {prod.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Materials & Color</Text>
          <View style={styles.materialRow}>
            {MATERIALS.map((mat) => (
              <TouchableOpacity
                key={mat.key}
                style={[
                  styles.materialSwatch,
                  { backgroundColor: mat.color },
                  activeMaterial === mat.key && styles.materialSwatchActive,
                ]}
                onPress={() => setActiveMaterial(mat.key)}
              >
                {activeMaterial === mat.key ? (
                  <Text style={styles.materialCheck}>✓</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.materialLabel}>
            Selected material: <Text style={styles.materialValue}>{activeMaterial}</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Design Details</Text>
          <Text style={styles.description}>
            {baseDescription || 'No detailed description for this piece yet.'}
          </Text>
          {specsList.map((feat, idx) => (
            <View key={idx} style={styles.specRow}>
              <View style={styles.specDot} />
              <Text style={styles.specText}>{feat}</Text>
            </View>
          ))}

          <AppButton
            title="View Product Page"
            onPress={() => navigation.navigate('ProductDetail', { id: selectedProduct._id })}
            style={{ marginTop: 24 }}
          />
        </View>
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
  liveBadge: {
    backgroundColor: 'rgba(113,90,62,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeText: {
    ...typography.caps,
    fontSize: 9,
    color: colors.secondary,
  },
  modelViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  hintBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hintText: {
    ...typography.label,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  viewport: {
    height: 380,
    backgroundColor: colors.surfaceContainer,
    position: 'relative',
    marginBottom: 0,
  },
  viewportImage: {
    width: '100%',
    height: '100%',
  },
  viewportOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  viewportLabel: {
    ...typography.caps,
    fontSize: 9,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  viewportHint: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  modelUrlBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  modelUrlText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  panel: {
    paddingHorizontal: spacing.mobile,
    paddingTop: 24,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  productHeader: { marginBottom: 16 },
  categoryBadge: {
    ...typography.caps,
    fontSize: 10,
    color: colors.secondary,
    backgroundColor: 'rgba(113,90,62,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  productName: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.onSurfaceVariant,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginVertical: 20,
  },
  sectionTitle: {
    ...typography.caps,
    fontSize: 11,
    color: colors.onSurface,
    marginBottom: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  productChip: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  productChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  productChipText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  productChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  materialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  materialSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialSwatchActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  materialCheck: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  materialLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  materialValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  specDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginTop: 6,
  },
  specText: {
    flex: 1,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.mobile,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.outline,
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
});
