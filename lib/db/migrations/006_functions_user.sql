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
    /******************************************************************************
      NOMBRE:  fn_user_create_with_access_code
      PROPÓSITO: Función para crear un nuevo usuario con código de acceso auto-generado y asignarle un rol
      INVOCACIÓN: SELECT * FROM fn_user_create_with_access_code('Juan Pérez', 'juanp', NULL, NULL, 'player');
      PARÁMETROS:
        - p_name: Nombre completo del usuario (requerido)
        - p_short_name: Nombre corto/alias del usuario (opcional)
        - p_persona_id: ID de la persona asociada (opcional)
        - p_url_image: URL de imagen de perfil (opcional)
        - p_role_name: Nombre del rol a asignar (default: 'player')
      RETORNA: TABLE con:
        - out_user_id: ID del usuario creado
        - out_access_code: Código de acceso en texto plano (CRÍTICO: guardar de forma segura)
        - out_user_name: Nombre del usuario
        - out_assigned_role: Nombre del rol asignado
      VALIDACIONES:
        - Verifica unicidad del código de acceso generado
        - Valida que el rol especificado exista (lanza excepción si no existe)
        - Genera código de acceso único usando bcrypt
      SEGURIDAD:
        - El código de acceso se hashea con bcrypt antes de almacenarse
        - El código en texto plano SOLO se retorna en esta función
        - Imposible recuperar el código después de esta operación
    ******************************************************************************/
    -- Generate unique access code (check for collisions)
    WHILE NOT v_unique LOOP
        v_access_code := fn_auth_generate_access_code();
        v_access_code_hash := crypt(v_access_code, gen_salt('bf'));

        -- Check if hash already exists (extremely unlikely but good practice)
        SELECT NOT EXISTS(SELECT 1 FROM users u WHERE u.access_code_hash = v_access_code_hash) INTO v_unique;
    END LOOP;

    -- Get role id
    SELECT r.id INTO v_role_id FROM role r WHERE r.name = p_role_name;

    -- If role doesn't exist, raise exception
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'El rol % no existe', p_role_name;
    END IF;

    -- Insert user with role
    INSERT INTO users (name, short_name, access_code_hash, persona_id, role_id, url_image, state)
    VALUES (p_name, p_short_name, v_access_code_hash, p_persona_id, v_role_id, p_url_image, 'active')
    RETURNING id INTO v_user_id;

    -- Return user info with plain access code and assigned role
    RETURN QUERY SELECT v_user_id, v_access_code, p_name, p_role_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTA: fn_user_get_by_id se define en 011_functions_user_stats.sql
-- ============================================================================
