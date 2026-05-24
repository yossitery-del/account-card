"use client";

import {
  connectFunctionsEmulator,
  Functions,
  getFunctions,
  httpsCallable,
  HttpsCallableResult,
} from "firebase/functions";
import { logJoinPreviewDev } from "@/lib/invitations/joinPreviewDevLog";
import { getFirebaseApp } from "./client";

/** חייב להתאים ל-functions/src/lib/admin.ts */
export const FIREBASE_FUNCTIONS_REGION = "us-central1";

const FUNCTIONS_EMULATOR_HOST = "127.0.0.1";
const FUNCTIONS_EMULATOR_PORT = 5001;

let functionsInstance: Functions | undefined;
let emulatorConnected = false;

function shouldUseFunctionsEmulator(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === "true"
  );
}

export function getFirebaseFunctions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(getFirebaseApp(), FIREBASE_FUNCTIONS_REGION);

    if (shouldUseFunctionsEmulator() && !emulatorConnected) {
      connectFunctionsEmulator(
        functionsInstance,
        FUNCTIONS_EMULATOR_HOST,
        FUNCTIONS_EMULATOR_PORT
      );
      emulatorConnected = true;
    }
  }

  return functionsInstance;
}

export type HealthCallableResult = {
  ok: true;
  stage: "2B-0";
  timestamp: string;
  region: string;
  authenticated: boolean;
};

/** קריאה ל-Callable `health` — לבדיקות dev ול-2B-0. */
export async function callHealthFunction(): Promise<HealthCallableResult> {
  const callable = httpsCallable<Record<string, never>, HealthCallableResult>(
    getFirebaseFunctions(),
    "health"
  );
  const result: HttpsCallableResult<HealthCallableResult> = await callable({});
  return result.data;
}

export type CreateAccountCardInput = {
  title: string;
  displayName?: string;
};

export type CreateAccountCardResult = {
  cardId: string;
};

/** קריאה ל-Callable `createAccountCard` — Stage 2B-1. */
export async function callCreateAccountCardFunction(
  title: string,
  displayName?: string
): Promise<string> {
  const callable = httpsCallable<
    CreateAccountCardInput,
    CreateAccountCardResult
  >(getFirebaseFunctions(), "createAccountCard");
  const trimmedName = displayName?.trim();
  const result = await callable({
    title: title.trim(),
    ...(trimmedName ? { displayName: trimmedName } : {}),
  });
  return result.data.cardId;
}

export type CreateInvitationInput = {
  cardId: string;
  invitedName?: string;
  intendedRecipientLabel?: string;
};

export type CreateInvitationCallableResult = {
  inviteLink: string;
  expiresAt: string;
};

/** קריאה ל-Callable `createInvitation` — Stage 2B-2. */
export async function callCreateInvitationFunction(
  input: CreateInvitationInput
): Promise<CreateInvitationCallableResult> {
  const callable = httpsCallable<
    CreateInvitationInput,
    CreateInvitationCallableResult
  >(getFirebaseFunctions(), "createInvitation");
  const result = await callable(input);
  return result.data;
}

export type GetInvitationPreviewInput = {
  token: string;
};

export type GetInvitationPreviewCallableResult = {
  status: "valid" | "expired" | "accepted" | "revoked" | "invalid";
  inviterDisplayName?: string;
  expiresAt?: string;
};

export type AcceptInvitationInput = {
  token: string;
  displayName?: string;
};

export type AcceptInvitationCallableResult = {
  cardId: string;
  alreadyParticipant?: boolean;
};

export type CreateEntryInput = {
  cardId: string;
  intent: "to_receive" | "to_pay";
  amount: number;
  title: string;
};

export type ViewerPendingAwaitingMyApprovalCallable = {
  pendingAwaitingMyApprovalCount: number;
  pendingAwaitingMyApproval?: {
    entryId: string;
    title: string;
    amount: number;
    effectOnPerspectiveBalance: "increase" | "decrease";
    entryDate: string;
    createdAt: string;
    createdByUid: string;
    status: "pending";
  } | null;
};

export type CreateEntryCallableResult = {
  cardId: string;
  entryId: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: string;
};

/** תשובת mutation עם יתרות מהשרת — P1A/P1B */
export type EntryMutationCallableResult = CreateEntryCallableResult & {
  pendingAwaitingMyApproval?: ViewerPendingAwaitingMyApprovalCallable;
};

/** תשובת approve/reject לדשבורד — כולל סיכום ממתין לצופה בלבד */
export type DashboardQuickActionCallableResult = EntryMutationCallableResult & {
  pendingAwaitingMyApproval: ViewerPendingAwaitingMyApprovalCallable;
};

/** קריאה ל-Callable `createEntry` — Stage 2C-1 (auth חובה). */
export async function callCreateEntryFunction(
  input: CreateEntryInput
): Promise<CreateEntryCallableResult> {
  const callable = httpsCallable<CreateEntryInput, CreateEntryCallableResult>(
    getFirebaseFunctions(),
    "createEntry"
  );
  const result = await callable(input);
  return result.data;
}

export type EntryActionInput = {
  cardId: string;
  entryId: string;
};

export type RejectEntryInput = EntryActionInput & {
  rejectionNote?: string;
};

/** קריאה ל-Callable `approveEntry` — Stage 2C-2 (auth חובה). */
export async function callApproveEntryFunction(
  input: EntryActionInput
): Promise<DashboardQuickActionCallableResult> {
  const callable = httpsCallable<
    EntryActionInput,
    DashboardQuickActionCallableResult
  >(getFirebaseFunctions(), "approveEntry");
  const result = await callable(input);
  return result.data;
}

/** קריאה ל-Callable `rejectEntry` — Stage 2C-2 (auth חובה). */
export async function callRejectEntryFunction(
  input: RejectEntryInput
): Promise<DashboardQuickActionCallableResult> {
  const callable = httpsCallable<
    RejectEntryInput,
    DashboardQuickActionCallableResult
  >(getFirebaseFunctions(), "rejectEntry");
  const result = await callable(input);
  return result.data;
}

/** קריאה ל-Callable `cancelEntry` — Stage 2C-3 (auth חובה). */
export async function callCancelEntryFunction(
  input: EntryActionInput
): Promise<EntryMutationCallableResult> {
  const callable = httpsCallable<
    EntryActionInput,
    EntryMutationCallableResult
  >(getFirebaseFunctions(), "cancelEntry");
  const result = await callable(input);
  return result.data;
}

export type EditEntryInput = {
  cardId: string;
  entryId: string;
  intent: "to_receive" | "to_pay";
  amount: number;
  title: string;
};

/** קריאה ל-Callable `editEntry` — Stage 2C-4 (auth חובה). */
export async function callEditEntryFunction(
  input: EditEntryInput
): Promise<EntryMutationCallableResult> {
  const callable = httpsCallable<EditEntryInput, EntryMutationCallableResult>(
    getFirebaseFunctions(),
    "editEntry"
  );
  const result = await callable(input);
  return result.data;
}

/** קריאה ל-Callable `acceptInvitation` — Stage 2B-4 (auth חובה). */
export async function callAcceptInvitationFunction(
  token: string,
  displayName?: string
): Promise<AcceptInvitationCallableResult> {
  const callable = httpsCallable<
    AcceptInvitationInput,
    AcceptInvitationCallableResult
  >(getFirebaseFunctions(), "acceptInvitation");
  const trimmedName = displayName?.trim();
  const result = await callable({
    token: token.trim(),
    ...(trimmedName ? { displayName: trimmedName } : {}),
  });
  return result.data;
}

/** קריאה ל-Callable `getInvitationPreview` — Stage 2B-3 (ללא auth). */
export async function callGetInvitationPreviewFunction(
  token: string
): Promise<GetInvitationPreviewCallableResult> {
  logJoinPreviewDev("request", token);

  const callable = httpsCallable<
    GetInvitationPreviewInput,
    GetInvitationPreviewCallableResult
  >(getFirebaseFunctions(), "getInvitationPreview");

  try {
    const result = await callable({ token: token.trim() });
    logJoinPreviewDev("success", token, { status: result.data.status });
    return result.data;
  } catch (err) {
    logJoinPreviewDev("error", token, { error: err });
    throw err;
  }
}
