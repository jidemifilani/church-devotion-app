import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';
import type { Tag } from '@/types/database';

export default function AdminTagsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    supabase
      .from('tags')
      .select('*')
      .order('name')
      .then(({ data }) => setTags(data ?? []));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter a tag name.');
      return;
    }
    setSaving(true);
    const { error } = editingId
      ? await supabase.from('tags').update({ name: name.trim() }).eq('id', editingId)
      : await supabase.from('tags').insert({ name: name.trim() });
    setSaving(false);
    if (error) {
      Alert.alert('Could not save tag', error.message);
      return;
    }
    cancelEdit();
    load();
  };

  const remove = (tag: Tag) => {
    Alert.alert('Delete tag', `Remove "${tag.name}"? This also removes it from any tagged devotions/plans.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('tags').delete().eq('id', tag.id);
          if (editingId === tag.id) cancelEdit();
          load();
        },
      },
    ]);
  };

  return (
    <FlatList
      data={tags}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.form}>
          <Text style={theme.typography.heading}>{editingId ? 'Rename Tag' : 'New Tag'}</Text>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Grief, Marriage, New Believers…" />
          <View style={styles.formActions}>
            <Button label={editingId ? 'Save' : 'Add tag'} onPress={save} loading={saving} style={styles.formButton} />
            {editingId ? <Button label="Cancel" variant="secondary" onPress={cancelEdit} style={styles.formButton} /> : null}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>No tags yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card onPress={() => startEdit(item)}>
          <View style={styles.row}>
            <Text style={theme.typography.body}>{item.name}</Text>
            <Button label="Delete" variant="secondary" onPress={() => remove(item)} />
          </View>
        </Card>
      )}
    />
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    form: {
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    formActions: { flexDirection: 'row', gap: theme.spacing.sm },
    formButton: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });
