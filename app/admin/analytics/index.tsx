import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

type Stats = {
  activeStreaks: number;
  readsThisWeek: number;
  prayersThisWeek: number;
  plansStarted: number;
  plansCompleted: number;
  dailyReads: { label: string; count: number }[];
};

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default function AdminAnalyticsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const weekAgo = daysAgoIso(7);

    const [activeStreaks, readsThisWeek, prayersThisWeek, planProgress, readsRaw] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('current_streak', 0),
      supabase.from('devotion_reads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('prayer_requests').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('user_plan_progress').select('completed_at'),
      supabase.from('devotion_reads').select('created_at').gte('created_at', daysAgoIso(6)),
    ]);

    const buckets = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of readsRaw.data ?? []) {
      const key = row.created_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const dailyReads = [...buckets.entries()].map(([date, count]) => ({
      label: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
      count,
    }));

    setStats({
      activeStreaks: activeStreaks.count ?? 0,
      readsThisWeek: readsThisWeek.count ?? 0,
      prayersThisWeek: prayersThisWeek.count ?? 0,
      plansStarted: planProgress.data?.length ?? 0,
      plansCompleted: (planProgress.data ?? []).filter((p) => p.completed_at).length,
      dailyReads,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!stats) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const completionRate = stats.plansStarted ? Math.round((stats.plansCompleted / stats.plansStarted) * 100) : 0;
  const maxDaily = Math.max(1, ...stats.dailyReads.map((d) => d.count));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <StatCard theme={theme} label="Active streaks" value={String(stats.activeStreaks)} />
        <StatCard theme={theme} label="Reads this week" value={String(stats.readsThisWeek)} />
        <StatCard theme={theme} label="Prayers this week" value={String(stats.prayersThisWeek)} />
        <StatCard theme={theme} label="Plan completion" value={`${completionRate}%`} />
      </View>

      <View style={styles.chartCard}>
        <Text style={theme.typography.caption}>DEVOTION READS — LAST 7 DAYS</Text>
        <View style={styles.chartRow}>
          {stats.dailyReads.map((d) => (
            <View key={d.label} style={styles.barColumn}>
              <View style={[styles.bar, { height: Math.max(4, (d.count / maxDaily) * 80) }]} />
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ theme, label, value }: { theme: Theme; label: string; value: string }) {
  const styles = makeStyles(theme);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={theme.typography.caption}>{label}</Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    statCard: {
      flexBasis: '47%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: 4,
    },
    statValue: { fontSize: 28 * theme.fontScale, fontWeight: '700', color: theme.colors.primary },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
    barColumn: { alignItems: 'center', gap: 4, flex: 1 },
    bar: { width: 16, backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm },
    barLabel: { fontSize: 11, color: theme.colors.textMuted },
  });
