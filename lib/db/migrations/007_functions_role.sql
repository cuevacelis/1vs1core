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
    /******************************************************************************
      NOMBRE:  fn_role_assign_to_user
      PROPÓSITO: Función para asignar un rol a un usuario o reactivar una asignación existente
      INVOCACIÓN: SELECT fn_role_assign_to_user(5, 'admin');
      PARÁMETROS:
        - p_user_id: ID del usuario al que se asignará el rol
        - p_role_name: Nombre del rol a asignar (ej: 'admin', 'player')
      RETORNA: BOOLEAN - TRUE si la asignación fue exitosa
      VALIDACIONES:
        - Verifica que el rol especificado exista (lanza excepción si no existe)
        - Si la asignación ya existe, la reactiva estableciendo state = 'active'
      COMPORTAMIENTO:
        - Si el usuario ya tiene el rol asignado, se reactiva (state = 'active')
        - Si es una nueva asignación, se crea con state = 'active'
        - Utiliza ON CONFLICT para manejar asignaciones duplicadas
    ******************************************************************************/
    -- Get role id
    SELECT r.id INTO v_role_id FROM role r WHERE r.name = p_role_name;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'El rol % no existe', p_role_name;
    END IF;

    -- Insert role assignment (ignore if already exists)
    INSERT INTO role_user (user_id, role_id, state)
    VALUES (p_user_id, v_role_id, 'active')
    ON CONFLICT (user_id, role_id) DO UPDATE SET state = 'active';

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
