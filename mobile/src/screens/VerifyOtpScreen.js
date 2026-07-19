import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { Header, AppButton, AppInput, ErrorBox } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { resetToRoleHome } from '../utils/roles';

function SuccessBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.successBox}>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export default function VerifyOtpScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { verifyOtp, resendOtp } = useContext(AuthContext);

  const paramEmail = route.params?.email || '';
  const redirectTo = route.params?.redirectTo;

  const [email, setEmail] = useState(paramEmail);
  const [showEmailInput, setShowEmailInput] = useState(!paramEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!email.trim()) {
      setError('Please provide your email address');
      setShowEmailInput(true);
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email.trim(), otpCode);
      setMessage('Account verified successfully. Welcome to Lumina!');
      setTimeout(() => {
        if (redirectTo) {
          navigation.reset({ index: 0, routes: [{ name: redirectTo }] });
        } else {
          resetToRoleHome(navigation, res.user);
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    if (!email.trim()) {
      setError('Please enter your email to resend OTP');
      setShowEmailInput(true);
      return;
    }

    setError('');
    setMessage('');
    try {
      await resendOtp(email.trim());
      setMessage('Verification code resent. Please check your console.');
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    }
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
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to your email address. Please enter it below
              to activate your account.
            </Text>
          </View>

          <ErrorBox message={error} />
          <SuccessBox message={message} />

          {showEmailInput ? (
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
          ) : (
            <View style={styles.emailBanner}>
              <Text style={styles.emailBannerText}>
                Verifying <Text style={styles.emailBold}>{email}</Text>
              </Text>
              <TouchableOpacity onPress={() => setShowEmailInput(true)}>
                <Text style={styles.changeEmail}>Change Email</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.otpRow}>
            {otp.map((val, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputRefs.current[idx] = ref;
                }}
                style={[styles.otpInput, val ? styles.otpInputFilled : null]}
                maxLength={1}
                keyboardType="number-pad"
                value={val}
                onChangeText={(v) => handleChange(idx, v)}
                onKeyPress={(e) => handleKeyPress(idx, e)}
                selectTextOnFocus
              />
            ))}
          </View>

          <AppButton
            title={loading ? 'Verifying...' : 'Verify Code'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitBtn}
          />

          <View style={styles.resendBlock}>
            <Text style={styles.resendHint}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0}
            >
              <Text
                style={[
                  styles.resendLink,
                  resendCooldown > 0 && styles.resendLinkDisabled,
                ]}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.backLinkText}>Back to Sign In</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  emailBannerText: {
    ...typography.body,
    flex: 1,
    marginRight: 12,
  },
  emailBold: {
    fontWeight: '600',
    color: colors.onSurface,
  },
  changeEmail: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    flex: 1,
    height: 64,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '300',
    color: colors.onSurface,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: 'transparent',
  },
  otpInputFilled: {
    borderBottomColor: colors.primary,
  },
  submitBtn: {
    marginBottom: 24,
  },
  resendBlock: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  resendHint: {
    ...typography.body,
  },
  resendLink: {
    ...typography.caps,
    color: colors.primary,
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
});
