import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ArchiveScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadRecent = useCallback(async () => {
    const { data } = await supabase
      .from('devotions')
      .select('*')
      .eq('status', 'published')
      .lte('devotion_date', todayIso())
      .order('devotion_date', { ascending: false })
      .limit(60);
    setDevotions(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent])
  );

  const runSearch = async (text: string) => {
    setQuery(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setSearching(false);
      loadRecent();
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from('devotions')
      .select('*')
      .eq('status', 'published')
      .textSearch('search_vector', trimmed.split(/\s+/).join(' & '), { type: 'plain' })
      .order('devotion_date', { ascending: false })
      .limit(60);
    setDevotions(data ?? []);
  };

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
          placeholder="Search past devotions..."
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={runSearch}
        />
        <Text style={styles.topicsLink} onPress={() => router.push('/topics')}>
          Browse by topic
        </Text>
      </View>
      <FlatList
        data={devotions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={theme.typography.body}>{searching ? 'No devotions match your search.' : 'Nothing here yet.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/devotion/${item.id}`)}>
            <Text style={theme.typography.caption}>
              {new Date(item.devotion_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={theme.typography.heading}>{item.title}</Text>
            <Text style={theme.typography.caption}>{item.scripture_reference}</Text>
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
      color: theme.colors.text,
    },
    container: { padding: theme.spacing.lg, gap: theme.spacing.sm, flexGrow: 1 },
    topicsLink: { color: theme.colors.primary, fontWeight: '600', marginTop: theme.spacing.sm },
  });
