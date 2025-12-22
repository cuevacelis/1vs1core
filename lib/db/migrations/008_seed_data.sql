-- ============================================================================
-- 008_seed_data.sql
-- Initial Data (Seed Data)
-- ============================================================================

-- Insert default roles
INSERT INTO role (name, description) VALUES
    ('admin', 'Tournament administrator with full access'),
    ('player', 'Tournament player')
ON CONFLICT (name) DO NOTHING;

-- Insert default module access for admin role with navigation metadata
INSERT INTO module (role_id, url_pattern, title, icon, display_order, is_visible_in_nav, description)
SELECT r.id, '/dashboard', 'Dashboard', 'LayoutDashboard', 1, true, 'Admin dashboard access'
FROM role r WHERE r.name = 'admin'
ON CONFLICT (role_id, url_pattern) DO NOTHING;

INSERT INTO module (role_id, url_pattern, title, icon, display_order, is_visible_in_nav, description)
SELECT r.id, '/torneo/*', 'Torneos', 'Trophy', 2, true, 'Full access to tournaments and all sub-routes'
FROM role r WHERE r.name = 'admin'
ON CONFLICT (role_id, url_pattern) DO NOTHING;

INSERT INTO module (role_id, url_pattern, title, icon, display_order, is_visible_in_nav, description)
SELECT r.id, '/player/*', 'Partidas', 'Swords', 3, true, 'Full access to matches and all sub-routes'
FROM role r WHERE r.name = 'admin'
ON CONFLICT (role_id, url_pattern) DO NOTHING;

INSERT INTO module (role_id, url_pattern, title, icon, display_order, is_visible_in_nav, description)
SELECT r.id, '/perfil', 'Perfil', 'User', 4, true, 'Profile access'
FROM role r WHERE r.name = 'admin'
ON CONFLICT (role_id, url_pattern) DO NOTHING;

-- Insert default module access for player role with navigation metadata
INSERT INTO module (role_id, url_pattern, title, icon, display_order, is_visible_in_nav, description)
SELECT r.id, '/dashboard', 'Dashboard', 'LayoutDashboard', 1, true, 'Player dashboard access'
FROM role r WHERE r.name = 'player'
ON CONFLICT (role_id, url_pattern) DO NOTHING;

INSERT INTO module (role_id, url_pattern, title, icon, display_order, is_visible_in_nav, description)
SELECT r.id, '/perfil', 'Perfil', 'User', 2, true, 'Profile access'
FROM role r WHERE r.name = 'player'
ON CONFLICT (role_id, url_pattern) DO NOTHING;

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
