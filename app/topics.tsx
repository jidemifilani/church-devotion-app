import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Devotion, ReadingPlan, Tag } from '@/types/database';

export default function TopicsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('tags')
        .select('*')
        .order('name')
        .then(({ data }) => {
          setTags(data ?? []);
          setLoading(false);
        });
    }, [])
  );

  useEffect(() => {
    if (!selectedTag) {
      setDevotions([]);
      setPlans([]);
      return;
    }
    setLoadingResults(true);
    Promise.all([
      supabase.from('devotion_tags').select('devotion_id').eq('tag_id', selectedTag.id),
      supabase.from('plan_tags').select('plan_id').eq('tag_id', selectedTag.id),
    ]).then(async ([{ data: devotionTagRows }, { data: planTagRows }]) => {
      const devotionIds = (devotionTagRows ?? []).map((r) => r.devotion_id);
      const planIds = (planTagRows ?? []).map((r) => r.plan_id);
      const [{ data: devotionsData }, { data: plansData }] = await Promise.all([
        devotionIds.length
          ? supabase.from('devotions').select('*').eq('status', 'published').in('id', devotionIds).order('devotion_date', { ascending: false })
          : Promise.resolve({ data: [] }),
        planIds.length ? supabase.from('reading_plans').select('*').in('id', planIds) : Promise.resolve({ data: [] }),
      ]);
      setDevotions(devotionsData ?? []);
      setPlans(plansData ?? []);
      setLoadingResults(false);
    });
  }, [selectedTag]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={theme.typography.caption}>BROWSE BY TOPIC</Text>
      {tags.length ? (
        <View style={styles.chipsRow}>
          {tags.map((tag) => {
            const active = selectedTag?.id === tag.id;
            return (
              <Text
                key={tag.id}
                onPress={() => setSelectedTag(active ? null : tag)}
                style={[styles.chip, active && styles.chipActive]}>
                {tag.name}
              </Text>
            );
          })}
        </View>
      ) : (
        <Text style={theme.typography.body}>No topics have been tagged yet.</Text>
      )}

      {selectedTag ? (
        loadingResults ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.resultsLoading} />
        ) : (
          <View style={styles.results}>
            {devotions.length ? (
              <>
                <Text style={theme.typography.caption}>DEVOTIONS</Text>
                {devotions.map((d) => (
                  <Card key={d.id} onPress={() => router.push(`/devotion/${d.id}`)}>
                    <Text style={theme.typography.heading}>{d.title}</Text>
                    <Text style={theme.typography.caption}>{d.scripture_reference}</Text>
                  </Card>
                ))}
              </>
            ) : null}
            {plans.length ? (
              <>
                <Text style={theme.typography.caption}>READING PLANS</Text>
                {plans.map((p) => (
                  <Card key={p.id} onPress={() => router.push(`/plans/${p.id}`)}>
                    <Text style={theme.typography.heading}>{p.title}</Text>
                    <Text style={theme.typography.caption}>{p.duration_days} days</Text>
                  </Card>
                ))}
              </>
            ) : null}
            {!devotions.length && !plans.length ? (
              <Text style={theme.typography.body}>Nothing tagged "{selectedTag.name}" yet.</Text>
            ) : null}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 13,
      overflow: 'hidden',
    },
    chipActive: { backgroundColor: theme.colors.primary, color: '#fff' },
    resultsLoading: { marginTop: theme.spacing.lg },
    results: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  });
