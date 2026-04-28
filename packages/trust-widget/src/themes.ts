export interface ThemeColors {
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  barBg: string;
  divider: string;
  shadow: string;
}

export const THEMES: Record<string, ThemeColors> = {
  light: {
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#9CA3AF',
    barBg: '#F3F4F6',
    divider: '#F3F4F6',
    shadow: 'rgba(0,0,0,0.08)',
  },
  dark: {
    cardBg: '#1F2937',
    cardBorder: '#374151',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#6B7280',
    barBg: '#374151',
    divider: '#374151',
    shadow: 'rgba(0,0,0,0.3)',
  },
};
