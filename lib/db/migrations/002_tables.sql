-- ============================================================================
-- 002_tables.sql
-- Table Definitions for 1v1 Tournament System
-- ============================================================================

-- Person table
CREATE TABLE IF NOT EXISTS person (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100),
    paternal_last_name VARCHAR(100) NOT NULL,
    maternal_last_name VARCHAR(100),
    state entity_state DEFAULT 'active',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role table (must be created before users table due to FK constraint)
CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    access_code_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50),
    state user_state DEFAULT 'active',
    persona_id INTEGER REFERENCES person(id) ON DELETE SET NULL,
    role_id INTEGER NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
    url_image TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Module table for role-based access control
-- Controls which routes/modules each role can access
-- The url_pattern supports wildcards: /torneos/* means /torneos and all child routes
CREATE TABLE IF NOT EXISTS module (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    url_pattern VARCHAR(200) NOT NULL,
    title VARCHAR(100),
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_visible_in_nav BOOLEAN DEFAULT true,
    description TEXT,
    state entity_state DEFAULT 'active',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, url_pattern)
);

-- Game table
CREATE TABLE IF NOT EXISTS game (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    state entity_state DEFAULT 'active',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament table
CREATE TABLE IF NOT EXISTS tournament (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    game_id INTEGER NOT NULL REFERENCES game(id) ON DELETE RESTRICT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    max_participants INTEGER,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    state tournament_state DEFAULT 'draft',
    url_image TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament participations table
CREATE TABLE IF NOT EXISTS tournament_participations (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state participation_state DEFAULT 'registered',
    UNIQUE(tournament_id, user_id)
);

-- Match table
CREATE TABLE IF NOT EXISTS match (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    player1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    player2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    match_date TIMESTAMP,
    state match_state DEFAULT 'pending',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (player1_id != player2_id)
);

-- Champion table
CREATE TABLE IF NOT EXISTS champion (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    game_id INTEGER NOT NULL REFERENCES game(id) ON DELETE CASCADE,
    description TEXT,
    url_image TEXT,
    state entity_state DEFAULT 'active',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, game_id)
);

-- Tournament champion bans table
-- Allows tournaments to ban specific champions
CREATE TABLE IF NOT EXISTS tournament_champion_bans (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
    champion_id INTEGER NOT NULL REFERENCES champion(id) ON DELETE CASCADE,
    banned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ban_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    UNIQUE(tournament_id, champion_id)
);

-- Match champions table (selections)
CREATE TABLE IF NOT EXISTS match_champions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES match(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    champion_id INTEGER NOT NULL REFERENCES champion(id) ON DELETE RESTRICT,
    role VARCHAR(50),
    is_locked BOOLEAN DEFAULT false,
    selection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lock_date TIMESTAMP,
    UNIQUE(match_id, player_id)
);
