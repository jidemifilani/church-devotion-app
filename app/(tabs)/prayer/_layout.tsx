import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function PrayerLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Prayer Wall' }} />
      <Stack.Screen name="new" options={{ title: 'New Prayer Request', presentation: 'modal' }} />
    </Stack>
  );
}
