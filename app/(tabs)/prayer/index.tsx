import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { PrayerRequest } from '@/types/database';

type Row = PrayerRequest & { hasPrayed: boolean };

export default function PrayerWallScreen() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: requestsData } = await supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: myInteractions } = session
      ? await supabase.from('prayer_interactions').select('prayer_request_id').eq('user_id', session.user.id)
      : { data: [] };

    const interactedIds = new Set((myInteractions ?? []).map((i) => i.prayer_request_id));
    setRequests((requestsData ?? []).map((r) => ({ ...r, hasPrayed: interactedIds.has(r.id) })));
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const togglePray = async (item: Row) => {
    if (!session) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? { ...r, hasPrayed: !r.hasPrayed, prayer_count: r.prayer_count + (r.hasPrayed ? -1 : 1) }
          : r
      )
    );
    if (item.hasPrayed) {
      await supabase.from('prayer_interactions').delete().eq('user_id', session.user.id).eq('prayer_request_id', item.id);
    } else {
      await supabase.from('prayer_interactions').insert({ user_id: session.user.id, prayer_request_id: item.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={typography.body}>No prayer requests yet. Be the first to share one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={typography.caption}>
              {item.is_anonymous ? 'Anonymous' : item.display_name ?? 'A member'}
              {item.status === 'answered' ? '  •  🙌 Answered' : ''}
            </Text>
            <Text style={typography.body}>{item.content}</Text>
            <Pressable style={styles.prayRow} onPress={() => togglePray(item)}>
              <Ionicons
                name={item.hasPrayed ? 'heart' : 'heart-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.prayCount}>
                {item.prayer_count} praying
              </Text>
            </Pressable>
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/prayer/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  prayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  prayCount: { color: colors.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
