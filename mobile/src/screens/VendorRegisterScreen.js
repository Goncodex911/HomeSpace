import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { colors, typography, spacing } from '../theme';
import { Header, AppButton, AppInput, ErrorBox, LoadingScreen } from '../components/ui';

const PENDING_KEY = 'pending_vendor_application';

const BUSINESS_TYPES = [
  'Independent Designer',
  'Furniture Manufacturer',
  'Architectural Firm',
  'Interior Stylist',
];

export default function VendorRegisterScreen() {
  const navigation = useNavigation();
  const { user, token, register, applyVendor } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [taxId, setTaxId] = useState('');
  const [yearsInIndustry, setYearsInIndustry] = useState('1');
  const [philosophy, setPhilosophy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkPendingSubmission = async () => {
      if (!user || !token) return;
      try {
        const pendingData = await AsyncStorage.getItem(PENDING_KEY);
        if (!pendingData) return;

        const parsed = JSON.parse(pendingData);
        await AsyncStorage.removeItem(PENDING_KEY);
        setLoading(true);
        await applyVendor({
          companyName: parsed.companyName,
          businessType: parsed.businessType,
          taxId: parsed.taxId,
          yearsInIndustry: Number(parsed.yearsInIndustry),
          philosophy: parsed.philosophy,
          phone: parsed.phone,
          fullName: user.fullName,
        });
        setSuccessMessage('Account verified and curator application submitted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to submit vendor details automatically');
      } finally {
        setLoading(false);
      }
    };
    checkPendingSubmission();
  }, [user, token, applyVendor]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleNextStep = () => {
    setError('');
    if (user) {
      setStep(2);
      return;
    }
    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all personal information fields and choose a password');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!companyName || !businessType || !taxId || !yearsInIndustry || !philosophy) {
      setError('Please fill in all business details and brand philosophy');
      setLoading(false);
      return;
    }

    try {
      if (user) {
        await applyVendor({
          companyName,
          businessType,
          taxId,
          yearsInIndustry: Number(yearsInIndustry),
          philosophy,
          phone,
          fullName,
        });
        setSuccessMessage(
          'Your curator application has been submitted and is pending admin approval.'
        );
      } else {
        await register(fullName, email, password);
        const businessData = {
          companyName,
          businessType,
          taxId,
          yearsInIndustry: Number(yearsInIndustry),
          philosophy,
          phone,
        };
        await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(businessData));
        navigation.navigate('VerifyOtp', { email, redirectTo: 'VendorRegister' });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !successMessage && step === 1 && user?.vendorStatus === 'none') {
    return <LoadingScreen label="Processing application..." />;
  }

  if (user && user.vendorStatus && user.vendorStatus !== 'none' && !successMessage) {
    if (user.vendorStatus === 'pending') {
      return (
        <View style={styles.container}>
          <Header title="Lumina" showBack />
          <View style={styles.statusWrap}>
            <Text style={styles.statusIcon}>⏳</Text>
            <Text style={styles.statusTitle}>Application Under Review</Text>
            <Text style={styles.statusBody}>
              Dear {user.fullName}, thank you for applying to become a Lumina Curator. Your
              application for{' '}
              <Text style={styles.bold}>{user.companyName || 'your atelier'}</Text> is currently
              under review by our design directors.
            </Text>
            <Text style={styles.statusNote}>
              We review every portfolio to ensure brand alignment. You will receive a notification
              once a decision has been reached.
            </Text>
            <AppButton title="Return to Settings" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>
      );
    }

    if (user.vendorStatus === 'approved') {
      return (
        <View style={styles.container}>
          <Header title="Lumina" />
          <View style={styles.statusWrap}>
            <Text style={styles.statusIcon}>✓</Text>
            <Text style={styles.statusTitle}>Welcome to the Atelier</Text>
            <Text style={styles.statusBody}>
              Your application is approved! You are registered as an official Lumina Curator.
            </Text>
            <AppButton
              title="Open Store Dashboard"
              onPress={() => navigation.navigate('StoreDashboard')}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      );
    }

    if (user.vendorStatus === 'rejected') {
      return (
        <View style={styles.container}>
          <Header title="Lumina" showBack />
          <View style={styles.statusWrap}>
            <Text style={[styles.statusIcon, { color: colors.error }]}>✕</Text>
            <Text style={styles.statusTitle}>Application Not Approved</Text>
            <Text style={styles.statusBody}>
              Unfortunately, your curator application for{' '}
              <Text style={styles.bold}>{user.companyName || 'your atelier'}</Text> was not approved
              at this time.
            </Text>
            {user.vendorRejectionReason ? (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Reason</Text>
                <Text style={styles.reasonText}>{user.vendorRejectionReason}</Text>
              </View>
            ) : null}
            <Text style={styles.statusNote}>
              You may update your portfolio and reapply, or contact support for more information.
            </Text>
            <AppButton
              title="Back to Settings"
              variant="outline"
              onPress={() => navigation.navigate('Settings')}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        showBack={!!user}
        right={
          user ? (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.cancelLink}>Sign In</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Curator Partnership</Text>
        <Text style={styles.title}>Become a Lumina Curator</Text>
        <Text style={styles.subtitle}>
          Join our exclusive network of master artisans and design studios curated for discerning
          collectors.
        </Text>

        <ErrorBox message={error} />

        {successMessage ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
            <AppButton
              title="Go to Settings"
              onPress={() => navigation.navigate('Settings')}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <>
            <View style={styles.progressRow}>
              <View style={[styles.progressBar, styles.progressBarActive]} />
              <View style={[styles.progressBar, step >= 2 && styles.progressBarActive]} />
              <Text style={styles.stepLabel}>Step {step} of 2</Text>
            </View>

            {step === 1 ? (
              <View style={styles.formSection}>
                <Text style={styles.formHeading}>Personal Information</Text>

                {user ? (
                  <View style={styles.profileCard}>
                    <Text style={styles.profileLabel}>Applicant Profile</Text>
                    <Text style={styles.profileName}>{user.fullName}</Text>
                    <Text style={styles.profileEmail}>{user.email}</Text>
                    <Text style={styles.profileHint}>
                      You are logged in. We will link your vendor application to this account.
                    </Text>
                  </View>
                ) : (
                  <>
                    <AppInput
                      label="Full Name"
                      placeholder="Alexandre Moreau"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                    <AppInput
                      label="Professional Email"
                      placeholder="atelier@lumina.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <AppInput
                      label="Phone Number"
                      placeholder="+84 912 345 678"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                    <AppInput
                      label="Account Password"
                      placeholder="Choose a secure password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </>
                )}

                <AppButton title="Continue to Business Details" onPress={handleNextStep} />
              </View>
            ) : (
              <View style={styles.formSection}>
                <Text style={styles.formHeading}>Business Specifics</Text>

                <AppInput
                  label="Company / Atelier Name"
                  placeholder="Moreau Architecture & Design"
                  value={companyName}
                  onChangeText={setCompanyName}
                />

                <Text style={styles.inputLabel}>Business Type</Text>
                <View style={styles.typeRow}>
                  {BUSINESS_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, businessType === type && styles.typeChipActive]}
                      onPress={() => setBusinessType(type)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          businessType === type && styles.typeChipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <AppInput
                  label="Tax ID / VAT Number"
                  placeholder="VAT123456789"
                  value={taxId}
                  onChangeText={setTaxId}
                />
                <AppInput
                  label="Years in Industry"
                  placeholder="5"
                  value={yearsInIndustry}
                  onChangeText={setYearsInIndustry}
                  keyboardType="number-pad"
                />

                <Text style={[styles.formHeading, { marginTop: 8 }]}>Ethos & Philosophy</Text>
                <AppInput
                  label="Brand Philosophy"
                  placeholder="Tell us about your design approach..."
                  value={philosophy}
                  onChangeText={setPhilosophy}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />

                <View style={styles.actionRow}>
                  <AppButton title="Previous" variant="outline" onPress={() => setStep(1)} />
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title={loading ? 'Submitting...' : 'Submit Application'}
                      onPress={handleSubmit}
                      disabled={loading}
                    />
                  </View>
                </View>
              </View>
            )}
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
    paddingTop: 8,
  },
  cancelLink: {
    ...typography.caps,
    fontSize: 10,
    color: colors.primary,
  },
  eyebrow: {
    ...typography.label,
    color: colors.secondary,
    marginBottom: 8,
  },
  title: {
    ...typography.headline,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surfaceContainer,
  },
  progressBarActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    ...typography.label,
    marginLeft: 8,
  },
  formSection: { gap: 0 },
  formHeading: {
    ...typography.title,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: 12,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 20,
  },
  profileLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  profileEmail: {
    ...typography.body,
    marginBottom: 8,
  },
  profileHint: {
    fontSize: 12,
    color: colors.outline,
    fontStyle: 'italic',
  },
  inputLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  typeChipTextActive: {
    color: colors.onPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  successBox: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: 20,
  },
  successText: {
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 22,
  },
  statusWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.mobile,
    paddingBottom: 48,
  },
  statusIcon: {
    fontSize: 56,
    color: colors.secondary,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusBody: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
    color: colors.primary,
  },
  statusNote: {
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  reasonBox: {
    width: '100%',
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.2)',
    padding: 16,
    marginBottom: 16,
  },
  reasonLabel: {
    ...typography.label,
    color: colors.onErrorContainer,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    color: colors.onErrorContainer,
    lineHeight: 20,
  },
});
