import { WidgetConfig, WidgetData, WidgetMode, WidgetTheme } from './types';
import { fetchWidgetData } from './api';
import { renderBadge, renderCard, renderProfile, renderLoading, renderError } from './renderer';
import { getStyles } from './styles';
import { THEMES } from './themes';

export class TrustBadgeWidget {
  private config: WidgetConfig;
  private container: HTMLElement;
  private shadowRoot: ShadowRoot;
  private data: WidgetData | null = null;
  private pollTimer: number | null = null;
  private isVisible: boolean = true;

  constructor(container: HTMLElement, config: WidgetConfig) {
    this.config = config;
    this.container = container;
    this.shadowRoot = container.attachShadow({ mode: 'open' });
    this.injectStyles();
    this.setupVisibilityListener();
  }

  private injectStyles(): void {
    const theme = THEMES[this.config.theme] || THEMES.light;
    const style = document.createElement('style');
    style.textContent = getStyles(theme);
    this.shadowRoot.appendChild(style);
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible && this.pollTimer === null) this.startPolling();
      else if (!this.isVisible) this.stopPolling();
    });
  }

  async init(): Promise<void> {
    this.showLoading();
    try {
      this.data = await fetchWidgetData(this.config);
      this.render();
      if (this.config.refreshInterval > 0) this.startPolling();
    } catch (err) {
      this.showError((err as Error).message);
    }
  }

  private render(): void {
    // Clear existing content (except style)
    const style = this.shadowRoot.querySelector('style');
    this.shadowRoot.innerHTML = '';
    if (style) this.shadowRoot.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'ote-wrapper';

    const theme = THEMES[this.config.theme] || THEMES.light;

    if (!this.data) {
      renderLoading(this.config.mode, theme, wrapper);
    } else {
      switch (this.config.mode) {
        case 'badge': renderBadge(this.data, theme, wrapper); break;
        case 'card': renderCard(this.data, theme, wrapper); break;
        case 'profile': renderProfile(this.data, theme, wrapper); break;
      }
    }

    this.shadowRoot.appendChild(wrapper);
  }

  private showLoading(): void {
    const style = this.shadowRoot.querySelector('style');
    this.shadowRoot.innerHTML = '';
    if (style) this.shadowRoot.appendChild(style);
    const wrapper = document.createElement('div');
    wrapper.className = 'ote-wrapper';
    const theme = THEMES[this.config.theme] || THEMES.light;
    renderLoading(this.config.mode, theme, wrapper);
    this.shadowRoot.appendChild(wrapper);
  }

  private showError(msg: string): void {
    const style = this.shadowRoot.querySelector('style');
    this.shadowRoot.innerHTML = '';
    if (style) this.shadowRoot.appendChild(style);
    const wrapper = document.createElement('div');
    wrapper.className = 'ote-wrapper';
    const theme = THEMES[this.config.theme] || THEMES.light;
    renderError(msg, theme, wrapper);
    this.shadowRoot.appendChild(wrapper);
  }

  private startPolling(): void {
    if (this.pollTimer !== null) return;
    this.pollTimer = window.setInterval(async () => {
      if (!this.isVisible) return;
      try {
        this.data = await fetchWidgetData(this.config);
        this.render();
      } catch {
        // Silently ignore refresh errors to keep last good data visible
      }
    }, this.config.refreshInterval * 1000);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  destroy(): void {
    this.stopPolling();
    this.shadowRoot.innerHTML = '';
  }

  update(newConfig: Partial<WidgetConfig>): void {
    Object.assign(this.config, newConfig);
    this.init();
  }
}
