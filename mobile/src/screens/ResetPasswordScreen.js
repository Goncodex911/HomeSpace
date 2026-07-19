import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { Header, AppButton, AppInput, ErrorBox } from '../components/ui';
import { colors, typography, spacing } from '../theme';

function SuccessBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.successBox}>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword, resetPassword } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setMessage('A reset OTP has been sent. Please check your console.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword) {
      setError('Please enter the OTP and your new password.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email.trim(), otp.trim(), newPassword);
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setError('');
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        showBack
        right={
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.headerLink}>Sign In</Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Enter your email address and we'll send you an OTP to reset your password."
                : 'Enter the OTP code from your console and your new password.'}
            </Text>
          </View>

          <ErrorBox message={error} />
          <SuccessBox message={message} />

          {step === 1 ? (
            <>
              <AppInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />

              <AppButton
                title={loading ? 'Sending...' : 'Send Reset OTP'}
                onPress={handleRequestReset}
                disabled={loading}
                style={styles.submitBtn}
              />

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => navigation.navigate('SignIn')}
              >
                <Text style={styles.backLinkText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.emailBanner}>
                <Text style={styles.emailBannerText}>
                  Resetting password for{' '}
                  <Text style={styles.emailBold}>{email}</Text>
                </Text>
              </View>

              <AppInput
                label="6-Digit OTP Code"
                placeholder="123456"
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />

              <Text style={styles.passwordLabel}>New Password</Text>
              <View style={styles.passwordRow}>
                <AppInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                />
                <TouchableOpacity
                  style={styles.showBtn}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              <AppButton
                title={loading ? 'Resetting...' : 'Reset Password'}
                onPress={handleResetPassword}
                disabled={loading}
                style={styles.submitBtn}
              />

              <View style={styles.step2Actions}>
                <TouchableOpacity onPress={handleResendEmail}>
                  <Text style={styles.actionLink}>Resend Email</Text>
                </TouchableOpacity>
                <Text style={styles.actionDivider}>|</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.actionLink}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.mobile,
    paddingBottom: 40,
  },
  headerBlock: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    ...typography.headline,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
  },
  headerLink: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
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
  emailBanner: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  emailBannerText: {
    ...typography.body,
  },
  emailBold: {
    fontWeight: '600',
    color: colors.onSurface,
  },
  passwordLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  passwordRow: {
    position: 'relative',
    marginBottom: 8,
  },
  passwordInput: {
    paddingRight: 56,
  },
  showBtn: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  showBtnText: {
    ...typography.caps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
  },
  step2Actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionLink: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
  },
  actionDivider: {
    color: colors.outlineVariant,
  },
});
