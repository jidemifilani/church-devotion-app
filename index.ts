import 'expo-router/entry';
import { Platform } from 'react-native';

// react-native-android-widget's native module only exists on Android
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('@/widgets/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
