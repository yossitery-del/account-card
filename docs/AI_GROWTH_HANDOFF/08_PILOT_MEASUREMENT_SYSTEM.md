# 08 — Pilot Measurement System

Defines **how we know the pilot is working**. No in-app product analytics is required for pilot v1 — manual tracking is acceptable ([section 8](#8-manual-tracking-google-sheet)).

---

## 1. Pilot North Star Metric

**Recommended North Star:**

> **מספר כרטיסים פעילים עם שני צדדים ולפחות פעולה אחת שאושרה**

English: *Count of active cards where (a) exactly two active participants exist and (b) at least one entry has status `approved`.*

### Why this metric

| Condition | Why insufficient alone |
|-----------|-------------------------|
| User signed up | No relationship value |
| Card created, one side only | No mutual ledger |
| Pending entries only, zero approvals | No shared “official” truth |
| Approvals on test/solo cards | Distorts signal |

The North Star forces **invite → join → record → agree**.

**Measurement:** Count distinct `card_id` meeting criteria (sheet or Firestore query by founder). **Needs verification** for automated query.

---

## 2. Funnel metrics

| Step | Event name | Success | Failure | Pilot benchmark (suggested) |
|------|------------|---------|---------|----------------------------|
| 1 | `invite_created` | Invitation doc created server-side; link generated | No token / create failed | 15+ invites across 3+ owners |
| 2 | `invite_shared_whatsapp` | Creator tapped share / sent wa.me message (honor system or timestamp in sheet) | Link never sent | ≥80% of invites shared within 24h |
| 3 | `invite_link_opened` | Invitee opened `/j/{token}` (server log or founder confirms) | Zero opens after 48h | ≥50% open rate of shared invites |
| 4 | `join_started` | Preview loaded `status: valid` | invalid/expired/revoked | ≥40% of opens |
| 5 | `sign_in_completed` | Google auth completed on join path | Abandoned at login | ≥70% of join_started |
| 6 | `display_name_required` | `!isCleanDisplayName` after login | — | Track % (quality signal) |
| 7 | `display_name_completed` | User submitted clean name + continued | Abandoned on name step | ≥90% of those required |
| 8 | `card_joined` | `acceptInvitation` success; 2 active participants | Accept error / no second side | ≥50% of invites → joined |
| 9 | `entry_created` | First `createEntry` on that card | Card idle after join | ≥60% of joined cards |
| 10 | `entry_approved` | First `approveEntry` on that card | Only pending / rejections | ≥50% of cards with entry |
| 11 | `dashboard_returned` | User opens app again after day 0 (session 2+) | One-and-done | ≥30% of activated owners |
| 12 | `second_card_created` | Same user creates another card | Single-card only | ≥20% of activated owners |
| 13 | `additional_invite_sent` | New invitation after first card success | No referrals | ≥15% of activated owners |

**Failure** at any step = drop-off; investigate with qualitative questions (section 7).

Events are **not** all wired in code today — log manually or infer from Firestore until product analytics exists.

---

## 3. Required events to track

Canonical names for sheet columns and future instrumentation:

| Event | Trigger (definition) |
|-------|----------------------|
| `invite_created` | `createInvitation` (or equivalent) returns link |
| `invite_shared_whatsapp` | User launches `buildWhatsAppShareUrl` / confirms send |
| `invite_link_opened` | First HTTP load of join route for token **Needs verification** if no logging |
| `join_started` | `getInvitationPreview` → `valid` on client |
| `sign_in_completed` | Firebase Auth session established during join |
| `display_name_required` | Join UI shows clean-name step |
| `display_name_completed` | User submits name; proceeds to accept |
| `card_joined` | `acceptInvitation` OK; participant count = 2 |
| `entry_created` | First entry `pending` on card |
| `entry_approved` | First entry → `approved` |
| `dashboard_returned` | Auth session day 2+ with dashboard view |
| `second_card_created` | User owns ≥2 cards (createdByUid or participant) |
| `additional_invite_sent` | Second+ invitation by same owner |

**Privacy:** Log **uids/card ids** in internal sheet only — not in public docs.

---

## 4. Pilot dashboard fields

One row per **card** (or per **owner–card** pair — pick one convention and stick to it).

| Field | Description |
|-------|-------------|
| `user_id` | Owner / primary pilot user Firebase uid |
| `card_id` | `accountCards` document id |
| `invite_created_at` | ISO timestamp |
| `invite_opened_at` | First known open |
| `joined_at` | Second participant active |
| `second_side_joined` | boolean |
| `first_entry_at` | First pending entry |
| `first_approval_at` | First approved entry |
| `last_active_at` | Last known session |
| `number_of_cards` | Per owner (rollup tab optional) |
| `number_of_approved_entries` | On this card |
| `referred_user_count` | Invites sent by this user after activation |
| `notes` | Qualitative feedback, objections, quotes |

---

## 5. Success thresholds (first pilot)

Realistic **early** targets for a founder-led cohort (~2 weeks):

| Metric | Target |
|--------|--------|
| Invited users (unique invitees targeted) | **20** |
| Account owners activated (created card + shared invite) | **10** |
| Cards with second side joined | **7** |
| Cards with ≥1 approved action | **5** |
| Users returning within 7 days | **3** |
| Users with >1 card | **2** |
| Strong qualitative pain confirmations | **≥3** (interviews) |

**North Star at end of pilot:** **5** cards meeting full North Star definition aligns with approved-action row above.

Adjust if cohort size changes; document changes in sheet “Notes” tab.

---

## 6. Go / No-Go decision

After **14 days** (+ interviews):

### Green — continue / expand pilot

- Users **create cards**, **invite**, and **approvals happen** without handholding.
- Invited side understands why to join (mutual record, not “another debt app”).
- North Star ≥5 cards or clear upward trend week-over-week.
- Qualitative language matches positioning ([01](./01_PRODUCT_STRATEGY.md)).

### Yellow — iterate GTM / UX, stay in pilot

- People **like the idea** but stall at join, name step, or first entry.
- Fix: scripts, onboarding nudges, founder concierge — **not** scale marketing.

### Red — pause acquisition; fix product or positioning

- People **don’t understand why the second side should join**.
- High opens, near-zero joins or approvals.
- Consistent “I’ll stay on WhatsApp” with **no** willingness to try one real card.

Document decision in sheet + 2-paragraph summary for next sprint.

---

## 7. Qualitative interview questions

Ask after day 3–7 (Hebrew in field; English here for AI context):

1. **What made you click?** — trigger and trust
2. **What confused you?** — join, name, balance, approval
3. **Where would you use this in real life?** — wedge validation
4. **What would make you stop using WhatsApp/Excel for this?** — switching cost
5. **Would you invite another person?** — viral intent
6. **What sentence best describes the product?** — positioning check
7. **What felt unprofessional?** — UX/copy gaps
8. **What felt trustworthy?** — premium + security perception
9. **Would you pay for this?** — pricing signal (hypothesis only)
10. **What is missing before you use it seriously?** — blocker features

Store answers in `notes` column; tag themes (join friction, approval confusion, etc.).

---

## 8. Manual tracking (Google Sheet)

### Tabs

1. **Funnel_Events** — one row per event  
   Columns: `timestamp`, `event_name`, `user_id`, `card_id`, `token_prefix` (first 6 chars only), `source` (manual / firestore), `notes`

2. **Cards** — dashboard fields from section 4

3. **Users** — `user_id`, `display_name`, `cohort`, `owner?`, `number_of_cards`, `first_activation_at`, `interview_done` (Y/N)

4. **Weekly_Snapshot** — week ending date, North Star count, funnel conversion %, Go/No-Go color

### Daily founder ritual (5 min)

- Update opens/joins from Firestore Console or user screenshots
- Mark WhatsApp sends when users confirm
- Note any failed accept or OG issues

---

## 9. Future analytics

Pilot v1: **manual sheet is acceptable** and aligned with `docs/PRIVACY_DECISIONS.md` (no third-party analytics on card content).

Later (post–Go Green):

- Instrument the event names in section 3 inside the app (server-side or privacy-safe client events)
- Founder dashboard: funnel conversion, North Star, cohort retention
- Still **no** balance/entry text in analytics payloads

Until then, treat Firestore `auditEvents` as engineering audit — **not** a product analytics UI.
