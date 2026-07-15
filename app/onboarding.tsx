import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { Button } from '@/components/Button';
import type { Theme } from '@/constants/theme';

const SLIDES = [
  { icon: 'sunny', title: 'A daily devotion', body: 'Start each day with scripture and reflection on the Today tab.' },
  { icon: 'book', title: 'Reading plans', body: 'Work through multi-day plans at your own pace.' },
  { icon: 'heart', title: 'Prayer wall', body: 'Share requests, pray for others, and celebrate answered prayers together.' },
  { icon: 'notifications', title: 'Stay on track', body: "We'll ask for notification permission next so you can get a daily reminder." },
] as const;

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const finish = async () => {
    if (!session) return;
    setFinishing(true);
    await registerForPushNotificationsAsync(session.user.id).catch(() => null);
    await supabase.from('profiles').update({ has_onboarded: true }).eq('id', session.user.id);
    await refreshProfile();
    setFinishing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={slide.icon as any} size={56} color={theme.colors.primary} />
      </View>
      <Text style={theme.typography.title}>{slide.title}</Text>
      <Text style={[theme.typography.body, styles.body]}>{slide.body}</Text>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <Button
        label={isLast ? "Let's go" : 'Next'}
        onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
        loading={finishing}
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
      justifyContent: 'center',
      gap: theme.spacing.md,
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    body: { textAlign: 'center', color: theme.colors.textMuted },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xs, marginVertical: theme.spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
    dotActive: { backgroundColor: theme.colors.primary, width: 20 },
  });
