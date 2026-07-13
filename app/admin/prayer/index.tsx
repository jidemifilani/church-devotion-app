import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/constants/theme';
import type { PrayerRequest } from '@/types/database';

export default function AdminPrayerScreen() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);

  const load = useCallback(() => {
    supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRequests(data ?? []));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleStatus = async (item: PrayerRequest) => {
    const nextStatus = item.status === 'active' ? 'answered' : 'active';
    await supabase.from('prayer_requests').update({ status: nextStatus }).eq('id', item.id);
    load();
  };

  const remove = (item: PrayerRequest) => {
    Alert.alert('Delete prayer request', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('prayer_requests').delete().eq('id', item.id);
          load();
        },
      },
    ]);
  };

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={typography.body}>No prayer requests yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={typography.caption}>
            {item.is_anonymous ? 'Anonymous' : item.display_name ?? 'A member'} • {item.prayer_count} praying
            {item.status === 'answered' ? ' • Answered' : ''}
          </Text>
          <Text style={typography.body}>{item.content}</Text>
          <View style={styles.actions}>
            <Button
              label={item.status === 'active' ? 'Mark answered' : 'Mark active'}
              variant="secondary"
              onPress={() => toggleStatus(item)}
              style={styles.actionButton}
            />
            <Button label="Delete" variant="secondary" onPress={() => remove(item)} style={styles.actionButton} />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionButton: { flex: 1 },
});
