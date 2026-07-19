import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';
import {
  Header,
  AppButton,
  AppInput,
  ErrorBox,
  LoadingScreen,
} from '../components/ui';

const WITHDRAW_FILTERS = ['all', 'pending', 'accepted', 'rejected'];

const REJECT_REASONS = [
  'Incomplete documentation',
  'Portfolio not aligned with brand',
  'Duplicate application',
  'Other',
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { user, token, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('vendors');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawFilter, setWithdrawFilter] = useState('all');
  const [activeWithdrawal, setActiveWithdrawal] = useState(null);
  const [rejectWithdrawModal, setRejectWithdrawModal] = useState(false);
  const [rejectWithdrawNote, setRejectWithdrawNote] = useState('');
  const [withdrawActionLoading, setWithdrawActionLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/auth/admin/vendor-applications');
      const apps = res.data || res.applications || [];
      setApplications(apps);
      if (apps.length > 0 && !activeId) {
        const pendingApp = apps.find((app) => app.vendorStatus === 'pending') || apps[0];
        setActiveId(pendingApp._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch vendor applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setWithdrawLoading(true);
      const res = await api('/payment/withdraw/admin/all');
      setWithdrawals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals();
  }, [activeTab]);

  const handleApprove = (id) => {
    Alert.alert('Approve Application', 'Approve this curator application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setError('');
            setSuccess('');
            await api(`/auth/admin/approve-vendor/${id}`, { method: 'PUT' });
            setSuccess('Application approved. Role upgraded to store.');
            fetchApplications();
          } catch (err) {
            setError(err.message || 'Failed to approve application');
          }
        },
      },
    ]);
  };

  const handleRejectSubmit = async () => {
    if (!activeId) return;
    const finalReason = customReason.trim() || rejectReason;
    try {
      setError('');
      setSuccess('');
      await api(`/auth/admin/reject-vendor/${activeId}`, {
        method: 'PUT',
        body: { reason: finalReason },
      });
      setSuccess('Application rejected.');
      setRejectModalOpen(false);
      setCustomReason('');
      fetchApplications();
    } catch (err) {
      setError(err.message || 'Failed to reject application');
    }
  };

  const handleWithdrawalAction = async (id, action, note = '') => {
    setWithdrawActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api(`/payment/withdraw/admin/${id}`, {
        method: 'PUT',
        body: { action, note },
      });
      setSuccess(
        action === 'accept'
          ? 'Withdrawal approved and disbursed.'
          : 'Withdrawal request rejected.'
      );
      setRejectWithdrawModal(false);
      setRejectWithdrawNote('');
      setActiveWithdrawal(null);
      fetchWithdrawals();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setWithdrawActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    return (
      app.companyName?.toLowerCase().includes(q) ||
      app.fullName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q)
    );
  });

  const filteredWithdrawals = withdrawals.filter((w) =>
    withdrawFilter === 'all' ? true : w.status === withdrawFilter
  );

  const activeApp = applications.find((app) => app._id === activeId);
  const pendingCount = applications.filter((app) => app.vendorStatus === 'pending').length;
  const pendingWithdrawCount = withdrawals.filter((w) => w.status === 'pending').length;

  if (loading && activeTab === 'vendors') {
    return <LoadingScreen label="Loading Admin Dashboard..." />;
  }

  const renderVendorsTab = () => (
    <View style={styles.tabBody}>
      <AppInput
        label="Search applications"
        placeholder="Company, name, email..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <Text style={styles.countLabel}>
        {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
        {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listScroll}>
        {filteredApps.map((app) => (
          <TouchableOpacity
            key={app._id}
            style={[styles.appCard, activeId === app._id && styles.appCardActive]}
            onPress={() => setActiveId(app._id)}
          >
            <Text style={styles.appCardName} numberOfLines={1}>
              {app.companyName || app.fullName}
            </Text>
            <Text style={styles.appCardMeta}>{app.businessType}</Text>
            <View
              style={[
                styles.miniBadge,
                app.vendorStatus === 'pending' && styles.miniBadgePending,
                app.vendorStatus === 'approved' && styles.miniBadgeApproved,
                app.vendorStatus === 'rejected' && styles.miniBadgeRejected,
              ]}
            >
              <Text style={styles.miniBadgeText}>{app.vendorStatus}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeApp ? (
        <View style={styles.detailPanel}>
          <Text style={styles.detailTitle}>{activeApp.companyName || activeApp.fullName}</Text>
          <Text style={styles.detailSub}>
            {activeApp.fullName} · {activeApp.email}
          </Text>

          <View style={styles.detailGrid}>
            <DetailRow label="Business Type" value={activeApp.businessType} />
            <DetailRow label="Tax ID" value={activeApp.taxId} />
            <DetailRow label="Years" value={String(activeApp.yearsInIndustry ?? '—')} />
            <DetailRow label="Phone" value={activeApp.phone || '—'} />
            <DetailRow label="Status" value={activeApp.vendorStatus} />
          </View>

          {activeApp.philosophy ? (
            <View style={styles.philosophyBox}>
              <Text style={styles.philosophyLabel}>Philosophy</Text>
              <Text style={styles.philosophyText}>"{activeApp.philosophy}"</Text>
            </View>
          ) : null}

          {activeApp.vendorStatus === 'pending' ? (
            <View style={styles.actionRow}>
              <AppButton
                title="Approve"
                onPress={() => handleApprove(activeApp._id)}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Reject"
                variant="outline"
                onPress={() => setRejectModalOpen(true)}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No applications to display.</Text>
        </View>
      )}
    </View>
  );

  const renderWithdrawalsTab = () => (
    <View style={styles.tabBody}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {WITHDRAW_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, withdrawFilter === f && styles.filterChipActive]}
            onPress={() => setWithdrawFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                withdrawFilter === f && styles.filterChipTextActive,
              ]}
            >
              {f} ({withdrawals.filter((w) => (f === 'all' ? true : w.status === f)).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {withdrawLoading ? (
        <Text style={styles.loadingHint}>Loading withdrawals...</Text>
      ) : filteredWithdrawals.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No withdrawal requests.</Text>
        </View>
      ) : (
        filteredWithdrawals.map((w) => (
          <TouchableOpacity
            key={w._id}
            style={[
              styles.withdrawCard,
              activeWithdrawal?._id === w._id && styles.withdrawCardActive,
            ]}
            onPress={() => setActiveWithdrawal(w)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.withdrawAmount}>{formatVnd(w.amount)}</Text>
              <Text style={styles.withdrawStore}>
                {w.store?.companyName || w.store?.fullName || 'Store'}
              </Text>
              <Text style={styles.withdrawBank}>
                {w.bankName} · {w.accountNumber}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                w.status === 'pending' && styles.statusPending,
                w.status === 'accepted' && styles.statusAccepted,
                w.status === 'rejected' && styles.statusRejected,
              ]}
            >
              <Text style={styles.statusBadgeText}>{w.status}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {activeWithdrawal ? (
        <View style={styles.detailPanel}>
          <Text style={styles.detailTitle}>Withdrawal Detail</Text>
          <DetailRow label="Amount" value={formatVnd(activeWithdrawal.amount)} />
          <DetailRow label="Bank" value={activeWithdrawal.bankName} />
          <DetailRow label="Account" value={activeWithdrawal.accountNumber} />
          <DetailRow label="Holder" value={activeWithdrawal.accountHolder} />
          <DetailRow label="Status" value={activeWithdrawal.status} />
          {activeWithdrawal.store?.walletBalance !== undefined ? (
            <DetailRow
              label="Store Wallet"
              value={formatVnd(activeWithdrawal.store.walletBalance)}
            />
          ) : null}
          {activeWithdrawal.note ? (
            <DetailRow label="Note" value={activeWithdrawal.note} />
          ) : null}

          {activeWithdrawal.status === 'pending' ? (
            <View style={styles.actionRow}>
              <AppButton
                title={withdrawActionLoading ? 'Processing...' : 'Approve & Disburse'}
                onPress={() => handleWithdrawalAction(activeWithdrawal._id, 'accept')}
                disabled={withdrawActionLoading}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Reject"
                variant="outline"
                onPress={() => setRejectWithdrawModal(true)}
                disabled={withdrawActionLoading}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Atelier Admin"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.headerLink}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await logout();
                navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
              }}
            >
              <Text style={styles.headerLink}>Logout</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {!token || user?.role !== 'admin' ? (
        <View style={{ flex: 1, padding: spacing.mobile, justifyContent: 'center' }}>
          <ErrorBox message="Admin access required. Please sign in with an admin account." />
          <AppButton title="Sign In" onPress={() => navigation.navigate('SignIn')} />
        </View>
      ) : (
        <>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendors' && styles.tabActive]}
          onPress={() => setActiveTab('vendors')}
        >
          <Text style={[styles.tabText, activeTab === 'vendors' && styles.tabTextActive]}>
            Vendors
          </Text>
          {pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'withdrawals' && styles.tabActive]}
          onPress={() => setActiveTab('withdrawals')}
        >
          <Text style={[styles.tabText, activeTab === 'withdrawals' && styles.tabTextActive]}>
            Withdrawals
          </Text>
          {pendingWithdrawCount > 0 ? (
            <View style={[styles.badge, styles.badgeAmber]}>
              <Text style={styles.badgeText}>{pendingWithdrawCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.adminGreeting}>
          Signed in as {user?.fullName || 'Admin'}
        </Text>

        <ErrorBox message={error} />
        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{success}</Text>
          </View>
        ) : null}

        {activeTab === 'vendors' ? renderVendorsTab() : renderWithdrawalsTab()}
      </ScrollView>

      {/* Vendor reject modal */}
      <Modal visible={rejectModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Application</Text>
            {REJECT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.reasonOption}
                onPress={() => setRejectReason(reason)}
              >
                <View style={[styles.radio, rejectReason === reason && styles.radioActive]} />
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.customReasonInput}
              placeholder="Custom reason (optional)"
              placeholderTextColor={colors.outlineVariant}
              value={customReason}
              onChangeText={setCustomReason}
            />
            <View style={styles.modalActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setRejectModalOpen(false)} />
              <View style={{ flex: 1 }}>
                <AppButton title="Confirm Reject" onPress={handleRejectSubmit} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdrawal reject modal */}
      <Modal visible={rejectWithdrawModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Withdrawal</Text>
            <TextInput
              style={styles.customReasonInput}
              placeholder="Rejection note for the store"
              placeholderTextColor={colors.outlineVariant}
              value={rejectWithdrawNote}
              onChangeText={setRejectWithdrawNote}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setRejectWithdrawModal(false)}
              />
              <View style={{ flex: 1 }}>
                <AppButton
                  title={withdrawActionLoading ? 'Processing...' : 'Confirm Reject'}
                  disabled={withdrawActionLoading}
                  onPress={() =>
                    handleWithdrawalAction(activeWithdrawal._id, 'reject', rejectWithdrawNote)
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
        </>
      )}
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.caps,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeAmber: {
    backgroundColor: '#C8860A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
    paddingTop: 12,
  },
  adminGreeting: {
    ...typography.label,
    marginBottom: 16,
  },
  tabBody: {},
  countLabel: {
    ...typography.label,
    marginBottom: 12,
  },
  listScroll: { marginBottom: 16 },
  appCard: {
    width: 160,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
  appCardActive: {
    borderColor: colors.primary,
    borderLeftWidth: 4,
  },
  appCardName: {
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  appCardMeta: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  miniBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.surfaceContainer,
  },
  miniBadgePending: { backgroundColor: '#FFF3CD' },
  miniBadgeApproved: { backgroundColor: '#D4EDDA' },
  miniBadgeRejected: { backgroundColor: colors.errorContainer },
  miniBadgeText: {
    ...typography.caps,
    fontSize: 8,
  },
  detailPanel: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 20,
    marginTop: 8,
  },
  detailTitle: {
    ...typography.headline,
    fontSize: 22,
    marginBottom: 4,
  },
  detailSub: {
    ...typography.body,
    marginBottom: 16,
  },
  detailGrid: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  detailLabel: {
    ...typography.label,
    fontSize: 9,
  },
  detailValue: {
    fontSize: 14,
    color: colors.onSurface,
    maxWidth: '60%',
    textAlign: 'right',
  },
  philosophyBox: {
    backgroundColor: colors.surfaceContainer,
    padding: 14,
    marginBottom: 16,
  },
  philosophyLabel: {
    ...typography.label,
    marginBottom: 6,
  },
  philosophyText: {
    fontStyle: 'italic',
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  filterScroll: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12,
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
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  loadingHint: {
    ...typography.body,
    marginBottom: 16,
  },
  withdrawCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
  withdrawCardActive: {
    borderColor: colors.primary,
    borderLeftWidth: 4,
  },
  withdrawAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  withdrawStore: {
    fontSize: 13,
    color: colors.onSurface,
    marginTop: 2,
  },
  withdrawBank: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surfaceContainer,
  },
  statusPending: { backgroundColor: '#FFF3CD' },
  statusAccepted: { backgroundColor: '#D4EDDA' },
  statusRejected: { backgroundColor: colors.errorContainer },
  statusBadgeText: {
    ...typography.caps,
    fontSize: 9,
    color: colors.primary,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
  },
  emptyText: {
    ...typography.body,
  },
  successBanner: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.mobile,
  },
  modalBox: {
    backgroundColor: colors.background,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modalTitle: {
    ...typography.headline,
    fontSize: 20,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  customReasonInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.onSurface,
    marginTop: 8,
    marginBottom: 16,
    minHeight: 44,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
