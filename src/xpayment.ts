import type { X402Payment } from './inspect.js';

export function decodeXPaymentHeader(header: string): X402Payment {
  try {
    const normalized = header.trim();
    const json = Buffer.from(normalized, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as X402Payment;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('decoded value is not an object');
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown decode error';
    throw new Error(`Invalid X-PAYMENT header: ${message}`);
  }
}
