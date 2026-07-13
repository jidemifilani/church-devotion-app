import { useCallback, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/constants/theme';
import type { ReadingPlan, ReadingPlanDay } from '@/types/database';

export default function AdminPlanEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const isNew = id === 'new';

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [savingPlan, setSavingPlan] = useState(false);

  const [dayTitle, setDayTitle] = useState('');
  const [dayScripture, setDayScripture] = useState('');
  const [dayContent, setDayContent] = useState('');
  const [savingDay, setSavingDay] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    const [{ data: planData }, { data: daysData }] = await Promise.all([
      supabase.from('reading_plans').select('*').eq('id', id).single(),
      supabase.from('reading_plan_days').select('*').eq('plan_id', id).order('day_number'),
    ]);
    if (planData) {
      setPlan(planData);
      setTitle(planData.title);
      setDescription(planData.description ?? '');
      setDurationDays(String(planData.duration_days));
    }
    setDays(daysData ?? []);
  }, [id, isNew]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const createPlan = async () => {
    if (!title.trim() || !durationDays.trim()) {
      Alert.alert('Missing fields', 'Title and duration are required.');
      return;
    }
    setSavingPlan(true);
    const { data, error } = await supabase
      .from('reading_plans')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        duration_days: Number(durationDays),
        created_by: profile?.id,
      })
      .select()
      .single();
    setSavingPlan(false);
    if (error || !data) {
      Alert.alert('Could not create plan', error?.message);
      return;
    }
    router.replace(`/admin/plans/${data.id}`);
  };

  const addDay = async () => {
    if (!plan || !dayContent.trim()) {
      Alert.alert('Missing content', 'Day content is required.');
      return;
    }
    setSavingDay(true);
    const nextDayNumber = days.length + 1;
    const { error } = await supabase.from('reading_plan_days').insert({
      plan_id: plan.id,
      day_number: nextDayNumber,
      title: dayTitle.trim() || null,
      scripture_reference: dayScripture.trim() || null,
      content: dayContent.trim(),
    });
    setSavingDay(false);
    if (error) {
      Alert.alert('Could not add day', error.message);
      return;
    }
    setDayTitle('');
    setDayScripture('');
    setDayContent('');
    load();
  };

  const removeDay = (day: ReadingPlanDay) => {
    Alert.alert('Delete day', `Remove Day ${day.day_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('reading_plan_days').delete().eq('id', day.id);
          load();
        },
      },
    ]);
  };

  if (isNew) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <Text style={typography.heading}>New Reading Plan</Text>
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="7 Days of Gratitude" />
          <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline style={styles.multiline} />
          <TextField label="Duration (days)" value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad" />
          <Button label="Create plan" onPress={createPlan} loading={savingPlan} />
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={days}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.form}>
          <Text style={typography.heading}>{plan?.title}</Text>
          {plan?.description ? <Text style={typography.body}>{plan.description}</Text> : null}
          <Text style={typography.caption}>
            {days.length} of {plan?.duration_days} days added
          </Text>

          <View style={styles.addDayCard}>
            <Text style={typography.caption}>ADD DAY {days.length + 1}</Text>
            <TextField label="Day title (optional)" value={dayTitle} onChangeText={setDayTitle} />
            <TextField label="Scripture reference (optional)" value={dayScripture} onChangeText={setDayScripture} />
            <TextField label="Content" value={dayContent} onChangeText={setDayContent} multiline style={styles.multiline} />
            <Button label="Add day" onPress={addDay} loading={savingDay} />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={typography.caption}>Day {item.day_number}</Text>
          {item.title ? <Text style={typography.heading}>{item.title}</Text> : null}
          {item.scripture_reference ? <Text style={typography.caption}>{item.scripture_reference}</Text> : null}
          <Text style={typography.body}>{item.content}</Text>
          <Button label="Delete day" variant="secondary" onPress={() => removeDay(item)} />
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  form: { gap: spacing.md, marginBottom: spacing.md },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  addDayCard: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
});
