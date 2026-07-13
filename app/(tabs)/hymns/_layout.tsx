import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function HymnsLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Hymn Book' }} />
      <Stack.Screen name="[id]" options={{ title: 'Hymn' }} />
    </Stack>
  );
}
