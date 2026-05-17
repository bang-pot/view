# Frontend Bootstrap Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a runnable frontend bootstrap for Banglog using Next.js App Router and TypeScript so later domain builders can start from an already-verified frontend base.

**Architecture:** Start with a minimal Next.js application using the App Router, a single bootstrap page, and a folder structure that already reflects `app + features/entities/shared`. Keep styling intentionally minimal and lock in `lint`, `test`, and `build` commands plus CI from the start.

**Tech Stack:** Next.js, React, TypeScript, ESLint, Vitest, Testing Library, GitHub Actions

---

### Task 1: Bootstrap the Next.js application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/test/app/page.test.tsx`

- [ ] **Step 1: Write the failing homepage test**
- [ ] **Step 2: Run the test to verify the app does not exist yet**
- [ ] **Step 3: Add the minimal Next.js application files**
- [ ] **Step 4: Re-run the homepage test and make it pass**
- [ ] **Step 5: Commit the application skeleton**

### Task 2: Establish frontend structure and verification commands

**Files:**
- Create: `src/features/.gitkeep`
- Create: `src/entities/.gitkeep`
- Create: `src/shared/.gitkeep`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Write the failing verification flow for lint/test/build**
- [ ] **Step 2: Run the intended commands and verify the missing pieces fail for the expected reason**
- [ ] **Step 3: Add the minimal structure, env example, and test tooling**
- [ ] **Step 4: Run lint, test, and build until all are green**
- [ ] **Step 5: Commit the verification baseline**

### Task 3: Add minimal CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write down the exact CI commands that mirror local verification**
- [ ] **Step 2: Add the minimal workflow**
- [ ] **Step 3: Run local verification one more time**
- [ ] **Step 4: Commit the round-1 frontend bootstrap**
