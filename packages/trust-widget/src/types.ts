export type TrustBand = 'AAA' | 'AAB' | 'ABB' | 'BBB' | 'BBC' | 'BCC' | 'CCC' | 'DDD';
export type WidgetMode = 'badge' | 'card' | 'profile';
export type WidgetTheme = 'light' | 'dark' | 'custom';

export interface BandConfig {
  color: string;
  bg: string;
  label: string;
  icon: string;
  tier: 'elite' | 'premium' | 'standard' | 'basic';
}

export interface WidgetPillar {
  name: string;
  scored: number;
  max: number;
  coverage: number;
}

export interface WidgetBadge {
  name: string;
  icon: string;
  color: string;
  tier: string;
  trustImpact?: number;
}

export interface WidgetRole {
  role: string;
  score: number;
  band: string;
}

export interface WidgetData {
  score: number;
  band: TrustBand;
  confidence: number;
  mode: string;
  label: string;
  activeRoles: string[];
  pillars: WidgetPillar[];
  badges: WidgetBadge[];
  endorsementCount: number;
  roles?: WidgetRole[];
}

export interface WidgetConfig {
  apiKey: string;
  entityType: string;
  entityId: string;
  mode: WidgetMode;
  theme: WidgetTheme;
  color?: string;
  refreshInterval: number;
  baseUrl: string;
}
