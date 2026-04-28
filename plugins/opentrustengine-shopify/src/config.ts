export const config = {
  shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
  shopifyScopes: process.env.SHOPIFY_SCOPES || 'read_orders,read_products,write_script_tags',

  oteApiKey: process.env.OTE_API_KEY || '',
  oteApiSecret: process.env.OTE_API_SECRET || '',
  oteBaseUrl: process.env.OTE_BASE_URL || 'https://api.sttiz.com',

  appUrl: process.env.APP_URL || 'http://localhost:3030',
  port: parseInt(process.env.PORT || '3030', 10),
};
