-- ============================================================================
-- 003_indexes.sql
-- Index Definitions for Performance Optimization
-- ============================================================================

-- Person table indexes
CREATE INDEX IF NOT EXISTS idx_person_state ON person(state);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code_hash);
CREATE INDEX IF NOT EXISTS idx_users_persona ON users(persona_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);

-- Module table indexes
CREATE INDEX IF NOT EXISTS idx_module_role ON module(role_id);
CREATE INDEX IF NOT EXISTS idx_module_url_pattern ON module(url_pattern);
CREATE INDEX IF NOT EXISTS idx_module_state ON module(state);

-- Game table indexes
CREATE INDEX IF NOT EXISTS idx_game_state ON game(state);

-- Tournament table indexes
CREATE INDEX IF NOT EXISTS idx_tournament_game ON tournament(game_id);
CREATE INDEX IF NOT EXISTS idx_tournament_creator ON tournament(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournament_state ON tournament(state);

-- Tournament participations table indexes
CREATE INDEX IF NOT EXISTS idx_tournament_participations_tournament ON tournament_participations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participations_user ON tournament_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participations_state ON tournament_participations(state);

-- Match table indexes
CREATE INDEX IF NOT EXISTS idx_match_tournament ON match(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_state ON match(state);
CREATE INDEX IF NOT EXISTS idx_match_players ON match(player1_id, player2_id);

-- Champion table indexes
CREATE INDEX IF NOT EXISTS idx_champion_game ON champion(game_id);
CREATE INDEX IF NOT EXISTS idx_champion_state ON champion(state);

-- Tournament champion bans table indexes
CREATE INDEX IF NOT EXISTS idx_tournament_champion_bans_tournament ON tournament_champion_bans(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_champion_bans_champion ON tournament_champion_bans(champion_id);

-- Match champions table indexes
CREATE INDEX IF NOT EXISTS idx_match_champions_match ON match_champions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_champions_player ON match_champions(player_id);
