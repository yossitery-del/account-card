# 01 — Product Strategy

## Category

**Digital shared account card / mutual ledger** — not payments, not group splits, not formal bookkeeping.

## Core promise

> **Not “I wrote that you owe me” — but “we both agree on the state of the account between us.”**

- Actions enter as **pending**
- The other side **approves** or **rejects**
- **Official balance** changes only on **approved** actions
- Pending items affect **pending impact** only

## Main pain

- Informal business and personal relationships run on **WhatsApp + memory + Excel**
- Disputes come from **asymmetric records** (“you never told me”, “I thought we agreed”)
- No single **trusted, timestamped** place both sides see the same numbers

## Emotional value

- Calm, dignity, fairness — “we’re adults managing our account”
- Premium Hebrew UX (vault/glass), not a cheap debt tracker
- Reduced anxiety before money conversations

## Practical value

- One place for charges, refunds, and approvals
- Clear **official balance** vs **pending**
- Audit trail (`auditEvents` in Firestore) for what happened — **Needs verification** for pilot-facing history UI

## Why WhatsApp / Excel / memory fail

| Channel | Limitation |
|---------|------------|
| WhatsApp | Messages scroll away; no structured balance; no formal approve/reject |
| Excel | One-sided or version chaos; friction on mobile; feels “office”, not relationship |
| Memory | Biased, incomplete, no shared record |

## Likely first users (ICP hypothesis)

- Freelancers ↔ clients (ongoing tab, not invoice system)
- Small suppliers ↔ regular buyers
- Partners / co-founders with informal IOUs
- Family or friends with recurring informal balances  
**Needs verification** with pilot interviews.

## What the pilot must prove

1. **Invitation works** — creator shares `/j/{token}` on WhatsApp; invitee understands and joins.
2. **Two-sided activation** — second participant joins and both see human names (not email/handles).
3. **Core loop** — create entry → other approves → official balance updates.
4. **Return usage** — users come back within 7 days without founder handholding.
5. **Willingness to expand** — at least some users open a **second card** or send another invite.
6. **Qualitative fit** — users describe the product in **mutual ledger** language, not “Splitwise” or “accounting app.”

Measurement detail: [08_PILOT_MEASUREMENT_SYSTEM.md](./08_PILOT_MEASUREMENT_SYSTEM.md).
