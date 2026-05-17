"use client";

import { useParams } from "next/navigation";
import { AppShellHeader } from "@/components/cards/AppShellHeader";
import { InviteForm } from "@/components/cards/InviteForm";

export default function InvitePage() {
  const params = useParams();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-lg">
        <AppShellHeader
          title="שיתוף הכרטיס"
          backHref={cardId ? `/app/cards/${cardId}` : "/app"}
          backLabel="חזרה לכרטיס"
        />
        {cardId ? <InviteForm cardId={cardId} /> : null}
      </div>
    </main>
  );
}
