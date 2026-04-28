/**
 * Simple in-memory store for shop data.
 * In production, replace with Redis or a database.
 */

export interface EntityMapping {
  entityType: string;
  entityId: string;
  shop: string;
}

class ShopStore {
  private accessTokens: Map<string, string> = new Map();
  private nonces: Map<string, string> = new Map();
  private entityMappings: Map<string, EntityMapping> = new Map();

  // --- Access tokens ---

  setAccessToken(shop: string, token: string): void {
    this.accessTokens.set(shop, token);
  }

  getAccessToken(shop: string): string | undefined {
    return this.accessTokens.get(shop);
  }

  removeAccessToken(shop: string): void {
    this.accessTokens.delete(shop);
  }

  // --- Nonces (OAuth state) ---

  setNonce(shop: string, nonce: string): void {
    this.nonces.set(shop, nonce);
  }

  getNonce(shop: string): string | undefined {
    return this.nonces.get(shop);
  }

  removeNonce(shop: string): void {
    this.nonces.delete(shop);
  }

  // --- Entity mappings (Shopify shop → OTE entity) ---

  setEntityMapping(shop: string, mapping: EntityMapping): void {
    this.entityMappings.set(shop, mapping);
  }

  getEntityMapping(shop: string): EntityMapping | undefined {
    return this.entityMappings.get(shop);
  }

  removeEntityMapping(shop: string): void {
    this.entityMappings.delete(shop);
  }

  // --- Cleanup ---

  removeShop(shop: string): void {
    this.accessTokens.delete(shop);
    this.nonces.delete(shop);
    this.entityMappings.delete(shop);
  }
}

export const shopStore = new ShopStore();
