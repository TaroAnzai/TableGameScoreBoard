export type SavedLink = {
  type: 'tournament' | 'table';
  key: string;
  name: string;
  tournamentKey?: string;
  savedAt: string;
  lastOpenedAt: string;
  parentGroupName?: string;
  parentTournamentName?: string;
};
