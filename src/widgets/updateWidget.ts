import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/environment';
import { writeTodayVerseWidgetData } from './widgetStorage';
import type { TodayVerseWidgetData } from './TodayVerseWidget';

/**
 * No-op on iOS/web (native module is Android-only) and in Expo Go (Expo
 * Go's precompiled binary doesn't include this custom native module).
 */
export async function updateTodayVerseWidget(data: TodayVerseWidgetData) {
  if (Platform.OS !== 'android' || isExpoGo) return;

  await writeTodayVerseWidgetData(data);

  const { requestWidgetUpdate } = require('react-native-android-widget');
  const { TodayVerseWidget } = require('./TodayVerseWidget');

  await requestWidgetUpdate({
    widgetName: 'TodayVerse',
    renderWidget: () => TodayVerseWidget(data),
  });
}
