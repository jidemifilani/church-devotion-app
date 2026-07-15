import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Announcement } from '@/types/database';

export default function AnnouncementsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setAnnouncements(data ?? []);
          setLoading(false);
        });
    }, [])
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
      data={announcements}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>No announcements right now.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          {item.event_date ? (
            <Text style={theme.typography.caption}>
              {new Date(item.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          ) : null}
          <Text style={theme.typography.heading}>{item.title}</Text>
          <Text style={theme.typography.body}>{item.body}</Text>
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
