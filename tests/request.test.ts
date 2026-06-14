import { describe, expect, it } from 'vitest';
import { inspectRequest } from '../src/request.ts';

const requirement = {
  network: 'base',
  maxAmountRequired: '10000',
  resource: 'https://api.example.com/weather',
  payTo: '0x1111111111111111111111111111111111111111',
  asset: '0x2222222222222222222222222222222222222222'
};

describe('inspectRequest', () => {
  it('uses xPayment header when payment object is absent', () => {
    const payment = {
      network: 'base',
      payload: {
        authorization: {
          from: '0x3333333333333333333333333333333333333333',
          to: requirement.payTo,
          value: '10000'
        }
      }
    };
    const xPayment = Buffer.from(JSON.stringify(payment), 'utf8').toString('base64url');

    const result = inspectRequest({ requirement, xPayment });

    expect(result.status).toBe('valid');
    expect(result.receipt.buyer).toBe('0x3333333333333333333333333333333333333333');
  });
});
