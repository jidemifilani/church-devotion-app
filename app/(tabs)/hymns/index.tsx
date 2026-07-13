import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Hymn } from '@/types/database';

export default function HymnsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search hymns..."
          placeholderTextColor={theme.colors.textMuted}
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
            <Text style={theme.typography.body}>No hymns found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/hymns/${item.id}`)} style={styles.row}>
            <Text style={styles.number}>{item.number ?? '–'}</Text>
            <View style={styles.rowText}>
              <Text style={theme.typography.heading}>{item.title}</Text>
              {item.author ? <Text style={theme.typography.caption}>{item.author}</Text> : null}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    searchWrap: { padding: theme.spacing.lg, paddingBottom: 0 },
    search: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      backgroundColor: theme.colors.surface,
      fontSize: 16,
    },
    container: { padding: theme.spacing.lg, gap: theme.spacing.sm, flexGrow: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    number: { width: 32, textAlign: 'center', fontWeight: '700', color: theme.colors.primary, fontSize: 16 },
    rowText: { flex: 1, gap: 2 },
  });
