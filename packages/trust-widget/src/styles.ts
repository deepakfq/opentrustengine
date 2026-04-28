import { ThemeColors } from './themes';

export function getStyles(theme: ThemeColors): string {
  return `
    @keyframes ote-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes ote-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes ote-fill {
      from { width: 0; }
    }

    :host {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .ote-wrapper {
      animation: ote-fade-in 0.3s ease-out;
    }

    /* ===== BADGE (pill) MODE ===== */
    .ote-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px 4px 6px;
      border-radius: 20px;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      box-shadow: 0 1px 3px ${theme.shadow};
      cursor: default;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      text-decoration: none;
    }

    .ote-badge:hover {
      box-shadow: 0 2px 8px ${theme.shadow};
      transform: translateY(-1px);
    }

    .ote-shield {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .ote-score-text {
      font-size: 14px;
      font-weight: 700;
      color: ${theme.textPrimary};
      letter-spacing: -0.02em;
      transition: color 0.3s ease;
    }

    .ote-score-max {
      font-size: 11px;
      font-weight: 400;
      color: ${theme.textMuted};
    }

    .ote-band-text {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      min-width: 28px;
      text-align: center;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .ote-band-label {
      font-size: 11px;
      font-weight: 500;
      color: ${theme.textSecondary};
      margin-left: 2px;
    }

    /* ===== CARD MODE ===== */
    .ote-card {
      width: 300px;
      max-width: 100%;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      box-shadow: 0 2px 8px ${theme.shadow};
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }

    .ote-card:hover {
      box-shadow: 0 4px 16px ${theme.shadow};
    }

    .ote-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .ote-card-shield {
      flex-shrink: 0;
    }

    .ote-card-score-block {
      display: flex;
      flex-direction: column;
    }

    .ote-card-score-row {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }

    .ote-card-score {
      font-size: 28px;
      font-weight: 800;
      color: ${theme.textPrimary};
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .ote-card-max {
      font-size: 13px;
      font-weight: 400;
      color: ${theme.textMuted};
    }

    .ote-card-band-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }

    .ote-card-band {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .ote-card-label {
      font-size: 12px;
      font-weight: 500;
      color: ${theme.textSecondary};
    }

    .ote-divider {
      height: 1px;
      background: ${theme.divider};
      margin: 0 16px;
    }

    /* ===== PILLARS ===== */
    .ote-pillars {
      padding: 12px 16px;
    }

    .ote-pillars-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${theme.textMuted};
      margin-bottom: 10px;
    }

    .ote-pillar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .ote-pillar-row:last-child {
      margin-bottom: 0;
    }

    .ote-pillar-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .ote-pillar-info {
      flex: 1;
      min-width: 0;
    }

    .ote-pillar-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }

    .ote-pillar-label {
      font-size: 12px;
      font-weight: 500;
      color: ${theme.textSecondary};
    }

    .ote-pillar-score {
      font-size: 11px;
      font-weight: 600;
      color: ${theme.textMuted};
    }

    .ote-pillar-bar {
      width: 100%;
      height: 6px;
      background: ${theme.barBg};
      border-radius: 3px;
      overflow: hidden;
    }

    .ote-pillar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      animation: ote-fill 0.8s ease-out;
    }

    /* ===== BADGES ===== */
    .ote-badges-section {
      padding: 12px 16px;
    }

    .ote-badges-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${theme.textMuted};
      margin-bottom: 8px;
    }

    .ote-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ote-badge-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid ${theme.cardBorder};
      background: ${theme.cardBg};
      color: ${theme.textSecondary};
      transition: transform 0.2s ease;
    }

    .ote-badge-chip:hover {
      transform: scale(1.05);
    }

    .ote-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ===== ENDORSEMENTS ===== */
    .ote-endorsements {
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .ote-endorsement-icon {
      display: flex;
      color: ${theme.textMuted};
    }

    .ote-endorsement-text {
      font-size: 12px;
      color: ${theme.textMuted};
      font-weight: 500;
    }

    /* ===== ROLES ===== */
    .ote-roles-section {
      padding: 12px 16px;
    }

    .ote-roles-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${theme.textMuted};
      margin-bottom: 8px;
    }

    .ote-roles-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ote-role-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid ${theme.cardBorder};
      color: ${theme.textMuted};
      background: transparent;
      transition: all 0.2s ease;
    }

    .ote-role-chip.active {
      border-color: currentColor;
      color: ${theme.textPrimary};
      font-weight: 600;
    }

    /* ===== MODE / CONFIDENCE INDICATORS ===== */
    .ote-indicators {
      padding: 8px 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ote-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: ${theme.textMuted};
      font-weight: 500;
    }

    .ote-indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    /* ===== PROFILE MODE ===== */
    .ote-profile {
      width: 400px;
      max-width: 100%;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      box-shadow: 0 2px 8px ${theme.shadow};
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }

    .ote-profile:hover {
      box-shadow: 0 4px 16px ${theme.shadow};
    }

    /* ===== POWERED BY ===== */
    .ote-powered-by {
      display: flex;
      justify-content: center;
      padding: 8px 16px 12px;
    }

    .ote-powered-by a {
      font-size: 10px;
      color: ${theme.textMuted};
      text-decoration: none;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      font-weight: 400;
    }

    .ote-powered-by a:hover {
      opacity: 1;
      text-decoration: underline;
    }

    /* ===== LOADING STATE ===== */
    .ote-skeleton {
      background: linear-gradient(90deg,
        ${theme.barBg} 25%,
        ${theme.divider} 50%,
        ${theme.barBg} 75%
      );
      background-size: 200% 100%;
      animation: ote-shimmer 1.5s infinite ease-in-out;
      border-radius: 4px;
    }

    .ote-skeleton-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px 4px 6px;
      border-radius: 20px;
      border: 1px solid ${theme.cardBorder};
      background: ${theme.cardBg};
    }

    .ote-skeleton-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }

    .ote-skeleton-line {
      height: 14px;
      border-radius: 7px;
    }

    .ote-skeleton-bar {
      height: 6px;
      border-radius: 3px;
      margin-top: 4px;
    }

    .ote-skeleton-card {
      width: 300px;
      max-width: 100%;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px ${theme.shadow};
    }

    .ote-skeleton-profile {
      width: 400px;
      max-width: 100%;
      background: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px ${theme.shadow};
    }

    .ote-skeleton-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .ote-skeleton-pillar {
      margin-bottom: 10px;
    }

    /* ===== ERROR STATE ===== */
    .ote-error {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: ${theme.cardBg};
      border: 1px solid #FCA5A5;
      font-size: 12px;
      color: #DC2626;
    }

    .ote-error-icon {
      flex-shrink: 0;
    }
  `;
}
