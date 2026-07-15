import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { ChurchInfo, StaffMember } from '@/types/database';

function InfoRow({ icon, text, onPress, theme }: { icon: any; text: string; onPress?: () => void; theme: Theme }) {
  const styles = makeStyles(theme);
  const content = (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={theme.typography.body}>{text}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export default function ChurchInfoScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [info, setInfo] = useState<ChurchInfo | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        supabase.from('church_info').select('*').eq('id', 1).single(),
        supabase.from('staff_members').select('*').order('order_index'),
      ]).then(([{ data: infoData }, { data: staffData }]) => {
        setInfo(infoData ?? null);
        setStaff(staffData ?? []);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={theme.typography.title}>{info?.name || 'Our Church'}</Text>

      {info?.service_times ? <InfoRow theme={theme} icon="time-outline" text={info.service_times} /> : null}
      {info?.address ? (
        <InfoRow
          theme={theme}
          icon="location-outline"
          text={info.address}
          onPress={() =>
            Linking.openURL(info.map_url || `https://maps.google.com/?q=${encodeURIComponent(info.address ?? '')}`)
          }
        />
      ) : null}
      {info?.phone ? <InfoRow theme={theme} icon="call-outline" text={info.phone} onPress={() => Linking.openURL(`tel:${info.phone}`)} /> : null}
      {info?.email ? (
        <InfoRow theme={theme} icon="mail-outline" text={info.email} onPress={() => Linking.openURL(`mailto:${info.email}`)} />
      ) : null}
      {info?.website ? (
        <InfoRow theme={theme} icon="globe-outline" text={info.website} onPress={() => Linking.openURL(info.website!)} />
      ) : null}

      {staff.length ? (
        <View style={styles.staffSection}>
          <Text style={theme.typography.caption}>STAFF</Text>
          {staff.map((member) => (
            <View key={member.id} style={styles.staffRow}>
              <Text style={theme.typography.body}>{member.full_name}</Text>
              {member.role_title ? <Text style={theme.typography.caption}>{member.role_title}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {!info?.address && !info?.service_times && !staff.length ? (
        <Text style={theme.typography.body}>Church info hasn't been added yet.</Text>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flexGrow: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    staffSection: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
    staffRow: { gap: 2 },
  });
