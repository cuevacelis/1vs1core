-- ============================================================================
-- 006_functions_user.sql
-- User Module Functions
-- ============================================================================

-- Drop function if exists (needed when changing return type)
DROP FUNCTION IF EXISTS fn_user_create_with_access_code(VARCHAR, VARCHAR, INTEGER, TEXT, VARCHAR);

-- Function to create a new user with auto-generated access code
-- Returns the plain access code (store this securely, it won't be retrievable later)
-- Optionally assigns a role to the user (defaults to 'player' if not specified)
CREATE OR REPLACE FUNCTION fn_user_create_with_access_code(
    p_name VARCHAR(100),
    p_short_name VARCHAR(50) DEFAULT NULL,
    p_persona_id INTEGER DEFAULT NULL,
    p_url_image TEXT DEFAULT NULL,
    p_role_name VARCHAR(50) DEFAULT 'player'
)
RETURNS TABLE(
    out_user_id INTEGER,
    out_access_code TEXT,
    out_user_name VARCHAR(100),
    out_assigned_role VARCHAR(50)
) AS $$
DECLARE
    v_access_code TEXT;
    v_access_code_hash VARCHAR(255);
    v_user_id INTEGER;
    v_unique BOOLEAN := FALSE;
    v_role_id INTEGER;
BEGIN
    -- Generate unique access code (check for collisions)
    WHILE NOT v_unique LOOP
        v_access_code := fn_auth_generate_access_code();
        v_access_code_hash := crypt(v_access_code, gen_salt('bf'));

        -- Check if hash already exists (extremely unlikely but good practice)
        SELECT NOT EXISTS(SELECT 1 FROM users u WHERE u.access_code_hash = v_access_code_hash) INTO v_unique;
    END LOOP;

    -- Insert user
    INSERT INTO users (name, short_name, access_code_hash, persona_id, url_image, state)
    VALUES (p_name, p_short_name, v_access_code_hash, p_persona_id, p_url_image, 'active')
    RETURNING id INTO v_user_id;

    -- Get role id
    SELECT r.id INTO v_role_id FROM role r WHERE r.name = p_role_name;

    -- If role doesn't exist, raise exception
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', p_role_name;
    END IF;

    -- Assign role to user
    INSERT INTO role_user (user_id, role_id, state)
    VALUES (v_user_id, v_role_id, 'active')
    ON CONFLICT (user_id, role_id) DO UPDATE SET state = 'active';

    -- Return user info with plain access code and assigned role
    RETURN QUERY SELECT v_user_id, v_access_code, p_name, p_role_name;
END;
$$ LANGUAGE plpgsql;
