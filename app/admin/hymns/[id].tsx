import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, spacing, typography } from '@/constants/theme';

export default function AdminHymnEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [number, setNumber] = useState('');
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      supabase
        .from('hymns')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setNumber(data.number ? String(data.number) : '');
          setTitle(data.title);
          setLyrics(data.lyrics);
          setAuthor(data.author ?? '');
          setCategory(data.category ?? '');
        });
    }, [id, isNew])
  );

  const save = async () => {
    if (!title.trim() || !lyrics.trim()) {
      Alert.alert('Missing fields', 'Title and lyrics are required.');
      return;
    }
    setLoading(true);
    const payload = {
      number: number.trim() ? Number(number.trim()) : null,
      title: title.trim(),
      lyrics: lyrics.trim(),
      author: author.trim() || null,
      category: category.trim() || null,
    };
    const { error } = isNew
      ? await supabase.from('hymns').insert(payload)
      : await supabase.from('hymns').update(payload).eq('id', id);
    setLoading(false);
    if (error) Alert.alert('Could not save', error.message);
    else router.back();
  };

  const remove = () => {
    Alert.alert('Delete hymn', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('hymns').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.heading}>{isNew ? 'New Hymn' : 'Edit Hymn'}</Text>
      <TextField label="Number (optional)" value={number} onChangeText={setNumber} keyboardType="number-pad" placeholder="1" />
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Amazing Grace" />
      <TextField label="Author (optional)" value={author} onChangeText={setAuthor} placeholder="John Newton" />
      <TextField label="Category (optional)" value={category} onChangeText={setCategory} placeholder="Classic Hymns" />
      <TextField
        label="Lyrics"
        value={lyrics}
        onChangeText={setLyrics}
        placeholder="Amazing grace, how sweet the sound..."
        multiline
        style={styles.multilineTall}
      />

      <Button label={isNew ? 'Add hymn' : 'Save changes'} onPress={save} loading={loading} />
      {!isNew ? <Button label="Delete hymn" variant="secondary" onPress={remove} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  multilineTall: { minHeight: 200, textAlignVertical: 'top' },
});
