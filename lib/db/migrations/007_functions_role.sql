-- ============================================================================
-- 007_functions_role.sql
-- Role Module Functions
-- ============================================================================

-- Function to assign role to user
CREATE OR REPLACE FUNCTION fn_role_assign_to_user(
    p_user_id INTEGER,
    p_role_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id INTEGER;
BEGIN
    -- Get role id
    SELECT r.id INTO v_role_id FROM role r WHERE r.name = p_role_name;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', p_role_name;
    END IF;

    -- Insert role assignment (ignore if already exists)
    INSERT INTO role_user (user_id, role_id, state)
    VALUES (p_user_id, v_role_id, 'active')
    ON CONFLICT (user_id, role_id) DO UPDATE SET state = 'active';

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
