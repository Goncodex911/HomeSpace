import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';
import { Header, AppButton, ErrorBox, LoadingScreen } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80';

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

function getTimelineProgress(status) {
  switch (status) {
    case 'pending':
      return 0;
    case 'processing':
      return 50;
    case 'shipped':
      return 75;
    case 'delivered':
      return 100;
    default:
      return 0;
  }
}

function stepActive(status, stepKey) {
  switch (stepKey) {
    case 'placed':
      return true;
    case 'confirmed':
      return ['processing', 'shipped', 'delivered'].includes(status);
    case 'processing':
      return ['processing', 'shipped', 'delivered'].includes(status);
    case 'shipped':
      return ['shipped', 'delivered'].includes(status);
    case 'delivered':
      return status === 'delivered';
    default:
      return false;
  }
}

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route.params?.id || route.params?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order not found');
      setLoading(false);
      return;
    }

    try {
      const data = await api(`/orders/${orderId}`);
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return <LoadingScreen label="Loading Order Details..." />;
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <Header title="Lumina" showBack />
        <View style={styles.centered}>
          <ErrorBox message={error || 'Order not found'} />
          <AppButton
            title="Back to Orders"
            variant="outline"
            onPress={() => navigation.navigate('Settings', { activeTab: 'orders' })}
          />
        </View>
      </View>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const shortId = String(order._id).slice(-6).toUpperCase();
  const isCancelled = order.status === 'cancelled';
  const progressWidth = isCancelled ? 0 : getTimelineProgress(order.status);
  const canCancel = order.status === 'pending' || order.status === 'processing';
  const canReturn =
    order.status === 'delivered' && !order.returnRequest?.isRequested;
  const returnRequested = order.returnRequest?.isRequested;

  return (
    <View style={styles.container}>
      <Header title="Lumina" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.orderId}>Order #{shortId}</Text>
          <Text style={styles.orderDate}>Placed on {orderDate}</Text>
          <View
            style={[
              styles.statusBadge,
              isCancelled && styles.statusBadgeCancelled,
            ]}
          >
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        {!isCancelled && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionLabel}>Tracking</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timelineWrap}>
                <View style={styles.timelineLine} />
                <View
                  style={[styles.timelineProgress, { width: `${progressWidth}%` }]}
                />
                <View style={styles.timelineSteps}>
                  {TIMELINE_STEPS.map((step) => {
                    const active = stepActive(order.status, step.key);
                    return (
                      <View key={step.key} style={styles.timelineStep}>
                        <View
                          style={[
                            styles.timelineDot,
                            active ? styles.timelineDotActive : styles.timelineDotInactive,
                          ]}
                        >
                          <Text style={styles.timelineDotText}>
                            {active ? '✓' : '·'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.timelineLabel,
                            active && styles.timelineLabelActive,
                          ]}
                        >
                          {step.label}
                        </Text>
                        {step.key === 'placed' && (
                          <Text style={styles.timelineSub}>{orderDate}</Text>
                        )}
                        {step.key === 'processing' && order.status === 'processing' && (
                          <Text style={styles.timelineSub}>Est. 3–5 days</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionLabel}>Order Items</Text>
        {order.items?.map((orderItem) => (
          <View key={orderItem._id} style={styles.itemCard}>
            <Image
              source={{ uri: orderItem.item?.image || PLACEHOLDER }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={styles.itemBody}>
              <Text style={styles.itemName}>
                {orderItem.item?.name || 'Unknown Item'}
              </Text>
              <Text style={styles.itemPrice}>{formatVnd(orderItem.price)}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemMetaText}>Qty: {orderItem.quantity}</Text>
                <Text style={styles.itemMetaText}>
                  Subtotal: {formatVnd(orderItem.price * orderItem.quantity)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.infoRow}>
          <View style={[styles.infoCard, styles.infoCardHalf]}>
            <Text style={styles.infoTitle}>Shipping Address</Text>
            <Text style={styles.infoBody}>
              {order.customer?.fullName || 'Customer'}
              {'\n'}
              {order.shippingAddress?.streetAddress}
              {'\n'}
              {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
              {order.shippingAddress?.zipCode}
              {'\n'}Vietnam
            </Text>
            <View style={styles.infoDivider} />
            <Text style={styles.infoSubtitle}>Shipping Method</Text>
            <Text style={styles.infoBold}>Standard Delivery</Text>
          </View>

          <View style={[styles.infoCard, styles.infoCardHalf]}>
            <Text style={styles.infoTitle}>Payment</Text>
            <Text style={styles.infoBody}>
              Status: {order.paymentStatus || 'pending'}
              {'\n'}
              Order code: #{order.orderCode}
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatVnd(order.totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatVnd(0)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatVnd(order.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {canReturn && (
            <AppButton
              title="Return Request"
              variant="outline"
              onPress={() =>
                navigation.navigate('ReturnOrder', { id: order._id })
              }
            />
          )}
          {returnRequested && (
            <View style={styles.returnNotice}>
              <Text style={styles.returnNoticeText}>Return Requested</Text>
            </View>
          )}
          {canCancel && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('CancelOrder', { id: order._id })
              }
              style={styles.cancelLink}
            >
              <Text style={styles.cancelLinkText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
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
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.mobile,
  },
  headerBlock: {
    marginTop: 16,
    marginBottom: 24,
  },
  orderId: {
    ...typography.headline,
    marginBottom: 4,
  },
  orderDate: {
    ...typography.body,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusBadgeCancelled: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...typography.caps,
    color: colors.onPrimary,
    fontSize: 10,
  },
  timelineSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: 12,
  },
  timelineWrap: {
    minWidth: 520,
    paddingVertical: 8,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.4,
  },
  timelineProgress: {
    position: 'absolute',
    top: 20,
    left: 16,
    height: 1,
    backgroundColor: colors.primary,
  },
  timelineSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timelineStep: {
    width: 88,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineDotInactive: {
    backgroundColor: colors.surfaceContainer,
  },
  timelineDotText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  timelineLabel: {
    ...typography.caps,
    fontSize: 8,
    textAlign: 'center',
    color: colors.onSurfaceVariant,
  },
  timelineLabelActive: {
    color: colors.primary,
  },
  timelineSub: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  itemImage: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceContainerLow,
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    ...typography.title,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: 8,
  },
  itemMetaText: {
    ...typography.caps,
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 20,
  },
  infoCardHalf: {
    flex: 1,
    minWidth: 280,
  },
  infoTitle: {
    ...typography.label,
    marginBottom: 12,
  },
  infoBody: {
    ...typography.body,
    color: colors.onSurface,
    lineHeight: 22,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginVertical: 16,
  },
  infoSubtitle: {
    ...typography.caps,
    fontSize: 9,
    marginBottom: 4,
  },
  infoBold: {
    fontWeight: '600',
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 20,
    marginBottom: 24,
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
    color: colors.primary,
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    ...typography.title,
  },
  totalValue: {
    ...typography.headline,
    fontSize: 20,
  },
  actions: {
    gap: 12,
  },
  returnNotice: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  returnNoticeText: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
  },
  cancelLink: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelLinkText: {
    ...typography.caps,
    color: colors.error,
  },
});
