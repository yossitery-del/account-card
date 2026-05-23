import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/admin/firebaseAdmin";
import type {
  PilotMetricsAggregate,
  PilotMetricsConversionRates,
} from "@/types/pilotMetrics";

function cardIdFromDocRef(ref: DocumentReference): string | null {
  return ref.parent.parent?.id ?? null;
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
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
