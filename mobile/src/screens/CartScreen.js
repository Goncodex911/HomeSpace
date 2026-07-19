import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { Header, AppButton, ErrorBox, LoadingScreen } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const FALLBACK_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAl1GXaqF0bq-4NtcLTvEhVfImrFCJvko7FVsjzt8jR5Dx9S07fyuJAFrtZdK3_MADw_dUc6Yc_kAUgdm99HtevAWWm2GjlWobDveKoORvwc281pxGo64mT7brXyQ5cNRvtnIpMfPexGxBgDGXHjcgJHnyu80MDejSci63tlQwjHRBZT32XhBHNwk6UFXJHHc5xevPS03CflIiBy-Vn3fR8vSekKYXFKLi4DFREwRCmFt-15RykOuatjvVjr_cPZaa1cW-fnGkS9WeL';

const SHIPPING_FEE = 150;
const TAX_RATE = 0.08;

export default function CartScreen() {
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setCartItems([]);
      return;
    }

    try {
      setError('');
      const res = await api('/cart');
      setCartItems(res.items || []);
    } catch (err) {
      setError('Failed to fetch cart items.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCart();
    }, [fetchCart])
  );

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingId(itemId);
    try {
      const res = await api(`/cart/${itemId}`, {
        method: 'PUT',
        body: { quantity: newQuantity },
      });
      setCartItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
      fetchCart();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    try {
      const res = await api(`/cart/${itemId}`, { method: 'DELETE' });
      setCartItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    if (!token) {
      navigation.navigate('SignIn');
      return;
    }
    if (cartItems.length === 0) return;
    navigation.navigate('Checkout');
  };

  const subtotal = cartItems.reduce(
    (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
    0
  );
  const shippingEstimate = cartItems.length > 0 ? SHIPPING_FEE : 0;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + shippingEstimate + tax;

  if (loading) {
    return <LoadingScreen label="Loading cart..." />;
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Header title="Lumina" showBack />
        <View style={styles.authWrap}>
          <Text style={styles.emptyTitle}>Sign in to view your cart</Text>
          <Text style={styles.emptyText}>
            Access your curated selection and proceed to checkout.
          </Text>
          <AppButton
            title="Sign In"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.authBtn}
          />
          <AppButton
            title="Continue Shopping"
            variant="outline"
            onPress={() => navigation.navigate('Home')}
          />
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
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.profileInitial}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Shopping Cart</Text>
          <Text style={styles.pageSubtitle}>
            Review your selection of architectural pieces.
          </Text>
        </View>

        <ErrorBox message={error} />

        {cartItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Explore our collection and add pieces to your cart.
            </Text>
            <AppButton
              title="Continue Shopping"
              onPress={() => navigation.navigate('Home')}
              style={styles.shopBtn}
            />
          </View>
        ) : (
          <>
            {cartItems.map((cartItem) => {
              const isUpdating = updatingId === cartItem.item._id;
              return (
                <View key={cartItem.item._id} style={styles.cartRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ProductDetail', {
                        id: cartItem.item._id,
                      })
                    }
                  >
                    <Image
                      source={{ uri: cartItem.item.image || FALLBACK_IMAGE }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>

                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTextBlock}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {cartItem.item.name}
                        </Text>
                        <Text style={styles.itemCategory}>
                          {(cartItem.item.category || 'Product').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        {formatVnd(cartItem.item.price)}
                      </Text>
                    </View>

                    <View style={styles.itemActions}>
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(
                              cartItem.item._id,
                              cartItem.quantity - 1
                            )
                          }
                          disabled={isUpdating || cartItem.quantity <= 1}
                          style={styles.qtyBtn}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{cartItem.quantity}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(
                              cartItem.item._id,
                              cartItem.quantity + 1
                            )
                          }
                          disabled={isUpdating}
                          style={styles.qtyBtn}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemove(cartItem.item._id)}
                        disabled={isUpdating}
                      >
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatVnd(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Estimate</Text>
                <Text style={styles.summaryValue}>
                  {formatVnd(shippingEstimate)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (8%)</Text>
                <Text style={styles.summaryValue}>{formatVnd(tax)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>{formatVnd(grandTotal)}</Text>
              </View>

              <AppButton
                title="Proceed to Checkout"
                onPress={handleCheckout}
                style={styles.checkoutBtn}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
  },
  titleBlock: {
    marginTop: 8,
    marginBottom: 24,
  },
  pageTitle: {
    ...typography.headline,
    marginBottom: 6,
  },
  pageSubtitle: {
    ...typography.body,
  },
  authWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.mobile,
    alignItems: 'center',
  },
  authBtn: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.surfaceContainerLow,
  },
  emptyTitle: {
    ...typography.title,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopBtn: {
    alignSelf: 'stretch',
  },
  profileInitial: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '700',
    color: colors.primary,
  },
  cartRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  itemImage: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceContainerLow,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTextBlock: {
    flex: 1,
  },
  itemName: {
    ...typography.title,
    fontSize: 16,
    marginBottom: 4,
  },
  itemCategory: {
    ...typography.label,
    fontSize: 9,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 16,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyBtnText: {
    fontSize: 18,
    color: colors.primary,
  },
  qtyValue: {
    ...typography.caps,
    minWidth: 20,
    textAlign: 'center',
  },
  removeText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  summary: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 20,
    marginTop: 8,
  },
  summaryTitle: {
    ...typography.title,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    ...typography.body,
  },
  summaryValue: {
    fontSize: 15,
    color: colors.onSurface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 16,
    marginTop: 8,
    marginBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  totalLabel: {
    ...typography.caps,
    color: colors.onSurface,
  },
  totalValue: {
    ...typography.headline,
    fontSize: 22,
  },
  checkoutBtn: {
    width: '100%',
  },
});
