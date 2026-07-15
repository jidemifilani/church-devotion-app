import 'expo-router/entry';
import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/environment';

// react-native-android-widget's native module only exists on Android, and
// only in a dev-client/standalone build — Expo Go's precompiled binary
// doesn't include it, so this must be skipped there or it crashes on import
// (same class of issue as expo-notifications in src/lib/notifications.ts).
if (Platform.OS === 'android' && !isExpoGo) {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('@/widgets/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
