import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

export default function BookmarksScreen() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      supabase
        .from('bookmarks')
        .select('devotion_id, devotions(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setDevotions((data ?? []).map((row: any) => row.devotions).filter(Boolean));
          setLoading(false);
        });
    }, [session])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={devotions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>You haven't saved any devotions yet.</Text>
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
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
  });
