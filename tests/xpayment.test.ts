import { describe, expect, it } from 'vitest';
import { decodeXPaymentHeader } from '../src/xpayment.ts';

describe('decodeXPaymentHeader', () => {
  it('decodes base64url JSON X-PAYMENT headers', () => {
    const payment = {
      network: 'base',
      payload: {
        authorization: {
          from: '0x3333333333333333333333333333333333333333',
          to: '0x1111111111111111111111111111111111111111',
          value: '10000'
        }
      }
    };
    const header = Buffer.from(JSON.stringify(payment), 'utf8').toString('base64url');

    expect(decodeXPaymentHeader(header)).toEqual(payment);
  });

  it('throws a helpful error for malformed headers', () => {
    expect(() => decodeXPaymentHeader('not-json')).toThrow('Invalid X-PAYMENT header');
  });
});
