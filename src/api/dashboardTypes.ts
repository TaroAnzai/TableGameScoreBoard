import type {
  Game,
  Group,
  Player,
  Table,
  Tournament,
  TournamentScoreMap,
} from '@/src/api/generated/mahjongApi.schemas';

export type GroupDashboard = {
  group: Group;
  tournaments: Tournament[];
  players: Player[];
};

export type TournamentDashboard = {
  tournament: Tournament;
  participants: Player[];
  available_group_players: Player[];
  tables: Table[];
  score_map: TournamentScoreMap;
};

export type TableDashboard = {
  table: Table;
  table_players: Player[];
  available_tournament_players: Player[];
  games: Game[];
};
