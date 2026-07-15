import { Platform } from 'react-native';
import { writeTodayVerseWidgetData } from './widgetStorage';
import type { TodayVerseWidgetData } from './TodayVerseWidget';

/** No-op on iOS/web — react-native-android-widget's native module is Android-only. */
export async function updateTodayVerseWidget(data: TodayVerseWidgetData) {
  if (Platform.OS !== 'android') return;

  await writeTodayVerseWidgetData(data);

  const { requestWidgetUpdate } = require('react-native-android-widget');
  const { TodayVerseWidget } = require('./TodayVerseWidget');

  await requestWidgetUpdate({
    widgetName: 'TodayVerse',
    renderWidget: () => TodayVerseWidget(data),
  });
}
