import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function PrayerLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Prayer Wall' }} />
      <Stack.Screen name="new" options={{ title: 'New Prayer Request', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Prayer Request' }} />
    </Stack>
  );
}
