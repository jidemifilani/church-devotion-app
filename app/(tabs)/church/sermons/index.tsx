import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Sermon } from '@/types/database';

function SermonRow({ sermon, theme }: { sermon: Sermon; theme: Theme }) {
  const styles = makeStyles(theme);
  const player = useAudioPlayer(sermon.audio_url ?? undefined);
  const status = useAudioPlayerStatus(player);

  return (
    <Card>
      <Text style={theme.typography.caption}>
        {new Date(sermon.sermon_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        {sermon.speaker ? ` • ${sermon.speaker}` : ''}
      </Text>
      <Text style={theme.typography.heading}>{sermon.title}</Text>
      {sermon.description ? <Text style={theme.typography.body}>{sermon.description}</Text> : null}
      {sermon.audio_url ? (
        <Pressable
          style={styles.playRow}
          onPress={() => (status.playing ? player.pause() : player.play())}>
          <Ionicons name={status.playing ? 'pause-circle' : 'play-circle'} size={28} color={theme.colors.primary} />
          <Text style={styles.playLabel}>
            {status.playing ? 'Playing…' : 'Listen'}
            {status.duration ? ` (${Math.round(status.duration / 60)} min)` : ''}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export default function SermonsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('sermons')
        .select('*')
        .order('sermon_date', { ascending: false })
        .then(({ data }) => {
          setSermons(data ?? []);
          setLoading(false);
        });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={sermons}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>No sermons posted yet.</Text>
        </View>
      }
      renderItem={({ item }) => <SermonRow sermon={item} theme={theme} />}
    />
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    playRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
    playLabel: { color: theme.colors.primary, fontWeight: '600' },
  });
