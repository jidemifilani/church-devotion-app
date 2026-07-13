import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function NewPrayerRequestScreen() {
  const { session, profile } = useAuth();
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
    if (!error) router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={typography.caption}>What would you like the church to pray for?</Text>
        <TextInput
          style={styles.input}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="Share your prayer request..."
          placeholderTextColor={colors.textMuted}
        />

        <Pressable style={styles.anonRow} onPress={() => setIsAnonymous((v) => !v)}>
          <Ionicons
            name={isAnonymous ? 'checkbox' : 'square-outline'}
            size={22}
            color={colors.primary}
          />
          <Text style={typography.body}>Post anonymously</Text>
        </Pressable>

        <Button label="Share with the church" onPress={submit} loading={loading} disabled={!content.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
