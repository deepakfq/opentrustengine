import { WidgetData, WidgetConfig } from './types';

export async function fetchWidgetData(config: WidgetConfig): Promise<WidgetData> {
  const url = new URL(`${config.baseUrl}/v1/widget/config`);
  url.searchParams.set('apiKey', config.apiKey);
  url.searchParams.set('entityType', config.entityType);
  url.searchParams.set('entityId', config.entityId);
  url.searchParams.set('mode', config.mode);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Widget API error: ${res.status}`);
  }

  return res.json();
}
