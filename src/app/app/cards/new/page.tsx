"use client";

import { AppShellHeader } from "@/components/cards/AppShellHeader";
import { CreateCardForm } from "@/components/cards/CreateCardForm";

export default function NewCardPage() {
  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-lg">
        <AppShellHeader
          title="כרטיס חדש"
          backHref="/app"
          backLabel="חזרה לכרטיסים"
        />
        <CreateCardForm />
      </div>
    </main>
  );
}
