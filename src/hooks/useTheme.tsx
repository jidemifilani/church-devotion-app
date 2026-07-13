import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeTheme, type ColorScheme, type Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { ThemePreference } from '@/types/database';

const THEME_STORAGE_KEY = 'theme-preference';
const FONT_SCALE_STORAGE_KEY = 'font-scale';
const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.6;

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  fontScale: number;
  setPreference: (pref: ThemePreference) => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { profile, session } = useAuth();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [fontScale, setFontScaleState] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  // pre-auth fallback: local cache, then device locale-equivalent (system scheme)
  useEffect(() => {
    (async () => {
      const [storedPref, storedScale] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(FONT_SCALE_STORAGE_KEY),
      ]);
      if (storedPref === 'light' || storedPref === 'dark' || storedPref === 'system') {
        setPreferenceState(storedPref);
      }
      if (storedScale) {
        const parsed = Number(storedScale);
        if (!Number.isNaN(parsed)) setFontScaleState(parsed);
      }
      setHydrated(true);
    })();
  }, []);

  // once a profile loads, it's authoritative — sync local cache to match
  useEffect(() => {
    if (!profile) return;
    if (profile.theme_preference && profile.theme_preference !== preference) {
      setPreferenceState(profile.theme_preference);
      AsyncStorage.setItem(THEME_STORAGE_KEY, profile.theme_preference);
    }
    if (profile.font_scale && profile.font_scale !== fontScale) {
      setFontScaleState(profile.font_scale);
      AsyncStorage.setItem(FONT_SCALE_STORAGE_KEY, String(profile.font_scale));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme_preference, profile?.font_scale]);

  const setPreference = async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    if (session) {
      await supabase.from('profiles').update({ theme_preference: pref }).eq('id', session.user.id);
    }
  };

  const setFontScale = async (scale: number) => {
    const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
    setFontScaleState(clamped);
    await AsyncStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    if (session) {
      await supabase.from('profiles').update({ font_scale: clamped }).eq('id', session.user.id);
    }
  };

  const resolvedScheme: ColorScheme = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => makeTheme(resolvedScheme, fontScale), [resolvedScheme, fontScale]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, fontScale, setPreference, setFontScale }),
    [theme, preference, fontScale]
  );

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
