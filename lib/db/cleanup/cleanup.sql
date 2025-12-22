-- ============================================================================
-- cleanup.sql
-- Script para eliminar completamente el esquema de la base de datos
-- ADVERTENCIA: Este script elimina TODAS las tablas, funciones y tipos
-- ============================================================================

-- ============================================================================
-- Drop all functions
-- ============================================================================

-- Navigation functions
DROP FUNCTION IF EXISTS fn_navigation_get_items_for_user(INTEGER);

-- User functions
DROP FUNCTION IF EXISTS fn_user_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_profile(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_match_statistics(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_recent_matches(INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_active_match(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_tournaments(INTEGER, BOOLEAN, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_user_list_with_roles(BOOLEAN, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_accessible_modules(INTEGER);
DROP FUNCTION IF EXISTS fn_user_create_with_access_code(VARCHAR, VARCHAR, INTEGER);

-- Role functions
DROP FUNCTION IF EXISTS fn_role_assign_to_user(INTEGER, VARCHAR);

-- Auth functions
DROP FUNCTION IF EXISTS fn_auth_verify_access_code(TEXT);
DROP FUNCTION IF EXISTS fn_auth_generate_access_code();

-- Tournament functions
DROP FUNCTION IF EXISTS fn_tournament_create(VARCHAR, TEXT, INTEGER, TIMESTAMP, TIMESTAMP, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS fn_tournament_update(INTEGER, VARCHAR, TEXT, TIMESTAMP, TIMESTAMP, INTEGER, TEXT, tournament_state);
DROP FUNCTION IF EXISTS fn_tournament_get_all(tournament_state, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_delete(INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_join(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_get_participants(INTEGER);

-- Match functions
DROP FUNCTION IF EXISTS fn_match_create(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TIMESTAMP);
DROP FUNCTION IF EXISTS fn_match_update_status(INTEGER, match_state, INTEGER);
DROP FUNCTION IF EXISTS fn_match_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_match_get_by_tournament(INTEGER);
DROP FUNCTION IF EXISTS fn_match_set_winner(INTEGER, INTEGER);

-- Champion functions
DROP FUNCTION IF EXISTS fn_champion_create(VARCHAR, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_champion_get_by_game(INTEGER);
DROP FUNCTION IF EXISTS fn_champion_get_available_for_match(INTEGER);
DROP FUNCTION IF EXISTS fn_champion_select_for_match(INTEGER, INTEGER, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS fn_champion_lock_selection(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_champion_get_match_selections(INTEGER);
DROP FUNCTION IF EXISTS fn_champion_ban_for_tournament(INTEGER, INTEGER, INTEGER, TEXT);

-- Game functions
DROP FUNCTION IF EXISTS fn_game_get_all();
DROP FUNCTION IF EXISTS fn_game_get_by_id(INTEGER);

-- Shared/utility functions
DROP FUNCTION IF EXISTS fn_shared_update_modification_date() CASCADE;

-- ============================================================================
-- Drop all tables (in correct order to respect foreign key dependencies)
-- ============================================================================

DROP TABLE IF EXISTS match_champions CASCADE;
DROP TABLE IF EXISTS tournament_champion_bans CASCADE;
DROP TABLE IF EXISTS champion CASCADE;
DROP TABLE IF EXISTS match CASCADE;
DROP TABLE IF EXISTS tournament_participations CASCADE;
DROP TABLE IF EXISTS tournament CASCADE;
DROP TABLE IF EXISTS module CASCADE;
DROP TABLE IF EXISTS role_user CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS person CASCADE;
DROP TABLE IF EXISTS game CASCADE;

-- ============================================================================
-- Drop all custom types (ENUMS)
-- ============================================================================

DROP TYPE IF EXISTS match_state CASCADE;
DROP TYPE IF EXISTS participation_state CASCADE;
DROP TYPE IF EXISTS tournament_state CASCADE;
DROP TYPE IF EXISTS user_state CASCADE;
DROP TYPE IF EXISTS entity_state CASCADE;

-- ============================================================================
-- Confirmation message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Database cleanup completed successfully.';
    RAISE NOTICE 'All tables, functions, and types have been dropped.';
END $$;
