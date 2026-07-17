import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { Devotion } from '@/types/database';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDevotionsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState(todayIso());
  const [bulkCount, setBulkCount] = useState('7');
  const [bulkCreating, setBulkCreating] = useState(false);

  const load = useCallback(() => {
    supabase
      .from('devotions')
      .select('*')
      .order('devotion_date', { ascending: false })
      .then(({ data }) => setDevotions(data ?? []));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const bulkPublish = async () => {
    const ids = [...selectedIds];
    await supabase
      .from('devotions')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .in('id', ids);
    const today = todayIso();
    devotions
      .filter((d) => ids.includes(d.id) && d.status !== 'published' && d.devotion_date === today)
      .forEach((d) => supabase.functions.invoke('notify-devotion-published', { body: { devotion_id: d.id } }));
    exitSelecting();
    load();
  };

  const bulkDelete = () => {
    Alert.alert('Delete selected devotions', `Delete ${selectedIds.size} devotion(s)? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('devotions').delete().in('id', [...selectedIds]);
          exitSelecting();
          load();
        },
      },
    ]);
  };

  const createSequentialDrafts = async () => {
    const count = Number(bulkCount);
    if (!bulkStartDate.trim() || !count || count < 1 || count > 60) {
      Alert.alert('Invalid input', 'Enter a start date and a count between 1 and 60.');
      return;
    }
    setBulkCreating(true);
    const start = new Date(`${bulkStartDate}T00:00:00`);
    const rows = Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        devotion_date: d.toISOString().slice(0, 10),
        title: 'Untitled devotion',
        scripture_reference: 'TBD',
        body: 'Draft placeholder — edit me.',
        status: 'draft' as const,
      };
    });
    const { error } = await supabase.from('devotions').insert(rows);
    setBulkCreating(false);
    if (error) {
      Alert.alert('Could not create drafts', error.message);
      return;
    }
    setBulkCreateOpen(false);
    load();
  };

  return (
    <View style={styles.flex}>
      <View style={styles.toolbar}>
        <Pressable onPress={selecting ? exitSelecting : () => setSelecting(true)}>
          <Text style={styles.toolbarAction}>{selecting ? 'Cancel' : 'Select'}</Text>
        </Pressable>
        <Pressable onPress={() => setBulkCreateOpen(true)}>
          <Text style={styles.toolbarAction}>Bulk create</Text>
        </Pressable>
      </View>

      <FlatList
        data={devotions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={theme.typography.body}>No devotions yet. Add the first one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => (selecting ? toggleSelect(item.id) : router.push(`/admin/devotions/${item.id}`))}
            style={selecting && selectedIds.has(item.id) ? styles.cardSelected : undefined}>
            <View style={styles.cardRow}>
              {selecting ? (
                <Ionicons
                  name={selectedIds.has(item.id) ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              ) : null}
              <View style={styles.cardText}>
                <Text style={theme.typography.caption}>
                  {item.devotion_date} • {item.language.toUpperCase()} {item.status === 'draft' ? '• DRAFT' : ''}
                </Text>
                <Text style={theme.typography.heading}>{item.title}</Text>
                <Text style={theme.typography.caption}>{item.scripture_reference}</Text>
              </View>
            </View>
          </Card>
        )}
      />

      {selecting && selectedIds.size > 0 ? (
        <View style={styles.actionBar}>
          <Button label={`Publish (${selectedIds.size})`} onPress={bulkPublish} style={styles.actionButton} />
          <Button label="Delete" variant="secondary" onPress={bulkDelete} style={styles.actionButton} />
        </View>
      ) : null}

      {!selecting ? (
        <Pressable style={styles.fab} onPress={() => router.push('/admin/devotions/new')}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      ) : null}

      <Modal visible={bulkCreateOpen} transparent animationType="fade" onRequestClose={() => setBulkCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={theme.typography.heading}>Bulk create drafts</Text>
            <Text style={theme.typography.caption}>Creates sequential daily draft placeholders for you to fill in.</Text>
            <TextField label="Start date (YYYY-MM-DD)" value={bulkStartDate} onChangeText={setBulkStartDate} />
            <TextField label="Number of days" value={bulkCount} onChangeText={setBulkCount} keyboardType="number-pad" />
            <Button label="Create drafts" onPress={createSequentialDrafts} loading={bulkCreating} />
            <Button label="Cancel" variant="secondary" onPress={() => setBulkCreateOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, flexGrow: 1 },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    toolbarAction: { color: theme.colors.primary, fontWeight: '600' },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    cardText: { flex: 1, gap: 2 },
    cardSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
    actionBar: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: { flex: 1 },
    fab: {
      position: 'absolute',
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      width: 56,
      height: 56,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: theme.spacing.lg },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
  });
