import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';
import type { StaffMember } from '@/types/database';

// staff directory shown on the member-facing church info screen
export function StaffMembersEditor() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    supabase
      .from('staff_members')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => setMembers(data ?? []));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing fields', 'Full name is required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('staff_members').insert({
      full_name: fullName.trim(),
      role_title: roleTitle.trim() || null,
      email: email.trim() || null,
      order_index: 0,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not add staff member', error.message);
      return;
    }
    setFullName('');
    setRoleTitle('');
    setEmail('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('staff_members').delete().eq('id', id);
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={theme.typography.caption}>STAFF DIRECTORY</Text>
      {members.map((member) => (
        <View key={member.id} style={styles.row}>
          <Text style={theme.typography.body}>
            {member.full_name}
            {member.role_title ? ` — ${member.role_title}` : ''}
          </Text>
          <Button label="Remove" variant="secondary" onPress={() => remove(member.id)} />
        </View>
      ))}
      <View style={styles.form}>
        <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
        <TextField label="Role / title (optional)" value={roleTitle} onChangeText={setRoleTitle} placeholder="Lead Pastor" />
        <TextField label="Email (optional)" value={email} onChangeText={setEmail} placeholder="jane@example.com" autoCapitalize="none" />
        <Button label="Add staff member" variant="secondary" onPress={add} loading={saving} />
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
    form: {
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
  });
