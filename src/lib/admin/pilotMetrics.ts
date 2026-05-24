import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type DocumentReference,
} from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/admin/firebaseAdmin";
import type {
  PilotMetricsAggregate,
  PilotMetricsConversionRates,
  PilotMetricsDelta,
  PilotMetricsSnapshot,
} from "@/types/pilotMetrics";

const SNAPSHOT_COLLECTION = "pilotMetricSnapshots";
const SNAPSHOT_SCHEMA_VERSION = 1;

function cardIdFromDocRef(ref: DocumentReference): string | null {
  return ref.parent.parent?.id ?? null;
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

function deltaValue(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null) {
    return null;
  }
  return Math.round((current - previous) * 10) / 10;
}

function timestampToIso(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

function snapshotFromDoc(docSnap: DocumentSnapshot): PilotMetricsSnapshot | null {
  const data = docSnap.data();
  if (!data) {
    return null;
  }

  if (!data.metrics || typeof data.metrics !== "object") {
    return null;
  }

  const metrics = data.metrics as PilotMetricsAggregate;
  const generatedAt =
    typeof data.generatedAt === "string"
      ? data.generatedAt
      : metrics.generatedAt;

  if (typeof generatedAt !== "string") {
    return null;
  }

  return {
    metrics,
    createdAt: timestampToIso(data.createdAt),
    generatedAt,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  };
}

function buildConversionRates(
  totalCards: number,
  twoSidedCards: number,
  cardsWithApprovedEntries: number,
  invitationsCreated: number,
  invitationsAccepted: number
): PilotMetricsConversionRates {
  return {
    cardsToTwoSidedCards: percent(twoSidedCards, totalCards),
    twoSidedCardsToApprovedActivity: percent(
      cardsWithApprovedEntries,
      twoSidedCards
    ),
    invitationsToAccepted: percent(invitationsAccepted, invitationsCreated),
  };
}

/**
 * אוסף מדדי פיילוט מצרפיים — counts בלבד, ללא החזרת מזהים או מסמכים.
 * מתאים לנפח פיילוט קטן; לא collectionGroup aggregation מורכב.
 */
export async function collectPilotMetrics(): Promise<PilotMetricsAggregate> {
  const db = getAdminFirestore();
  const generatedAt = new Date().toISOString();

  const [
    usersCountSnap,
    activeCardsSnap,
    activeParticipantsSnap,
    entriesSnap,
    invitationsSnap,
  ] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("accountCards").where("status", "==", "active").get(),
    db.collectionGroup("participants").where("status", "==", "active").get(),
    db.collectionGroup("entries").get(),
    db.collectionGroup("invitations").get(),
  ]);

  const usersWithProfiles = usersCountSnap.data().count;

  const totalCards = activeCardsSnap.size;
  const activeCardIds = new Set(activeCardsSnap.docs.map((doc) => doc.id));

  const participantsPerCard = new Map<string, number>();
  const cardsPerUid = new Map<string, number>();

  for (const participantDoc of activeParticipantsSnap.docs) {
    const cardId = cardIdFromDocRef(participantDoc.ref);
    if (!cardId || !activeCardIds.has(cardId)) {
      continue;
    }

    participantsPerCard.set(
      cardId,
      (participantsPerCard.get(cardId) ?? 0) + 1
    );

    const uid =
      typeof participantDoc.data().uid === "string"
        ? participantDoc.data().uid
        : participantDoc.id;

    if (uid) {
      cardsPerUid.set(uid, (cardsPerUid.get(uid) ?? 0) + 1);
    }
  }

  let twoSidedCards = 0;
  for (const count of participantsPerCard.values()) {
    if (count === 2) {
      twoSidedCards += 1;
    }
  }

  const cardsWithAnyEntry = new Set<string>();
  const cardsWithApprovedEntries = new Set<string>();
  let pendingEntries = 0;
  let approvedEntries = 0;

  for (const entryDoc of entriesSnap.docs) {
    const cardId = cardIdFromDocRef(entryDoc.ref);
    if (!cardId || !activeCardIds.has(cardId)) {
      continue;
    }

    cardsWithAnyEntry.add(cardId);

    const status = entryDoc.data().status;
    if (status === "pending") {
      pendingEntries += 1;
    }
    if (status === "approved") {
      approvedEntries += 1;
      if (cardId) {
        cardsWithApprovedEntries.add(cardId);
      }
    }
  }

  const creators = new Set<string>();
  for (const cardDoc of activeCardsSnap.docs) {
    const createdByUid = cardDoc.data().createdByUid;
    if (typeof createdByUid === "string" && createdByUid.trim().length > 0) {
      creators.add(createdByUid.trim());
    }
  }

  let usersWithMoreThanOneCard = 0;
  for (const count of cardsPerUid.values()) {
    if (count > 1) {
      usersWithMoreThanOneCard += 1;
    }
  }

  let invitationsCreated = 0;
  let invitationsAccepted = 0;
  for (const inviteDoc of invitationsSnap.docs) {
    const cardId = cardIdFromDocRef(inviteDoc.ref);
    if (!cardId || !activeCardIds.has(cardId)) {
      continue;
    }

    invitationsCreated += 1;
    if (inviteDoc.data().status === "accepted") {
      invitationsAccepted += 1;
    }
  }

  const cardsWithEntries = cardsWithAnyEntry.size;
  const cardsWithApprovedEntriesCount = cardsWithApprovedEntries.size;
  const usersWhoCreatedCards = creators.size;

  return {
    usersWithProfiles,
    totalCards,
    twoSidedCards,
    cardsWithEntries,
    cardsWithApprovedEntries: cardsWithApprovedEntriesCount,
    invitationsCreated,
    invitationsAccepted,
    pendingEntries,
    approvedEntries,
    usersWhoCreatedCards,
    usersWithMoreThanOneCard,
    conversionRates: buildConversionRates(
      totalCards,
      twoSidedCards,
      cardsWithApprovedEntriesCount,
      invitationsCreated,
      invitationsAccepted
    ),
    generatedAt,
  };
}

export async function getLatestPilotMetricsSnapshot(): Promise<PilotMetricsSnapshot | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(SNAPSHOT_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  return snapshotFromDoc(snap.docs[0]!) ?? null;
}

export async function savePilotMetricsSnapshot(): Promise<PilotMetricsSnapshot> {
  const db = getAdminFirestore();
  const metrics = await collectPilotMetrics();
  const ref = db.collection(SNAPSHOT_COLLECTION).doc();

  await ref.set({
    metrics,
    createdAt: FieldValue.serverTimestamp(),
    generatedAt: metrics.generatedAt,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  });

  const saved = await ref.get();
  if (saved.exists) {
    const snapshot = snapshotFromDoc(saved);
    if (snapshot) {
      return snapshot;
    }
  }

  return {
    metrics,
    createdAt: null,
    generatedAt: metrics.generatedAt,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  };
}

export function computePilotMetricsDelta(
  current: PilotMetricsAggregate,
  previous: PilotMetricsAggregate | null
): PilotMetricsDelta | null {
  if (!previous) {
    return null;
  }

  return {
    usersWithProfiles: deltaValue(
      current.usersWithProfiles,
      previous.usersWithProfiles
    ),
    totalCards: deltaValue(current.totalCards, previous.totalCards),
    twoSidedCards: deltaValue(current.twoSidedCards, previous.twoSidedCards),
    cardsWithEntries: deltaValue(
      current.cardsWithEntries,
      previous.cardsWithEntries
    ),
    cardsWithApprovedEntries: deltaValue(
      current.cardsWithApprovedEntries,
      previous.cardsWithApprovedEntries
    ),
    invitationsCreated: deltaValue(
      current.invitationsCreated,
      previous.invitationsCreated
    ),
    invitationsAccepted: deltaValue(
      current.invitationsAccepted,
      previous.invitationsAccepted
    ),
    pendingEntries: deltaValue(current.pendingEntries, previous.pendingEntries),
    approvedEntries: deltaValue(
      current.approvedEntries,
      previous.approvedEntries
    ),
    usersWhoCreatedCards: deltaValue(
      current.usersWhoCreatedCards,
      previous.usersWhoCreatedCards
    ),
    usersWithMoreThanOneCard: deltaValue(
      current.usersWithMoreThanOneCard,
      previous.usersWithMoreThanOneCard
    ),
    conversionRates: {
      cardsToTwoSidedCards: deltaValue(
        current.conversionRates.cardsToTwoSidedCards,
        previous.conversionRates.cardsToTwoSidedCards
      ),
      twoSidedCardsToApprovedActivity: deltaValue(
        current.conversionRates.twoSidedCardsToApprovedActivity,
        previous.conversionRates.twoSidedCardsToApprovedActivity
      ),
      invitationsToAccepted: deltaValue(
        current.conversionRates.invitationsToAccepted,
        previous.conversionRates.invitationsToAccepted
      ),
    },
  };
}
