import type { ShareLinkV2AccessLevel } from '@/src/api/generated/mahjongApi.schemas';

export type SavedLink = {
  type: 'tournament' | 'table';
  key: string;
  name: string;
  accessLevel?: ShareLinkV2AccessLevel;
  tournamentKey?: string;
  savedAt: string;
  lastOpenedAt: string;
  parentGroupName?: string;
  parentTournamentName?: string;
};
