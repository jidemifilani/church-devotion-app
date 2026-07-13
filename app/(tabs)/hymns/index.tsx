import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Hymn } from '@/types/database';

export default function HymnsScreen() {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('hymns')
        .select('*')
        .order('number', { ascending: true, nullsFirst: false })
        .then(({ data }) => {
          setHymns(data ?? []);
          setLoading(false);
        });
    }, [])
  );

  const filtered = hymns.filter((h) => h.title.toLowerCase().includes(query.trim().toLowerCase()));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search hymns..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={typography.body}>No hymns found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/hymns/${item.id}`)} style={styles.row}>
            <Text style={styles.number}>{item.number ?? '–'}</Text>
            <View style={styles.rowText}>
              <Text style={typography.heading}>{item.title}</Text>
              {item.author ? <Text style={typography.caption}>{item.author}</Text> : null}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  searchWrap: { padding: spacing.lg, paddingBottom: 0 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  container: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  number: { width: 32, textAlign: 'center', fontWeight: '700', color: colors.primary, fontSize: 16 },
  rowText: { flex: 1, gap: 2 },
});
