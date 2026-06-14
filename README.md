# x402 Debugger Base

Developer diagnostic tool for x402 payments on Base.

## MVP

- Inspect a `402 Payment Required` requirement + `X-PAYMENT` payload.
- Detect common failures:
  - wrong network
  - wrong seller/receiver
  - underpayment
- Return a machine-readable receipt JSON.
- Expose both CLI and HTTP API.

## Install

```bash
npm install
cp .env.example .env
# set BASE_RPC_URL for live transaction lookups
```

## Test

```bash
npm test
```

## CLI

Inspect JSON requirement + payment:

```bash
npx tsx bin/x402-debug.js inspect -f examples/invalid-network-underpay.json
```

Inspect raw `X-PAYMENT` header payload:

```bash
npx tsx bin/x402-debug.js inspect -f examples/raw-xpayment-valid.json
```

Inspect Base transaction hash:

```bash
npx tsx bin/x402-debug.js tx 0xYOUR_TX_HASH --network base
```

## API

```bash
npm run dev
curl -s http://localhost:4020/health
curl -s -X POST http://localhost:4020/inspect \
  -H 'content-type: application/json' \
  --data @examples/invalid-network-underpay.json
```

## Web UI

```bash
npm run dev
open http://localhost:4020
```

The UI supports paste/debug for requirement JSON, raw `X-PAYMENT`, and transaction hashes.

## JSON shape

```json
{
  "requirement": {
    "network": "base",
    "maxAmountRequired": "10000",
    "resource": "https://api.example.com/weather",
    "payTo": "0x1111111111111111111111111111111111111111",
    "asset": "0x2222222222222222222222222222222222222222"
  },
  "payment": {
    "network": "base",
    "payload": {
      "authorization": {
        "from": "0x3333333333333333333333333333333333333333",
        "to": "0x1111111111111111111111111111111111111111",
        "value": "10000"
      }
    }
  }
}
```

## Next

- Decode base64 `X-PAYMENT` header directly.
- Add tx hash lookup with Base RPC.
- Add small paste-and-debug web UI.
