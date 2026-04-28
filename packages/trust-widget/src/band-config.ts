import { BandConfig, TrustBand } from './types';

export const BAND_CONFIG: Record<TrustBand, BandConfig> = {
  AAA: { color: '#B8860B', bg: '#FDF6E3', label: 'Elite',    icon: 'shield-crown',   tier: 'elite' },
  AAB: { color: '#D97706', bg: '#FFFBEB', label: 'Premier',  icon: 'shield-star',    tier: 'elite' },
  ABB: { color: '#059669', bg: '#ECFDF5', label: 'Trusted',  icon: 'shield-check',   tier: 'premium' },
  BBB: { color: '#2563EB', bg: '#EFF6FF', label: 'Reliable', icon: 'shield-half',    tier: 'premium' },
  BBC: { color: '#4F46E5', bg: '#EEF2FF', label: 'Building', icon: 'shield-outline', tier: 'standard' },
  BCC: { color: '#7C3AED', bg: '#F5F3FF', label: 'Growing',  icon: 'shield-outline', tier: 'standard' },
  CCC: { color: '#EA580C', bg: '#FFF7ED', label: 'Starting', icon: 'shield-outline', tier: 'basic' },
  DDD: { color: '#6B7280', bg: '#F9FAFB', label: 'New',      icon: 'shield-outline', tier: 'basic' },
};

export const PILLAR_CONFIG: Record<string, { label: string; color: string; cap: number }> = {
  transaction_discipline: { label: 'Transactions', color: '#3B82F6', cap: 400 },
  payment_reliability:    { label: 'Payments',     color: '#10B981', cap: 300 },
  consistency_volume:     { label: 'Consistency',   color: '#8B5CF6', cap: 250 },
  dispute_resolution:     { label: 'Disputes',      color: '#F59E0B', cap: 150 },
  peer_feedback:          { label: 'Feedback',      color: '#EC4899', cap: 100 },
};
