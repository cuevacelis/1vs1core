// Database types

export interface Person {
  id: number;
  first_name: string;
  second_name?: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  status: boolean;
  creation_date: Date;
  modification_date: Date;
}

// Helper function to get full name (use this in application code instead of stored column)
export function getPersonFullName(
  person: Pick<
    Person,
    "first_name" | "second_name" | "paternal_last_name" | "maternal_last_name"
  >,
): string {
  return [
    person.first_name,
    person.second_name,
    person.paternal_last_name,
    person.maternal_last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export interface User {
  id: number;
  access_code_hash: string;
  name: string;
  short_name?: string;
  status: boolean;
  suspension_status?: "suspended" | null;
  persona_id?: number;
  url_image?: string;
  creation_date: Date;
  modification_date: Date;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  creation_date: Date;
}

export interface RoleUser {
  id: number;
  user_id: number;
  role_id: number;
  status: boolean;
  creation_date: Date;
  modification_date: Date;
}

export interface Game {
  id: number;
  name: string;
  type: string;
  description?: string;
  status: boolean;
  creation_date: Date;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  game_id: number;
  start_date?: Date;
  end_date?: Date;
  max_participants?: number;
  creator_id: number;
  status: boolean;
  tournament_state:
    | "draft"
    | "active"
    | "in_progress"
    | "completed"
    | "cancelled";
  url_image?: string;
  creation_date: Date;
  modification_date: Date;
}

export interface TournamentParticipation {
  id: number;
  tournament_id: number;
  user_id: number;
  registration_date: Date;
  status: boolean;
  participation_state: "registered" | "confirmed" | "withdrawn";
}

export interface Match {
  id: number;
  tournament_id: number;
  round: number;
  player1_id: number;
  player2_id: number;
  winner_id?: number;
  match_date?: Date;
  status: boolean;
  match_state:
    | "pending"
    | "active"
    | "player1_connected"
    | "player2_connected"
    | "both_connected"
    | "in_selection"
    | "locked"
    | "completed"
    | "cancelled";
  creation_date: Date;
  modification_date: Date;
}

export interface Champion {
  id: number;
  name: string;
  game_id: number;
  description?: string;
  url_image?: string;
  status: boolean;
  ban_status?: "banned" | null;
  creation_date: Date;
}

export interface MatchChampion {
  id: number;
  match_id: number;
  player_id: number;
  champion_id: number;
  role?: string;
  is_locked: boolean;
  selection_date: Date;
  lock_date?: Date;
}

// Extended types with joins
export interface UserWithPerson extends User {
  person?: Person;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface TournamentWithGame extends Tournament {
  game: Game;
}

export interface MatchWithPlayers extends Match {
  player1: User;
  player2: User;
  winner?: User;
}

export interface MatchChampionWithDetails extends MatchChampion {
  champion: Champion;
  player: User;
}
