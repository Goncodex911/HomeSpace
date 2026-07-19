import React, { useState, useEffect, useContext } from 'react';
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
import { AuthContext } from '../context/AuthContext';
import { Header, AppButton, ErrorBox, LoadingScreen } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const FALLBACK_IMAGE =
  'https://lh3.googleusercontent.com/aida/AP1WRLtsYoBL8I3wlWpyJs7mzVkJF5uWuIogTZzMFwjPHN3p8eddEFRSQsVWacYL7xIGegczapJYU5PT4GzJGeZMOUR8TPi0A7cDRmo2GG2C2ICILZ-xogzEmkrR5eVL39T-cncCM9fILsX1JmYNy2Uzpz-I0Qz3DCWNxuOor6Ox9z7DcvY5JadAfdM64phEvKOwXqmwasL5E25Y7FbCF58c-_ZGT48imlkvXggXomTBK-sMVqUlI4wQC1q25QQX';

const FINISHES = ['Cream', 'Charcoal', 'Sand'];

const FINISH_COLORS = {
  Cream: '#FAF9F5',
  Charcoal: '#444748',
  Sand: '#D2B48C',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const { token } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSwatch, setActiveSwatch] = useState('Cream');
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product not found.');
        setLoading(false);
        return;
      }

      try {
        const response = await api(`/items/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!token) {
      navigation.navigate('SignIn');
      return;
    }

    setAdding(true);
    setCartMessage('');

    try {
      await api('/cart', {
        method: 'POST',
        body: { itemId: id, quantity: 1 },
      });
      setCartMessage('Added to cart!');
    } catch (err) {
      setCartMessage(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading product..." />;
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <Header title="Lumina" showBack />
        <View style={styles.errorWrap}>
          <ErrorBox message={error || 'Product not found.'} />
          <AppButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        showBack
        right={
          token ? (
            <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
              <Text style={styles.cartLink}>Cart</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.image || FALLBACK_IMAGE }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          {product.model3d ? (
            <View style={styles.badge3d}>
              <Text style={styles.badge3dText}>3D READY</Text>
            </View>
          ) : null}
          {product.category ? (
            <Text style={styles.figLabel}>
              FIG. 01 — {product.category.toUpperCase()}
            </Text>
          ) : null}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.breadcrumb}>
            Collections / {product.category || 'Product'}
          </Text>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatVnd(product.price)}</Text>

          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.customLabel}>Customization — Finish</Text>
          <View style={styles.swatchRow}>
            {FINISHES.map((swatch) => (
              <TouchableOpacity
                key={swatch}
                style={styles.swatchWrap}
                onPress={() => setActiveSwatch(swatch)}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: FINISH_COLORS[swatch] },
                    activeSwatch === swatch && styles.swatchActive,
                  ]}
                />
                <Text style={styles.swatchLabel}>{swatch.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {cartMessage ? (
            <Text
              style={[
                styles.cartMessage,
                cartMessage.includes('Added') && styles.cartMessageSuccess,
              ]}
            >
              {cartMessage}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            <AppButton
              title={adding ? 'Adding...' : 'Add to Cart'}
              onPress={handleAddToCart}
              disabled={adding}
              style={styles.actionBtn}
            />
            {product.model3d ? (
              <AppButton
                title="Room Builder"
                variant="outline"
                onPress={() =>
                  navigation.navigate('RoomBuilder', { productId: product._id })
                }
                style={styles.actionBtn}
              />
            ) : null}
          </View>

          <View style={styles.shippingRow}>
            <Text style={styles.shippingIcon}>🚚</Text>
            <Text style={styles.shippingText}>
              White glove delivery available (4–6 weeks)
            </Text>
          </View>

          <View style={styles.specSection}>
            <Text style={styles.specLabel}>Technical Data</Text>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Stock Status</Text>
              <Text style={styles.specValue}>
                {product.quantity > 0
                  ? `${product.quantity} Available`
                  : 'Out of Stock'}
              </Text>
            </View>
            {product.model3d ? (
              <View style={styles.specRow}>
                <Text style={styles.specKey}>3D Model</Text>
                <Text style={styles.specValue}>Available in Room Builder</Text>
              </View>
            ) : null}
          </View>
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
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.mobile,
  },
  cartLink: {
    ...typography.caps,
    color: colors.primary,
  },
  imageSection: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
    backgroundColor: colors.surfaceContainerLow,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  badge3d: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badge3dText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onPrimary,
  },
  figLabel: {
    position: 'absolute',
    bottom: 16,
    left: spacing.mobile,
    ...typography.label,
    color: 'rgba(26,28,26,0.4)',
  },
  infoSection: {
    paddingHorizontal: spacing.mobile,
    paddingVertical: 24,
  },
  breadcrumb: {
    ...typography.label,
    marginBottom: 12,
  },
  productName: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: colors.primary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 20,
  },
  description: {
    ...typography.body,
    marginBottom: 28,
  },
  customLabel: {
    ...typography.label,
    marginBottom: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  swatchWrap: {
    alignItems: 'center',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  swatchLabel: {
    ...typography.caps,
    fontSize: 9,
    marginTop: 8,
    opacity: 0.6,
  },
  cartMessage: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 12,
  },
  cartMessageSuccess: {
    color: colors.secondary,
  },
  actionRow: {
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    width: '100%',
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    marginBottom: 32,
  },
  shippingIcon: {
    fontSize: 20,
  },
  shippingText: {
    ...typography.body,
    flex: 1,
  },
  specSection: {
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingBottom: 40,
  },
  specLabel: {
    ...typography.label,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  specKey: {
    ...typography.label,
    fontSize: 10,
  },
  specValue: {
    ...typography.body,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
});
