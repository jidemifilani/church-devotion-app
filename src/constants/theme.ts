export const colors = {
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

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
};
