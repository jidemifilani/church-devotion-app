import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { TagPicker } from '@/components/TagPicker';
import { ScriptureVersionsEditor } from '@/components/ScriptureVersionsEditor';
import type { Theme } from '@/constants/theme';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDevotionEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isNew = id === 'new';

  const [devotionDate, setDevotionDate] = useState(todayIso());
  const [title, setTitle] = useState('');
  const [scriptureReference, setScriptureReference] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      supabase
        .from('devotions')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setDevotionDate(data.devotion_date);
          setTitle(data.title);
          setScriptureReference(data.scripture_reference);
          setScriptureText(data.scripture_text ?? '');
          setBody(data.body);
          setAuthor(data.author ?? '');
        });
      supabase
        .from('devotion_tags')
        .select('tag_id')
        .eq('devotion_id', id)
        .then(({ data }) => setTagIds((data ?? []).map((row) => row.tag_id)));
    }, [id, isNew])
  );

  const save = async () => {
    if (!title.trim() || !scriptureReference.trim() || !body.trim() || !devotionDate.trim()) {
      Alert.alert('Missing fields', 'Date, title, scripture reference, and body are required.');
      return;
    }
    setLoading(true);
    const payload = {
      devotion_date: devotionDate.trim(),
      title: title.trim(),
      scripture_reference: scriptureReference.trim(),
      scripture_text: scriptureText.trim() || null,
      body: body.trim(),
      author: author.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { data: saved, error } = isNew
      ? await supabase.from('devotions').insert({ ...payload, created_by: profile?.id }).select().single()
      : await supabase.from('devotions').update(payload).eq('id', id).select().single();

    if (!error && saved) {
      const devotionId = saved.id;
      await supabase.from('devotion_tags').delete().eq('devotion_id', devotionId);
      if (tagIds.length) {
        await supabase.from('devotion_tags').insert(tagIds.map((tag_id) => ({ devotion_id: devotionId, tag_id })));
      }
    }

    setLoading(false);
    if (error) Alert.alert('Could not save', error.message);
    else router.back();
  };

  const remove = () => {
    Alert.alert('Delete devotion', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('devotions').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={theme.typography.heading}>{isNew ? 'New Devotion' : 'Edit Devotion'}</Text>
      <TextField label="Date (YYYY-MM-DD)" value={devotionDate} onChangeText={setDevotionDate} placeholder={todayIso()} />
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Walking in Faith" />
      <TextField
        label="Scripture reference"
        value={scriptureReference}
        onChangeText={setScriptureReference}
        placeholder="Hebrews 11:1"
      />
      <TextField
        label="Scripture text (optional)"
        value={scriptureText}
        onChangeText={setScriptureText}
        placeholder="Now faith is confidence in..."
        multiline
        style={styles.multiline}
      />
      <TextField
        label="Devotion body"
        value={body}
        onChangeText={setBody}
        placeholder="Write today's devotion..."
        multiline
        style={styles.multilineTall}
      />
      <TextField label="Author (optional)" value={author} onChangeText={setAuthor} placeholder="Pastor John" />
      <TagPicker selectedIds={tagIds} onChange={setTagIds} />
      {!isNew ? <ScriptureVersionsEditor devotionId={id} /> : null}

      <Button label={isNew ? 'Publish devotion' : 'Save changes'} onPress={save} loading={loading} />
      {!isNew ? <Button label="Delete devotion" variant="secondary" onPress={remove} /> : null}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    multilineTall: { minHeight: 160, textAlignVertical: 'top' },
  });
