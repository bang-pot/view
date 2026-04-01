# BangPot Frontend

Round 1 auth flow for the BangPot frontend repository.

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

## Round 1 routes

- `/login`: Kakao login entry and login-page re-entry branching
- `/auth/complete`: temp-user completion flow
- `/protected-demo`: reusable full-user guard example

## Verification commands

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

After starting the dev server, you can manually verify round 1 from these entry points:

1. Visit `/login`
2. Start Kakao login
3. Confirm Spring Security completes OAuth on the backend
4. Confirm temp users land on `/auth/complete`
5. Confirm full users or completed users reach the original destination or `/`
