import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';

export default function SignupScreen() {
  const { signUpWithEmail } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: signUpError } = await signUpWithEmail(email.trim(), password, fullName.trim());
    setLoading(false);
    if (signUpError) setError(signUpError);
    else setConfirmSent(true);
  };

  if (confirmSent) {
    return (
      <View style={styles.container}>
        <Text style={theme.typography.title}>Check your email</Text>
        <Text style={[theme.typography.body, styles.subtitle]}>
          We sent a confirmation link to {email}. Verify your email, then sign in.
        </Text>
        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Back to sign in</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={theme.typography.title}>{t('auth.createAccountTitle')}</Text>
        <Text style={[theme.typography.body, styles.subtitle]}>{t('auth.createAccountSubtitle')}</Text>

        <View style={styles.form}>
          <TextField label={t('auth.fullName')} value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={t('actions.signUp')} onPress={handleSubmit} loading={loading} />
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={theme.typography.body}>
            {t('auth.haveAccount')} <Text style={styles.linkText}>{t('auth.signIn')}</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    container: { flexGrow: 1, padding: theme.spacing.lg, justifyContent: 'center', gap: theme.spacing.md },
    subtitle: { color: theme.colors.textMuted },
    form: { gap: theme.spacing.md, marginTop: theme.spacing.lg },
    error: { color: theme.colors.danger },
    link: { marginTop: theme.spacing.xl, alignSelf: 'center' },
    linkText: { color: theme.colors.primary, fontWeight: '600' },
  });
