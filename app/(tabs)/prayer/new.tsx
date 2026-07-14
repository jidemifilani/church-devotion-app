import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';

export default function NewPrayerRequestScreen() {
  const { session, profile } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!session || !content.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('prayer_requests').insert({
      user_id: session.user.id,
      content: content.trim(),
      is_anonymous: isAnonymous,
      display_name: isAnonymous ? null : profile?.full_name ?? null,
    });
    setLoading(false);
    if (error) Alert.alert('Could not post', error.message);
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={theme.typography.caption}>What would you like the church to pray for?</Text>
        <TextInput
          style={styles.input}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="Share your prayer request..."
          placeholderTextColor={theme.colors.textMuted}
        />

        <Pressable style={styles.anonRow} onPress={() => setIsAnonymous((v) => !v)}>
          <Ionicons
            name={isAnonymous ? 'checkbox' : 'square-outline'}
            size={22}
            color={theme.colors.primary}
          />
          <Text style={theme.typography.body}>Post anonymously</Text>
        </Pressable>

        <Button label="Share with the church" onPress={submit} loading={loading} disabled={!content.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md },
    input: {
      minHeight: 140,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      textAlignVertical: 'top',
    },
    anonRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  });
