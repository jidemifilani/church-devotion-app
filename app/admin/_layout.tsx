import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="devotions/index" options={{ title: 'Devotions' }} />
      <Stack.Screen name="devotions/[id]" options={{ title: 'Devotion' }} />
      <Stack.Screen name="hymns/index" options={{ title: 'Hymns' }} />
      <Stack.Screen name="hymns/[id]" options={{ title: 'Hymn' }} />
      <Stack.Screen name="plans/index" options={{ title: 'Reading Plans' }} />
      <Stack.Screen name="plans/[id]" options={{ title: 'Plan' }} />
      <Stack.Screen name="prayer/index" options={{ title: 'Prayer Requests' }} />
    </Stack>
  );
}
