import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function ChurchLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Church' }} />
      <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
      <Stack.Screen name="info" options={{ title: 'Church Info' }} />
      <Stack.Screen name="giving" options={{ title: 'Give' }} />
      <Stack.Screen name="ministries" options={{ title: 'Ministries' }} />
      <Stack.Screen name="sermons/index" options={{ title: 'Sermons' }} />
    </Stack>
  );
}
