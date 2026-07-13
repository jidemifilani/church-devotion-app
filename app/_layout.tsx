import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { registerForPushNotificationsAsync, syncDailyReminder } from '@/lib/notifications';
import { colors } from '@/constants/theme';

function RootNavigator() {
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!session || !profile) return;
    registerForPushNotificationsAsync(session.user.id);
    syncDailyReminder(profile.reminder_enabled, profile.reminder_time);
  }, [session, profile?.reminder_enabled, profile?.reminder_time]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="devotion/[id]" options={{ title: 'Devotion' }} />
        <Stack.Screen name="bookmarks" options={{ title: 'Saved Devotions' }} />
        <Stack.Protected guard={profile?.role === 'admin'}>
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
