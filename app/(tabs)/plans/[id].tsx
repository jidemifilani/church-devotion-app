import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';
import type { ReadingPlan, ReadingPlanDay, UserPlanProgress } from '@/types/database';

async function loadRecommendations(planId: string, userId: string): Promise<ReadingPlan[]> {
  const { data: startedRows } = await supabase.from('user_plan_progress').select('plan_id').eq('user_id', userId);
  const startedIds = new Set((startedRows ?? []).map((r) => r.plan_id).concat(planId));

  const { data: tagRows } = await supabase.from('plan_tags').select('tag_id').eq('plan_id', planId);
  const tagIds = (tagRows ?? []).map((r) => r.tag_id);

  if (tagIds.length) {
    const { data: relatedRows } = await supabase.from('plan_tags').select('plan_id').in('tag_id', tagIds).neq('plan_id', planId);
    const relatedIds = [...new Set((relatedRows ?? []).map((r) => r.plan_id))].filter((pid) => !startedIds.has(pid));
    if (relatedIds.length) {
      const { data: plans } = await supabase.from('reading_plans').select('*').in('id', relatedIds).limit(3);
      if (plans?.length) return plans;
    }
  }

  const { data: fallback } = await supabase
    .from('reading_plans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(startedIds.size + 3);
  return (fallback ?? []).filter((p) => !startedIds.has(p.id)).slice(0, 3);
}

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [progress, setProgress] = useState<UserPlanProgress | null>(null);
  const [recommendations, setRecommendations] = useState<ReadingPlan[]>([]);
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
    if (progressData?.completed_at && session) {
      setRecommendations(await loadRecommendations(id, session.user.id));
    }
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
        <ActivityIndicator color={theme.colors.primary} />
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
          {plan.description ? <Text style={theme.typography.body}>{plan.description}</Text> : null}
          {!progress ? (
            <Button label="Start Plan" onPress={startPlan} loading={busy} />
          ) : progress.completed_at ? (
            <>
              <Text style={styles.doneBadge}>🎉 You completed this plan</Text>
              {recommendations.length ? (
                <View style={styles.recommendations}>
                  <Text style={theme.typography.caption}>YOU MIGHT ALSO LIKE</Text>
                  {recommendations.map((rec) => (
                    <Card key={rec.id} onPress={() => router.push(`/plans/${rec.id}`)}>
                      <Text style={theme.typography.heading}>{rec.title}</Text>
                      <Text style={theme.typography.caption}>
                        {rec.duration_days} day{rec.duration_days === 1 ? '' : 's'}
                      </Text>
                    </Card>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        const isCurrent = progress ? item.day_number === progress.current_day && !progress.completed_at : false;
        const isPast = progress ? item.day_number < progress.current_day || !!progress.completed_at : false;
        return (
          <Card style={isCurrent ? styles.currentCard : undefined}>
            <Text style={theme.typography.caption}>Day {item.day_number}</Text>
            {item.title ? <Text style={theme.typography.heading}>{item.title}</Text> : null}
            {item.scripture_reference ? <Text style={styles.scripture}>{item.scripture_reference}</Text> : null}
            <Text style={theme.typography.body}>{item.content}</Text>
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

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    header: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    currentCard: { borderColor: theme.colors.primary, borderWidth: 2 },
    scripture: { fontWeight: '600', color: theme.colors.primary },
    completeLabel: { color: theme.colors.success, fontWeight: '600' },
    doneBadge: { fontSize: 16, fontWeight: '600', color: theme.colors.success },
    recommendations: { gap: theme.spacing.sm },
  });
