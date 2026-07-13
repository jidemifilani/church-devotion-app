import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Hymn } from '@/types/database';

export default function AdminHymnsScreen() {
  const [hymns, setHymns] = useState<Hymn[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('hymns')
        .select('*')
        .order('number', { ascending: true, nullsFirst: false })
        .then(({ data }) => setHymns(data ?? []));
    }, [])
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={hymns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={typography.body}>No hymns yet. Add the first one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/admin/hymns/${item.id}`)}>
            <Text style={typography.heading}>
              {item.number ? `${item.number}. ` : ''}
              {item.title}
            </Text>
            {item.author ? <Text style={typography.caption}>{item.author}</Text> : null}
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/admin/hymns/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
