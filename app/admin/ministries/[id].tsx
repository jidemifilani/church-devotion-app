import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAdminForm } from '@/hooks/useAdminForm';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';

export default function AdminMinistryEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { values, setValue, isNew, saving, save, remove } = useAdminForm(
    'ministries',
    id,
    { name: '' },
    {
      validate: (v) => (!v.name?.trim() ? 'Name is required.' : null),
      beforeSave: (v) => {
        const description = v.description?.trim();
        const leaderName = v.leader_name?.trim();
        const leaderContact = v.leader_contact?.trim();
        const meetingSchedule = v.meeting_schedule?.trim();
        return {
          ...v,
          name: v.name?.trim(),
          description: description ? description : null,
          leader_name: leaderName ? leaderName : null,
          leader_contact: leaderContact ? leaderContact : null,
          meeting_schedule: meetingSchedule ? meetingSchedule : null,
        };
      },
    }
  );

  const onSave = async () => {
    const { error } = await save();
    if (error) Alert.alert('Could not save', error);
    else router.back();
  };

  const onDelete = () => {
    Alert.alert('Delete ministry', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await remove();
          if (error) Alert.alert('Could not delete', error);
          else router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={theme.typography.heading}>{isNew ? 'New Ministry' : 'Edit Ministry'}</Text>
      <TextField label="Name" value={values.name ?? ''} onChangeText={(text) => setValue('name', text)} placeholder="Youth Ministry" />
      <TextField
        label="Description (optional)"
        value={values.description ?? ''}
        onChangeText={(text) => setValue('description', text)}
        placeholder="What this ministry does..."
        multiline
        style={styles.multiline}
      />
      <TextField label="Leader name (optional)" value={values.leader_name ?? ''} onChangeText={(text) => setValue('leader_name', text)} placeholder="Jane Doe" />
      <TextField
        label="Leader contact (optional)"
        value={values.leader_contact ?? ''}
        onChangeText={(text) => setValue('leader_contact', text)}
        placeholder="jane@example.com or phone number"
      />
      <TextField
        label="Meeting schedule (optional)"
        value={values.meeting_schedule ?? ''}
        onChangeText={(text) => setValue('meeting_schedule', text)}
        placeholder="Fridays 6:30pm"
      />

      <Button label={isNew ? 'Add ministry' : 'Save changes'} onPress={onSave} loading={saving} />
      {!isNew ? <Button label="Delete ministry" variant="secondary" onPress={onDelete} /> : null}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    multiline: { minHeight: 120, textAlignVertical: 'top' },
  });
