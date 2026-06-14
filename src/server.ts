import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { inspectRequest } from './request.js';
import { inspectTransaction } from './tx.js';

export function createApp() {
  const app = express();
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(here, '..', 'public');
  app.use(express.static(publicDir));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'x402-debugger-base' });
  });

  app.post('/inspect', async (req, res) => {
    try {
      if (req.body.txHash && !req.body.requirement && !req.body.payment && !req.body.xPayment) {
        const txResult = await inspectTransaction({
          txHash: req.body.txHash,
          network: req.body.network,
          rpcUrl: req.body.rpcUrl
        });
        const code = txResult.status === 'settled' ? 200 : txResult.status === 'pending' ? 202 : 422;
        res.status(code).json(txResult);
        return;
      }

      const result = inspectRequest({
        ...req.body,
        xPayment: req.body.xPayment ?? req.header('x-payment') ?? req.header('X-PAYMENT')
      });
      res.status(result.status === 'valid' ? 200 : 422).json(result);
    } catch (error) {
      res.status(400).json({
        status: 'invalid',
        diagnostics: [{
          code: 'INSPECT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown inspection error',
          fix: 'Send JSON shaped as { requirement, payment }.'
        }],
        receipt: {}
      });
    }
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 4020);
  createApp().listen(port, () => {
    console.log(`x402-debugger-base listening on :${port}`);
  });
}
