# 07 — Recent Incidents Summary

Brief operational history for the next AI. **No secrets.** Detailed **OPS_RUNBOOK** and **INCIDENT_LOG** should be created after production invite/join/OG flow is fully green.

## 1. Functions deploy — discovery timeout

**Symptom:** `firebase deploy --only functions` hung or timed out during discovery.  
**Cause:** Eager top-level Firebase Admin / Firestore imports in function modules loaded entire SDK at discovery time.  
**Mitigation direction:** Lazy-init Admin; keep index exports thin.  
**Status:** **Needs verification** on current `functions/src/index.ts` pattern.

## 2. Missing `jws` / `sign-stream` at runtime

**Symptom:** Function crashes referencing missing packages.  
**Cause:** Corrupted or partial `functions/node_modules`.  
**Mitigation:** Clean reinstall in `functions/` (`rm -rf node_modules && npm ci`).  
**Status:** **Needs verification** after last clean install.

## 3. Git status hanging

**Symptom:** `git status` never returns.  
**Cause:** Cursor/Codex background git workers locking repo.  
**Mitigation:** Close IDE workers; retry from external terminal; avoid parallel git-heavy agents.

## 4. `npm ci` / ESLint hangs

**Symptom:** Install or lint stuck.  
**Cause:** Broken root `node_modules` + stray background Node processes.  
**Mitigation:** Kill node processes; rename broken tree (e.g. `node_modules_broken_YYYYMMDD`); fresh `npm ci`.

## 5. WhatsApp preview showed app icon (not product OG image)

**Symptom:** Link preview generic icon or broken image.  
**Cause:** `og:image` pointed at **protected** Vercel deployment URL → **401** for Meta crawler.  
**Fix:** Set **`NEXT_PUBLIC_APP_URL`** to stable **`https://account-card-prod.vercel.app`**; generate **absolute** `og:image` URLs via `joinOgPublicOrigin()` / `joinOgMetadataBase()`.  
**Follow-up:** Meta cache refresh; test with Facebook Sharing Debugger **Needs verification**.

## 6. OG vs real join page confusion (product, not outage)

**Risk:** Stakeholders think mock “2 החלטות ממתינות” in PNG is live data.  
**Clarification:** OG is marketing-only; real state is in app after login.

---

## After green production

Create and maintain:

- **OPS_RUNBOOK** — deploy order (Vercel → Functions params → Auth domains), rollback, smoke tests for `/j/{token}`, OG, accept flow  
- **INCIDENT_LOG** — dated entries, impact, root cause, prevention
