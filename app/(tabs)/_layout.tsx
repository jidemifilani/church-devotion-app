import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.today'),
          tabBarIcon: ({ color, size }) => <Ionicons name="sunny" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: t('nav.plans'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t('nav.prayer'),
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="hymns"
        options={{
          title: t('nav.hymns'),
          tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
