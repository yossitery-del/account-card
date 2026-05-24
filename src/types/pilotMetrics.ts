/** מדדי פיילוט מצרפיים בלבד — ללא PII, ללא מזהים */
export type PilotMetricsConversionRates = {
  cardsToTwoSidedCards: number | null;
  twoSidedCardsToApprovedActivity: number | null;
  invitationsToAccepted: number | null;
};

export type PilotMetricsAggregate = {
  usersWithProfiles: number | null;
  totalCards: number | null;
  twoSidedCards: number | null;
  cardsWithEntries: number | null;
  cardsWithApprovedEntries: number | null;
  invitationsCreated: number | null;
  invitationsAccepted: number | null;
  pendingEntries: number | null;
  approvedEntries: number | null;
  usersWhoCreatedCards: number | null;
  usersWithMoreThanOneCard: number | null;
  conversionRates: PilotMetricsConversionRates;
  generatedAt: string;
};

export type PilotMetricsConversionRatesDelta = {
  cardsToTwoSidedCards: number | null;
  twoSidedCardsToApprovedActivity: number | null;
  invitationsToAccepted: number | null;
};

export type PilotMetricsDelta = {
  usersWithProfiles: number | null;
  totalCards: number | null;
  twoSidedCards: number | null;
  cardsWithEntries: number | null;
  cardsWithApprovedEntries: number | null;
  invitationsCreated: number | null;
  invitationsAccepted: number | null;
  pendingEntries: number | null;
  approvedEntries: number | null;
  usersWhoCreatedCards: number | null;
  usersWithMoreThanOneCard: number | null;
  conversionRates: PilotMetricsConversionRatesDelta;
};

export type PilotMetricsSnapshot = {
  metrics: PilotMetricsAggregate;
  createdAt: string | null;
  generatedAt: string;
  schemaVersion: 1;
};
