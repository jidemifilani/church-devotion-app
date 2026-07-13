import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Device from 'expo-device';
import { supabase } from '@/lib/supabase';

const REMINDER_NOTIFICATION_ID = 'daily-devotion-reminder';

// expo-notifications' remote-push functionality was removed from Expo Go in SDK 53,
// and merely importing the module throws there — so it must be loaded lazily and
// skipped entirely when running inside Expo Go rather than a dev/production build.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let handlerSet = false;
async function getNotifications() {
  if (isExpoGo) return null;
  const Notifications = await import('expo-notifications');
  if (!handlerSet) {
    handlerSet = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return Notifications;
}

export async function registerForPushNotificationsAsync(userId: string) {
  const Notifications = await getNotifications();
  if (!Notifications || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, device_type: Platform.OS },
      { onConflict: 'user_id,token' }
    );
    return token;
  } catch {
    return null;
  }
}

export async function syncDailyReminder(enabled: boolean, time: string) {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID).catch(() => {});
  if (!enabled) return;

  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'Time for your daily devotion 🙏',
      body: "Today's reading is ready whenever you are.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
