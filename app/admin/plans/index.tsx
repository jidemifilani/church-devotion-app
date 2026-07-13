import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { ReadingPlan } from '@/types/database';

export default function AdminPlansScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [plans, setPlans] = useState<ReadingPlan[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('reading_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => setPlans(data ?? []));
    }, [])
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={theme.typography.body}>No reading plans yet. Add the first one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/admin/plans/${item.id}`)}>
            <Text style={theme.typography.heading}>{item.title}</Text>
            <Text style={theme.typography.caption}>{item.duration_days} days</Text>
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/admin/plans/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, flexGrow: 1 },
    fab: {
      position: 'absolute',
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      width: 56,
      height: 56,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  });
