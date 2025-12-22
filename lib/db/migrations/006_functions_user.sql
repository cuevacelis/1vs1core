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
-- Function to get user information with role by user ID
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_user_get_by_id(
    p_user_id INTEGER
)
RETURNS TABLE(
    out_user_id INTEGER,
    out_user_data JSONB,
    out_role JSONB
) AS $$
DECLARE
    v_user users%ROWTYPE;
    v_role role%ROWTYPE;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_by_id
      PROPÓSITO: Función para obtener información completa de un usuario con su rol
      INVOCACIÓN: SELECT * FROM fn_user_get_by_id(1);
      PARÁMETROS:
        - p_user_id: ID del usuario a consultar
      RETORNA: TABLE con:
        - out_user_id: ID del usuario
        - out_user_data: Datos completos del usuario en formato JSONB
        - out_role: Datos del rol en formato JSONB
      VALIDACIONES:
        - Retorna NULL si el usuario no existe
        - Solo retorna usuarios activos
      NOTAS:
        - No incluye el access_code_hash por seguridad
        - Incluye toda la información del usuario y su rol
    ******************************************************************************/

    -- Get user information
    SELECT u.* INTO v_user
    FROM users u
    WHERE u.id = p_user_id
      AND u.state = 'active';

    -- If user doesn't exist or is not active, return NULL
    IF v_user.id IS NULL THEN
        RETURN;
    END IF;

    -- Get role information
    SELECT r.* INTO v_role
    FROM role r
    WHERE r.id = v_user.role_id;

    -- Return user and role data
    RETURN QUERY SELECT
        v_user.id,
        jsonb_build_object(
            'id', v_user.id,
            'name', v_user.name,
            'short_name', v_user.short_name,
            'state', v_user.state,
            'url_image', v_user.url_image,
            'creation_date', v_user.creation_date,
            'modification_date', v_user.modification_date,
            'persona_id', v_user.persona_id,
            'role_id', v_user.role_id
        ),
        jsonb_build_object(
            'id', v_role.id,
            'name', v_role.name,
            'description', v_role.description
        );
END;
$$ LANGUAGE plpgsql;
