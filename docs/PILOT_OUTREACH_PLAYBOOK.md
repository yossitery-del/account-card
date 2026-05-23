# Pilot Outreach Playbook — כרטיס חשבון

Practical founder guide for the **first pilot outreach**.  
Companion docs: [AI_GROWTH_HANDOFF](./AI_GROWTH_HANDOFF/README.md) · [08_PILOT_MEASUREMENT_SYSTEM](./AI_GROWTH_HANDOFF/08_PILOT_MEASUREMENT_SYSTEM.md)

**Production link format:** `https://account-card-prod.vercel.app/j/{token}`  
**In-app share button** may append longer copy — Mode A below is the **minimal natural** version for people who already share a real account with you.

---

## 1. Two outreach modes

### A. Natural real-use invite

**When:** The invitee already has a **real, ongoing financial/account relationship** with you (supplier, client, partner, friend with an open tab).

**Goal:** Use the product **as if it already exists** — no pitch deck, no “startup language.” They should recognize *their* relationship in the message.

**Message:**

```
פתחתי לנו כרטיס חשבון. כנס כאן 👇🏼
{link}
```

**Founder actions before send:**

1. Create the card in the app: **«מול מי הכרטיס?»** — use the name *they* know (e.g. their business or first name).
2. Generate invite link (`/j/{token}`).
3. Send only to the **one person** on that card.

**Optional:** If you use the app’s WhatsApp share button, the longer approved copy is fine for the same audience — do not add a pilot disclaimer on top.

---

### B. Transparent pilot invite

**When:** The person has **no existing shared account** with you — e.g. another business owner, operator in another field, potential power user you want to **test the product**, not your real ledger.

**Goal:** Invite into a **small, closed pilot** with clear expectations. They may create a card with *their* real counterparty later — you are not faking a balance between you and them.

**Message must convey:**

| Point | Why |
|-------|-----|
| What the product is | Mutual ledger between two sides — not payments, not accounting software |
| Why they were selected | Relevant role, relationships, or judgment — not mass blast |
| Closed pilot | Small group; founder-led feedback |
| Real usefulness test | We want to see if *they* would use it with a real client/supplier |

**Do not** send Mode B link pretending it is “our” shared card between you and them.

---

## 2. Who belongs in each mode

| Person type | Mode | Rationale |
|-------------|------|-----------|
| **Existing supplier / customer** (you owe or they owe, ongoing) | **A — Natural** | Real card, real entries; product replaces WhatsApp/Excel noise |
| **Friend with real ongoing account** (loans, shared expenses, informal tab) | **A — Natural** | Same — relationship context is obvious |
| **Business owner with many clients** (no direct account with you) | **B — Transparent** | No shared ledger with founder; they test with *their* network |
| **Partner / small fund / informal group** | **A** if 1:1 account with you; **B** if exploring tool for their own pairs | Split: real dyad → A; scouting → B |
| **Strong connector** (knows many owners, may refer) | **Short voice note or call first**, then **B** (or light B before any link) | High leverage; needs 60s context or they will forward blindly |

**Red flags — do not invite yet:**

- No plausible second side within 7 days
- Will treat link as “another app spam” with zero intent to open a real card
- Public figure / broad audience (use neither mode at scale)

---

## 3. First 20 pilot segmentation

| Bucket | Count | Mode | Notes |
|--------|------:|------|--------|
| Natural real-use | **8** | A | Highest signal for North Star (2 sides + approval) |
| Transparent pilot | **6** | B | Owners/operators without account with founder |
| Strong connectors | **3** | B (+ brief explanation first) | Referral potential; not counted in North Star until *they* run a real card |
| Reserve | **3** | A or B | Hold for drop-outs, wrong bucket, or week-2 expansion |

**Send order:** Never all 20 at once. See [§7](#7-founder-emotional-rules) and [§9](#9-final-72-hour-action-plan).

---

## 4. Exact WhatsApp scripts

Replace `{link}` with the real `/j/{token}` URL. Replace `{שם}` / `{תחום}` as needed.

### 4.1 Natural invite (Mode A)

```
פתחתי לנו כרטיס חשבון. כנס כאן 👇🏼
{link}
```

---

### 4.2 Transparent pilot invite (Mode B)

```
היי {שם},
אני מריץ פיילוט סגור ל«כרטיס חשבון» — פנקס חשבון דיגיטלי משותף בין שני צדדים: רושמים פעולה, הצד השני מאשר, ורק מה שאושר נכנס ליתרה הרשמית. לא תשלומים ולא הנהלת חשבונות.

בחרתי אותך כי {תחום/סיבה קצרה} — רוצה לבדוק אם זה שימושי באמת בעסק שלך, עם לקוח או ספק אמיתי.

מדובר בפיילוט קטן — משוב כנה חשוב לי יותר מפרגון.
אם מתאים, אשמח שתנסה ותגיד מה עובד ומה לא:
{link}
```

---

### 4.3 After “yes” (they agreed to try — Mode B)

```
מעולה. כשתיכנס:
1) תיצור כרטיס «מול מי» — השם שאתה רואה בדשבורד
2) תשלח את הקישור לצד השני (לקוח/ספק אמיתי)
3) תרשום פעולה אחת פשוטה — והצד השני יאשר

אם משהו לא ברור — תכתוב לי. לא צריך «להיות מומחה».
```

*(Mode A after “כן, אשלח” — usually no extra message; send the natural invite link only.)*

---

### 4.4 After no response (48–72 hours)

**Mode A (light):**

```
שלחתי קודם קישור לכרטיס החשבון שלנו — אם לא הספקת, הנה שוב:
{link}
```

**Mode B:**

```
{שם}, רק בודק אם ראית את ההודעה על הפיילוט. אין חובה — אם לא רלוונטי עכשיו, סבבה. אם כן, הקישור:
{link}
```

---

### 4.5 After 2 days (still no join)

**Mode A:**

```
אם הקישור לא נפתח — תגיד לי, אולי נוח יותר בשעה אחרת. זה באמת לניהול החשבון בינינו, לא אפליקציה כללית.
```

**Mode B:**

```
עדיין לא נכנסת — שווה לי לדעת אם חסם (זמן / לא מצאת צד שני / לא הבנת). תשיב במילה אחת אם אפשר: כן / לא / אחר כך
```

---

### 4.6 Asking for feedback (after join or first activity)

```
תודה שנכנסת. שאלה אחת בכנות:
מה היה הכי ברור, ומה הכי מבלבל?
(משפט אחד מספיק)
```

**If they completed an approval:**

```
ראיתי שנרשמה פעולה ואישור — תודה.
האם זה מרגיש טוב יותר מוואטסאפ/אקסל לחשבון הזה? למה כן/לא?
```

---

### 4.7 Asking for referral

**Only after positive signal** (they used the product or gave strong qualitative yes).

```
אם מישהו נוסף בעסק שלך (לקוח/ספק/שותף) יכול להרוויח מזה — מוכן לשלוח לו גם? 
אני בפיילוט סגור, אז רק ממליץ שאתה סומך עליו.
```

**Connectors (after Mode B + explanation):**

```
אם יש לך 1–2 בעלי עסקים שמתנהלים עם לקוחות/ספקים על זיכרון ווואטסאפ — אשמח הקדמה קצרה. אסביר פיילוט לפני קישור.
```

---

## 5. Pilot tracking table

Copy to Google Sheet or Notion. One row per person.

| Column | Values / notes |
|--------|----------------|
| **Name** | First name or business name |
| **Category** | supplier/customer · friend · business owner · partner · connector · reserve |
| **Outreach mode** | A natural · B transparent · connector |
| **Sent date** | YYYY-MM-DD |
| **Responded** | Y / N / partial |
| **Joined** | Second side opened link + Google sign-in |
| **Second side joined** | Y / N / n/a (B may lag) |
| **First entry created** | Y / N |
| **First approval completed** | Y / N — **North Star ingredient** |
| **Opened another card** | Y / N |
| **Feedback** | Short quote or theme |
| **Next action** | e.g. nudge D+2 · interview · referral ask · close |

Align event names with [08_PILOT_MEASUREMENT_SYSTEM.md](./AI_GROWTH_HANDOFF/08_PILOT_MEASUREMENT_SYSTEM.md) when logging funnel events.

---

## 6. Founder emotional rules

1. **Do not ask for approval** — You are not begging (“אשמח מאוד אם תוכל maybe…”). You offer a tool or a pilot seat.
2. **Do not apologize** — No “sorry to bother”, “sorry it’s not finished”. Pilot is intentional.
3. **Do not over-explain** — Mode A: two lines. Mode B: one screen of text max before link.
4. **Do not send to 20 at once** — Batch 3 → 5 → rest; learn from replies.
5. **Start with 3 safest natural invites** — People who will forgive friction and answer honestly.
6. **Data is feedback, not embarrassment** — Low join rate teaches funnel/copy; it is not a verdict on you.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| **No context** → confusion, ignored link | Use Mode B; never fake a “our card” with strangers |
| **Hiding pilot** → feels like spam or trick | Mode B states closed pilot explicitly |
| **Connector blasts link** | 60s explanation or voice note **before** `{link}` |
| **Broad public marketing** | Wait — no posts, ads, or large groups until natural + transparent cohorts show join → approval pattern |
| **Wrong mode for relationship** | Supplier you pay monthly → A; admired CEO you never billed → B |
| **OG preview vs app** | If they ask “why does preview look different?” — preview is marketing; real app after tap ([03_INVITATION_AND_JOIN_UX](./AI_GROWTH_HANDOFF/03_INVITATION_AND_JOIN_UX.md)) |

---

## 8. Cadence (beyond 72 hours)

| Week | Action |
|------|--------|
| 1 | 3 natural → 5 more natural/B → connectors with context |
| 2 | Reserve list; feedback calls; referral asks for greens only |
| 3 | Go/No-Go vs [08](./AI_GROWTH_HANDOFF/08_PILOT_MEASUREMENT_SYSTEM.md) thresholds |

---

## 9. Final 72-hour action plan

### Day 1 — Choose

- [ ] Pick **3 safest natural (Mode A)** names from the list of 8 — real account, high trust, mobile-friendly.
- [ ] Create **3 cards** in the app with correct **«מול מי הכרטיס?»** labels.
- [ ] Copy **3 links** (`/j/{token}`) into the tracking table (no send yet).
- [ ] Fill rows: Name, Category, Mode A, Sent date blank.

### Day 2 — Send

- [ ] Morning: send **only** the 3 natural messages (§4.1).
- [ ] Log **Sent date**; do not send to the other 17 yet.
- [ ] If someone replies “מה זה?” — one line: «פנקס משותף לחשבון בינינו, תיכנס ותראה» + link again. No pilot speech for Mode A.

### Day 3 — Track & learn

- [ ] Update: Responded, Joined, Second side joined, First entry, First approval.
- [ ] For anyone who joined: send §4.6 feedback (one question).
- [ ] For no response: §4.4 (not §4.5 yet unless Day 3 evening).
- [ ] Write 3 bullets: what worked, what broke, adjust next batch (next 5 sends on Day 4–5).
- [ ] Decide: ready for 6× Mode B this week, or fix join friction first.

---

## Quick reference

| Mode | Audience | Message length | Link pretends shared card with founder? |
|------|----------|----------------|----------------------------------------|
| **A Natural** | Real counterparty | Minimal | **Yes** — legitimate |
| **B Transparent** | Pilot tester / owner | Full context | **No** — they bring their own dyad |
| **Connector** | Referrer | Explain first | **No** |

---

*Last updated: pilot prep — docs only, no product changes.*
