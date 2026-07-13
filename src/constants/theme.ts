export const lightColors = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  primary: '#4A3AFF',
  primaryMuted: '#EDEBFF',
  text: '#1F2233',
  textMuted: '#6B7080',
  border: '#E7E5F0',
  danger: '#E0533D',
  success: '#2E9E6D',
};

export const darkColors: typeof lightColors = {
  background: '#14141C',
  surface: '#1E1E29',
  primary: '#8B7FFF',
  primaryMuted: '#2A2740',
  text: '#F2F1F7',
  textMuted: '#9A9AAC',
  border: '#2E2E3D',
  danger: '#FF6B57',
  success: '#4FCC96',
};

export type ThemeColors = typeof lightColors;
export type ColorScheme = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export function makeTypography(colors: ThemeColors, fontScale: number = 1) {
  return {
    title: { fontSize: 26 * fontScale, fontWeight: '700' as const, color: colors.text },
    heading: { fontSize: 20 * fontScale, fontWeight: '700' as const, color: colors.text },
    body: { fontSize: 16 * fontScale, fontWeight: '400' as const, color: colors.text, lineHeight: 24 * fontScale },
    caption: { fontSize: 13 * fontScale, fontWeight: '500' as const, color: colors.textMuted },
  };
}

export type Typography = ReturnType<typeof makeTypography>;

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: Typography;
  fontScale: number;
};

export function makeTheme(scheme: ColorScheme, fontScale: number = 1): Theme {
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { scheme, colors, spacing, radius, typography: makeTypography(colors, fontScale), fontScale };
}
