import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { PrayerReport, PrayerRequest } from '@/types/database';

type Row = PrayerRequest & { openReports: PrayerReport[] };

export default function AdminPrayerScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [requests, setRequests] = useState<Row[]>([]);
  const [showReportedOnly, setShowReportedOnly] = useState(false);

  const load = useCallback(async () => {
    const [{ data: requestsData }, { data: reportsData }] = await Promise.all([
      supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('prayer_reports').select('*').eq('status', 'open'),
    ]);
    const reportsByRequest = new Map<string, PrayerReport[]>();
    for (const report of reportsData ?? []) {
      const list = reportsByRequest.get(report.prayer_request_id) ?? [];
      list.push(report);
      reportsByRequest.set(report.prayer_request_id, list);
    }
    setRequests((requestsData ?? []).map((r) => ({ ...r, openReports: reportsByRequest.get(r.id) ?? [] })));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleStatus = async (item: PrayerRequest) => {
    const nextStatus = item.status === 'active' ? 'answered' : 'active';
    await supabase.from('prayer_requests').update({ status: nextStatus }).eq('id', item.id);
    load();
  };

  const remove = (item: PrayerRequest) => {
    Alert.alert('Delete prayer request', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('prayer_requests').delete().eq('id', item.id);
          load();
        },
      },
    ]);
  };

  const dismissReports = async (item: Row) => {
    await supabase
      .from('prayer_reports')
      .update({ status: 'dismissed' })
      .in('id', item.openReports.map((r) => r.id));
    load();
  };

  const resolveReports = async (item: Row) => {
    await supabase
      .from('prayer_reports')
      .update({ status: 'resolved' })
      .in('id', item.openReports.map((r) => r.id));
    load();
  };

  const visibleRequests = showReportedOnly ? requests.filter((r) => r.openReports.length > 0) : requests;
  const reportedCount = requests.filter((r) => r.openReports.length > 0).length;

  return (
    <FlatList
      data={visibleRequests}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <Pressable onPress={() => setShowReportedOnly((v) => !v)} style={[styles.filterChip, showReportedOnly && styles.filterChipActive]}>
          <Text style={[styles.filterText, showReportedOnly && styles.filterTextActive]}>
            {showReportedOnly ? 'Showing reported' : `Reported (${reportedCount})`}
          </Text>
        </Pressable>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>{showReportedOnly ? 'No open reports.' : 'No prayer requests yet.'}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={item.openReports.length ? styles.reportedCard : undefined}>
          <Text style={theme.typography.caption}>
            {item.is_anonymous ? 'Anonymous' : item.display_name ?? 'A member'} • {item.prayer_count} praying
            {item.status === 'answered' ? ' • Answered' : ''}
          </Text>
          <Text style={theme.typography.body}>{item.content}</Text>
          {item.openReports.length ? (
            <Text style={styles.reportNote}>
              🚩 Reported {item.openReports.length} time{item.openReports.length === 1 ? '' : 's'}
              {item.openReports[0].reason ? ` — ${item.openReports.map((r) => r.reason).join(', ')}` : ''}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={item.status === 'active' ? 'Mark answered' : 'Mark active'}
              variant="secondary"
              onPress={() => toggleStatus(item)}
              style={styles.actionButton}
            />
            <Button label="Delete" variant="secondary" onPress={() => remove(item)} style={styles.actionButton} />
          </View>
          {item.openReports.length ? (
            <View style={styles.actions}>
              <Button label="Dismiss reports" variant="secondary" onPress={() => dismissReports(item)} style={styles.actionButton} />
              <Button label="Resolve reports" variant="secondary" onPress={() => resolveReports(item)} style={styles.actionButton} />
            </View>
          ) : null}
        </Card>
      )}
    />
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    filterChip: {
      alignSelf: 'flex-start',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
      marginBottom: theme.spacing.sm,
    },
    filterChipActive: { backgroundColor: theme.colors.primary },
    filterText: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
    filterTextActive: { color: '#fff' },
    reportedCard: { borderColor: theme.colors.danger, borderWidth: 2 },
    reportNote: { color: theme.colors.danger, fontWeight: '600', fontSize: 13 },
    actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    actionButton: { flex: 1 },
  });
