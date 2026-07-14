import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { Tag } from '@/types/database';

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function TagPicker({ selectedIds, onChange }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    supabase
      .from('tags')
      .select('*')
      .order('name')
      .then(({ data }) => setTags(data ?? []));
  }, []);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  if (!tags.length) return null;

  return (
    <View style={styles.container}>
      <Text style={theme.typography.caption}>TAGS</Text>
      <View style={styles.chipsRow}>
        {tags.map((tag) => {
          const active = selectedIds.includes(tag.id);
          return (
            <Pressable key={tag.id} onPress={() => toggle(tag.id)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.xs },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
    },
    chipActive: { backgroundColor: theme.colors.primary },
    chipText: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: '#fff' },
  });
