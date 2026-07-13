import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function HymnsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Hymn Book' }} />
      <Stack.Screen name="[id]" options={{ title: 'Hymn' }} />
    </Stack>
  );
}
