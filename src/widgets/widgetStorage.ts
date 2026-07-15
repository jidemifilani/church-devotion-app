import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TodayVerseWidgetData } from './TodayVerseWidget';

const WIDGET_DATA_KEY = 'today-verse-widget-data';

export async function writeTodayVerseWidgetData(data: TodayVerseWidgetData) {
  await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
}

export async function readTodayVerseWidgetData(): Promise<TodayVerseWidgetData | null> {
  const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
  return raw ? JSON.parse(raw) : null;
}
