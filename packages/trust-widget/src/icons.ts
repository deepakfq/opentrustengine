import { TrustBand } from './types';
import { BAND_CONFIG } from './band-config';

const SHIELD_PATHS: Record<string, string> = {
  'shield-crown': `
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="currentColor" opacity="0.15"/>
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M8 13l2-4 2 2 2-2 2 4H8z" fill="currentColor"/>
    <path d="M9 9l1.5-2L12 8.5 13.5 7 15 9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  'shield-star': `
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="currentColor" opacity="0.15"/>
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M12 7.5l1.45 2.94 3.24.47-2.35 2.28.56 3.23L12 14.88l-2.9 1.54.56-3.23-2.35-2.28 3.24-.47L12 7.5z" fill="currentColor"/>
  `,
  'shield-check': `
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="currentColor" opacity="0.15"/>
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M8.5 12.5l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  'shield-half': `
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12V2z" fill="currentColor" opacity="0.25"/>
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
  `,
  'shield-outline': `
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="currentColor" opacity="0.08"/>
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
  `,
};

export function getShieldSvg(band: TrustBand, size: number = 24): string {
  const config = BAND_CONFIG[band];
  const iconName = config.icon;
  const paths = SHIELD_PATHS[iconName] || SHIELD_PATHS['shield-outline'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${config.color}">${paths}</svg>`;
}

const PILLAR_ICONS: Record<string, string> = {
  transaction_discipline: `<path d="M4 6h16M4 10h16M4 14h10M4 18h6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  payment_reliability: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.3"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor"/>`,
  consistency_volume: `<path d="M3 17l4-4 4 4 5-6 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="13" r="1.5" fill="currentColor"/><circle cx="11" cy="17" r="1.5" fill="currentColor"/><circle cx="16" cy="11" r="1.5" fill="currentColor"/><circle cx="20" cy="15" r="1.5" fill="currentColor"/>`,
  dispute_resolution: `<path d="M12 2L4 7v5c0 4.5 3.2 8.7 8 10 4.8-1.3 8-5.5 8-10V7l-8-5z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  peer_feedback: `<path d="M12 4c-4.41 0-8 2.69-8 6 0 2.21 1.64 4.15 4 5.2V19l3.25-2.17c.25.01.5.03.75.03 4.41 0 8-2.69 8-6s-3.59-6-8-6z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>`,
};

export function getPillarIcon(pillarName: string, size: number = 16, color: string = 'currentColor'): string {
  const paths = PILLAR_ICONS[pillarName] || PILLAR_ICONS['transaction_discipline'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${color}">${paths}</svg>`;
}
