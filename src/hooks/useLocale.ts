import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { changeLocale } from '@/lib/i18n';
import type { Locale } from '@/types/database';

export function useLocale() {
  const { i18n } = useTranslation();
  const { session } = useAuth();
  const locale = i18n.language as Locale;

  const setLocale = async (next: Locale) => {
    await changeLocale(next);
    if (session) {
      await supabase.from('profiles').update({ locale: next }).eq('id', session.user.id);
    }
  };

  return { locale, setLocale };
}
