import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function PlansLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <Stack.Screen name="index" options={{ title: 'Reading Plans' }} />
      <Stack.Screen name="[id]" options={{ title: 'Plan' }} />
    </Stack>
  );
}
