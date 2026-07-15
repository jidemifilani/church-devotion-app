import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';
import type { GivingSettings } from '@/types/database';

export default function GivingScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [settings, setSettings] = useState<GivingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('giving_settings')
        .select('*')
        .eq('id', 1)
        .single()
        .then(({ data }) => {
          setSettings(data ?? null);
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
    <View style={styles.container}>
      <Text style={theme.typography.title}>Support the Church</Text>
      <Text style={theme.typography.body}>{settings?.note || 'Thank you for considering a gift to support our ministry.'}</Text>
      {settings?.giving_url ? (
        <Button label="Give now" onPress={() => WebBrowser.openBrowserAsync(settings.giving_url!)} />
      ) : (
        <Text style={theme.typography.caption}>Online giving isn't set up yet — check back soon.</Text>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    container: { padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.background, flex: 1 },
  });
