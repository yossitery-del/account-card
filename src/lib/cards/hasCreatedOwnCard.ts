import type { AccountCardSummary } from "@/types/card";

/** האם למשתמש יש לפחות כרטיס אחד שהוא יצר (createdByUid). */
export function userHasCreatedOwnCard(
  cards: AccountCardSummary[],
  viewerUid: string
): boolean {
  if (!viewerUid) {
    return false;
  }
  return cards.some((card) => {
    const creatorUid = card.createdByUid;
    return (
      typeof creatorUid === "string" &&
      creatorUid.length > 0 &&
      creatorUid === viewerUid
    );
  });
}
