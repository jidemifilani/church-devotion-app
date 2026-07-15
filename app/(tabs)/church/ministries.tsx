import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Ministry } from '@/types/database';

export default function MinistriesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('ministries')
        .select('*')
        .order('name')
        .then(({ data }) => {
          setMinistries(data ?? []);
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
      data={ministries}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>No ministries listed yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={theme.typography.heading}>{item.name}</Text>
          {item.description ? <Text style={theme.typography.body}>{item.description}</Text> : null}
          {item.meeting_schedule ? <Text style={theme.typography.caption}>{item.meeting_schedule}</Text> : null}
          {item.leader_name ? (
            <Text style={theme.typography.caption}>
              Contact: {item.leader_name}
              {item.leader_contact ? ` — ${item.leader_contact}` : ''}
            </Text>
          ) : null}
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
