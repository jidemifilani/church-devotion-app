import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Devotion } from '@/types/database';

export default function AdminDevotionsScreen() {
  const [devotions, setDevotions] = useState<Devotion[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('devotions')
        .select('*')
        .order('devotion_date', { ascending: false })
        .then(({ data }) => setDevotions(data ?? []));
    }, [])
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={devotions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={typography.body}>No devotions yet. Add the first one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/admin/devotions/${item.id}`)}>
            <Text style={typography.caption}>{item.devotion_date}</Text>
            <Text style={typography.heading}>{item.title}</Text>
            <Text style={typography.caption}>{item.scripture_reference}</Text>
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/admin/devotions/new')}>
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
