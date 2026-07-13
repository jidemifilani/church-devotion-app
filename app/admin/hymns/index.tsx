import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { Hymn } from '@/types/database';

export default function AdminHymnsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
            <Text style={theme.typography.body}>No hymns yet. Add the first one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/admin/hymns/${item.id}`)}>
            <Text style={theme.typography.heading}>
              {item.number ? `${item.number}. ` : ''}
              {item.title}
            </Text>
            {item.author ? <Text style={theme.typography.caption}>{item.author}</Text> : null}
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/admin/hymns/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, flexGrow: 1 },
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
  });
