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
import { resetToRoleHome } from '../utils/roles';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      resetToRoleHome(navigation, res.user);
    } catch (err) {
      const msg = err.message || 'Login failed';
      if (
        msg.includes('not verified') ||
        msg.includes('unverified') ||
        err.unverified
      ) {
        navigation.navigate('VerifyOtp', { email: email.trim() });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Lumina"
        right={
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.headerLink}>Sign Up</Text>
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Access your curated collection and design preferences.
            </Text>
          </View>

          <ErrorBox message={error} />

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

          <View style={styles.passwordHeader}>
            <Text style={styles.passwordLabel}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordRow}>
            <AppInput
              style={styles.passwordInput}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.showBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <AppButton
            title={loading ? 'Signing In...' : 'Sign In'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('SignUp')}>
                Sign Up
              </Text>
            </Text>
          </View>
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
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
  },
  headerLink: {
    ...typography.caps,
    color: colors.onSurfaceVariant,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordLabel: {
    ...typography.label,
  },
  forgotLink: {
    ...typography.caps,
    color: colors.secondary,
    fontSize: 10,
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
    marginTop: 24,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
