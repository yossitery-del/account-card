import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../lib/admin";

type SeedCardOptions = {
  cardId?: string;
  ownerUid?: string;
  participantUid?: string;
};

export async function resetFirestore(): Promise<void> {
  const collections = await db.listCollections();
  await Promise.all(
    collections.map(async (collectionRef) => {
      const snapshot = await collectionRef.get();
      await Promise.all(snapshot.docs.map((doc) => db.recursiveDelete(doc.ref)));
    })
  );
}

export async function seedCard(options: SeedCardOptions = {}): Promise<{
  cardId: string;
  ownerUid: string;
  participantUid: string;
}> {
  const cardId = options.cardId ?? "card-smoke";
  const ownerUid = options.ownerUid ?? "uid-owner";
  const participantUid = options.participantUid ?? "uid-participant";
  const now = FieldValue.serverTimestamp();
  const cardRef = db.collection("accountCards").doc(cardId);

  await cardRef.set({
    title: "כרטיס בדיקה",
    currency: "ILS",
    status: "active",
    createdByUid: ownerUid,
    balancePerspectiveUid: ownerUid,
    createdAt: now,
    updatedAt: now,
    officialBalance: 0,
    pendingBalanceImpact: 0,
    encryptionMode: "none",
    dataSchemaVersion: 1,
  });

  await Promise.all([
    cardRef.collection("participants").doc(ownerUid).set({
      uid: ownerUid,
      email: "owner@example.test",
      displayName: "יוצר",
      role: "owner",
      status: "active",
      joinedAt: now,
      invitedByUid: null,
      permissions: {
        canAddEntry: true,
        canApprove: true,
        canInvite: true,
      },
    }),
    cardRef.collection("participants").doc(participantUid).set({
      uid: participantUid,
      email: "participant@example.test",
      displayName: "משתתף",
      role: "participant",
      status: "active",
      joinedAt: now,
      invitedByUid: ownerUid,
      permissions: {
        canAddEntry: true,
        canApprove: true,
        canInvite: false,
      },
    }),
  ]);

  return {cardId, ownerUid, participantUid};
}

export async function readCard(cardId: string): Promise<FirebaseFirestore.DocumentData> {
  const snapshot = await db.collection("accountCards").doc(cardId).get();
  const data = snapshot.data();
  if (!data) {
    throw new Error(`כרטיס בדיקה לא נמצא: ${cardId}`);
  }
  return data;
}
