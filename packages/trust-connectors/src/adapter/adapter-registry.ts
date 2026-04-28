import { BaseAdapter } from './base-adapter';

export class AdapterRegistry {
  private adapters: Map<string, BaseAdapter> = new Map();

  register(adapter: BaseAdapter): void {
    this.adapters.set(adapter.platform, adapter);
  }

  get(platform: string): BaseAdapter | undefined {
    return this.adapters.get(platform);
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  has(platform: string): boolean {
    return this.adapters.has(platform);
  }
}
