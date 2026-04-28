import { TrustBadgeWidget } from './widget';
import { WidgetConfig, WidgetMode, WidgetTheme } from './types';

// Auto-init from script tag
(function() {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (!currentScript) return;

  const apiKey = currentScript.getAttribute('data-api-key');
  const entityType = currentScript.getAttribute('data-entity-type') || 'user';
  const entityId = currentScript.getAttribute('data-entity-id');
  const mode = (currentScript.getAttribute('data-mode') || 'badge') as WidgetMode;
  const theme = (currentScript.getAttribute('data-theme') || 'light') as WidgetTheme;
  const color = currentScript.getAttribute('data-color') || undefined;
  const refresh = parseInt(currentScript.getAttribute('data-refresh') || '300', 10);
  const baseUrl = currentScript.getAttribute('data-base-url') || 'https://api.sttiz.com';
  const containerId = currentScript.getAttribute('data-container');

  if (!apiKey || !entityId) {
    console.warn('[OpenTrustEngine] Missing required data-api-key or data-entity-id');
    return;
  }

  const config: WidgetConfig = {
    apiKey,
    entityType,
    entityId,
    mode,
    theme,
    color,
    refreshInterval: refresh,
    baseUrl,
  };

  // Find or create container
  let container: HTMLElement;
  if (containerId) {
    container = document.getElementById(containerId) || document.createElement('div');
    if (!container.parentNode) document.body.appendChild(container);
  } else {
    container = document.createElement('div');
    container.className = 'ote-trust-widget';
    currentScript.parentNode?.insertBefore(container, currentScript.nextSibling);
  }

  const widget = new TrustBadgeWidget(container, config);
  widget.init();

  // Expose globally for programmatic control
  (window as any).__oteWidget = widget;
})();

// Also export for programmatic use
export { TrustBadgeWidget } from './widget';
export type { WidgetConfig, WidgetData, WidgetMode, WidgetTheme, TrustBand } from './types';
