import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAdminForm } from '@/hooks/useAdminForm';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';

export default function AdminSermonEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { values, setValue, isNew, saving, save, remove } = useAdminForm(
    'sermons',
    id,
    { title: '', sermon_date: '' },
    {
      validate: (v) => (!v.title?.trim() || !v.sermon_date?.trim() ? 'Title and sermon date are required.' : null),
      beforeSave: (v) => {
        const speaker = v.speaker?.trim();
        const description = v.description?.trim();
        const audioUrl = v.audio_url?.trim();
        return {
          ...v,
          title: v.title?.trim(),
          sermon_date: v.sermon_date?.trim(),
          speaker: speaker ? speaker : null,
          description: description ? description : null,
          audio_url: audioUrl ? audioUrl : null,
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
    Alert.alert('Delete sermon', 'This cannot be undone.', [
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
      <Text style={theme.typography.heading}>{isNew ? 'New Sermon' : 'Edit Sermon'}</Text>
      <TextField label="Title" value={values.title ?? ''} onChangeText={(text) => setValue('title', text)} placeholder="Walking in Faith" />
      <TextField label="Speaker (optional)" value={values.speaker ?? ''} onChangeText={(text) => setValue('speaker', text)} placeholder="Pastor John Smith" />
      <TextField
        label="Sermon date (YYYY-MM-DD)"
        value={values.sermon_date ?? ''}
        onChangeText={(text) => setValue('sermon_date', text)}
        placeholder="2026-07-13"
      />
      <TextField
        label="Description (optional)"
        value={values.description ?? ''}
        onChangeText={(text) => setValue('description', text)}
        placeholder="A short summary of the sermon..."
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Audio URL (optional)"
        value={values.audio_url ?? ''}
        onChangeText={(text) => setValue('audio_url', text)}
        placeholder="https://..."
        autoCapitalize="none"
      />
      <Text style={theme.typography.caption}>Upload the audio file to Supabase Storage and paste its public URL here.</Text>

      <Button label={isNew ? 'Add sermon' : 'Save changes'} onPress={onSave} loading={saving} />
      {!isNew ? <Button label="Delete sermon" variant="secondary" onPress={onDelete} /> : null}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    multiline: { minHeight: 120, textAlignVertical: 'top' },
  });
