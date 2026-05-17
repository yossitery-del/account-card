import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { loadingLabels } from "@/lib/ui/loadingLabels";

type LoadingVaultProps = {
  label?: string;
  /** בתוך עמוד עם header — לא ממלא מסך שלם */
  inline?: boolean;
};

export function LoadingVault({
  label = loadingLabels.default,
  inline = false,
}: LoadingVaultProps) {
  if (inline) {
    return (
      <div className="flex justify-center py-16">
        <PremiumLoader label={label} />
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <PremiumLoader label={label} />
    </main>
  );
}
