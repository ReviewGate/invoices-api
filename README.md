# invoices-api

A small invoicing service: issue invoices, take payments, report on a period.
It runs without a database — storage is in memory — so you can clone it and try
things out in a minute.

```bash
pnpm install
pnpm test          # 17 tests
pnpm run lint      # clean
pnpm run start:dev # http://localhost:3000/api
```

## What is inside

| Module | Responsibility |
|---|---|
| `common/money` | amounts in integer minor units, one rounding helper |
| `invoices` | invoice lifecycle and tenant-scoped storage |
| `pricing` | line totals, discounts, tax per country |
| `payments` | recording payments, idempotency keys |
| `reports` | monthly periods in the customer's time zone |
| `notifications` | the letter a customer receives |
| `access` | API key to tenant, and the guard that enforces it |

## Why this repository exists

It is the working ground for the ReviewGate recipes: a codebase small enough to
read in one sitting, but with the kind of invariants a linter cannot check —
money that must stay in minor units, reads that must be scoped to one tenant,
payments that must survive a retry. Those invariants live in
[`.reviewgate/config.yml`](.reviewgate/config.yml) as team rules.

The `main` branch is kept green: tests, linter and types all pass. Anything that
should be found by a review lives in a branch of its own.
