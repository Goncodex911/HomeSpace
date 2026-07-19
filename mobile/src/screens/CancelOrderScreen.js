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

const CANCEL_REASONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'better_price', label: 'Found a better price' },
  { value: 'mistake', label: 'Ordered by mistake' },
  { value: 'shipping_delay', label: 'Shipping delay' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

function SelectField({ label, value, options, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectTrigger, disabled && styles.selectDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            !value && styles.selectPlaceholder,
          ]}
        >
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

export default function CancelOrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route.params?.id || route.params?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [confirmPolicy, setConfirmPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order not found');
      setLoading(false);
      return;
    }

    try {
      const data = await api(`/orders/${orderId}`);
      if (data.status !== 'pending' && data.status !== 'processing') {
        setError('This order cannot be cancelled at this stage.');
      }
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!reason || !confirmPolicy) return;

    setIsSubmitting(true);
    setError('');
    try {
      await api(`/orders/${orderId}/cancel`, {
        method: 'PUT',
        body: { reason, details },
      });
      navigation.navigate('Settings', { activeTab: 'orders' });
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading..." />;
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
  const canSubmit = reason && confirmPolicy && !isSubmitting;

  return (
    <View style={styles.container}>
      <Header title="Lumina" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Cancel Order</Text>
          <Text style={styles.subtitle}>
            We're sorry to hear you'd like to cancel. Please provide a reason below
            so we can improve our atelier service.
          </Text>
        </View>

        <ErrorBox message={error} />

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>Order Details</Text>
              <Text style={styles.summaryId}>#{shortId}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>Placed On</Text>
              <Text style={styles.summaryDate}>
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {order.items?.map((orderItem) => (
            <View key={orderItem._id} style={styles.itemRow}>
              <Image
                source={{ uri: orderItem.item?.image || PLACEHOLDER }}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>
                  {orderItem.item?.name || 'Unknown Item'}
                </Text>
                <Text style={styles.itemQty}>Qty: {orderItem.quantity}</Text>
                <Text style={styles.itemPrice}>{formatVnd(orderItem.price)}</Text>
              </View>
            </View>
          ))}

          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Total Refund</Text>
            <Text style={styles.refundValue}>{formatVnd(order.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <SelectField
            label="Reason for Cancellation"
            value={reason}
            options={CANCEL_REASONS}
            onSelect={setReason}
          />

          <Text style={styles.fieldLabel}>Additional Details (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={details}
            onChangeText={setDetails}
            placeholder="Tell us more about your experience..."
            placeholderTextColor={colors.outlineVariant}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConfirmPolicy((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, confirmPolicy && styles.checkboxChecked]}>
              {confirmPolicy ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand that this action is irreversible and the refund will be
              processed within 5–10 business days to my original payment method.
            </Text>
          </TouchableOpacity>

          <AppButton
            title={isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            onPress={handleCancelOrder}
            disabled={!canSubmit}
            style={styles.submitBtn}
          />
          <AppButton
            title="Keep My Order"
            variant="outline"
            onPress={() => navigation.navigate('Settings', { activeTab: 'orders' })}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Need immediate assistance?</Text>
          <Text style={styles.infoBody}>
            Our concierge team is available 24/7 to help with complex requests or
            modifications to existing orders.
          </Text>
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
    gap: 16,
  },
  headerBlock: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    ...typography.headline,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  summaryLabel: {
    ...typography.caps,
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 4,
  },
  summaryId: {
    ...typography.title,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryDate: {
    ...typography.body,
    color: colors.onSurface,
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
    height: 72,
    backgroundColor: colors.surfaceContainer,
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    ...typography.title,
    fontSize: 15,
    marginBottom: 4,
  },
  itemQty: {
    ...typography.body,
    fontSize: 13,
    marginBottom: 4,
  },
  itemPrice: {
    fontWeight: '600',
    color: colors.primary,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  refundLabel: {
    fontWeight: '600',
    color: colors.onSurface,
  },
  refundValue: {
    fontWeight: '700',
    color: colors.secondary,
  },
  formCard: {
    backgroundColor: 'rgba(244,244,240,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.35)',
    padding: 20,
    marginBottom: 20,
  },
  fieldWrap: {
    marginBottom: 20,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectDisabled: {
    opacity: 0.5,
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
    marginLeft: 8,
  },
  textArea: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.onSurface,
    minHeight: 120,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...typography.body,
    flex: 1,
    fontSize: 14,
  },
  submitBtn: {
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    padding: 16,
  },
  infoTitle: {
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  infoBody: {
    ...typography.body,
    fontSize: 14,
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
