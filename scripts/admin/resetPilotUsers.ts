/**
 * One-time admin reset for pilot / test users.
 *
 * Default: dry-run only (no deletes).
 * Real delete: pass --confirm and type RESET PILOT DATA when prompted.
 *
 * Requires Application Default Credentials, e.g.:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 *
 * Examples:
 *   npm run admin:reset-pilot-users -- --check-credentials
 *   npm run admin:reset-pilot-users -- --email a@example.com --email b@example.com
 *   npm run admin:reset-pilot-users -- --config scripts/admin/pilot-users.json
 *   npm run admin:reset-pilot-users -- --email a@example.com --confirm
 */

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Firebase Admin is loaded dynamically so startup logs appear before network/credential work. */
type FirebaseAdmin = typeof import("firebase-admin/app");
type FirebaseAuth = typeof import("firebase-admin/auth");
type FirebaseFirestore = typeof import("firebase-admin/firestore");
type Firestore = import("firebase-admin/firestore").Firestore;
type DocumentReference =
  import("firebase-admin/firestore").DocumentReference;
type CollectionReference =
  import("firebase-admin/firestore").CollectionReference;

const SCRIPT_NAME = "resetPilotUsers";
const SCRIPT_VERSION = "1.1.0";
const CONFIRMATION_PHRASE = "RESET PILOT DATA";
const CALL_TIMEOUT_MS = 15_000;
const CARD_SUBCOLLECTIONS = [
  "participants",
  "entries",
  "auditEvents",
  "invitations",
] as const;

let debugEnabled = false;

type PilotUsersConfig = {
  emails?: string[];
  uids?: string[];
};

type CardTarget = {
  cardId: string;
  title: string;
  matchedUids: string[];
};

type SubcollectionCounts = Record<(typeof CARD_SUBCOLLECTIONS)[number], number>;

type CliOptions = {
  emails: string[];
  uids: string[];
  configPath?: string;
  confirm: boolean;
  checkCredentials: boolean;
  debug: boolean;
  help: boolean;
};

function log(message: string, options?: { debugOnly?: boolean }): void {
  if (options?.debugOnly && !debugEnabled) {
    return;
  }
  process.stdout.write(`${message}\n`);
}

function logError(message: string): void {
  process.stderr.write(`${message}\n`);
}

function printHelp(): void {
  log(`
Usage:
  npm run admin:reset-pilot-users -- [options]

Options:
  --email <email>          Pilot/test user email (repeatable)
  --uid <uid>              Firebase Auth UID (repeatable)
  --config <path>          JSON file: { "emails": [], "uids": [] }
  --check-credentials      Initialize Admin only; verify connection (no card reads)
  --confirm                Perform deletion after typed confirmation
  --debug                  Extra verbose logs
  -h, --help               Show this help

Default mode is dry-run (no deletes).
`);
}

function parseArgs(argv: string[]): CliOptions {
  const emails: string[] = [];
  const uids: string[] = [];
  let configPath: string | undefined;
  let confirm = false;
  let checkCredentials = false;
  let debug = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--confirm") {
      confirm = true;
      continue;
    }
    if (arg === "--check-credentials") {
      checkCredentials = true;
      continue;
    }
    if (arg === "--debug") {
      debug = true;
      continue;
    }
    if (arg === "--email") {
      const value = argv[++i];
      if (!value) {
        throw new Error("Missing value for --email");
      }
      emails.push(value.trim());
      continue;
    }
    if (arg === "--uid") {
      const value = argv[++i];
      if (!value) {
        throw new Error("Missing value for --uid");
      }
      uids.push(value.trim());
      continue;
    }
    if (arg === "--config") {
      const value = argv[++i];
      if (!value) {
        throw new Error("Missing value for --config");
      }
      configPath = value.trim();
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    emails,
    uids,
    configPath,
    confirm,
    checkCredentials,
    debug,
    help,
  };
}

async function withTimeout<T>(
  label: string,
  promise: Promise<T>,
  timeoutMs = CALL_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${timeoutMs / 1000}s. Check credentials, network, and project access.`
        )
      );
    }, timeoutMs);
    timeoutId.unref?.();
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function requireCredentialsPath(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    return;
  }

  throw new Error(
    [
      "GOOGLE_APPLICATION_CREDENTIALS is not set.",
      "This script requires an explicit service-account JSON path to avoid hanging on credential discovery.",
      'Set: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"',
    ].join("\n")
  );
}

async function withLoadingHeartbeat<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const heartbeat = setInterval(() => {
    log(`Still working: ${label}...`);
  }, 5000);
  heartbeat.unref?.();

  try {
    return await operation();
  } finally {
    clearInterval(heartbeat);
  }
}

async function readServiceAccountProjectId(): Promise<string | null> {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credentialsPath) {
    return null;
  }

  try {
    const absolutePath = resolve(credentialsPath);
    const raw = await readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as { project_id?: unknown };
    return typeof parsed.project_id === "string" ? parsed.project_id : null;
  } catch (error) {
    log(
      `Could not read project_id from GOOGLE_APPLICATION_CREDENTIALS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

function printStartupBanner(options: CliOptions, argv: string[]): void {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const mode = options.checkCredentials
    ? "CHECK-CREDENTIALS"
    : options.confirm
      ? "CONFIRM"
      : "DRY-RUN";

  log(`${SCRIPT_NAME} v${SCRIPT_VERSION}`);
  log(`Mode: ${mode}`);
  log(`CLI args: ${argv.length ? argv.join(" ") : "(none)"}`);
  if (options.emails.length > 0) {
    log(`Emails from CLI: ${options.emails.join(", ")}`);
  }
  if (options.uids.length > 0) {
    log(`UIDs from CLI: ${options.uids.join(", ")}`);
  }
  if (options.configPath) {
    log(`Config file: ${options.configPath}`);
  }
  log(
    `GOOGLE_APPLICATION_CREDENTIALS: ${
      credentialsPath ? `set (${credentialsPath})` : "not set"
    }`
  );
}

async function loadFirebaseAdmin(): Promise<{
  app: FirebaseAdmin;
  auth: FirebaseAuth;
  firestore: FirebaseFirestore;
}> {
  requireCredentialsPath();
  log("Initializing Firebase Admin...");

  return withLoadingHeartbeat("Firebase Admin setup", async () => {
    const [app, auth, firestore] = await withTimeout(
      "Firebase Admin module import",
      Promise.all([
        import("firebase-admin/app"),
        import("firebase-admin/auth"),
        import("firebase-admin/firestore"),
      ])
    );

    await withTimeout(
      "Firebase Admin initializeApp",
      Promise.resolve().then(() => {
        if (app.getApps().length === 0) {
          app.initializeApp();
        }
      })
    );

    log("Firebase Admin initialized");
    return { app, auth, firestore };
  });
}

function resolveProjectId(app: FirebaseAdmin): string {
  return (
    app.getApps()[0]?.options.projectId ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    "(unknown)"
  );
}

async function runCredentialCheck(
  app: FirebaseAdmin,
  auth: FirebaseAuth,
  firestore: FirebaseFirestore
): Promise<void> {
  const projectId = resolveProjectId(app);
  const serviceAccountProjectId = await readServiceAccountProjectId();

  log(`Resolved Admin projectId: ${projectId}`);
  if (serviceAccountProjectId) {
    log(`Service account JSON project_id: ${serviceAccountProjectId}`);
    if (serviceAccountProjectId !== projectId && projectId !== "(unknown)") {
      logError(
        "Warning: service account project_id differs from initialized projectId."
      );
    }
  }

  log("Checking Firebase Auth connection...");
  const authClient = auth.getAuth();
  await withTimeout(
    "Firebase Auth listUsers(1)",
    authClient.listUsers(1)
  );
  log("Firebase Auth: OK");

  log("Checking Firestore connection...");
  const db = firestore.getFirestore();
  await withTimeout("Firestore listCollections", db.listCollections());
  log("Firestore: OK");

  log("\nCredential check complete. No cards were read or deleted.");
}

async function loadConfig(configPath: string): Promise<PilotUsersConfig> {
  const absolutePath = resolve(process.cwd(), configPath);
  log(`Loading config: ${absolutePath}`);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw) as PilotUsersConfig;

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid config file: ${absolutePath}`);
  }

  return parsed;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

async function resolveTargets(options: CliOptions): Promise<{
  emails: string[];
  uids: string[];
}> {
  const emails = [...options.emails];
  const uids = [...options.uids];

  if (options.configPath) {
    const config = await loadConfig(options.configPath);
    if (Array.isArray(config.emails)) {
      emails.push(...config.emails.map((email) => String(email).trim()));
    }
    if (Array.isArray(config.uids)) {
      uids.push(...config.uids.map((uid) => String(uid).trim()));
    }
  }

  return {
    emails: uniqueStrings(emails),
    uids: uniqueStrings(uids),
  };
}

function isAuthUserNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === "auth/user-not-found";
}

async function resolveUidsFromEmails(
  auth: FirebaseAuth,
  emails: string[]
): Promise<{ emailToUid: Map<string, string>; missingEmails: string[] }> {
  const emailToUid = new Map<string, string>();
  const missingEmails: string[] = [];
  const authClient = auth.getAuth();

  for (const email of emails) {
    log(`Resolving email: ${email}`);
    try {
      const user = await withTimeout(
        `Firebase Auth getUserByEmail(${email})`,
        authClient.getUserByEmail(email)
      );
      emailToUid.set(email, user.uid);
      log(`Resolved ${email} -> ${user.uid}`);
    } catch (error) {
      if (isAuthUserNotFound(error)) {
        missingEmails.push(email);
        logError(`Email not found in Firebase Auth: ${email}`);
        continue;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to resolve email "${email}": ${message}`);
    }
  }

  return { emailToUid, missingEmails };
}

function isMissingCollectionGroupIndexError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: unknown }).code;
  return (
    code === 9 ||
    code === "failed-precondition" ||
    message.includes("FAILED_PRECONDITION") ||
    message.includes("COLLECTION_GROUP") ||
    message.includes("requires an index")
  );
}

function participantUid(
  participantDoc: import("firebase-admin/firestore").QueryDocumentSnapshot
): string | null {
  const dataUid = participantDoc.data()?.uid;
  if (typeof dataUid === "string" && dataUid.trim()) {
    return dataUid.trim();
  }
  return participantDoc.id || null;
}

function upsertCardTarget(
  cardsById: Map<string, CardTarget>,
  cardId: string,
  title: string,
  uid: string
): void {
  const existing = cardsById.get(cardId);
  if (existing) {
    if (!existing.matchedUids.includes(uid)) {
      existing.matchedUids.push(uid);
    }
    return;
  }

  cardsById.set(cardId, {
    cardId,
    title,
    matchedUids: [uid],
  });
}

async function findCardsForUidsViaCollectionGroup(
  db: Firestore,
  targetUids: string[]
): Promise<CardTarget[]> {
  const cardsById = new Map<string, CardTarget>();

  for (const uid of targetUids) {
    log(`Querying participants for UID: ${uid}`);
    const participantSnap = await withTimeout(
      `Firestore collectionGroup(participants) uid=${uid}`,
      db.collectionGroup("participants").where("uid", "==", uid).get()
    );
    log(
      `Found ${participantSnap.size} participant doc(s) for UID ${uid}`,
      { debugOnly: true }
    );

    for (const participantDoc of participantSnap.docs) {
      const cardRef = participantDoc.ref.parent.parent;
      if (!cardRef) {
        continue;
      }

      const cardId = cardRef.id;
      log(`Loading accountCard: ${cardId}`, { debugOnly: true });
      const cardSnap = await withTimeout(
        `Firestore accountCards/${cardId} get`,
        cardRef.get()
      );
      const title =
        typeof cardSnap.data()?.title === "string"
          ? cardSnap.data()!.title
          : "(no title)";

      upsertCardTarget(cardsById, cardId, title, uid);
    }
  }

  return [...cardsById.values()].sort((a, b) =>
    a.title.localeCompare(b.title, "he")
  );
}

async function findCardsForUidsViaAccountCardsScan(
  db: Firestore,
  targetUidSet: Set<string>
): Promise<CardTarget[]> {
  const cardsById = new Map<string, CardTarget>();

  log("Listing all accountCards for participant scan...");
  const cardsSnap = await withTimeout(
    "Firestore accountCards list",
    db.collection("accountCards").get()
  );

  const totalCards = cardsSnap.size;
  let cardsScanned = 0;
  let matchingCardsFound = 0;

  log(`accountCards to scan: ${totalCards}`);

  for (const cardDoc of cardsSnap.docs) {
    cardsScanned += 1;
    if (
      cardsScanned === 1 ||
      cardsScanned === totalCards ||
      cardsScanned % 10 === 0
    ) {
      log(
        `Cards scanned: ${cardsScanned}/${totalCards}, matching cards found: ${matchingCardsFound}`
      );
    }

    const participantsSnap = await withTimeout(
      `Firestore accountCards/${cardDoc.id}/participants list`,
      cardDoc.ref.collection("participants").get()
    );

    const matchedUids: string[] = [];
    for (const participantDoc of participantsSnap.docs) {
      const uid = participantUid(participantDoc);
      if (uid && targetUidSet.has(uid) && !matchedUids.includes(uid)) {
        matchedUids.push(uid);
      }
    }

    if (matchedUids.length === 0) {
      continue;
    }

    matchingCardsFound += 1;
    const title =
      typeof cardDoc.data()?.title === "string"
        ? cardDoc.data()!.title
        : "(no title)";

    for (const uid of matchedUids) {
      upsertCardTarget(cardsById, cardDoc.id, title, uid);
    }
  }

  log(
    `Scan complete. Cards scanned: ${cardsScanned}, matching cards found: ${matchingCardsFound}`
  );

  return [...cardsById.values()].sort((a, b) =>
    a.title.localeCompare(b.title, "he")
  );
}

async function findCardsForUids(
  db: Firestore,
  targetUids: string[]
): Promise<CardTarget[]> {
  if (targetUids.length === 0) {
    return [];
  }

  const targetUidSet = new Set(targetUids);

  try {
    return await findCardsForUidsViaCollectionGroup(db, targetUids);
  } catch (error) {
    if (!isMissingCollectionGroupIndexError(error)) {
      throw error;
    }

    log(
      "Collection group index missing; falling back to accountCards scan."
    );
    return findCardsForUidsViaAccountCardsScan(db, targetUidSet);
  }
}

async function countSubcollections(
  cardRef: DocumentReference
): Promise<SubcollectionCounts> {
  const counts = {
    participants: 0,
    entries: 0,
    auditEvents: 0,
    invitations: 0,
  } satisfies SubcollectionCounts;

  for (const name of CARD_SUBCOLLECTIONS) {
    const collectionRef = cardRef.collection(name) as CollectionReference;
    log(`Counting ${cardRef.id}/${name}...`, { debugOnly: true });
    const snap = await withTimeout(
      `Firestore count ${cardRef.id}/${name}`,
      collectionRef.count().get()
    );
    counts[name] = snap.data().count;
  }

  return counts;
}

function printSummary(params: {
  projectId: string;
  emails: string[];
  emailToUid: Map<string, string>;
  missingEmails: string[];
  uids: string[];
  cards: CardTarget[];
  countsByCard: Map<string, SubcollectionCounts>;
  confirm: boolean;
}): void {
  const {
    projectId,
    emails,
    emailToUid,
    missingEmails,
    uids,
    cards,
    countsByCard,
    confirm,
  } = params;

  log("\n=== Pilot user reset plan ===");
  log(`Project ID: ${projectId}`);
  log(`Mode: ${confirm ? "CONFIRM (will delete)" : "DRY-RUN (no deletes)"}`);
  log(`Selected emails: ${emails.length ? emails.join(", ") : "(none)"}`);
  if (missingEmails.length > 0) {
    log(`Emails not found in Auth: ${missingEmails.join(", ")}`);
  }
  if (emailToUid.size > 0) {
    log("Resolved UIDs from emails:");
    for (const [email, uid] of emailToUid) {
      log(`  ${email} -> ${uid}`);
    }
  }
  log(`Selected UIDs: ${uids.length ? uids.join(", ") : "(none)"}`);

  if (cards.length === 0) {
    log("\nNo accountCards matched for the selected users.");
    return;
  }

  log(`\nMatched accountCards (${cards.length}):`);
  let totalParticipants = 0;
  let totalEntries = 0;
  let totalAuditEvents = 0;
  let totalInvitations = 0;

  for (const card of cards) {
    const counts = countsByCard.get(card.cardId)!;
    totalParticipants += counts.participants;
    totalEntries += counts.entries;
    totalAuditEvents += counts.auditEvents;
    totalInvitations += counts.invitations;

    log(`\n- ${card.cardId}`);
    log(`  title: ${card.title}`);
    log(`  matched UIDs: ${card.matchedUids.join(", ")}`);
    log(`  participants: ${counts.participants}`);
    log(`  entries: ${counts.entries}`);
    log(`  auditEvents: ${counts.auditEvents}`);
    log(`  invitations: ${counts.invitations}`);
  }

  log("\n=== Totals to delete ===");
  log(`accountCards: ${cards.length}`);
  log(`participants: ${totalParticipants}`);
  log(`entries: ${totalEntries}`);
  log(`auditEvents: ${totalAuditEvents}`);
  log(`invitations: ${totalInvitations}`);
  log(
    "\nNot deleted: Firebase Auth users, users/{uid} profiles, unrelated cards."
  );
}

async function promptForConfirmation(): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    log(
      `\nType "${CONFIRMATION_PHRASE}" exactly to proceed with deletion:`
    );
    const typed = (await rl.question("> ")).trim();
    return typed === CONFIRMATION_PHRASE;
  } finally {
    rl.close();
  }
}

async function deleteCards(db: Firestore, cards: CardTarget[]): Promise<void> {
  for (const card of cards) {
    const cardRef = db.collection("accountCards").doc(card.cardId);
    log(`Deleting ${card.cardId} (${card.title})...`);
    await withTimeout(
      `Firestore recursiveDelete ${card.cardId}`,
      db.recursiveDelete(cardRef),
      60_000
    );
    log(`Deleted ${card.cardId}`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const options = parseArgs(argv);
  debugEnabled = options.debug;

  printStartupBanner(options, argv);

  const serviceAccountProjectId = await readServiceAccountProjectId();
  if (serviceAccountProjectId) {
    log(`Service account JSON project_id: ${serviceAccountProjectId}`);
  }

  if (!options.help) {
    requireCredentialsPath();
  }

  if (options.help) {
    printHelp();
    return;
  }

  const { app, auth, firestore } = await loadFirebaseAdmin();
  const projectId = resolveProjectId(app);
  log(`Admin SDK projectId: ${projectId}`);

  if (options.checkCredentials) {
    await runCredentialCheck(app, auth, firestore);
    return;
  }

  const targets = await resolveTargets(options);
  if (targets.emails.length === 0 && targets.uids.length === 0) {
    throw new Error(
      "No targets provided. Use --email, --uid, or --config with at least one user."
    );
  }

  const authClient = auth.getAuth();
  const db = firestore.getFirestore();

  const { emailToUid, missingEmails } = await resolveUidsFromEmails(
    auth,
    targets.emails
  );
  const resolvedUids = uniqueStrings([
    ...targets.uids,
    ...emailToUid.values(),
  ]);

  if (resolvedUids.length === 0) {
    log("\nNo UIDs available to scan for accountCards.");
    if (missingEmails.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  log(`Scanning accountCards for ${resolvedUids.length} UID(s)...`);
  const cards = await findCardsForUids(db, resolvedUids);
  const countsByCard = new Map<string, SubcollectionCounts>();

  for (const card of cards) {
    const cardRef = db.collection("accountCards").doc(card.cardId);
    countsByCard.set(card.cardId, await countSubcollections(cardRef));
  }

  printSummary({
    projectId,
    emails: targets.emails,
    emailToUid,
    missingEmails,
    uids: resolvedUids,
    cards,
    countsByCard,
    confirm: options.confirm,
  });

  if (missingEmails.length > 0) {
    logError(
      `\nCompleted with ${missingEmails.length} unresolved email(s). No deletes were attempted for missing users.`
    );
    if (!options.confirm) {
      process.exitCode = 1;
    }
  }

  if (!options.confirm) {
    log("\nDry-run complete. No data was deleted.");
    log("Re-run with --confirm to perform deletion.");
    return;
  }

  if (cards.length === 0) {
    log("\nNothing to delete.");
    return;
  }

  const confirmed = await promptForConfirmation();
  if (!confirmed) {
    logError("\nConfirmation phrase did not match. Aborting without deletes.");
    process.exitCode = 2;
    return;
  }

  log("\nStarting deletion...");
  await deleteCards(db, cards);
  log("\nDeletion complete.");
}

log(`${SCRIPT_NAME} v${SCRIPT_VERSION} — booting`);

main().catch((error) => {
  logError("\nReset script failed:");
  logError(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
