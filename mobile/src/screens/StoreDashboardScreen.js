import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
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

const VIEWS = [
  { key: 'overview', label: 'Overview' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'add_product', label: 'Add Product' },
  { key: 'wallet', label: 'Wallet' },
];

const CATEGORIES = ['Seating', 'Tables', 'Lighting', 'Storage', 'Textiles', 'Decor'];

export default function StoreDashboardScreen() {
  const navigation = useNavigation();
  const { user, token, logout } = useContext(AuthContext);

  const [view, setView] = useState('overview');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Seating');
  const [material, setMaterial] = useState('');
  const [image, setImage] = useState('');
  const [model3d, setModel3d] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      setError('');
      const res = await api('/items/my');
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const [balRes, histRes] = await Promise.all([
        api('/payment/wallet'),
        api('/payment/withdraw/my'),
      ]);
      setWalletBalance(balRes.walletBalance || 0);
      setWithdrawals(histRes.data || []);
    } catch (err) {
      console.error('Wallet fetch error:', err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (view === 'wallet') fetchWallet();
  }, [view]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setQuantity('');
    setCategory('Seating');
    setMaterial('');
    setImage('');
    setModel3d('');
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setName(item.name || '');
    setPrice(String(item.price ?? ''));
    setQuantity(String(item.quantity ?? ''));
    setImage(item.image || '');
    setModel3d(item.model3d || '');

    const desc = item.description || '';
    const parts = desc.split('\n\n---\n');
    setDescription(parts[0] || '');

    let itemCategory = 'Seating';
    let itemMaterial = '';
    if (parts.length > 1) {
      const specText = parts[1];
      const catMatch = specText.match(/Category:\s*(.*)/);
      const matMatch = specText.match(/Material:\s*(.*)/);
      if (catMatch) itemCategory = catMatch[1].trim();
      if (matMatch) itemMaterial = matMatch[1].trim();
    }
    setCategory(itemCategory);
    setMaterial(itemMaterial);
    setView('add_product');
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Remove this item from your catalog?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setError('');
            setSuccess('');
            await api(`/items/delete/${id}`, { method: 'DELETE' });
            setSuccess('Product removed from catalog.');
            fetchItems();
          } catch (err) {
            setError(err.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!name || !price || quantity === '') {
      setError('Product name, price, and quantity are required.');
      return;
    }

    let finalDescription = description;
    if (category || material) {
      finalDescription += `\n\n---\nCategory: ${category}\nMaterial: ${material}`;
    }

    setSaving(true);
    try {
      const body = {
        name,
        description: finalDescription,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        image,
        model3d,
      };

      if (editingId) {
        await api(`/items/update/${editingId}`, { method: 'PUT', body });
        setSuccess('Product updated successfully.');
      } else {
        await api('/items/add', { method: 'POST', body });
        setSuccess('Product published to catalog.');
      }

      resetForm();
      setView('inventory');
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawSubmitting(true);
    try {
      await api('/payment/withdraw', {
        method: 'POST',
        body: {
          amount: parseFloat(withdrawAmount),
          bankName: withdrawBank,
          accountNumber: withdrawAccount,
          accountHolder: withdrawHolder,
        },
      });
      setWithdrawSuccess('Withdrawal request submitted. Admin will review shortly.');
      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawAccount('');
      setWithdrawHolder('');
      fetchWallet();
    } catch (err) {
      setWithdrawError(err.message || 'Withdrawal request failed');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  if (loading) {
    return <LoadingScreen label="Loading Store Portal..." />;
  }

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.welcome}>Welcome, {user?.fullName || 'Curator'}</Text>
      <Text style={styles.company}>{user?.companyName || 'Your Atelier'}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatVnd(totalValue)}</Text>
          <Text style={styles.statLabel}>Inventory Value</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatVnd(walletBalance)}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
      </View>

      <AppButton title="Manage Inventory" onPress={() => setView('inventory')} />
      <AppButton
        title="Add New Product"
        variant="outline"
        onPress={() => {
          resetForm();
          setView('add_product');
        }}
        style={{ marginTop: 12 }}
      />
    </View>
  );

  const renderInventory = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => { resetForm(); setView('add_product'); }}>
          <Text style={styles.linkAction}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <AppInput
        label="Search products"
        placeholder="Filter by name..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {filteredItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No products in catalog yet.</Text>
          <AppButton
            title="Add First Product"
            onPress={() => { resetForm(); setView('add_product'); }}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        filteredItems.map((item) => (
          <View key={item._id} style={styles.itemCard}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemThumb} contentFit="cover" />
            ) : (
              <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                <Text style={styles.thumbLetter}>{(item.name || '?')[0]}</Text>
              </View>
            )}
            <View style={styles.itemBody}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatVnd(item.price)}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAddProduct = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {editingId ? 'Edit Product' : 'Add Product'}
      </Text>

      <AppInput label="Product Name *" value={name} onChangeText={setName} />
      <AppInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={{ minHeight: 72, textAlignVertical: 'top' }}
      />
      <AppInput
        label="Price (VND) *"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />
      <AppInput
        label="Quantity *"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />

      <Text style={styles.fieldLabel}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AppInput label="Material" value={material} onChangeText={setMaterial} />
      <AppInput
        label="Image URL"
        placeholder="https://example.com/product.jpg"
        value={image}
        onChangeText={setImage}
        autoCapitalize="none"
      />
      {image ? (
        <Image source={{ uri: image }} style={styles.previewImage} contentFit="cover" />
      ) : null}
      <AppInput
        label="3D Model URL (optional)"
        placeholder="https://example.com/model.glb"
        value={model3d}
        onChangeText={setModel3d}
        autoCapitalize="none"
      />

      <View style={styles.formActions}>
        <AppButton
          title="Cancel"
          variant="outline"
          onPress={() => {
            resetForm();
            setView('inventory');
          }}
        />
        <View style={{ flex: 1 }}>
          <AppButton
            title={saving ? 'Saving...' : editingId ? 'Update Product' : 'Publish Product'}
            onPress={handleSubmit}
            disabled={saving}
          />
        </View>
      </View>
    </View>
  );

  const renderWallet = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Wallet & Withdrawals</Text>

      {walletLoading ? (
        <Text style={styles.loadingHint}>Loading wallet...</Text>
      ) : (
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Available Balance</Text>
          <Text style={styles.walletBalance}>{formatVnd(walletBalance)}</Text>
        </View>
      )}

      {withdrawSuccess ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{withdrawSuccess}</Text>
        </View>
      ) : null}
      <ErrorBox message={withdrawError} />

      <Text style={styles.formHeading}>Request Withdrawal</Text>
      <AppInput
        label="Amount (VND)"
        value={withdrawAmount}
        onChangeText={setWithdrawAmount}
        keyboardType="decimal-pad"
      />
      <AppInput label="Bank Name" value={withdrawBank} onChangeText={setWithdrawBank} />
      <AppInput
        label="Account Number"
        value={withdrawAccount}
        onChangeText={setWithdrawAccount}
        keyboardType="number-pad"
      />
      <AppInput label="Account Holder" value={withdrawHolder} onChangeText={setWithdrawHolder} />
      <AppButton
        title={withdrawSubmitting ? 'Submitting...' : 'Submit Withdrawal Request'}
        onPress={handleWithdrawSubmit}
        disabled={withdrawSubmitting}
      />

      <Text style={[styles.formHeading, { marginTop: 28 }]}>Withdrawal History</Text>
      {withdrawals.length === 0 ? (
        <Text style={styles.emptyHint}>No withdrawal requests yet.</Text>
      ) : (
        withdrawals.map((w) => (
          <View key={w._id} style={styles.withdrawRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.withdrawAmount}>{formatVnd(w.amount)}</Text>
              <Text style={styles.withdrawMeta}>
                {w.bankName} · {w.accountNumber}
              </Text>
              <Text style={styles.withdrawDate}>
                {w.createdAt ? new Date(w.createdAt).toLocaleDateString('vi-VN') : ''}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                w.status === 'accepted' && styles.statusAccepted,
                w.status === 'rejected' && styles.statusRejected,
                w.status === 'pending' && styles.statusPending,
              ]}
            >
              <Text style={styles.statusBadgeText}>{w.status}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Store Portal"
        showBack
        right={
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.headerLink}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.headerLink}>Settings</Text>
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

      {!token || (user?.role !== 'store' && user?.role !== 'admin') ? (
        <View style={{ flex: 1, padding: spacing.mobile, justifyContent: 'center' }}>
          <ErrorBox message="Store access required. Sign in with a store or admin account." />
          <AppButton title="Sign In" onPress={() => navigation.navigate('SignIn')} />
        </View>
      ) : (
        <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navScroll}
        contentContainerStyle={styles.navRow}
      >
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[styles.navTab, view === v.key && styles.navTabActive]}
            onPress={() => setView(v.key)}
          >
            <Text style={[styles.navTabText, view === v.key && styles.navTabTextActive]}>
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchItems();
              if (view === 'wallet') fetchWallet();
            }}
            tintColor={colors.secondary}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <ErrorBox message={error} />
        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{success}</Text>
          </View>
        ) : null}

        {view === 'overview' && renderOverview()}
        {view === 'inventory' && renderInventory()}
        {view === 'add_product' && renderAddProduct()}
        {view === 'wallet' && renderWallet()}
      </ScrollView>
        </>
      )}
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
  navScroll: {
    maxHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  navRow: {
    paddingHorizontal: spacing.mobile,
    gap: 8,
    alignItems: 'center',
  },
  navTab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabActive: {
    borderBottomColor: colors.primary,
  },
  navTabText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  navTabTextActive: {
    color: colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
    paddingTop: 16,
  },
  section: {},
  welcome: {
    ...typography.label,
    color: colors.secondary,
    marginBottom: 4,
  },
  company: {
    ...typography.headline,
    fontSize: 26,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.label,
    fontSize: 9,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.headline,
    fontSize: 22,
    marginBottom: 16,
  },
  linkAction: {
    ...typography.caps,
    fontSize: 10,
    color: colors.secondary,
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
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemThumb: {
    width: 88,
    height: 88,
  },
  itemThumbPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    fontSize: 24,
    color: colors.secondary,
    fontWeight: '300',
  },
  itemBody: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    ...typography.title,
    fontSize: 15,
    marginBottom: 4,
  },
  itemPrice: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  editLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.primary,
  },
  deleteLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.error,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  chipScroll: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  previewImage: {
    width: '100%',
    height: 160,
    marginBottom: 20,
    backgroundColor: colors.surfaceContainer,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  walletCard: {
    backgroundColor: colors.primary,
    padding: 24,
    marginBottom: 24,
  },
  walletLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.onPrimary,
  },
  loadingHint: {
    ...typography.body,
    marginBottom: 16,
  },
  formHeading: {
    ...typography.title,
    marginBottom: 16,
    marginTop: 8,
  },
  emptyHint: {
    ...typography.body,
    fontStyle: 'italic',
  },
  withdrawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  withdrawAmount: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  withdrawMeta: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  withdrawDate: {
    fontSize: 11,
    color: colors.outline,
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
});
