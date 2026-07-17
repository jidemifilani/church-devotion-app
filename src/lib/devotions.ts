import type { Devotion, Locale } from '@/types/database';

// devotions are admin-authored per language (unique per devotion_date + language),
// not machine-translated. When a date has no version in the member's locale yet,
// fall back to English rather than showing nothing.
export function localesToFetch(locale: Locale): Locale[] {
  return locale === 'en' ? ['en'] : [locale, 'en'];
}

export function preferLocale(devotions: Devotion[], locale: Locale): Devotion[] {
  const byDate = new Map<string, Devotion>();
  for (const devotion of devotions) {
    const existing = byDate.get(devotion.devotion_date);
    if (!existing || devotion.language === locale) {
      byDate.set(devotion.devotion_date, devotion);
    }
  }
  return [...byDate.values()].sort((a, b) => (a.devotion_date < b.devotion_date ? 1 : -1));
}
