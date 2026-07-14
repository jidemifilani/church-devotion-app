import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';
import type { DevotionScriptureVersion } from '@/types/database';

type Props = {
  devotionId: string;
};

// admin-authored alternate translations (e.g. KJV/WEB) — not machine-translated,
// since we don't have rights to reproduce copyrighted Bible translations
export function ScriptureVersionsEditor({ devotionId }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [versions, setVersions] = useState<DevotionScriptureVersion[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    supabase
      .from('devotion_scripture_versions')
      .select('*')
      .eq('devotion_id', devotionId)
      .order('translation_code')
      .then(({ data }) => setVersions(data ?? []));
  }, [devotionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    if (!code.trim() || !name.trim() || !text.trim()) {
      Alert.alert('Missing fields', 'Translation code, name, and text are all required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('devotion_scripture_versions').insert({
      devotion_id: devotionId,
      translation_code: code.trim().toLowerCase(),
      translation_name: name.trim(),
      scripture_text: text.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not add translation', error.message);
      return;
    }
    setCode('');
    setName('');
    setText('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('devotion_scripture_versions').delete().eq('id', id);
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={theme.typography.caption}>ALTERNATE TRANSLATIONS</Text>
      {versions.map((v) => (
        <View key={v.id} style={styles.row}>
          <Text style={theme.typography.body}>
            {v.translation_code.toUpperCase()} — {v.translation_name}
          </Text>
          <Button label="Remove" variant="secondary" onPress={() => remove(v.id)} />
        </View>
      ))}
      <View style={styles.form}>
        <TextField label="Code (e.g. kjv)" value={code} onChangeText={setCode} autoCapitalize="none" />
        <TextField label="Translation name (e.g. King James Version)" value={name} onChangeText={setName} />
        <TextField label="Scripture text" value={text} onChangeText={setText} multiline style={styles.multiline} />
        <Button label="Add translation" variant="secondary" onPress={add} loading={saving} />
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
    form: {
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    multiline: { minHeight: 60, textAlignVertical: 'top' },
  });
