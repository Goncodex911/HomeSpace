import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';
import { Header, AppButton, ErrorBox, LoadingScreen } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80';

const RETURN_REASONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'damaged', label: 'Damaged upon arrival' },
  { value: 'not-fit', label: "Doesn't fit space" },
  { value: 'style', label: 'Style not as expected' },
  { value: 'other', label: 'Other (Please specify)' },
];

function SelectField({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectTrigger} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {selected?.label || 'Select a reason...'}
        </Text>
        <Text style={styles.selectChevron}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalSheet}>
            <FlatList
              data={options.filter((o) => o.value !== '')}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function ReturnOrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route.params?.id || route.params?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [method, setMethod] = useState('courier');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order not found');
      setLoading(false);
      return;
    }

    try {
      const data = await api(`/orders/${orderId}`);
      if (data.status !== 'delivered') {
        setError('Only delivered orders can be returned.');
      } else if (data.returnRequest?.isRequested) {
        setError('A return request has already been submitted for this order.');
      }
      setOrder(data);
      if (data.items) {
        setSelectedItems(data.items.map((item) => item._id));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleToggleItem = (orderItemId) => {
    setSelectedItems((prev) =>
      prev.includes(orderItemId)
        ? prev.filter((id) => id !== orderItemId)
        : [...prev, orderItemId]
    );
  };

  const handleSubmitReturn = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return.');
      return;
    }
    if (!reason) {
      setError('Please select a reason for return.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const itemsToReturnIds = order.items
        .filter((orderItem) => selectedItems.includes(orderItem._id))
        .map((orderItem) => orderItem.item._id);

      await api(`/orders/${orderId}/return`, {
        method: 'PUT',
        body: {
          reason,
          comments,
          method,
          itemsToReturn: itemsToReturnIds,
        },
      });
      navigation.navigate('Settings', { activeTab: 'orders' });
    } catch (err) {
      setError(err.message || 'Failed to submit return request.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading Return Request..." />;
  }

  if ((error && !order) || !order) {
    return (
      <View style={styles.container}>
        <Header title="Lumina" showBack />
        <View style={styles.centered}>
          <ErrorBox message={error || 'Order not found'} />
          <AppButton title="Go Back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const shortId = String(order._id).slice(-6).toUpperCase();
  const selectedOrderItems = order.items.filter((item) =>
    selectedItems.includes(item._id)
  );
  const estimatedRefund = selectedOrderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const selectedItemCount = selectedOrderItems.reduce(
    (count, item) => count + item.quantity,
    0
  );
  const canSubmit = selectedItems.length > 0 && reason && !isSubmitting;

  return (
    <View style={styles.container}>
      <Header title="Lumina" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backHint} onPress={() => navigation.goBack()}>
          <Text style={styles.backHintText}>← Back to Order #{shortId}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Return Request</Text>
        <ErrorBox message={error} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>01 Select Item(s) to return</Text>
            <Text style={styles.verifiedBadge}>VERIFIED DELIVERY</Text>
          </View>

          {order.items?.map((orderItem) => {
            const checked = selectedItems.includes(orderItem._id);
            return (
              <View key={orderItem._id} style={styles.itemRow}>
                <Image
                  source={{ uri: orderItem.item?.image || PLACEHOLDER }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
                <View style={styles.itemBody}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {orderItem.item?.name || 'Unknown Item'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleToggleItem(orderItem._id)}
                      style={[styles.itemCheck, checked && styles.itemCheckActive]}
                    >
                      {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemQty}>Qty: {orderItem.quantity}</Text>
                    <Text style={styles.itemPrice}>{formatVnd(orderItem.price)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>02 Reason for Return</Text>
          <SelectField
            label=""
            value={reason}
            options={RETURN_REASONS}
            onSelect={setReason}
          />
          <TextInput
            style={styles.textArea}
            value={comments}
            onChangeText={setComments}
            placeholder="Additional comments (Optional)"
            placeholderTextColor={colors.outlineVariant}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>03 Select Return Method</Text>
          <TouchableOpacity
            style={[
              styles.methodOption,
              method === 'courier' && styles.methodOptionActive,
            ]}
            onPress={() => setMethod('courier')}
          >
            <View style={[styles.radio, method === 'courier' && styles.radioActive]} />
            <View>
              <Text style={styles.methodTitle}>Courier Pickup</Text>
              <Text style={styles.methodSub}>Free white-glove collection</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodOption,
              method === 'self' && styles.methodOptionActive,
            ]}
            onPress={() => setMethod('self')}
          >
            <View style={[styles.radio, method === 'self' && styles.radioActive]} />
            <View>
              <Text style={styles.methodTitle}>Self-Return</Text>
              <Text style={styles.methodSub}>Drop off at local showroom</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>Request Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Selected Items ({selectedItemCount})
            </Text>
            <Text style={styles.summaryValue}>{formatVnd(estimatedRefund)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Return Fee</Text>
            <Text style={styles.complimentary}>Complimentary</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryLabel}>Estimated Refund</Text>
            <Text style={styles.summaryTotal}>{formatVnd(estimatedRefund)}</Text>
          </View>

          <Text style={styles.summaryNote}>
            Refunds are processed within 5–7 business days after the item is received
            and inspected at our atelier.
          </Text>

          {method === 'courier' && (
            <View style={styles.addressBox}>
              <Text style={styles.addressLabel}>Collection Address</Text>
              <Text style={styles.addressText}>
                {order.shippingAddress?.streetAddress}
              </Text>
              <Text style={styles.addressText}>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </Text>
              {order.shippingAddress?.zipCode ? (
                <Text style={styles.addressText}>{order.shippingAddress.zipCode}</Text>
              ) : null}
            </View>
          )}
        </View>

        <AppButton
          title={isSubmitting ? 'Submitting...' : 'Submit Return Request'}
          onPress={handleSubmitReturn}
          disabled={!canSubmit}
          style={styles.submitBtn}
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
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.mobile,
    gap: 16,
  },
  backHint: {
    marginTop: 12,
    marginBottom: 8,
  },
  backHintText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  title: {
    ...typography.headline,
    marginBottom: 20,
  },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.primary,
    marginBottom: 12,
  },
  verifiedBadge: {
    ...typography.caps,
    fontSize: 9,
    color: colors.secondary,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(196,199,199,0.2)',
  },
  itemImage: {
    width: 72,
    height: 96,
    backgroundColor: colors.surfaceContainerLow,
  },
  itemBody: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemName: {
    ...typography.title,
    fontSize: 15,
    flex: 1,
  },
  itemCheck: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCheckActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  itemQty: {
    ...typography.body,
    fontSize: 13,
  },
  itemPrice: {
    fontWeight: '600',
    color: colors.primary,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 15,
    color: colors.onSurface,
    flex: 1,
  },
  selectPlaceholder: {
    color: colors.outlineVariant,
  },
  selectChevron: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  textArea: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.onSurface,
    minHeight: 100,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    marginBottom: 10,
  },
  methodOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  radioActive: {
    borderWidth: 5,
    borderColor: colors.primary,
  },
  methodTitle: {
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  methodSub: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 20,
    marginBottom: 24,
  },
  summaryHeading: {
    ...typography.label,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    fontWeight: '700',
    color: colors.onSurface,
  },
  complimentary: {
    fontWeight: '700',
    color: colors.secondary,
  },
  summaryTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryTotal: {
    fontWeight: '700',
    color: colors.primary,
  },
  summaryNote: {
    ...typography.body,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  addressBox: {
    backgroundColor: colors.surfaceContainer,
    padding: 16,
    marginTop: 16,
  },
  addressLabel: {
    ...typography.caps,
    fontSize: 9,
    marginBottom: 8,
  },
  addressText: {
    ...typography.body,
    color: colors.onSurface,
  },
  submitBtn: {
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    maxHeight: '50%',
    paddingBottom: 24,
  },
  modalOption: {
    paddingHorizontal: spacing.mobile,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  modalOptionText: {
    fontSize: 15,
    color: colors.onSurface,
  },
});
