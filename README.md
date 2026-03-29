# BangPot Frontend

Round 1 bootstrap for the BangPot frontend repository.

## Stack

- Next.js App Router
- React
- TypeScript
- ESLint
- Vitest

## Structure

- `src/app`: routing entry points
- `src/features`: user action oriented feature modules
- `src/entities`: domain-facing UI and models
- `src/shared`: shared UI, utils, and clients

## Local setup

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

## Verification commands

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```
