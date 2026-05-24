import { NextResponse } from "next/server";
import { collectPilotMetrics } from "@/lib/admin/pilotMetrics";
import { verifyPilotAdmin } from "@/lib/admin/verifyPilotAdmin";
import type { PilotMetricsAggregate } from "@/types/pilotMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyPilotAdmin(request.headers.get("authorization"));

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status }
    );
  }

  try {
    const metrics: PilotMetricsAggregate = await collectPilotMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
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

    console.error("pilot-metrics collection failed", errorInfo);
    return NextResponse.json(
      { error: "לא הצלחנו לטעון מדדים. נסה שוב." },
      { status: 500 }
    );
  }
}
