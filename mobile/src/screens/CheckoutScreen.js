import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import {
  Header,
  AppButton,
  AppInput,
  ErrorBox,
  LoadingScreen,
} from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80';

const SHIPPING_FEE = 150;
const TAX_RATE = 0.08;

function parseCheckoutParams(checkoutUrl, orderRes) {
  let orderCode = orderRes?.order?.orderCode ?? orderRes?.orderCode;
  let amount =
    orderRes?.order?.totalAmount ??
    orderRes?.totalAmount ??
    orderRes?.amount;

  if (checkoutUrl) {
    try {
      const url = new URL(checkoutUrl);
      orderCode = url.searchParams.get('orderCode') || orderCode;
      amount = url.searchParams.get('amount') || amount;
    } catch {
      const codeMatch = checkoutUrl.match(/orderCode=([^&]+)/);
      const amountMatch = checkoutUrl.match(/amount=([^&]+)/);
      if (codeMatch) orderCode = codeMatch[1];
      if (amountMatch) amount = amountMatch[1];
    }
  }

  return { orderCode, amount };
}

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [availableAddresses, setAvailableAddresses] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const list = [];

    if (user) {
      if (user.streetAddress) {
        list.push({
          streetAddress: user.streetAddress,
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || '',
          isDefault: true,
          fullName: user.fullName || 'Default Recipient',
          phone: user.phone || '',
        });
      }

      if (user.addresses && user.addresses.length > 0) {
        user.addresses.forEach((addr) => {
          list.push({
            streetAddress: addr.address,
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zipCode || '',
            isDefault: addr.isDefault || false,
            fullName: addr.fullName,
            phone: addr.phone,
          });
        });
      }
    }

    setAvailableAddresses(list);

    if (list.length > 0) {
      setShippingAddress({
        streetAddress: list[0].streetAddress,
        city: list[0].city,
        state: list[0].state,
        zipCode: list[0].zipCode,
      });
    } else {
      setEditMode(true);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api('/cart');
      if (!res.items || res.items.length === 0) {
        navigation.replace('Cart');
        return;
      }
      setCartItems(res.items);
    } catch (err) {
      setError('Failed to fetch cart items.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (index) => {
    setSelectedAddressIndex(index);
    const addr = availableAddresses[index];
    if (addr) {
      setShippingAddress({
        streetAddress: addr.streetAddress,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
      });
      setEditMode(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.streetAddress?.trim()) {
      setError('Please select or enter a shipping address.');
      return;
    }

    setPlacingOrder(true);
    setError('');

    try {
      const itemsToOrder = cartItems.map((cartItem) => ({
        item: cartItem.item._id,
        quantity: cartItem.quantity,
      }));

      const res = await api('/orders', {
        method: 'POST',
        body: {
          items: itemsToOrder,
          shippingAddress,
        },
      });

      if (res.checkoutUrl) {
        const { orderCode, amount } = parseCheckoutParams(res.checkoutUrl, res);
        navigation.replace('MockPayment', { orderCode, amount });
      } else {
        navigation.replace('Settings', { activeTab: 'orders' });
      }
    } catch (err) {
      setError(err.message || 'Failed to place order');
      setPlacingOrder(false);
    }
  };

  const subtotal = cartItems.reduce(
    (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
    0
  );
  const shippingEstimate = SHIPPING_FEE;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + shippingEstimate + tax;

  if (loading) {
    return <LoadingScreen label="Loading checkout..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        showBack
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.headerLink}>Cart</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepLabel}>1. Information & Shipping</Text>
        <Text style={styles.pageTitle}>Checkout</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <Text style={styles.fieldValue}>{user?.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TouchableOpacity onPress={() => setEditMode((v) => !v)}>
              <Text style={styles.editLink}>
                {editMode ? 'Use Saved' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {!editMode && availableAddresses.length > 0 ? (
            availableAddresses.map((addr, idx) => (
              <TouchableOpacity
                key={`addr-${idx}`}
                style={[
                  styles.addressCard,
                  selectedAddressIndex === idx && styles.addressCardActive,
                ]}
                onPress={() => handleAddressSelect(idx)}
              >
                <View style={styles.radioOuter}>
                  {selectedAddressIndex === idx ? (
                    <View style={styles.radioInner} />
                  ) : null}
                </View>
                <View style={styles.addressContent}>
                  <Text style={styles.addressTag}>
                    {addr.isDefault ? 'Default Shipping' : `Saved Address ${idx + 1}`}
                  </Text>
                  <Text style={styles.addressName}>{addr.fullName}</Text>
                  <Text style={styles.addressLine}>{addr.streetAddress}</Text>
                  {(addr.city || addr.state || addr.zipCode) ? (
                    <Text style={styles.addressLine}>
                      {[addr.city, addr.state, addr.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  ) : null}
                  {addr.phone ? (
                    <Text style={styles.addressPhone}>Phone: {addr.phone}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.editForm}>
              {availableAddresses.length === 0 ? (
                <View style={styles.noAddressBox}>
                  <Text style={styles.noAddressText}>
                    No saved address found. Enter your shipping details below or
                    add one in Settings.
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Text style={styles.settingsLink}>Go to Settings</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <AppInput
                label="Street Address"
                value={shippingAddress.streetAddress}
                onChangeText={(v) => handleAddressChange('streetAddress', v)}
                placeholder="123 Main Street"
              />
              <AppInput
                label="City"
                value={shippingAddress.city}
                onChangeText={(v) => handleAddressChange('city', v)}
                placeholder="Ho Chi Minh City"
              />
              <AppInput
                label="State / Province"
                value={shippingAddress.state}
                onChangeText={(v) => handleAddressChange('state', v)}
                placeholder="Ho Chi Minh"
              />
              <AppInput
                label="Zip Code"
                value={shippingAddress.zipCode}
                onChangeText={(v) => handleAddressChange('zipCode', v)}
                placeholder="700000"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {cartItems.map((cartItem) => (
            <View key={cartItem.item._id} style={styles.summaryItem}>
              <View style={styles.summaryImageWrap}>
                <Image
                  source={{ uri: cartItem.item.image || FALLBACK_IMAGE }}
                  style={styles.summaryImage}
                  contentFit="cover"
                />
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>{cartItem.quantity}</Text>
                </View>
              </View>
              <View style={styles.summaryItemInfo}>
                <Text style={styles.summaryItemName} numberOfLines={2}>
                  {cartItem.item.name}
                </Text>
                <Text style={styles.summaryItemQty}>
                  Qty: {cartItem.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {formatVnd(cartItem.item.price * cartItem.quantity)}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatVnd(subtotal)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Shipping</Text>
              <Text style={styles.breakdownValue}>
                {formatVnd(shippingEstimate)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tax (8%)</Text>
              <Text style={styles.breakdownValue}>{formatVnd(tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatVnd(grandTotal)}</Text>
            </View>
          </View>
        </View>

        <ErrorBox message={error} />

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.backLink}>← Return to Cart</Text>
          </TouchableOpacity>

          <AppButton
            title={placingOrder ? 'Placing Order...' : 'Place Order'}
            onPress={handlePlaceOrder}
            disabled={placingOrder}
            style={styles.placeBtn}
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
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
  },
  stepLabel: {
    ...typography.label,
    marginTop: 8,
    marginBottom: 8,
  },
  pageTitle: {
    ...typography.headline,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: 16,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.onSurface,
  },
  editLink: {
    ...typography.caps,
    color: colors.secondary,
    fontSize: 10,
  },
  addressCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  addressCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addressContent: {
    flex: 1,
  },
  addressTag: {
    ...typography.label,
    fontSize: 9,
    opacity: 0.6,
    marginBottom: 6,
  },
  addressName: {
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  addressLine: {
    ...typography.body,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 6,
  },
  editForm: {
    marginTop: 4,
  },
  noAddressBox: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.2)',
    padding: 14,
    marginBottom: 16,
  },
  noAddressText: {
    fontSize: 14,
    color: colors.onErrorContainer,
    marginBottom: 8,
  },
  settingsLink: {
    ...typography.caps,
    color: colors.primary,
    fontSize: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryImageWrap: {
    position: 'relative',
    width: 72,
    height: 88,
    backgroundColor: colors.surfaceContainer,
  },
  summaryImage: {
    width: '100%',
    height: '100%',
  },
  qtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  summaryItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryItemName: {
    ...typography.caps,
    fontSize: 11,
    color: colors.primary,
  },
  summaryItemQty: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  breakdown: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: 16,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    ...typography.body,
  },
  breakdownValue: {
    fontSize: 14,
    color: colors.onSurface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  totalLabel: {
    ...typography.title,
  },
  totalValue: {
    ...typography.headline,
    fontSize: 22,
  },
  actions: {
    gap: 16,
    marginTop: 8,
  },
  backLink: {
    ...typography.caps,
    color: colors.secondary,
  },
  placeBtn: {
    width: '100%',
  },
  headerLink: {
    ...typography.caps,
    color: colors.primary,
  },
});
