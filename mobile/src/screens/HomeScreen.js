import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { Header, AppButton, LoadingScreen } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDiGW6cAcnwTCfjLdDnsd7xZP42CS9rPVYz05A8QbYQHwuXnoSyqNmGv5LLotdbIwcknSe9c5ZFWi4PjpR9zChdImif72E80Xd_bmlxIkKhGOIT69CDB9HKsh2cAJrFwOWr7MCH2o1QfsNnZp8dm759_M2lz4waBM9grw8Ge_IZOBBXms-FSLAM78HZOeqkk3uxzh7rKcgKAsowORhTR05OVgpV8fTh6UL0b0vAO6rLFOgF5dmmpEs1v1RtRVzgZnev6tB8H_gVB--n';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';

const DEFAULT_PRODUCTS = [
  {
    _id: 'default-1',
    name: 'Ether Arc Lounge Chair',
    price: 24800000,
    description: 'Minimalist wooden chair with sharp architectural lines.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqhinz1WRpRywtmtoOJl-Xjnv3ZbvvTm2JmT-zPfqdWGUzbgVFW3SuEYFW0ePw7PVS5vIYE_7VQNTj3c6aHRykSS0VW_UsqvEEpGUdASGaUd7L-M6e5YH9inLvruE5x1kjWYNWl0iQ5F79sK_-V5BlV6sQG86UWSsMTyCor4_AxC_C2ByrHcb2UIE6WuvBD88KEASLN3SCe4fJDlQK1KneVSBlqKwy78y896DRnsdyEoj5WkUghaOTPykAgZSg3yGgOVN1AhlEPEm',
    category: 'Seating',
    createdAt: new Date().toISOString(),
    quantity: 5,
  },
  {
    _id: 'default-2',
    name: 'Orbital Sphere Lamp',
    price: 9000000,
    description: 'Modern floor lamp with frosted glass shade.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfcBqkWM3r21aDql5wiXK8r1kXDdZYe864IbIjJUXSGVCHKjEyK_UBES8bQM_fStWpzy37DyBN79HsugLf9B74NUc32hFtDivnF4iQMcvK3uAyLhTkfa5JTJ73f2Zl0izH8djHjzV7QHwEJY5FiyxH7sZZhYcBNYlrmU0soGLsyb0lHojl7T_fTfpRH8t9ZuqVqKfuRvXVSRhS2eeStyQk38lfXm3E1M5AxcxbYSvo2Bx9iiENsY4KqiVu2HFJIEq6gf4tU4SySm1k',
    category: 'Lighting',
    createdAt: new Date().toISOString(),
    quantity: 12,
  },
  {
    _id: 'default-3',
    name: 'Monolith Travertine Table',
    price: 76000000,
    description: 'Heavy travertine marble dining table.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXTVBsxtaabBH2J27cPb743kO_wPxof7yVDuNbR2VmrU1aQwAPxJt05kRu9X5kYNSfHznuKJ2MD2J38XPhwutH9eSDBmXVp3AsoxlmWUVBuywXJt8kDR5nWsPIGUKYRpiV2JdRzf8o5BlHknMcoNjfPBYefT04tn-l_wLr50QqMb2Hny0fwWR3euuGWGI1hu8QkPJHdt6bfwxVo98uI0PicozHCn0Hrct2nr2T5VIVJ_cb6W9sVlVwKY0nihRf6ycr4MUW_ejNTZb7',
    category: 'Tables',
    createdAt: new Date().toISOString(),
    quantity: 3,
  },
  {
    _id: 'default-4',
    name: 'Stratus Modular Sofa',
    price: 112000000,
    description: 'Modular sofa in light pebble grey bouclé.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAo0TFeq2XW3kTWiVvdUs-6HkTCbtUDvNOShLeF_DrVZPK_L7-f7WGbvvIW5c26zkOkQXCmTD2xHwFZjtwhpNI-aH8vPQ8sORWWRW-ml8W4S4cVHwKzxgJEBOZT2rIl8742AjVzhJwzDD34k7WqMkN-CGxwKshpuodtVVOHe9htIoY46E3UM9Ge257eymDu9vyHgn8Wc3M3M9RUaTnNhW7KUPz3LfQ85fMQZvr92C6skzsJnq4-CJALH2GMUyyNCA5zAT-K20qVLp_R',
    category: 'Living Room',
    createdAt: new Date().toISOString(),
    quantity: 2,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.mobile * 2 - GRID_GAP) / 2;

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('New Arrivals');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api('/items/all');
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const displayProducts = useMemo(() => {
    const list = items.length > 0 ? items : DEFAULT_PRODUCTS;

    if (activeCategory === 'Best Sellers') {
      return [...list]
        .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
        .slice(0, 8);
    }

    return [...list]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);
  }, [items, activeCategory]);

  const headerRight = (
    <View style={styles.headerActions}>
      {token ? (
        <>
          {user?.role === 'admin' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminDashboard')}
              style={styles.roleBtn}
            >
              <Text style={styles.roleBtnText}>Admin</Text>
            </TouchableOpacity>
          ) : null}
          {user?.role === 'store' || user?.role === 'admin' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('StoreDashboard')}
              style={[styles.roleBtn, styles.roleBtnPrimary]}
            >
              <Text style={[styles.roleBtnText, styles.roleBtnTextPrimary]}>Store</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('VendorRegister')}
              style={styles.roleBtnOutline}
            >
              <Text style={styles.roleBtnOutlineText}>Curator</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.iconBtn}
          >
            <Text style={styles.iconText}>🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconBtn}
          >
            <Text style={styles.iconText}>👤</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.signInLink}>Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return <LoadingScreen label="Loading collection..." />;
  }

  return (
    <View style={styles.container}>
      <Header title="Lumina" right={headerRight} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>The Art of{'\n'}Refined Living</Text>
            <AppButton
              title="Explore Collection"
              onPress={() => navigation.navigate('Catalog')}
              style={styles.heroBtn}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Seasonal Selection</Text>
          <Text style={styles.sectionTitle}>Curated for You</Text>

          <View style={styles.chipRow}>
            {['New Arrivals', 'Best Sellers'].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.grid}>
            {displayProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.productCard}
                onPress={() =>
                  navigation.navigate('ProductDetail', { id: product._id })
                }
                activeOpacity={0.85}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: product.image || FALLBACK_IMAGE }}
                    style={styles.productImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {product.model3d ? (
                    <View style={styles.badge3d}>
                      <Text style={styles.badge3dText}>3D</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>{formatVnd(product.price)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppButton
            title="View Full Catalog"
            variant="outline"
            onPress={() => navigation.navigate('Catalog')}
            style={styles.catalogBtn}
          />
        </View>

        <View style={styles.studioSection}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcS_cC93TlAgHuOI0P7abpiS6h2tNvVXWlinm6YtRoguLs1fdyAGD24ucZXx64woxQ2K2Nxz1P-KdaPW6E1JpKDuMluouPSYeG3xREU_Ni7H5xAvdzw4J8-lq5ZlSvBisGDfg1P6xIwUTSR7_SRR1zBOWRmFzPUl-ZxOA3xjwgQJuRvWvZeJdk0EjUHJrv-K9xvTr23bhOnh9xuP42rhRaFahIqHcAZfK301x1q8Lq9RfHN3YZEmRvb8FApRTEML2pQatJFJ68Q9Sz',
            }}
            style={styles.studioImage}
            contentFit="cover"
          />
          <View style={styles.studioOverlay} />
          <View style={styles.studioContent}>
            <Text style={styles.studioLabel}>Lumina Studio</Text>
            <Text style={styles.studioTitle}>
              Visualize your space in high-fidelity 3D
            </Text>
            <AppButton
              title="Start Designing"
              variant="secondary"
              onPress={() => navigation.navigate('RoomBuilder')}
              style={styles.studioBtn}
            />
          </View>
        </View>

        {user ? (
          <View style={styles.greetingBar}>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.greetingName}>{user.fullName}</Text>
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  iconText: {
    fontSize: 20,
  },
  signInLink: {
    ...typography.caps,
    color: colors.primary,
  },
  roleBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  roleBtnPrimary: {
    backgroundColor: colors.primary,
  },
  roleBtnText: {
    ...typography.caps,
    fontSize: 9,
    color: colors.onSecondary,
  },
  roleBtnTextPrimary: {
    color: colors.onPrimary,
  },
  roleBtnOutline: {
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  roleBtnOutlineText: {
    ...typography.caps,
    fontSize: 9,
    color: colors.secondary,
  },
  heroWrap: {
    height: 420,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 48,
    left: spacing.mobile,
    right: spacing.mobile,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#ffffff',
    marginBottom: 24,
    lineHeight: 40,
  },
  heroBtn: {
    alignSelf: 'flex-start',
  },
  section: {
    paddingHorizontal: spacing.mobile,
    paddingVertical: 32,
    backgroundColor: colors.surfaceContainerLow,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.secondary,
    marginBottom: 8,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: 4,
  },
  chip: {
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  chipActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  chipText: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 10,
    overflow: 'hidden',
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
    fontSize: 15,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  catalogBtn: {
    marginTop: 24,
  },
  studioSection: {
    height: 320,
    position: 'relative',
    marginBottom: 24,
  },
  studioImage: {
    width: '100%',
    height: '100%',
  },
  studioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  studioContent: {
    position: 'absolute',
    bottom: 32,
    left: spacing.mobile,
    right: spacing.mobile,
  },
  studioLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  studioTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: 20,
    lineHeight: 30,
  },
  studioBtn: {
    alignSelf: 'flex-start',
  },
  greetingBar: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 32,
  },
  greetingText: {
    ...typography.body,
  },
  greetingName: {
    color: colors.primary,
    fontWeight: '600',
  },
});
