import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { TagPicker } from '@/components/TagPicker';
import { ScriptureVersionsEditor } from '@/components/ScriptureVersionsEditor';
import { DatePickerField } from '@/components/DatePickerField';
import { DevotionView } from '@/components/DevotionView';
import type { Theme } from '@/constants/theme';
import type { Devotion, Locale } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDevotionEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isNew = id === 'new';

  const [devotionDate, setDevotionDate] = useState(todayIso());
  const [title, setTitle] = useState('');
  const [scriptureReference, setScriptureReference] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState<Locale>('en');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [initialStatus, setInitialStatus] = useState<'draft' | 'published'>('draft');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

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
          setLanguage(data.language);
          setStatus(data.status);
          setInitialStatus(data.status);
        });
      supabase
        .from('devotion_tags')
        .select('tag_id')
        .eq('devotion_id', id)
        .then(({ data }) => setTagIds((data ?? []).map((row) => row.tag_id)));
    }, [id, isNew])
  );

  const save = async (nextStatus: 'draft' | 'published') => {
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
      language,
      status: nextStatus,
      published_at: nextStatus === 'published' ? new Date().toISOString() : null,
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
      if (nextStatus === 'published' && initialStatus !== 'published') {
        supabase.functions.invoke('notify-devotion-published', { body: { devotion_id: devotionId } });
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

  const previewDevotion: Devotion = {
    id: typeof id === 'string' && !isNew ? id : 'preview',
    devotion_date: devotionDate || todayIso(),
    title: title || 'Untitled devotion',
    scripture_reference: scriptureReference,
    scripture_text: scriptureText || null,
    body: body || 'Nothing written yet.',
    author: author || null,
    image_url: null,
    audio_url: null,
    status,
    published_at: null,
    language,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={theme.typography.heading}>{isNew ? 'New Devotion' : 'Edit Devotion'}</Text>
        <Pressable onPress={() => setPreviewing(true)} style={styles.previewLink}>
          <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.previewLinkText}>Preview</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        {(['draft', 'published'] as const).map((s) => (
          <Pressable key={s} onPress={() => setStatus(s)} style={[styles.statusChip, status === s && styles.statusChipActive]}>
            <Text style={[styles.statusText, status === s && styles.statusTextActive]}>
              {s === 'draft' ? 'Draft' : 'Published'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statusRow}>
        {SUPPORTED_LOCALES.map((code) => (
          <Pressable
            key={code}
            onPress={() => setLanguage(code)}
            style={[styles.statusChip, language === code && styles.statusChipActive]}>
            <Text style={[styles.statusText, language === code && styles.statusTextActive]}>{t(`language.${code}`)}</Text>
          </Pressable>
        ))}
      </View>

      <DatePickerField label="Date" value={devotionDate} onChange={setDevotionDate} />
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

      <Button
        label={status === 'published' ? 'Publish devotion' : 'Save as draft'}
        onPress={() => save(status)}
        loading={loading}
      />
      {!isNew ? <Button label="Delete devotion" variant="secondary" onPress={remove} /> : null}

      <Modal visible={previewing} animationType="slide" onRequestClose={() => setPreviewing(false)}>
        <ScrollView contentContainerStyle={styles.previewContainer}>
          <Pressable onPress={() => setPreviewing(false)} style={styles.closePreview}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          <DevotionView devotion={previewDevotion} isBookmarked={false} onToggleBookmark={() => {}} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    previewLinkText: { color: theme.colors.primary, fontWeight: '600' },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    statusChip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
    },
    statusChipActive: { backgroundColor: theme.colors.primary },
    statusText: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
    statusTextActive: { color: '#fff' },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    multilineTall: { minHeight: 160, textAlignVertical: 'top' },
    previewContainer: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      backgroundColor: theme.colors.background,
      flexGrow: 1,
    },
    closePreview: { alignSelf: 'flex-end' },
  });
