import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

type Props = {
  devotion: Devotion;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
};

function splitSegments(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function DevotionView({ devotion, isBookmarked, onToggleBookmark }: Props) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState(false);

  const segments = useMemo(() => splitSegments(devotion.body), [devotion.body]);

  useEffect(() => {
    setHighlighted(new Set());
    if (!session) return;
    supabase
      .from('devotion_highlights')
      .select('segment_index')
      .eq('user_id', session.user.id)
      .eq('devotion_id', devotion.id)
      .then(({ data }) => {
        setHighlighted(new Set((data ?? []).map((row) => row.segment_index)));
      });
  }, [devotion.id, session]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, [devotion.id]);

  const toggleSegment = async (index: number) => {
    if (!session) return;
    const wasHighlighted = highlighted.has(index);
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (wasHighlighted) next.delete(index);
      else next.add(index);
      return next;
    });
    if (wasHighlighted) {
      await supabase
        .from('devotion_highlights')
        .delete()
        .eq('user_id', session.user.id)
        .eq('devotion_id', devotion.id)
        .eq('segment_index', index);
    } else {
      await supabase
        .from('devotion_highlights')
        .insert({ user_id: session.user.id, devotion_id: devotion.id, segment_index: index });
    }
  };

  const toggleSpeech = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const parts = [devotion.title, devotion.scripture_reference, devotion.scripture_text, devotion.body].filter(
      (part): part is string => !!part
    );
    setSpeaking(true);
    Speech.speak(parts.join('. '), {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const dateLabel = new Date(devotion.devotion_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Text style={theme.typography.caption}>{dateLabel}</Text>

      <View style={styles.titleRow}>
        <Text style={[theme.typography.title, styles.titleText]}>{devotion.title}</Text>
        <View style={styles.actions}>
          <Pressable onPress={toggleSpeech} hitSlop={12}>
            <Ionicons name={speaking ? 'stop-circle' : 'volume-high-outline'} size={24} color={theme.colors.primary} />
          </Pressable>
          <Pressable onPress={onToggleBookmark} hitSlop={12}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.scriptureCard}>
        <Text style={styles.scriptureRef}>{devotion.scripture_reference}</Text>
        {devotion.scripture_text ? (
          <Text style={styles.scriptureText}>"{devotion.scripture_text}"</Text>
        ) : null}
      </View>

      <Text style={theme.typography.body}>
        {segments.map((segment, index) => (
          <Text
            key={index}
            onPress={session ? () => toggleSegment(index) : undefined}
            style={highlighted.has(index) ? styles.highlighted : undefined}>
            {segment}
            {index < segments.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>

      {devotion.author ? <Text style={styles.author}>— {devotion.author}</Text> : null}
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
    titleText: { flex: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    scriptureCard: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    scriptureRef: { fontSize: 15 * theme.fontScale, fontWeight: '700', color: theme.colors.primary },
    scriptureText: { fontSize: 16 * theme.fontScale, fontStyle: 'italic', color: theme.colors.text },
    author: { fontSize: 15 * theme.fontScale, color: theme.colors.textMuted, textAlign: 'right' },
    highlighted: { backgroundColor: theme.scheme === 'dark' ? '#5C4813' : '#FFE58A' },
  });
