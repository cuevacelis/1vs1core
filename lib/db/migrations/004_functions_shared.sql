-- ============================================================================
-- 004_functions_shared.sql
-- Shared/Utility Functions and Triggers
-- ============================================================================

-- Create update timestamp trigger function
-- This function automatically updates modification_date when a row is updated
CREATE OR REPLACE FUNCTION fn_shared_update_modification_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modification_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_person_moddate ON person;
CREATE TRIGGER update_person_moddate BEFORE UPDATE ON person
    FOR EACH ROW EXECUTE FUNCTION fn_shared_update_modification_date();

DROP TRIGGER IF EXISTS update_users_moddate ON users;
CREATE TRIGGER update_users_moddate BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_shared_update_modification_date();

DROP TRIGGER IF EXISTS update_role_user_moddate ON role_user;
CREATE TRIGGER update_role_user_moddate BEFORE UPDATE ON role_user
    FOR EACH ROW EXECUTE FUNCTION fn_shared_update_modification_date();

DROP TRIGGER IF EXISTS update_tournament_moddate ON tournament;
CREATE TRIGGER update_tournament_moddate BEFORE UPDATE ON tournament
    FOR EACH ROW EXECUTE FUNCTION fn_shared_update_modification_date();

DROP TRIGGER IF EXISTS update_match_moddate ON match;
CREATE TRIGGER update_match_moddate BEFORE UPDATE ON match
    FOR EACH ROW EXECUTE FUNCTION fn_shared_update_modification_date();
