import { NextResponse } from "next/server";
import {
  getLatestPilotMetricsSnapshot,
  savePilotMetricsSnapshot,
} from "@/lib/admin/pilotMetrics";
import { verifyPilotAdmin } from "@/lib/admin/verifyPilotAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logSnapshotError(action: "load" | "save", err: unknown) {
  const errorInfo =
    err instanceof Error
      ? {
          name: err.name,
          message: err.message,
          code:
            typeof (err as { code?: unknown }).code === "string"
              ? (err as { code?: string }).code
              : undefined,
        }
      : { name: "UnknownError" };

  console.error(`pilot-metrics snapshot ${action} failed`, errorInfo);
}

export async function GET(request: Request) {
  const auth = await verifyPilotAdmin(request.headers.get("authorization"));

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status }
    );
  }

  try {
    const snapshot = await getLatestPilotMetricsSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    logSnapshotError("load", err);
    return NextResponse.json(
      { error: "לא הצלחנו לטעון תמונת מצב. נסה שוב." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyPilotAdmin(request.headers.get("authorization"));

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status }
    );
  }

  try {
    const snapshot = await savePilotMetricsSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    logSnapshotError("save", err);
    return NextResponse.json(
      { error: "לא הצלחנו לשמור תמונת מצב. נסה שוב." },
      { status: 500 }
    );
  }
}
