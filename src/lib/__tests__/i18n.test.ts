import { SUPPORTED_LOCALES } from '@/lib/i18n';

describe('SUPPORTED_LOCALES', () => {
  it('matches the locale check constraint in supabase/migrations/0002_engagement.sql and 0004_personalization.sql', () => {
    expect(SUPPORTED_LOCALES.sort()).toEqual(['en', 'fr', 'ha', 'ig', 'yo'].sort());
  });
});
