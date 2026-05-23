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
    console.error("pilot-metrics collection failed");
    return NextResponse.json(
      { error: "לא הצלחנו לטעון מדדים. נסה שוב." },
      { status: 500 }
    );
  }
}
