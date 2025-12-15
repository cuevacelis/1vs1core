-- ============================================================================
-- 005_functions_auth.sql
-- Authentication Module Functions
-- ============================================================================

-- Function to generate random access code
-- Generates a 12-character alphanumeric code (uppercase letters and numbers)
CREATE OR REPLACE FUNCTION fn_auth_generate_access_code()
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

-- Drop function if exists (needed when changing return type)
DROP FUNCTION IF EXISTS fn_auth_verify_access_code(TEXT);

-- Function to verify access code and return user with roles
CREATE OR REPLACE FUNCTION fn_auth_verify_access_code(
    p_access_code TEXT
)
RETURNS TABLE(
    out_user_id INTEGER,
    out_user_data JSONB,
    out_roles JSONB
) AS $$
DECLARE
    v_user users%ROWTYPE;
BEGIN
    -- Find user with matching access code hash using bcrypt
    -- crypt() with existing hash verifies the password
    SELECT u.* INTO v_user
    FROM users u
    WHERE u.state = 'active'
      AND u.access_code_hash = crypt(p_access_code, u.access_code_hash);

    -- If no match found, return empty
    IF v_user.id IS NULL THEN
        RETURN;
    END IF;

    -- Return user with roles
    RETURN QUERY
    SELECT
        v_user.id,
        to_jsonb(v_user) as user_data,
        COALESCE(
            (
                SELECT jsonb_agg(to_jsonb(r))
                FROM role r
                INNER JOIN role_user ru ON r.id = ru.role_id
                WHERE ru.user_id = v_user.id AND ru.state = 'active'
            ),
            '[]'::jsonb
        ) as roles;
END;
$$ LANGUAGE plpgsql;
