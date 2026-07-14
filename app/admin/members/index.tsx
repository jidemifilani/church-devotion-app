import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/Card';
import type { Theme } from '@/constants/theme';
import type { Profile, Role } from '@/types/database';

const ROLES: Role[] = ['member', 'editor', 'moderator', 'admin'];

export default function AdminMembersScreen() {
  const { profile: currentProfile } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [members, setMembers] = useState<Profile[]>([]);
  const canManageRoles = currentProfile?.role === 'admin';

  const load = useCallback(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('full_name')
      .then(({ data }) => setMembers(data ?? []));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const changeRole = async (member: Profile, role: Role) => {
    if (!canManageRoles || role === member.role) return;
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role } : m)));
    const { error } = await supabase.from('profiles').update({ role }).eq('id', member.id);
    if (error) {
      Alert.alert('Could not update role', error.message);
      load();
    }
  };

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        !canManageRoles ? (
          <Text style={[theme.typography.caption, styles.notice]}>Only admins can change member roles.</Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={theme.typography.body}>No members yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={theme.typography.heading}>{item.full_name ?? 'Unnamed member'}</Text>
          <View style={styles.rolesRow}>
            {ROLES.map((role) => {
              const active = item.role === role;
              return (
                <Text
                  key={role}
                  onPress={() => changeRole(item, role)}
                  style={[
                    styles.roleChip,
                    active && styles.roleChipActive,
                    !canManageRoles && styles.roleChipDisabled,
                  ]}>
                  {role}
                </Text>
              );
            })}
          </View>
        </Card>
      )}
    />
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    notice: { marginBottom: theme.spacing.sm },
    rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    roleChip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 13,
      overflow: 'hidden',
    },
    roleChipActive: { backgroundColor: theme.colors.primary, color: '#fff' },
    roleChipDisabled: { opacity: 0.5 },
  });
