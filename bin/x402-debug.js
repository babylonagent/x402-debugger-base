#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { inspectRequest } from '../src/request.ts';
import { inspectTransaction } from '../src/tx.ts';

const program = new Command();

program
  .name('x402-debug')
  .description('Inspect x402 payment payloads for Base/Base Sepolia')
  .version('0.1.0');

program
  .command('inspect')
  .description('Inspect JSON shaped as { requirement, payment }')
  .option('-f, --file <path>', 'JSON input file; defaults to stdin')
  .option('-p, --x-payment <header>', 'raw X-PAYMENT base64url header')
  .action((options) => {
    const raw = options.file
      ? readFileSync(options.file, 'utf8')
      : readFileSync(0, 'utf8');
    const parsed = JSON.parse(raw);
    const result = inspectRequest({ ...parsed, xPayment: options.xPayment ?? parsed.xPayment });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'valid' ? 0 : 2;
  });

program
  .command('tx <hash>')
  .description('Inspect a Base/Base Sepolia transaction hash')
  .option('-n, --network <network>', 'base or base-sepolia', 'base')
  .option('-r, --rpc-url <url>', 'custom RPC URL')
  .action(async (hash, options) => {
    const result = await inspectTransaction({ txHash: hash, network: options.network, rpcUrl: options.rpcUrl });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'settled' ? 0 : 2;
  });

program.parse(process.argv);
