import { describe, expect, it } from 'vitest';
import { inspectTransaction } from '../src/tx.ts';

describe('inspectTransaction', () => {
  it('returns transaction receipt details for a found Base tx hash', async () => {
    const result = await inspectTransaction({
      txHash: '0xabc',
      network: 'base',
      client: {
        getTransaction: async () => ({
          hash: '0xabc',
          from: '0x3333333333333333333333333333333333333333',
          to: '0x1111111111111111111111111111111111111111',
          value: 10000n,
          input: '0x'
        }),
        getTransactionReceipt: async () => ({
          status: 'success',
          blockNumber: 123n,
          gasUsed: 21000n
        })
      }
    });

    expect(result.status).toBe('settled');
    expect(result.receipt).toMatchObject({
      txHash: '0xabc',
      network: 'base',
      buyer: '0x3333333333333333333333333333333333333333',
      seller: '0x1111111111111111111111111111111111111111',
      amount: '10000',
      blockNumber: '123'
    });
  });

  it('returns pending when transaction exists but receipt is missing', async () => {
    const result = await inspectTransaction({
      txHash: '0xabc',
      network: 'base',
      client: {
        getTransaction: async () => ({ hash: '0xabc', from: '0x1', to: '0x2', value: 0n, input: '0x' }),
        getTransactionReceipt: async () => null
      }
    });

    expect(result.status).toBe('pending');
    expect(result.diagnostics[0].code).toBe('TX_PENDING');
  });
});
