import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { config } from './config';
import { authRouter } from './auth/shopify-auth';
import { webhookRouter } from './webhooks/webhook-handler';
import { proxyRouter } from './proxy/app-proxy';

const app = express();

// Raw body is needed for webhook HMAC verification — must come before express.json()
app.use(
  '/webhooks',
  express.raw({ type: 'application/json' }),
);

// JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRouter);
app.use('/webhooks', webhookRouter);
app.use('/proxy', proxyRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'opentrustengine-shopify',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.listen(config.port, () => {
  console.log(`OpenTrustEngine Shopify app listening on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

export default app;
