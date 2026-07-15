import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Locale } from '@/types/database';

import enCommon from '@/locales/en/common.json';
import frCommon from '@/locales/fr/common.json';
import yoCommon from '@/locales/yo/common.json';
import igCommon from '@/locales/ig/common.json';
import haCommon from '@/locales/ha/common.json';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'yo', 'ig', 'ha'];
export const LOCALE_STORAGE_KEY = 'app-locale';

// yo/ig/ha are best-effort machine/non-native translations of the UI chrome
// only (not reviewed by a native speaker — see README) — i18next's
// fallbackLng still covers any individual missing key with English.
// Devotion/scripture content stays admin-authored per language, never
// auto-translated.
const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
  yo: { common: yoCommon },
  ig: { common: igCommon },
  ha: { common: haCommon },
};

function resolveInitialLocale(): Locale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  return (SUPPORTED_LOCALES as string[]).includes(deviceLocale ?? '') ? (deviceLocale as Locale) : 'en';
}

let initialized = false;

export async function initI18n() {
  if (initialized) return;
  initialized = true;

  const cached = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  const initialLocale = cached && (SUPPORTED_LOCALES as string[]).includes(cached) ? (cached as Locale) : resolveInitialLocale();

  await i18next.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export async function changeLocale(locale: Locale) {
  await i18next.changeLanguage(locale);
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export default i18next;
