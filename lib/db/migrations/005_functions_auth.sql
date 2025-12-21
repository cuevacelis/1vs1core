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
    /******************************************************************************
      NOMBRE:  fn_auth_generate_access_code
      PROPÓSITO: Función para generar un código de acceso aleatorio de 12 caracteres alfanuméricos (mayúsculas y números)
      INVOCACIÓN: SELECT fn_auth_generate_access_code();
      RETORNA: TEXT - Código de acceso aleatorio (ej: 'A3K9M2P7Q1R5')
      NOTAS:
        - Utiliza solo letras mayúsculas (A-Z) y números (0-9)
        - Longitud fija de 12 caracteres
        - No verifica unicidad (debe hacerse externamente)
    ******************************************************************************/
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
    /******************************************************************************
      NOMBRE:  fn_auth_verify_access_code
      PROPÓSITO: Función para verificar un código de acceso y retornar el usuario con sus roles si es válido
      INVOCACIÓN: SELECT * FROM fn_auth_verify_access_code('ABC123XYZ789');
      PARÁMETROS:
        - p_access_code: Código de acceso en texto plano proporcionado por el usuario
      RETORNA: TABLE con:
        - out_user_id: ID del usuario autenticado
        - out_user_data: Datos completos del usuario en formato JSONB
        - out_roles: Array JSONB con los roles activos del usuario
      VALIDACIONES:
        - Verifica que el usuario esté en estado 'active'
        - Usa bcrypt para comparar el código con el hash almacenado
        - Retorna vacío si no hay coincidencia (autenticación fallida)
      SEGURIDAD:
        - Utiliza crypt() con bcrypt para verificación segura de códigos
        - No expone información de usuarios inactivos
    ******************************************************************************/
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
