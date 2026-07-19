import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';
import { Header, AppButton, ErrorBox } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

export default function MockPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const orderCode = route.params?.orderCode;
  const amount = route.params?.amount;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async (status) => {
    if (!orderCode) {
      setError('Missing order code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api('/payment/confirm-payment', {
        method: 'POST',
        body: {
          orderCode: Number(orderCode),
          status,
        },
      });

      if (status === 'success') {
        navigation.navigate('Cart', { status: 'success', orderCode: String(orderCode) });
      } else {
        navigation.navigate('Settings', { activeTab: 'orders' });
      }
    } catch (err) {
      setError(err.message || 'Failed to update payment status.');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ATELIER_ORDER_${orderCode}_AMOUNT_${amount}`;

  return (
    <View style={styles.container}>
      <Header title="Lumina" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cổng Thanh Toán Giả Lập</Text>
            <Text style={styles.cardSub}>
              Đang hoạt động ở chế độ Demo (Thiếu PayOS API Keys)
            </Text>
          </View>

          <ErrorBox message={error} />

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
              <Text style={styles.detailValue}>#{orderCode || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số tiền thanh toán:</Text>
              <Text style={styles.detailAmount}>
                {formatVnd(amount || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrFrame}>
              <Image source={{ uri: qrUrl }} style={styles.qrImage} />
            </View>
            <Text style={styles.qrHint}>
              Quét mã QR để chuyển khoản giả lập
            </Text>
            <Text style={styles.qrSub}>
              Hoặc nhấn nút xác nhận bên dưới để hoàn tất giao dịch
            </Text>
          </View>

          <View style={styles.actions}>
            <AppButton
              title={loading ? 'Đang xử lý...' : 'Xác nhận Đã chuyển khoản thành công'}
              onPress={() => handleConfirm('success')}
              disabled={loading}
            />
            <AppButton
              title="Hủy thanh toán"
              variant="outline"
              onPress={() => handleConfirm('cancel')}
              disabled={loading}
            />
            <AppButton
              title="Về giỏ hàng"
              variant="secondary"
              onPress={() => navigation.navigate('Cart')}
              disabled={loading}
            />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.mobile,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.4)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  cardHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: 'rgba(238,238,234,0.5)',
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  detailAmount: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 16,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrFrame: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.secondary,
    backgroundColor: colors.background,
    padding: 12,
    marginBottom: 12,
  },
  qrImage: {
    width: 192,
    height: 192,
  },
  qrHint: {
    ...typography.caps,
    fontSize: 10,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  qrSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(196,199,199,0.2)',
  },
});
