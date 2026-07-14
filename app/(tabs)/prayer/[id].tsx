import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';
import type { PrayerReply, PrayerRequest } from '@/types/database';

type Row = PrayerRequest & { hasPrayed: boolean };

export default function PrayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [request, setRequest] = useState<Row | null>(null);
  const [replies, setReplies] = useState<(PrayerReply & { author: string })[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [{ data: requestData }, { data: interaction }, { data: repliesData }] = await Promise.all([
      supabase.from('prayer_requests').select('*').eq('id', id).single(),
      session
        ? supabase.from('prayer_interactions').select('id').eq('user_id', session.user.id).eq('prayer_request_id', id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('prayer_replies')
        .select('*, profiles(full_name)')
        .eq('prayer_request_id', id)
        .order('created_at', { ascending: true }),
    ]);
    if (requestData) setRequest({ ...requestData, hasPrayed: !!interaction });
    setReplies(
      ((repliesData ?? []) as any[]).map((r) => ({
        ...r,
        author: r.profiles?.full_name ?? 'A member',
      }))
    );
    setLoading(false);
  }, [id, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const togglePray = async () => {
    if (!session || !request) return;
    const willPray = !request.hasPrayed;
    setRequest((prev) =>
      prev ? { ...prev, hasPrayed: willPray, prayer_count: prev.prayer_count + (willPray ? 1 : -1) } : prev
    );
    if (willPray) {
      await supabase.from('prayer_interactions').insert({ user_id: session.user.id, prayer_request_id: request.id });
      supabase.functions.invoke('notify-prayer', { body: { prayer_request_id: request.id } });
    } else {
      await supabase.from('prayer_interactions').delete().eq('user_id', session.user.id).eq('prayer_request_id', request.id);
    }
  };

  const sendReply = async () => {
    if (!session || !replyText.trim() || !request) return;
    setSending(true);
    const { error } = await supabase
      .from('prayer_replies')
      .insert({ prayer_request_id: request.id, user_id: session.user.id, content: replyText.trim() });
    setSending(false);
    if (error) {
      Alert.alert('Could not send reply', error.message);
      return;
    }
    setReplyText('');
    load();
  };

  const reportRequest = () => {
    if (!session || !request) return;
    Alert.alert('Report this request', 'Why are you reporting this?', [
      { text: 'Inappropriate', onPress: () => submitReport('inappropriate') },
      { text: 'Spam', onPress: () => submitReport('spam') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitReport = async (reason: string) => {
    if (!session || !request) return;
    const { error } = await supabase
      .from('prayer_reports')
      .insert({ prayer_request_id: request.id, reported_by: session.user.id, reason });
    if (error && !error.message.includes('duplicate')) {
      Alert.alert('Could not submit report', error.message);
    } else {
      Alert.alert('Thanks', 'This has been reported to the church staff.');
    }
  };

  if (loading || !request) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={theme.typography.caption}>
                {request.is_anonymous ? 'Anonymous' : request.display_name ?? 'A member'}
                {request.status === 'answered' ? '  •  🙌 Answered' : ''}
              </Text>
              {request.user_id !== session?.user.id ? (
                <Pressable onPress={reportRequest} hitSlop={12}>
                  <Ionicons name="flag-outline" size={18} color={theme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            <Text style={theme.typography.body}>{request.content}</Text>
            <Pressable style={styles.prayRow} onPress={togglePray}>
              <Ionicons name={request.hasPrayed ? 'heart' : 'heart-outline'} size={20} color={theme.colors.primary} />
              <Text style={styles.prayCount}>{request.prayer_count} praying</Text>
            </Pressable>
            <Text style={[theme.typography.caption, styles.repliesLabel]}>REPLIES</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[theme.typography.caption, styles.noReplies]}>No replies yet — be the first to encourage them.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.reply}>
            <Text style={theme.typography.caption}>{item.author}</Text>
            <Text style={theme.typography.body}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextField label="" placeholder="Write an encouraging reply..." value={replyText} onChangeText={setReplyText} style={styles.input} />
        <Button label="Send" onPress={sendReply} loading={sending} disabled={!replyText.trim()} style={styles.sendButton} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, flexGrow: 1 },
    header: { gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    prayRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    prayCount: { color: theme.colors.primary, fontWeight: '600' },
    repliesLabel: { marginTop: theme.spacing.md },
    noReplies: { paddingVertical: theme.spacing.md },
    reply: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: 2,
    },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm, padding: theme.spacing.lg, paddingTop: 0 },
    input: { flex: 1 },
    sendButton: { width: 80 },
  });
