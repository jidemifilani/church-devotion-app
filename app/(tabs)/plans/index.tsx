import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/constants/theme';
import type { ReadingPlan, UserPlanProgress } from '@/types/database';

type PlanWithProgress = ReadingPlan & { progress: UserPlanProgress | null };

export default function PlansScreen() {
  const { session } = useAuth();
  const [plans, setPlans] = useState<PlanWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: plansData } = await supabase
      .from('reading_plans')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: progressData } = session
      ? await supabase.from('user_plan_progress').select('*').eq('user_id', session.user.id)
      : { data: [] };

    const merged = (plansData ?? []).map((plan) => ({
      ...plan,
      progress: (progressData ?? []).find((p) => p.plan_id === plan.id) ?? null,
    }));
    setPlans(merged);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={plans}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={typography.body}>No reading plans yet. Check back soon.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card onPress={() => router.push(`/plans/${item.id}`)}>
          <Text style={typography.heading}>{item.title}</Text>
          {item.description ? <Text style={typography.body}>{item.description}</Text> : null}
          <Text style={typography.caption}>
            {item.duration_days} day{item.duration_days === 1 ? '' : 's'}
            {item.progress
              ? item.progress.completed_at
                ? ' • Completed'
                : ` • Day ${item.progress.current_day} of ${item.duration_days}`
              : ''}
          </Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
});
