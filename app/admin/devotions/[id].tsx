import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, spacing, typography } from '@/constants/theme';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDevotionEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const isNew = id === 'new';

  const [devotionDate, setDevotionDate] = useState(todayIso());
  const [title, setTitle] = useState('');
  const [scriptureReference, setScriptureReference] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
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
    const { error } = isNew
      ? await supabase.from('devotions').insert({ ...payload, created_by: profile?.id })
      : await supabase.from('devotions').update(payload).eq('id', id);
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
      <Text style={typography.heading}>{isNew ? 'New Devotion' : 'Edit Devotion'}</Text>
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

      <Button label={isNew ? 'Publish devotion' : 'Save changes'} onPress={save} loading={loading} />
      {!isNew ? <Button label="Delete devotion" variant="secondary" onPress={remove} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  multilineTall: { minHeight: 160, textAlignVertical: 'top' },
});
