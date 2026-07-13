import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Locale } from '@/types/database';

import enCommon from '@/locales/en/common.json';
import frCommon from '@/locales/fr/common.json';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'yo', 'ig', 'ha'];
export const LOCALE_STORAGE_KEY = 'app-locale';

// yo/ig/ha resource bundles aren't shipped yet (see roadmap: pipeline ships
// with en + fr to validate end-to-end; remaining languages are content-only
// follow-up) — i18next's fallbackLng means those locales render English text
// until real translations land, rather than us guessing at unverified copy.
const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
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
