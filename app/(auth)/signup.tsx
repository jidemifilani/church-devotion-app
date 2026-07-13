import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, spacing, typography } from '@/constants/theme';

export default function SignupScreen() {
  const { signUpWithEmail } = useAuth();
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
        <Text style={typography.title}>Check your email</Text>
        <Text style={[typography.body, styles.subtitle]}>
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
        <Text style={typography.title}>Create your account</Text>
        <Text style={[typography.body, styles.subtitle]}>Join the church community.</Text>

        <View style={styles.form}>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Sign Up" onPress={handleSubmit} loading={loading} />
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={typography.body}>
            Already have an account? <Text style={styles.linkText}>Sign in</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  subtitle: { color: colors.textMuted },
  form: { gap: spacing.md, marginTop: spacing.lg },
  error: { color: colors.danger },
  link: { marginTop: spacing.xl, alignSelf: 'center' },
  linkText: { color: colors.primary, fontWeight: '600' },
});
