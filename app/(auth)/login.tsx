import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';

export default function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={theme.typography.title}>{t('auth.welcomeBackTitle')}</Text>
        <Text style={[theme.typography.body, styles.subtitle]}>{t('auth.welcomeBackSubtitle')}</Text>

        <View style={styles.form}>
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
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={t('actions.signIn')} onPress={handleSubmit} loading={loading} />
        </View>

        <Link href="/(auth)/signup" style={styles.link}>
          <Text style={theme.typography.body}>
            {t('auth.noAccount')} <Text style={styles.linkText}>{t('auth.createOne')}</Text>
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
