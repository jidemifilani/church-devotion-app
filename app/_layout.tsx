import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/hooks/useLocale';
import { registerForPushNotificationsAsync, syncDailyReminder } from '@/lib/notifications';
import { initI18n, changeLocale } from '@/lib/i18n';
import { wrapRoot } from '@/lib/sentry';
import { STAFF_ROLES } from '@/constants/roles';

function RootNavigator() {
  const { session, profile, isLoading } = useAuth();
  const { theme } = useTheme();
  const { locale } = useLocale();

  useEffect(() => {
    if (!session || !profile) return;
    registerForPushNotificationsAsync(session.user.id);
    syncDailyReminder(profile.reminder_enabled, profile.reminder_time);
  }, [session, profile?.reminder_enabled, profile?.reminder_time]);

  // once a profile loads it's the authoritative locale source (same
  // precedence pattern as theme preference) — sync i18next to match
  useEffect(() => {
    if (profile?.locale && profile.locale !== locale) {
      changeLocale(profile.locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.locale]);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
        <Stack.Protected guard={!!session}>
          <Stack.Protected guard={!!profile && !profile.has_onboarded}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!!profile && profile.has_onboarded}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="devotion/[id]" options={{ title: 'Devotion' }} />
            <Stack.Screen name="bookmarks" options={{ title: 'Saved Devotions' }} />
            <Stack.Screen name="archive" options={{ title: 'Past Devotions' }} />
            <Stack.Protected guard={!!profile && STAFF_ROLES.includes(profile.role)}>
              <Stack.Screen name="admin" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack.Protected>
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default wrapRoot(RootLayout);
