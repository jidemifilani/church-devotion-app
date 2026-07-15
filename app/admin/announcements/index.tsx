import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { useAdminList } from '@/hooks/useAdminList';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

export default function AdminAnnouncementsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { items: announcements, loading } = useAdminList('announcements', {
    orderBy: { column: 'created_at', ascending: false },
  });

  return (
    <View style={styles.flex}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centered}>
              <Text style={theme.typography.body}>No announcements yet. Add the first one.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/admin/announcements/${item.id}`)}>
            <Text style={theme.typography.heading}>{item.title}</Text>
            {item.event_date ? (
              <Text style={theme.typography.caption}>{new Date(item.event_date).toLocaleDateString()}</Text>
            ) : null}
          </Card>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/admin/announcements/new')}>
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
