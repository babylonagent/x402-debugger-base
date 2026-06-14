import { createPublicClient, http, type Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { Diagnostic } from './inspect.js';

export type TxClient = {
  getTransaction(args: { hash: string }): Promise<{
    hash: string;
    from: string;
    to: string | null;
    value: bigint;
    input: string;
  } | null>;
  getTransactionReceipt(args: { hash: string }): Promise<{
    status: 'success' | 'reverted';
    blockNumber: bigint;
    gasUsed: bigint;
  } | null>;
};

export type TxInspectInput = {
  txHash: string;
  network?: 'base' | 'base-sepolia' | string;
  client?: TxClient;
  rpcUrl?: string;
};

export type TxInspectionResult = {
  status: 'settled' | 'failed' | 'pending' | 'not_found';
  diagnostics: Diagnostic[];
  receipt: {
    txHash: string;
    network: string;
    buyer?: string;
    seller?: string | null;
    amount?: string;
    blockNumber?: string;
    gasUsed?: string;
  };
};

export function createTxClient(network: string = 'base', rpcUrl?: string): TxClient {
  const chain = network === 'base-sepolia' ? baseSepolia : base;
  const transport = http(rpcUrl ?? process.env.BASE_RPC_URL ?? chain.rpcUrls.default.http[0]);
  return createPublicClient({ chain, transport }) as unknown as TxClient;
}

export async function inspectTransaction(input: TxInspectInput): Promise<TxInspectionResult> {
  const network = input.network ?? 'base';
  const client = input.client ?? createTxClient(network, input.rpcUrl);
  const tx = await client.getTransaction({ hash: input.txHash as Hash });

  if (!tx) {
    return {
      status: 'not_found',
      diagnostics: [{
        code: 'TX_NOT_FOUND',
        message: `Transaction ${input.txHash} was not found on ${network}.`,
        fix: 'Check the hash and selected network.'
      }],
      receipt: { txHash: input.txHash, network }
    };
  }

  const receipt = await client.getTransactionReceipt({ hash: input.txHash as Hash });
  if (!receipt) {
    return {
      status: 'pending',
      diagnostics: [{
        code: 'TX_PENDING',
        message: `Transaction ${input.txHash} exists but has no receipt yet.`,
        fix: 'Wait for confirmation and retry.'
      }],
      receipt: {
        txHash: tx.hash,
        network,
        buyer: tx.from,
        seller: tx.to,
        amount: tx.value.toString()
      }
    };
  }

  const failed = receipt.status === 'reverted';
  return {
    status: failed ? 'failed' : 'settled',
    diagnostics: failed ? [{
      code: 'TX_REVERTED',
      message: `Transaction ${tx.hash} reverted on ${network}.`,
      fix: 'Inspect facilitator/payment contract revert reason if available.'
    }] : [],
    receipt: {
      txHash: tx.hash,
      network,
      buyer: tx.from,
      seller: tx.to,
      amount: tx.value.toString(),
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString()
    }
  };
}
