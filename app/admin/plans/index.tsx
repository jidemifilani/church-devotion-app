import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { ReadingPlan } from '@/types/database';

export default function AdminPlansScreen() {
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
            <Text style={typography.body}>No reading plans yet. Add the first one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/admin/plans/${item.id}`)}>
            <Text style={typography.heading}>{item.title}</Text>
            <Text style={typography.caption}>{item.duration_days} days</Text>
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/admin/plans/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
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
