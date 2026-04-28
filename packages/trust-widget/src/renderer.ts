import { WidgetData, WidgetMode } from './types';
import { ThemeColors } from './themes';
import { BAND_CONFIG, PILLAR_CONFIG } from './band-config';
import { getShieldSvg, getPillarIcon } from './icons';

// Safe text node creation (no innerHTML with user data)
function text(str: string): Text {
  return document.createTextNode(str);
}

function el(tag: string, className?: string, attrs?: Record<string, string>): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, v);
    }
  }
  return node;
}

function svgContainer(svgHtml: string): HTMLElement {
  const wrap = el('span', 'ote-shield');
  wrap.innerHTML = svgHtml;
  return wrap;
}

function createPoweredBy(): HTMLElement {
  const div = el('div', 'ote-powered-by');
  const a = document.createElement('a');
  a.href = 'https://opentrustengine.com';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.appendChild(text('Powered by OpenTrustEngine'));
  div.appendChild(a);
  return div;
}

function createPillarRows(pillars: WidgetData['pillars']): HTMLElement {
  const section = el('div', 'ote-pillars');

  const title = el('div', 'ote-pillars-title');
  title.appendChild(text('Trust Pillars'));
  section.appendChild(title);

  for (const pillar of pillars) {
    const cfg = PILLAR_CONFIG[pillar.name];
    const label = cfg ? cfg.label : pillar.name;
    const color = cfg ? cfg.color : '#6B7280';
    const pct = pillar.max > 0 ? Math.min(100, (pillar.scored / pillar.max) * 100) : 0;

    const row = el('div', 'ote-pillar-row');

    // Icon
    const iconWrap = el('span', 'ote-pillar-icon');
    iconWrap.innerHTML = getPillarIcon(pillar.name, 16, color);
    row.appendChild(iconWrap);

    // Info
    const info = el('div', 'ote-pillar-info');

    const labelRow = el('div', 'ote-pillar-label-row');
    const labelEl = el('span', 'ote-pillar-label');
    labelEl.appendChild(text(label));
    labelRow.appendChild(labelEl);

    const scoreEl = el('span', 'ote-pillar-score');
    scoreEl.appendChild(text(`${Math.round(pillar.scored)} / ${pillar.max}`));
    labelRow.appendChild(scoreEl);
    info.appendChild(labelRow);

    const bar = el('div', 'ote-pillar-bar');
    const fill = el('div', 'ote-pillar-fill');
    fill.style.width = `${pct}%`;
    fill.style.backgroundColor = color;
    bar.appendChild(fill);
    info.appendChild(bar);

    row.appendChild(info);
    section.appendChild(row);
  }

  return section;
}

function createBadgeChips(badges: WidgetData['badges'], limit?: number): HTMLElement {
  const section = el('div', 'ote-badges-section');
  const title = el('div', 'ote-badges-title');
  title.appendChild(text('Badges'));
  section.appendChild(title);

  const row = el('div', 'ote-badges-row');
  const displayBadges = limit ? badges.slice(0, limit) : badges;

  for (const badge of displayBadges) {
    const chip = el('div', 'ote-badge-chip');
    const dot = el('span', 'ote-badge-dot');
    dot.style.backgroundColor = badge.color;
    chip.appendChild(dot);
    chip.appendChild(text(badge.name));
    row.appendChild(chip);
  }

  if (limit && badges.length > limit) {
    const more = el('div', 'ote-badge-chip');
    more.appendChild(text(`+${badges.length - limit}`));
    row.appendChild(more);
  }

  section.appendChild(row);
  return section;
}

function createEndorsements(count: number): HTMLElement {
  const div = el('div', 'ote-endorsements');
  const iconWrap = el('span', 'ote-endorsement-icon');
  iconWrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-6 0v4"/><path d="M5 11h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"/></svg>`;
  div.appendChild(iconWrap);
  const txt = el('span', 'ote-endorsement-text');
  txt.appendChild(text(`${count} endorsement${count !== 1 ? 's' : ''}`));
  div.appendChild(txt);
  return div;
}

function createRolesSection(roles: WidgetData['roles'], activeRoles: string[]): HTMLElement {
  const section = el('div', 'ote-roles-section');
  const title = el('div', 'ote-roles-title');
  title.appendChild(text('Roles'));
  section.appendChild(title);

  const row = el('div', 'ote-roles-row');

  if (roles && roles.length > 0) {
    for (const r of roles) {
      const isActive = activeRoles.includes(r.role);
      const chip = el('div', `ote-role-chip${isActive ? ' active' : ''}`);
      if (isActive) {
        const bandCfg = BAND_CONFIG[r.band as keyof typeof BAND_CONFIG];
        if (bandCfg) {
          chip.style.borderColor = bandCfg.color;
          chip.style.color = bandCfg.color;
        }
      }
      const roleName = r.role.charAt(0).toUpperCase() + r.role.slice(1);
      chip.appendChild(text(`${roleName} (${r.band})`));
      row.appendChild(chip);
    }
  } else {
    for (const role of activeRoles) {
      const chip = el('div', 'ote-role-chip active');
      const roleName = role.charAt(0).toUpperCase() + role.slice(1);
      chip.appendChild(text(roleName));
      row.appendChild(chip);
    }
  }

  section.appendChild(row);
  return section;
}

function createModeIndicator(mode: string): HTMLElement {
  const div = el('div', 'ote-indicators');
  if (mode && mode !== 'normal') {
    const indicator = el('span', 'ote-indicator');
    const dot = el('span', 'ote-indicator-dot');
    dot.style.backgroundColor = mode === 'recovery' ? '#F59E0B' : '#3B82F6';
    indicator.appendChild(dot);
    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode';
    indicator.appendChild(text(modeLabel));
    div.appendChild(indicator);
  }
  return div;
}

function createConfidenceIndicator(confidence: number): HTMLElement {
  const indicator = el('span', 'ote-indicator');
  const dot = el('span', 'ote-indicator-dot');
  let color = '#10B981';
  let label = 'High confidence';
  if (confidence < 0.3) {
    color = '#EF4444';
    label = 'Low confidence';
  } else if (confidence < 0.6) {
    color = '#F59E0B';
    label = 'Medium confidence';
  }
  dot.style.backgroundColor = color;
  indicator.appendChild(dot);
  indicator.appendChild(text(label));
  return indicator;
}

// ===== HEADER (shared between card & profile) =====
function createHeader(data: WidgetData, shieldSize: number): HTMLElement {
  const bandCfg = BAND_CONFIG[data.band];
  const header = el('div', 'ote-card-header');

  // Shield
  const shieldWrap = el('div', 'ote-card-shield');
  shieldWrap.innerHTML = getShieldSvg(data.band, shieldSize);
  header.appendChild(shieldWrap);

  // Score block
  const scoreBlock = el('div', 'ote-card-score-block');

  const scoreRow = el('div', 'ote-card-score-row');
  const scoreNum = el('span', 'ote-card-score');
  scoreNum.style.color = bandCfg.color;
  scoreNum.appendChild(text(data.confidence >= 0.3 ? String(Math.round(data.score)) : '--'));
  scoreRow.appendChild(scoreNum);

  const maxLabel = el('span', 'ote-card-max');
  maxLabel.appendChild(text(' / 1200'));
  scoreRow.appendChild(maxLabel);
  scoreBlock.appendChild(scoreRow);

  const bandRow = el('div', 'ote-card-band-row');
  const bandEl = el('span', 'ote-card-band');
  bandEl.style.backgroundColor = bandCfg.bg;
  bandEl.style.color = bandCfg.color;
  bandEl.appendChild(text(data.band));
  bandRow.appendChild(bandEl);

  const labelEl = el('span', 'ote-card-label');
  labelEl.appendChild(text(bandCfg.label));
  bandRow.appendChild(labelEl);

  scoreBlock.appendChild(bandRow);
  header.appendChild(scoreBlock);

  return header;
}

// ===== PUBLIC RENDER FUNCTIONS =====

export function renderBadge(data: WidgetData, _theme: ThemeColors, container: HTMLElement): void {
  const bandCfg = BAND_CONFIG[data.band];
  const badge = el('div', 'ote-badge');

  // Shield icon
  badge.appendChild(svgContainer(getShieldSvg(data.band, 20)));

  // Score
  const score = el('span', 'ote-score-text');
  score.appendChild(text(data.confidence >= 0.3 ? String(Math.round(data.score)) : '--'));
  badge.appendChild(score);

  // Band
  const band = el('span', 'ote-band-text');
  band.style.backgroundColor = bandCfg.bg;
  band.style.color = bandCfg.color;
  band.appendChild(text(data.band));
  badge.appendChild(band);

  // Label
  const label = el('span', 'ote-band-label');
  label.appendChild(text(bandCfg.label));
  badge.appendChild(label);

  container.appendChild(badge);
}

export function renderCard(data: WidgetData, _theme: ThemeColors, container: HTMLElement): void {
  const card = el('div', 'ote-card');

  // Header
  card.appendChild(createHeader(data, 36));

  // Divider
  card.appendChild(el('div', 'ote-divider'));

  // Pillars
  if (data.pillars && data.pillars.length > 0) {
    card.appendChild(createPillarRows(data.pillars));
  }

  // Badges (top 3)
  if (data.badges && data.badges.length > 0) {
    card.appendChild(el('div', 'ote-divider'));
    card.appendChild(createBadgeChips(data.badges, 3));
  }

  // Endorsements
  if (data.endorsementCount > 0) {
    card.appendChild(createEndorsements(data.endorsementCount));
  }

  // Powered by
  card.appendChild(createPoweredBy());

  container.appendChild(card);
}

export function renderProfile(data: WidgetData, _theme: ThemeColors, container: HTMLElement): void {
  const profile = el('div', 'ote-profile');

  // Header
  profile.appendChild(createHeader(data, 44));

  // Mode / Confidence indicators
  const indicators = el('div', 'ote-indicators');
  if (data.mode && data.mode !== 'normal') {
    const modeEl = createModeIndicator(data.mode);
    const children = modeEl.childNodes;
    while (children.length > 0) {
      indicators.appendChild(children[0]);
    }
  }
  indicators.appendChild(createConfidenceIndicator(data.confidence));
  if (indicators.childNodes.length > 0) {
    profile.appendChild(indicators);
  }

  // Divider
  profile.appendChild(el('div', 'ote-divider'));

  // Roles
  if ((data.roles && data.roles.length > 0) || data.activeRoles.length > 0) {
    profile.appendChild(createRolesSection(data.roles, data.activeRoles));
    profile.appendChild(el('div', 'ote-divider'));
  }

  // Pillars
  if (data.pillars && data.pillars.length > 0) {
    profile.appendChild(createPillarRows(data.pillars));
  }

  // All badges
  if (data.badges && data.badges.length > 0) {
    profile.appendChild(el('div', 'ote-divider'));
    profile.appendChild(createBadgeChips(data.badges));
  }

  // Endorsements
  if (data.endorsementCount > 0) {
    profile.appendChild(createEndorsements(data.endorsementCount));
  }

  // Powered by
  profile.appendChild(createPoweredBy());

  container.appendChild(profile);
}

export function renderLoading(mode: WidgetMode, _theme: ThemeColors, container: HTMLElement): void {
  if (mode === 'badge') {
    const wrap = el('div', 'ote-skeleton-badge');
    const circle = el('div', 'ote-skeleton ote-skeleton-circle');
    wrap.appendChild(circle);
    const line = el('div', 'ote-skeleton ote-skeleton-line');
    line.style.width = '60px';
    wrap.appendChild(line);
    container.appendChild(wrap);
    return;
  }

  const isProfile = mode === 'profile';
  const card = el('div', isProfile ? 'ote-skeleton-profile' : 'ote-skeleton-card');

  // Header skeleton
  const header = el('div', 'ote-skeleton-header');
  const circle = el('div', 'ote-skeleton ote-skeleton-circle');
  circle.style.width = isProfile ? '44px' : '36px';
  circle.style.height = isProfile ? '44px' : '36px';
  header.appendChild(circle);

  const lines = el('div');
  lines.style.flex = '1';
  const l1 = el('div', 'ote-skeleton ote-skeleton-line');
  l1.style.width = '80px';
  l1.style.marginBottom = '6px';
  lines.appendChild(l1);
  const l2 = el('div', 'ote-skeleton ote-skeleton-line');
  l2.style.width = '120px';
  l2.style.height = '10px';
  lines.appendChild(l2);
  header.appendChild(lines);
  card.appendChild(header);

  // Pillar skeletons
  for (let i = 0; i < 5; i++) {
    const pillar = el('div', 'ote-skeleton-pillar');
    const label = el('div', 'ote-skeleton ote-skeleton-line');
    label.style.width = `${60 + Math.random() * 40}px`;
    label.style.height = '10px';
    label.style.marginBottom = '4px';
    pillar.appendChild(label);

    const bar = el('div', 'ote-skeleton ote-skeleton-bar');
    bar.style.width = '100%';
    pillar.appendChild(bar);

    card.appendChild(pillar);
  }

  container.appendChild(card);
}

export function renderError(message: string, _theme: ThemeColors, container: HTMLElement): void {
  const error = el('div', 'ote-error');

  const icon = el('span', 'ote-error-icon');
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  error.appendChild(icon);

  const msg = el('span');
  msg.appendChild(text(message));
  error.appendChild(msg);

  container.appendChild(error);
}
