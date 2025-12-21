-- ============================================================================
-- 014_add_navigation_metadata.sql
-- Add navigation metadata to module table (title, icon, order)
-- ============================================================================

-- Add navigation metadata columns to module table
ALTER TABLE module ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE module ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE module ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE module ADD COLUMN IF NOT EXISTS is_visible_in_nav BOOLEAN DEFAULT true;

-- Update existing module records with navigation metadata
-- Admin modules
UPDATE module SET
    title = 'Dashboard',
    icon = 'LayoutDashboard',
    display_order = 1,
    is_visible_in_nav = true
WHERE url_pattern = '/dashboard' AND role_id IN (SELECT id FROM role WHERE name = 'admin');

UPDATE module SET
    title = 'Torneos',
    icon = 'Trophy',
    display_order = 2,
    is_visible_in_nav = true
WHERE url_pattern = '/torneo/*' AND role_id IN (SELECT id FROM role WHERE name = 'admin');

UPDATE module SET
    title = 'Partidas',
    icon = 'Swords',
    display_order = 3,
    is_visible_in_nav = true
WHERE url_pattern = '/player/*' AND role_id IN (SELECT id FROM role WHERE name = 'admin');

UPDATE module SET
    title = 'Perfil',
    icon = 'User',
    display_order = 4,
    is_visible_in_nav = true
WHERE url_pattern = '/perfil' AND role_id IN (SELECT id FROM role WHERE name = 'admin');

-- Player modules
UPDATE module SET
    title = 'Dashboard',
    icon = 'LayoutDashboard',
    display_order = 1,
    is_visible_in_nav = true
WHERE url_pattern = '/dashboard' AND role_id IN (SELECT id FROM role WHERE name = 'player');

UPDATE module SET
    title = 'Perfil',
    icon = 'User',
    display_order = 2,
    is_visible_in_nav = true
WHERE url_pattern = '/perfil' AND role_id IN (SELECT id FROM role WHERE name = 'player');
