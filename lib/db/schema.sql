-- Database Schema for 1v1 Tournament System

-- Enable pgcrypto extension for random token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Person table
CREATE TABLE IF NOT EXISTS person (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100),
    paternal_last_name VARCHAR(100) NOT NULL,
    maternal_last_name VARCHAR(100),
    status BOOLEAN DEFAULT true,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    access_code_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50),
    status BOOLEAN DEFAULT true,
    suspension_status VARCHAR(20) CHECK (suspension_status IN ('suspended') OR suspension_status IS NULL),
    persona_id INTEGER REFERENCES person(id) ON DELETE SET NULL,
    url_image TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role table
CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO role (name, description) VALUES
    ('admin', 'Tournament administrator with full access'),
    ('player', 'Tournament player')
ON CONFLICT (name) DO NOTHING;

-- Role_user table
CREATE TABLE IF NOT EXISTS role_user (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    status BOOLEAN DEFAULT true,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Game table
CREATE TABLE IF NOT EXISTS game (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT true,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default games
INSERT INTO game (name, type, description) VALUES
    ('League of Legends', 'MOBA', 'Multiplayer Online Battle Arena - 5v5 team-based strategy game'),
    ('Dota 2', 'MOBA', 'Multiplayer Online Battle Arena - competitive 5v5 matches'),
    ('Counter-Strike 2', 'FPS', 'First-Person Shooter - tactical team-based shooter'),
    ('Valorant', 'FPS', 'Tactical FPS - character-based competitive shooter'),
    ('Fortnite', 'Battle Royale', 'Battle Royale shooter with building mechanics'),
    ('Apex Legends', 'Battle Royale', 'Character-based Battle Royale shooter'),
    ('Rocket League', 'Sports', 'Vehicular soccer game'),
    ('FIFA', 'Sports', 'Football simulation game'),
    ('Street Fighter 6', 'Fighting', '1v1 fighting game'),
    ('Tekken 8', 'Fighting', '3D fighting game'),
    ('Starcraft II', 'RTS', 'Real-Time Strategy game'),
    ('Age of Empires IV', 'RTS', 'Historical Real-Time Strategy game'),
    ('PUBG', 'Battle Royale', 'Battle Royale shooter'),
    ('Overwatch 2', 'FPS', 'Team-based hero shooter'),
    ('Call of Duty', 'FPS', 'First-Person Shooter franchise')
ON CONFLICT (name) DO NOTHING;

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
    status BOOLEAN DEFAULT true,
    tournament_state VARCHAR(20) DEFAULT 'draft' CHECK (tournament_state IN ('draft', 'active', 'in_progress', 'completed', 'cancelled')),
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
    status BOOLEAN DEFAULT true,
    participation_state VARCHAR(20) DEFAULT 'registered' CHECK (participation_state IN ('registered', 'confirmed', 'withdrawn')),
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
    status BOOLEAN DEFAULT true,
    match_state VARCHAR(20) DEFAULT 'pending' CHECK (match_state IN ('pending', 'active', 'player1_connected', 'player2_connected', 'both_connected', 'in_selection', 'locked', 'completed', 'cancelled')),
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
    status BOOLEAN DEFAULT true,
    ban_status VARCHAR(20) CHECK (ban_status IN ('banned') OR ban_status IS NULL),
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, game_id)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code_hash);
CREATE INDEX IF NOT EXISTS idx_users_persona ON users(persona_id);
CREATE INDEX IF NOT EXISTS idx_role_user_user ON role_user(user_id);
CREATE INDEX IF NOT EXISTS idx_role_user_role ON role_user(role_id);
CREATE INDEX IF NOT EXISTS idx_tournament_game ON tournament(game_id);
CREATE INDEX IF NOT EXISTS idx_tournament_creator ON tournament(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournament_status ON tournament(status);
CREATE INDEX IF NOT EXISTS idx_tournament_state ON tournament(tournament_state);
CREATE INDEX IF NOT EXISTS idx_tournament_participations_tournament ON tournament_participations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participations_user ON tournament_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_match_tournament ON match(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_status ON match(status);
CREATE INDEX IF NOT EXISTS idx_match_state ON match(match_state);
CREATE INDEX IF NOT EXISTS idx_match_players ON match(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_champion_game ON champion(game_id);
CREATE INDEX IF NOT EXISTS idx_match_champions_match ON match_champions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_champions_player ON match_champions(player_id);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_modification_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modification_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_person_moddate ON person;
CREATE TRIGGER update_person_moddate BEFORE UPDATE ON person
    FOR EACH ROW EXECUTE FUNCTION update_modification_date();

DROP TRIGGER IF EXISTS update_users_moddate ON users;
CREATE TRIGGER update_users_moddate BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modification_date();

DROP TRIGGER IF EXISTS update_role_user_moddate ON role_user;
CREATE TRIGGER update_role_user_moddate BEFORE UPDATE ON role_user
    FOR EACH ROW EXECUTE FUNCTION update_modification_date();

DROP TRIGGER IF EXISTS update_tournament_moddate ON tournament;
CREATE TRIGGER update_tournament_moddate BEFORE UPDATE ON tournament
    FOR EACH ROW EXECUTE FUNCTION update_modification_date();

DROP TRIGGER IF EXISTS update_match_moddate ON match;
CREATE TRIGGER update_match_moddate BEFORE UPDATE ON match
    FOR EACH ROW EXECUTE FUNCTION update_modification_date();

-- Function to generate random access code
-- Generates a 12-character alphanumeric code (uppercase letters and numbers)
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new user with auto-generated access code
-- Returns the plain access code (store this securely, it won't be retrievable later)
CREATE OR REPLACE FUNCTION create_user_with_access_code(
    p_name VARCHAR(100),
    p_short_name VARCHAR(50) DEFAULT NULL,
    p_persona_id INTEGER DEFAULT NULL,
    p_url_image TEXT DEFAULT NULL
)
RETURNS TABLE(
    user_id INTEGER,
    access_code TEXT,
    user_name VARCHAR(100)
) AS $$
DECLARE
    v_access_code TEXT;
    v_access_code_hash VARCHAR(255);
    v_user_id INTEGER;
    v_unique BOOLEAN := FALSE;
BEGIN
    -- Generate unique access code (check for collisions)
    WHILE NOT v_unique LOOP
        v_access_code := generate_access_code();
        v_access_code_hash := crypt(v_access_code, gen_salt('bf'));

        -- Check if hash already exists (extremely unlikely but good practice)
        SELECT NOT EXISTS(SELECT 1 FROM users WHERE access_code_hash = v_access_code_hash) INTO v_unique;
    END LOOP;

    -- Insert user
    INSERT INTO users (name, short_name, access_code_hash, persona_id, url_image, status)
    VALUES (p_name, p_short_name, v_access_code_hash, p_persona_id, p_url_image, true)
    RETURNING id INTO v_user_id;

    -- Return user info with plain access code
    RETURN QUERY SELECT v_user_id, v_access_code, p_name;
END;
$$ LANGUAGE plpgsql;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_role_to_user(
    p_user_id INTEGER,
    p_role_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id INTEGER;
BEGIN
    -- Get role id
    SELECT id INTO v_role_id FROM role WHERE name = p_role_name;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', p_role_name;
    END IF;

    -- Insert role assignment (ignore if already exists)
    INSERT INTO role_user (user_id, role_id, status)
    VALUES (p_user_id, v_role_id, true)
    ON CONFLICT (user_id, role_id) DO UPDATE SET status = true;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
