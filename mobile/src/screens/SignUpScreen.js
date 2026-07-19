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

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(fullName.trim(), email.trim(), password);
      navigation.navigate('VerifyOtp', { email: email.trim() });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Create Your Atelier Account</Text>
            <Text style={styles.subtitle}>
              Join our curated community of designers and architects.
            </Text>
          </View>

          <ErrorBox message={error} />

          <AppInput
            label="Full Name"
            placeholder="E.g. Julian Vossen"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name"
          />

          <AppInput
            label="Email Address"
            placeholder="julian@atelier.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <Text style={styles.passwordLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <AppInput
              style={styles.passwordInput}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
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
            title={loading ? 'Creating...' : 'Create Account'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('SignIn')}>
                Sign In
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
    backgroundColor: colors.surfaceContainerLowest,
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
