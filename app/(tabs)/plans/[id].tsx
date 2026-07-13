import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/constants/theme';
import type { ReadingPlan, ReadingPlanDay, UserPlanProgress } from '@/types/database';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [progress, setProgress] = useState<UserPlanProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: planData }, { data: daysData }, { data: progressData }] = await Promise.all([
      supabase.from('reading_plans').select('*').eq('id', id).single(),
      supabase.from('reading_plan_days').select('*').eq('plan_id', id).order('day_number'),
      session
        ? supabase.from('user_plan_progress').select('*').eq('user_id', session.user.id).eq('plan_id', id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setPlan(planData ?? null);
    setDays(daysData ?? []);
    setProgress(progressData ?? null);
  }, [id, session]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const startPlan = async () => {
    if (!session || !plan) return;
    setBusy(true);
    const { data } = await supabase
      .from('user_plan_progress')
      .insert({ user_id: session.user.id, plan_id: plan.id, current_day: 1 })
      .select()
      .single();
    setProgress(data ?? null);
    setBusy(false);
  };

  const completeDay = async (dayNumber: number) => {
    if (!session || !plan || !progress) return;
    setBusy(true);
    const nextDay = dayNumber + 1;
    const isDone = nextDay > plan.duration_days;
    const { data } = await supabase
      .from('user_plan_progress')
      .update({ current_day: isDone ? plan.duration_days : nextDay, completed_at: isDone ? new Date().toISOString() : null })
      .eq('id', progress.id)
      .select()
      .single();
    setProgress(data ?? null);
    setBusy(false);
  };

  if (loading || !plan) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={days}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.header}>
          {plan.description ? <Text style={typography.body}>{plan.description}</Text> : null}
          {!progress ? (
            <Button label="Start Plan" onPress={startPlan} loading={busy} />
          ) : progress.completed_at ? (
            <Text style={styles.doneBadge}>🎉 You completed this plan</Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        const isCurrent = progress ? item.day_number === progress.current_day && !progress.completed_at : false;
        const isPast = progress ? item.day_number < progress.current_day || !!progress.completed_at : false;
        return (
          <Card style={isCurrent ? styles.currentCard : undefined}>
            <Text style={typography.caption}>Day {item.day_number}</Text>
            {item.title ? <Text style={typography.heading}>{item.title}</Text> : null}
            {item.scripture_reference ? <Text style={styles.scripture}>{item.scripture_reference}</Text> : null}
            <Text style={typography.body}>{item.content}</Text>
            {isCurrent ? (
              <Button label="Mark day complete" onPress={() => completeDay(item.day_number)} loading={busy} />
            ) : isPast ? (
              <Text style={styles.completeLabel}>✓ Completed</Text>
            ) : null}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  currentCard: { borderColor: colors.primary, borderWidth: 2 },
  scripture: { fontWeight: '600', color: colors.primary },
  completeLabel: { color: colors.success, fontWeight: '600' },
  doneBadge: { fontSize: 16, fontWeight: '600', color: colors.success },
});
