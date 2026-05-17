import type { AccountCardSummary } from "@/types/card";
import { CardListItem } from "./CardListItem";

type CardListProps = {
  cards: AccountCardSummary[];
  viewerUid: string;
};

export function CardList({ cards, viewerUid }: CardListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {cards.map((card) => (
        <li key={card.id}>
          <CardListItem card={card} viewerUid={viewerUid} />
        </li>
      ))}
    </ul>
  );
}
