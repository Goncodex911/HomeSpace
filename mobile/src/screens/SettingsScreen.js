import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { vietnamAddressData } from '../services/vietnamAddressData';
import {
  Header,
  AppButton,
  AppInput,
  ErrorBox,
  LoadingScreen,
} from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { formatVnd } from '../utils/format';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'orders', label: 'Orders' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'notifications', label: 'Alerts' },
  { key: 'curator', label: 'Curator' },
];

function SelectField({ label, value, options, onSelect, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.selectWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.selectTrigger, disabled && styles.selectDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {selected?.label || placeholder}
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
              data={options}
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

function SuccessBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.successBox}>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token, loading: authLoading, logout, updateProfile } =
    useContext(AuthContext);

  const [activeTab, setActiveTab] = useState(route.params?.activeTab || 'profile');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    occupation: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 1,
      name: 'Alexander Vance',
      phone: '+84 912 345 678',
      streetAddress: '742 Nguyễn Huệ, Phường Bến Nghé',
      city: 'Quận 1',
      state: 'Hồ Chí Minh',
      zipCode: '700000',
      isDefault: true,
    },
    {
      id: 2,
      name: 'Alexander Vance (Studio Office)',
      phone: '+84 903 888 999',
      streetAddress: 'Căn hộ 402, Tòa nhà Artisan, Đường Cầu Giấy',
      city: 'Quận Cầu Giấy',
      state: 'Hà Nội',
      zipCode: '100000',
      isDefault: false,
    },
  ]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    securityAlerts: true,
  });
  const [notifSuccess, setNotifSuccess] = useState(false);

  const provinces = Object.keys(vietnamAddressData);
  const profileDistricts = formData.state
    ? vietnamAddressData[formData.state] || []
    : [];
  const addressDistricts = addressForm.state
    ? vietnamAddressData[addressForm.state] || []
    : [];

  const provinceOptions = provinces.map((p) => ({ value: p, label: p }));
  const profileDistrictOptions = profileDistricts.map((d) => ({
    value: d,
    label: d,
  }));
  const addressDistrictOptions = addressDistricts.map((d) => ({
    value: d,
    label: d,
  }));

  const isStoreOrAdmin = user && (user.role === 'store' || user.role === 'admin');
  const visibleTabs = TABS.filter(
    (tab) => tab.key !== 'curator' || user?.role === 'customer'
  );

  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  useEffect(() => {
    if (!authLoading && !token) {
      navigation.replace('SignIn');
    }
  }, [authLoading, token, navigation]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        occupation: user.occupation || '',
        streetAddress: user.streetAddress || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await api('/orders');
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      setOrdersError(err.message || 'Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders' && token) {
      fetchOrders();
    }
  }, [activeTab, token, fetchOrders]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDiscard = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        occupation: user.occupation || '',
        streetAddress: user.streetAddress || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
      setSuccessMsg('');
      setErrorMsg('');
    }
  };

  const handleSubmitProfile = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await updateProfile(formData);
      setIsSaved(true);
      setSuccessMsg(res.message || 'Profile updated successfully.');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = () => {
    if (
      !addressForm.name ||
      !addressForm.phone ||
      !addressForm.streetAddress ||
      !addressForm.state ||
      !addressForm.city
    ) {
      return;
    }

    const newAddress = { id: Date.now(), ...addressForm };
    if (addressForm.isDefault) {
      setSavedAddresses((prev) =>
        prev.map((addr) => ({ ...addr, isDefault: false })).concat(newAddress)
      );
    } else {
      setSavedAddresses((prev) => prev.concat(newAddress));
    }

    setAddressForm({
      name: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false,
    });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    setSavedAddresses((prev) => prev.filter((addr) => addr.id !== id));
  };

  const handleSetDefaultAddress = (id) => {
    setSavedAddresses((prev) =>
      prev.map((addr) => ({ ...addr, isDefault: addr.id === id }))
    );
  };

  const handleSaveNotifications = () => {
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  };

  const navigateCurator = () => {
    if (isStoreOrAdmin) {
      navigation.navigate('StoreDashboard');
    } else {
      navigation.navigate('VendorRegister');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return colors.secondary;
    if (status === 'cancelled') return colors.error;
    return colors.primary;
  };

  if (authLoading) {
    return <LoadingScreen label="Loading Account..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        showBack
        right={
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutLink}>Logout</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Account Settings</Text>
        <Text style={styles.pageSub}>Manage your profile and preferences.</Text>
        {user?.fullName ? (
          <Text style={styles.greeting}>Hello, {user.fullName}</Text>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {visibleTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Profile Information</Text>
            <ErrorBox message={errorMsg} />
            <SuccessBox message={successMsg} />

            <AppInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(v) => handleChange('fullName', v)}
            />
            <AppInput
              label="Email Address"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(v) => handleChange('phone', v)}
              keyboardType="phone-pad"
            />
            <AppInput
              label="Occupation"
              value={formData.occupation}
              onChangeText={(v) => handleChange('occupation', v)}
            />

            <Text style={styles.sectionHeading}>Delivery Address</Text>
            <AppInput
              label="Street Address"
              value={formData.streetAddress}
              onChangeText={(v) => handleChange('streetAddress', v)}
            />

            <SelectField
              label="Province / City"
              value={formData.state}
              options={provinceOptions}
              placeholder="-- Select Province --"
              onSelect={(v) =>
                setFormData((prev) => ({ ...prev, state: v, city: '' }))
              }
            />
            <SelectField
              label="District"
              value={formData.city}
              options={profileDistrictOptions}
              placeholder="-- Select District --"
              disabled={!formData.state}
              onSelect={(v) => handleChange('city', v)}
            />
            <AppInput
              label="ZIP Code"
              value={formData.zipCode}
              onChangeText={(v) => handleChange('zipCode', v)}
            />

            <View style={styles.profileActions}>
              <TouchableOpacity onPress={handleDiscard}>
                <Text style={styles.discardLink}>Discard Changes</Text>
              </TouchableOpacity>
              <AppButton
                title={
                  isSaving
                    ? 'Saving...'
                    : isSaved
                      ? 'Profile Updated'
                      : 'Save Profile'
                }
                onPress={handleSubmitProfile}
                disabled={isSaving}
                variant={isSaved ? 'secondary' : 'primary'}
                style={styles.saveBtn}
              />
            </View>
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Order History</Text>
            <Text style={styles.panelSub}>
              Review your seasonal orders and delivery updates.
            </Text>

            {ordersLoading ? (
              <Text style={styles.loadingText}>Loading Orders...</Text>
            ) : ordersError ? (
              <ErrorBox message={ordersError} />
            ) : orders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No orders yet.</Text>
                <AppButton
                  title="Start Shopping"
                  variant="outline"
                  onPress={() => navigation.navigate('Home')}
                />
              </View>
            ) : (
              orders.map((order) => (
                <View key={order._id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderMetaLabel}>Order ID</Text>
                      <Text style={styles.orderMetaValue}>
                        #{String(order._id).slice(-6).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.orderMetaLabel}>Date</Text>
                      <Text style={styles.orderMetaValue}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.orderMetaLabel}>Status</Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(order.status) },
                          ]}
                        />
                        <Text style={styles.orderMetaValue}>{order.status}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={styles.orderMetaLabel}>Total</Text>
                      <Text style={styles.orderMetaValue}>
                        {formatVnd(order.totalAmount)}
                      </Text>
                    </View>
                  </View>

                  {order.items?.map((item, idx) => (
                    <View key={item._id || idx} style={styles.orderItemRow}>
                      <Image
                        source={{
                          uri: item.item?.image || PLACEHOLDER,
                        }}
                        style={styles.orderItemImage}
                        contentFit="cover"
                      />
                      <View style={styles.orderItemBody}>
                        <Text style={styles.orderItemName}>
                          {item.item?.name || 'Unknown Item'}
                        </Text>
                        <Text style={styles.orderItemMeta}>
                          Qty: {item.quantity} · {formatVnd(item.price)}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.orderActions}>
                    <AppButton
                      title="View Details"
                      variant="outline"
                      onPress={() =>
                        navigation.navigate('OrderDetail', { id: order._id })
                      }
                      style={styles.orderActionBtn}
                    />
                    {(order.status === 'pending' ||
                      order.status === 'processing') && (
                      <AppButton
                        title="Cancel"
                        variant="outline"
                        onPress={() =>
                          navigation.navigate('CancelOrder', { id: order._id })
                        }
                        style={styles.orderActionBtn}
                      />
                    )}
                    {order.status === 'delivered' &&
                      !order.returnRequest?.isRequested && (
                        <AppButton
                          title="Return"
                          variant="outline"
                          onPress={() =>
                            navigation.navigate('ReturnOrder', { id: order._id })
                          }
                          style={styles.orderActionBtn}
                        />
                      )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'addresses' && (
          <View style={styles.panel}>
            <View style={styles.addressHeader}>
              <View style={styles.flex}>
                <Text style={styles.panelTitle}>Saved Addresses</Text>
                <Text style={styles.panelSub}>
                  Manage your alternate delivery points in Vietnam.
                </Text>
              </View>
              {!showAddressForm && (
                <AppButton
                  title="Add New"
                  onPress={() => setShowAddressForm(true)}
                  style={styles.addAddressBtn}
                />
              )}
            </View>

            {showAddressForm && (
              <View style={styles.addressForm}>
                <Text style={styles.formTitle}>New Delivery Address</Text>
                <AppInput
                  label="Recipient Name"
                  value={addressForm.name}
                  onChangeText={(v) =>
                    setAddressForm((prev) => ({ ...prev, name: v }))
                  }
                />
                <AppInput
                  label="Phone"
                  value={addressForm.phone}
                  onChangeText={(v) =>
                    setAddressForm((prev) => ({ ...prev, phone: v }))
                  }
                  keyboardType="phone-pad"
                />
                <AppInput
                  label="Street Address"
                  value={addressForm.streetAddress}
                  onChangeText={(v) =>
                    setAddressForm((prev) => ({ ...prev, streetAddress: v }))
                  }
                />
                <SelectField
                  label="Province / City"
                  value={addressForm.state}
                  options={provinceOptions}
                  placeholder="-- Select Province --"
                  onSelect={(v) =>
                    setAddressForm((prev) => ({ ...prev, state: v, city: '' }))
                  }
                />
                <SelectField
                  label="District"
                  value={addressForm.city}
                  options={addressDistrictOptions}
                  placeholder="-- Select District --"
                  disabled={!addressForm.state}
                  onSelect={(v) =>
                    setAddressForm((prev) => ({ ...prev, city: v }))
                  }
                />
                <AppInput
                  label="ZIP Code"
                  value={addressForm.zipCode}
                  onChangeText={(v) =>
                    setAddressForm((prev) => ({ ...prev, zipCode: v }))
                  }
                />
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() =>
                    setAddressForm((prev) => ({
                      ...prev,
                      isDefault: !prev.isDefault,
                    }))
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      addressForm.isDefault && styles.checkboxChecked,
                    ]}
                  >
                    {addressForm.isDefault ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as default address</Text>
                </TouchableOpacity>
                <View style={styles.formActions}>
                  <TouchableOpacity onPress={() => setShowAddressForm(false)}>
                    <Text style={styles.discardLink}>Cancel</Text>
                  </TouchableOpacity>
                  <AppButton title="Save Address" onPress={handleAddAddress} />
                </View>
              </View>
            )}

            {savedAddresses.map((addr) => (
              <View
                key={addr.id}
                style={[
                  styles.addressCard,
                  addr.isDefault && styles.addressCardDefault,
                ]}
              >
                <View style={styles.addressCardHeader}>
                  <Text style={styles.addressName}>{addr.name}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressLine}>Phone: {addr.phone}</Text>
                <Text style={styles.addressLine}>{addr.streetAddress}</Text>
                <Text style={styles.addressLine}>
                  {addr.city}, {addr.state}
                </Text>
                {addr.zipCode ? (
                  <Text style={styles.addressLine}>ZIP: {addr.zipCode}</Text>
                ) : null}
                <View style={styles.addressActions}>
                  {!addr.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultAddress(addr.id)}
                    >
                      <Text style={styles.addressActionLink}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'notifications' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Notifications</Text>
            <Text style={styles.panelSub}>
              Select how and when you want to receive notifications.
            </Text>
            <SuccessBox
              message={
                notifSuccess ? 'Notification settings saved successfully.' : ''
              }
            />

            <View style={styles.notifCard}>
              <NotifRow
                title="Order Updates"
                description="Email alerts for shipping and delivery status."
                value={notificationSettings.orderUpdates}
                onValueChange={(v) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    orderUpdates: v,
                  }))
                }
              />
              <NotifRow
                title="Promotions"
                description="Seasonal collections and special events."
                value={notificationSettings.promotions}
                onValueChange={(v) =>
                  setNotificationSettings((prev) => ({ ...prev, promotions: v }))
                }
              />
              <NotifRow
                title="Newsletter"
                description="Monthly design insights from our atelier."
                value={notificationSettings.newsletter}
                onValueChange={(v) =>
                  setNotificationSettings((prev) => ({ ...prev, newsletter: v }))
                }
              />
              <NotifRow
                title="Security Alerts"
                description="Unusual login activity and account changes."
                value={notificationSettings.securityAlerts}
                onValueChange={(v) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    securityAlerts: v,
                  }))
                }
                last
              />
              <AppButton
                title="Save Settings"
                onPress={handleSaveNotifications}
                style={styles.notifSaveBtn}
              />
            </View>
          </View>
        )}

        {activeTab === 'curator' && user?.role === 'customer' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Curator Application</Text>
            <Text style={styles.panelSub}>
              Join our exclusive artisan network and manage your own collection.
            </Text>

            {user.vendorStatus === 'pending' ? (
              <View style={styles.curatorCard}>
                <Text style={styles.curatorIcon}>⏳</Text>
                <Text style={styles.curatorHeading}>
                  Application Status: Pending Review
                </Text>
                <Text style={styles.curatorBody}>
                  Your application for {user.companyName || 'your atelier'} is
                  being reviewed. We will email you at {user.email} once a
                  decision is made.
                </Text>
                <AppButton
                  title="Back to Profile"
                  variant="outline"
                  onPress={() => setActiveTab('profile')}
                />
              </View>
            ) : user.vendorStatus === 'rejected' ? (
              <View style={styles.curatorCard}>
                <Text style={styles.curatorIcon}>✕</Text>
                <Text style={styles.curatorHeading}>
                  Application Status: Rejected
                </Text>
                <Text style={styles.curatorBody}>
                  You may revise your brand philosophy and submit a new
                  application.
                </Text>
                <AppButton title="Re-Apply Now" onPress={navigateCurator} />
              </View>
            ) : (
              <View style={styles.curatorCard}>
                <Text style={styles.curatorHeading}>Partner with Lumina</Text>
                <Text style={styles.curatorBody}>
                  Become a Lumina Curator to showcase and sell your high-end
                  minimalist furniture designs. Access the Store Manager portal
                  to configure products and manage inventory.
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bullet}>✓ List architectural objects</Text>
                  <Text style={styles.bullet}>✓ Unified merchant dashboard</Text>
                  <Text style={styles.bullet}>✓ Direct customer communication</Text>
                </View>
                <AppButton title="Start Application" onPress={navigateCurator} />
              </View>
            )}

            {isStoreOrAdmin && (
              <AppButton
                title="Open Store Dashboard"
                variant="secondary"
                onPress={() => navigation.navigate('StoreDashboard')}
                style={styles.storeDashBtn}
              />
            )}
          </View>
        )}

        <AppButton
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  );
}

function NotifRow({ title, description, value, onValueChange, last }) {
  return (
    <View style={[styles.notifRow, !last && styles.notifRowBorder]}>
      <View style={styles.notifCopy}>
        <Text style={styles.notifTitle}>{title}</Text>
        <Text style={styles.notifDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceContainer, true: colors.primary }}
        thumbColor={colors.surfaceContainerLowest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  pageHeader: {
    paddingHorizontal: spacing.mobile,
    paddingTop: 8,
    paddingBottom: 12,
  },
  pageTitle: {
    ...typography.headline,
    fontSize: 22,
    marginBottom: 4,
  },
  pageSub: {
    ...typography.body,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  logoutLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.error,
  },
  tabBar: {
    maxHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  tabBarContent: {
    paddingHorizontal: spacing.mobile,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 48,
  },
  panel: {
    paddingTop: 20,
  },
  panelTitle: {
    ...typography.title,
    fontSize: 20,
    marginBottom: 6,
  },
  panelSub: {
    ...typography.body,
    marginBottom: 20,
  },
  sectionHeading: {
    ...typography.label,
    marginTop: 8,
    marginBottom: 4,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  discardLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 1,
    maxWidth: 200,
  },
  loadingText: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
  },
  emptyBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    ...typography.title,
  },
  orderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.25)',
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  orderMetaLabel: {
    ...typography.caps,
    fontSize: 8,
    marginBottom: 2,
  },
  orderMetaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(196,199,199,0.2)',
  },
  orderItemImage: {
    width: 64,
    height: 64,
    backgroundColor: colors.surfaceContainer,
  },
  orderItemBody: {
    flex: 1,
    justifyContent: 'center',
  },
  orderItemName: {
    ...typography.title,
    fontSize: 14,
    marginBottom: 4,
  },
  orderItemMeta: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  orderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  orderActionBtn: {
    flexGrow: 1,
    minWidth: 120,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  addAddressBtn: {
    minWidth: 100,
  },
  addressForm: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    ...typography.title,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  addressCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,199,199,0.25)',
    padding: 16,
    marginBottom: 12,
  },
  addressCardDefault: {
    borderColor: colors.primary,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    ...typography.title,
    fontSize: 15,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    ...typography.caps,
    fontSize: 8,
    color: colors.onPrimary,
  },
  addressLine: {
    ...typography.body,
    fontSize: 13,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  addressActionLink: {
    ...typography.caps,
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  deleteLink: {
    ...typography.caps,
    fontSize: 9,
    color: colors.error,
  },
  notifCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  notifRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(196,199,199,0.25)',
  },
  notifCopy: {
    flex: 1,
  },
  notifTitle: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  notifDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  notifSaveBtn: {
    marginTop: 16,
  },
  curatorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  curatorIcon: {
    fontSize: 40,
  },
  curatorHeading: {
    ...typography.title,
    textAlign: 'center',
  },
  curatorBody: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 8,
  },
  bulletList: {
    alignSelf: 'stretch',
    gap: 6,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  storeDashBtn: {
    marginTop: 16,
  },
  signOutBtn: {
    marginTop: 32,
  },
  successBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(113,90,62,0.25)',
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    color: colors.secondary,
    fontSize: 14,
  },
  selectWrap: {
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
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: 12,
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
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...typography.body,
    fontSize: 13,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    maxHeight: '55%',
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
