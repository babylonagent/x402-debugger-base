import { describe, expect, it } from 'vitest';
import { inspectPayment } from '../src/inspect.ts';

const baseRequirement = {
  scheme: 'exact',
  network: 'base',
  maxAmountRequired: '10000',
  resource: 'https://api.example.com/weather',
  description: 'weather call',
  mimeType: 'application/json',
  payTo: '0x1111111111111111111111111111111111111111',
  maxTimeoutSeconds: 60,
  asset: '0x2222222222222222222222222222222222222222'
};

describe('inspectPayment', () => {
  it('accepts a matching Base payment payload and returns a receipt', () => {
    const result = inspectPayment({
      requirement: baseRequirement,
      payment: {
        network: 'base',
        payload: {
          authorization: {
            from: '0x3333333333333333333333333333333333333333',
            to: baseRequirement.payTo,
            value: '10000'
          }
        }
      }
    });

    expect(result.status).toBe('valid');
    expect(result.receipt).toMatchObject({
      buyer: '0x3333333333333333333333333333333333333333',
      seller: baseRequirement.payTo,
      endpoint: baseRequirement.resource,
      network: 'base',
      amount: '10000'
    });
    expect(result.diagnostics).toEqual([]);
  });

  it('rejects Base Sepolia payment when requirement expects Base', () => {
    const result = inspectPayment({
      requirement: baseRequirement,
      payment: { network: 'base-sepolia', payload: { authorization: { to: baseRequirement.payTo, value: '10000' } } }
    });

    expect(result.status).toBe('invalid');
    expect(result.diagnostics[0]).toMatchObject({
      code: 'NETWORK_MISMATCH',
      expected: 'base',
      received: 'base-sepolia'
    });
  });

  it('rejects underpayment with suggested fix', () => {
    const result = inspectPayment({
      requirement: baseRequirement,
      payment: { network: 'base', payload: { authorization: { to: baseRequirement.payTo, value: '9999' } } }
    });

    expect(result.status).toBe('invalid');
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'AMOUNT_TOO_LOW',
      fix: 'Retry with value >= 10000.'
    }));
  });
});
