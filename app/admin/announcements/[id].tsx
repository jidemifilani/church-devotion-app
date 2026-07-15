import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAdminForm } from '@/hooks/useAdminForm';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';

export default function AdminAnnouncementEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { values, setValue, isNew, saving, save, remove } = useAdminForm(
    'announcements',
    id,
    { title: '', body: '' },
    {
      validate: (v) => (!v.title?.trim() || !v.body?.trim() ? 'Title and body are required.' : null),
      beforeSave: (v) => {
        const eventDate = v.event_date?.trim();
        return {
          ...v,
          title: v.title?.trim(),
          body: v.body?.trim(),
          event_date: eventDate ? eventDate : null,
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
    Alert.alert('Delete announcement', 'This cannot be undone.', [
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
      <Text style={theme.typography.heading}>{isNew ? 'New Announcement' : 'Edit Announcement'}</Text>
      <TextField label="Title" value={values.title ?? ''} onChangeText={(text) => setValue('title', text)} placeholder="Youth Retreat Sign-Ups Open" />
      <TextField
        label="Body"
        value={values.body ?? ''}
        onChangeText={(text) => setValue('body', text)}
        placeholder="Details about the announcement..."
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Event date (YYYY-MM-DD, optional)"
        value={values.event_date ?? ''}
        onChangeText={(text) => setValue('event_date', text)}
        placeholder="2026-08-15"
      />

      <Button label={isNew ? 'Add announcement' : 'Save changes'} onPress={onSave} loading={saving} />
      {!isNew ? <Button label="Delete announcement" variant="secondary" onPress={onDelete} /> : null}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    multiline: { minHeight: 140, textAlignVertical: 'top' },
  });
