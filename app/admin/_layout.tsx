import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function AdminLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="devotions/index" options={{ title: 'Devotions' }} />
      <Stack.Screen name="devotions/[id]" options={{ title: 'Devotion' }} />
      <Stack.Screen name="hymns/index" options={{ title: 'Hymns' }} />
      <Stack.Screen name="hymns/[id]" options={{ title: 'Hymn' }} />
      <Stack.Screen name="plans/index" options={{ title: 'Reading Plans' }} />
      <Stack.Screen name="plans/[id]" options={{ title: 'Plan' }} />
      <Stack.Screen name="prayer/index" options={{ title: 'Prayer Requests' }} />
      <Stack.Screen name="analytics/index" options={{ title: 'Analytics' }} />
      <Stack.Screen name="members/index" options={{ title: 'Members' }} />
      <Stack.Screen name="announcements/index" options={{ title: 'Announcements' }} />
      <Stack.Screen name="announcements/[id]" options={{ title: 'Announcement' }} />
      <Stack.Screen name="sermons/index" options={{ title: 'Sermons' }} />
      <Stack.Screen name="sermons/[id]" options={{ title: 'Sermon' }} />
      <Stack.Screen name="ministries/index" options={{ title: 'Ministries' }} />
      <Stack.Screen name="ministries/[id]" options={{ title: 'Ministry' }} />
      <Stack.Screen name="church-settings/index" options={{ title: 'Church Settings' }} />
      <Stack.Screen name="tags/index" options={{ title: 'Tags' }} />
    </Stack>
  );
}
